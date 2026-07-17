# SDD: Post-Migration Fixes

## Overview

**Change:** `post-migration-fixes`  
**Date:** 2026-07-13  
**Designer:** SDD Executor (design phase)  
**Status:** Draft  

Resolve five independent issues discovered after the Nx monorepo migration that affect bundle size, demo quality, TypeScript correctness, documentation accuracy, and demo app cleanliness.

---

## Design Decisions

### Issue 1: Elements Bundle Slim — Replace `vue` import with `@vue/runtime-dom`

#### Problem

`packages/elements/src/elements.ts` imports `defineCustomElement` from the full `"vue"` module, which includes the template compiler (`@vue/compiler-sfc`). Since the elements package uses `@vitejs/plugin-vue` with `customElement: true`, the SFC is pre-compiled at build time — the compiler is dead code at runtime, inflating the bundle to ~173KB.

#### Decision

**Change the import source** from `"vue"` to `"@vue/runtime-dom"` in `packages/elements/src/elements.ts`.

```typescript
// Before:
import { defineCustomElement } from "vue";

// After:
import { defineCustomElement } from "@vue/runtime-dom";
```

#### Rationale

- `@vue/runtime-dom` is the official Vue 3 subpath export that ships only the runtime DOM APIs (including `defineCustomElement`), excluding the compiler.
- It is shipped as part of the `vue` package (`node_modules/@vue/runtime-dom`). The `vue` package at root (`^3.5.13`) already satisfies this dependency — no new install needed.
- `defineCustomElement` is re-exported from `@vue/runtime-dom` with the same signature. Verified by checking `node_modules/@vue/runtime-dom/dist/runtime-dom.d.ts` — it exports `defineCustomElement` with the same overloads.
- The elements package **does not declare `vue` as `external`** in its `vite.config.ts` (it intentionally bundles Vue for drop-in usage). The bundler will resolve `@vue/runtime-dom` to the same underlying runtime code, minus the compiler.

#### Vite Config Changes

**None needed.** The elements `vite.config.ts` has no `resolve.alias` for `"vue"` and no `external` config. The bundler resolves `@vue/runtime-dom` directly to `node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js`. No alias remapping is required.

#### Bundle Size Expectations

| Metric | Before (full `vue`) | After (`@vue/runtime-dom`) | Savings |
|--------|---------------------|---------------------------|---------|
| Bundle size (uncompressed) | ~173KB | ~50KB | ~120KB (70%) |
| Bundle size (gzipped) | ~55KB | ~18KB | ~37KB (67%) |

The acceptance criterion from the spec is `< 80KB` uncompressed, which is easily met.

#### Risk

Low. `@vue/runtime-dom: 3.5.13` is the same version as the root `vue: ^3.5.13` installed. No API surface change — the `defineCustomElement` signature is identical. The `vue` package lists `@vue/runtime-dom` as a dependency at the exact same version.

#### Files Changed

| File | Change | Type |
|------|--------|------|
| `packages/elements/src/elements.ts` | Line 1: `"vue"` → `"@vue/runtime-dom"` | Edit |

---

### Issue 2: Elements Demo Pictures — Reuse `mockApi.ts` for Rich Images

#### Problem

`apps/demo-elements/index.html` hardcodes 5 static image URLs in a JSON `items` attribute on `<gallery-ce>`. This produces a sparse, unrepresentative demo. The Vue demo app (`apps/demo-vue`) already has a `mockApi.ts` that generates varied images from picsum.photos with realistic async loading.

#### Decision

**Option A (recommended):** Copy `apps/demo-vue/mockApi.ts` to `apps/demo-elements/mockApi.ts`, then update `main.ts` and `index.html` to use dynamic async initialization.

#### Rationale for Option A over Option B (shared package)

- A shared package would introduce a new workspace dependency, require a build step, and create a third package just for a trivial mock utility.
- The mock API is demo-only code (not production). Copying is the simplest approach with zero extra maintenance burden.
- The two mocks can diverge independently if needed.

#### Detailed Design

##### 1. Copy `mockApi.ts` → `apps/demo-elements/mockApi.ts`

The file is copied verbatim from `apps/demo-vue/mockApi.ts`. It exports:

- `GalleryItem` interface — `{ id: string | number; url: string; thumbUrl: string; title?: string }`
- `fetchMockImages(totalImages, page, itemsPerPage, signal?)` — async function returning `GalleryItem[]`

Note: The `GalleryItem` interface in `mockApi.ts` has an extra `id` field compared to `GalleryImage` in `packages/elements/src/types.ts` (`{ url: string; thumbUrl?: string; title?: string }`). This is fine — the `updateImages` method on `<gallery-ce>` accepts `any[]` and only reads `url` and `title` from each item. The extra `id` field is harmless.

##### 2. Update `apps/demo-elements/main.ts` — Async Initialization

```typescript
import { registerElements } from "@vue-infinity/elements";
import { fetchMockImages } from "./mockApi";
import type { GalleryItem } from "./mockApi";

// Register custom elements (synchronous, no Vue createApp needed)
registerElements();

// Async initialization: fetch images and pass to <gallery-ce>
async function initGallery() {
  const gallery = document.querySelector("gallery-ce");
  if (!gallery) return;

  const abortController = new AbortController();

  try {
    const items = await fetchMockImages(300, 0, 30, abortController.signal);
    // updateImages accepts any[] — GalleryItem shape is compatible
    (gallery as any).updateImages(items);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Gallery init aborted");
      return;
    }
    console.error("Failed to fetch gallery images:", error);
  }
}

// Start async initialization
initGallery();

console.log("Demo-elements: registered <gallery-ce> custom element");
```

##### 3. Update `apps/demo-elements/index.html` — Remove Hardcoded Items

Remove the `items='[{"url":"https://picsum.photos/seed/1/800/600",...}]'` attribute from the `<gallery-ce>` element. The element initially renders with an empty state (no images) until `updateImages()` is called with the fetched data.

```html
<!-- Before: -->
<gallery-ce
  items='[{"url":"https://picsum.photos/seed/1/800/600","title":"Image 1"},...]'
  height="50vh"
  ...
></gallery-ce>

<!-- After: -->
<gallery-ce
  height="50vh"
  width="100%"
  num-cols-to-show="2"
  gap="0.5rem"
></gallery-ce>
```

##### Data Flow

1. Page loads → `<gallery-ce>` rendered with empty initial state (no images)
2. `main.ts` executes → `registerElements()` runs synchronously
3. `initGallery()` starts → `fetchMockImages(300, 0, 30, signal)` fires async request
4. After ~200ms delay → `fetchMockImages` resolves with 30 `GalleryItem` objects
5. `gallery.updateImages(items)` called → internal `Gallery.ce.vue` state updates → Carousel re-renders with images
6. Images lazy-load from picsum.photos as they scroll into view

##### AbortSignal Handling

The `AbortController` is created in `initGallery()` scope. If the page navigates away before the fetch completes, the signal is never explicitly aborted (the controller goes out of scope). This is acceptable for a demo app. For production, a `beforeunload` listener could be added, but it's unnecessary here.

#### Files Changed

| File | Change | Type |
|------|--------|------|
| `apps/demo-elements/mockApi.ts` | New file — copy of `apps/demo-vue/mockApi.ts` | Create |
| `apps/demo-elements/main.ts` | Rewrite to async init with `fetchMockImages` | Edit |
| `apps/demo-elements/index.html` | Remove `items` JSON attribute from `<gallery-ce>` | Edit |

---

### Issue 3: TypeScript Declarations — Add `env.d.ts` for `@vue-infinity/elements`

#### Problem

TypeScript cannot find a declaration file for `@vue-infinity/elements` when `apps/demo-elements/main.ts` imports `registerElements`. The `package.json` declares `"types": "dist/index.d.ts"`, but:

- During development, the package is consumed via workspace protocol, so TypeScript looks for declarations in the source tree.
- The `vite-plugin-dts` plugin is configured but may not generate the correct module augmentation, or the generated file may not be accessible during development.
- The `tsconfig.json` for `demo-elements` has `"include": ["main.ts", "**/*.ts"]` but does not include node_modules resolution for the built dist.

#### Decision

**Add `packages/elements/src/env.d.ts`** with a manual module declaration for `@vue-infinity/elements`.

#### Declaration Content

```typescript
// packages/elements/src/env.d.ts
declare module "@vue-infinity/elements" {
  export interface GalleryImage {
    url: string;
    thumbUrl?: string;
    title?: string;
  }

  export function registerElements(): void;

  export class Gallery extends HTMLElement {
    updateImages(items: string | any[]): void;
    scrollToItem(index: number): void;
  }
}
```

#### Rationale

- **Manual declaration vs. vite-plugin-dts:** The `vite-plugin-dts` plugin generates `dist/index.d.ts` from the source, but during development the consuming app (`demo-elements`) resolves the package via workspace protocol and may not traverse into `dist/`. A source-level `env.d.ts` is the simplest, most reliable fix.
- **Module augmentation format:** The `declare module "@vue-infinity/elements"` syntax is a TypeScript module augmentation that tells the compiler about the module's shape when it cannot find a `.d.ts` file.
- **Exported types match the actual API:** `registerElements()` (function), `Gallery` (custom element class extending `HTMLElement`), `GalleryImage` (interface). The `Gallery` class exposes `updateImages` and `scrollToItem` methods that are defined via `defineExpose` in `Gallery.ce.vue` and exposed on the custom element prototype.

#### Alternative Considered

**Rely on `vite-plugin-dts` output only.** Rejected because:

- The generated `dist/index.d.ts` needs to be present for the consuming app's TypeScript to resolve it.
- The consumer's `tsconfig.json` would need `"paths"` or `"rootDirs"` configuration to find the generated declarations.
- A manual `env.d.ts` is more robust and explicit.

#### Files Changed

| File | Change | Type |
|------|--------|------|
| `packages/elements/src/env.d.ts` | New file — module declaration | Create |

---

### Issue 4: README Update — Monorepo Structure

#### Problem

The root `README.md` references the old single-package structure:

- Installation: `npm install vue-infinity` (still correct for published package, but incomplete)
- "Gallery Web Component" section imports from `vue-infinity` instead of `@vue-infinity/elements`
- "Run Playground App" section references `npm run playground` (no longer exists)
- No mention of the monorepo structure, two packages, or two demo apps

#### Decision

**Rewrite the README** to reflect the monorepo structure while preserving existing sections for core package components.

#### Section-by-Section Design

##### 1. Header and Introduction

Keep the existing header (clouds logo SVG, title, description). No changes needed.

##### 2. Table of Contents

Update to include new sections:

- Add "Monorepo Structure"
- Keep "Gallery Web Component" but update import paths
- Keep "Carousel Component", "InfiniteCarousel", "Ghost Component", "AutoObserver"
- Update "Installation" section
- Update "Run Playground App" → "Development" section

##### 3. New Section: Monorepo Structure

Add after the introduction:

```
## 🏗️ Monorepo Structure

This project is organized as an Nx monorepo with two packages and two demo apps:

| Package | npm Name | Description |
|---------|----------|-------------|
| `packages/core` | `vue-infinity` (published) / `@vue-infinity/core` (workspace) | Core Vue 3 components: Carousel, InfiniteCarousel, Ghost, AutoObserver, composables |
| `packages/elements` | `@vue-infinity/elements` | Framework-agnostic custom elements (web components) built on the core package |

| App | Command | Description |
|-----|---------|-------------|
| `apps/demo-vue` | `npm run dev:core` | Vue demo showcasing core components with live controls |
| `apps/demo-elements` | `npm run dev:elements` | Custom elements demo showcasing the `<gallery-ce>` web component |
```

##### 4. Gallery Web Component Section

Update all code examples to import from `@vue-infinity/elements` instead of `vue-infinity`:

```javascript
// Before:
import { registerElements } from 'vue-infinity';

// After:
import { registerElements } from '@vue-infinity/elements';
```

Update all four framework examples (Plain JS, React, Svelte, Vue).

##### 5. Core Component Sections (Carousel, InfiniteCarousel, Ghost, AutoObserver)

**No changes needed.** These sections correctly import from `vue-infinity` (which maps to the published `@vue-infinity/core` package). The imports remain as-is.

```javascript
import { Carousel } from 'vue-infinity';
import { useInfiniteList } from 'vue-infinity';
```

##### 6. Installation Section

Update to reflect both packages:

```bash
# Core Vue components (for use within Vue apps)
npm install vue-infinity

# Custom elements (for framework-agnostic usage)
npm install @vue-infinity/elements
```

##### 7. Development Section (formerly "Run Playground App")

Replace:

```bash
npm run playground
```

With:

```bash
# Core Vue demo (Carousel, Ghost, InfiniteCarousel)
npm run dev:core

# Custom elements demo (Gallery web component)
npm run dev:elements

# Build all packages
npm run build

# Run all tests
npm test
```

##### 8. Releases Section

Update the v0.8.0 Gallery Web Component entry to note that it now lives in the `@vue-infinity/elements` package. No other release notes changes.

#### Files Changed

| File | Change | Type |
|------|--------|------|
| `README.md` | Comprehensive rewrite of affected sections | Edit |

---

### Issue 5: Remove Gallery Demo from `demo-vue`

#### Problem

`apps/demo-vue/App.vue` includes a "Gallery web component demo" section that imports and renders `<GalleryDemo />`. The `GalleryDemo.vue` file actually uses the `Carousel` component from `@vue-infinity/core` — it's a Carousel component demo mislabeled as a web component demo. The `<gallery-ce>` web component is already demonstrated in `apps/demo-elements`.

#### Decision

**Remove the GalleryDemo import, usage, and section heading from `App.vue`.** Delete `apps/demo-vue/GalleryDemo.vue`.

#### Detailed Design

##### 1. Remove from `App.vue`

**Template change:** Remove the `<GalleryDemo />` component and its surrounding `<div class="demo-section">` with the "Gallery web component demo" `<h3>` heading.

**Script change:** Remove the `import GalleryDemo from './GalleryDemo.vue'` line.

The file remains structurally sound with two demo sections:

- `<div class="demo-section">` with `<GhostDemo />` (Ghost component demo)
- `<div class="demo-section">` with `<InfiniteCarousel>` (InfiniteCarousel component demo)

##### 2. Delete `GalleryDemo.vue`

The file `apps/demo-vue/GalleryDemo.vue` is no longer referenced by anything. Confirmed via `grep` — only `App.vue` imports it. Delete the file.

##### 3. Verify No Residual References

After changes, run `grep -r "GalleryDemo" apps/demo-vue/` to confirm zero matches.

#### Impact Assessment

- **GalleryDemo.vue** uses `Carousel` from `@vue-infinity/core` and `fetchMockImages` from `./mockApi`. The `mockApi.ts` file is **not** deleted — it's still used by `App.vue` for the InfiniteCarousel demo.
- The `Gallery` component in `packages/elements` is unaffected.
- The `apps/demo-elements` app continues to demonstrate the `<gallery-ce>` web component.

#### Files Changed

| File | Change | Type |
|------|--------|------|
| `apps/demo-vue/App.vue` | Remove `GalleryDemo` import, `<GalleryDemo />` usage, and "Gallery web component demo" section | Edit |
| `apps/demo-vue/GalleryDemo.vue` | Delete file | Delete |

---

## Data Flow Summary

### Issue 1 (Bundle Slim)

```
elements.ts: "vue" → "@vue/runtime-dom"
  → Vite resolves @vue/runtime-dom → node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
  → Bundle output: ~50KB (compiler excluded)
```

### Issue 2 (Demo Images)

```
index.html loads <gallery-ce> (empty state)
  → main.ts executes
    → registerElements() registers <gallery-ce>
    → initGallery() calls fetchMockImages(300, 0, 30, signal)
      → mockApi.ts generates 30 GalleryItem objects with picsum.photos URLs
      → Returns after 200ms simulated delay
    → gallery.updateImages(items) populates the gallery
  → Carousel inside Gallery.ce.vue renders images with lazy loading
```

### Issue 3 (TypeScript Declarations)

```
demo-elements/main.ts: import { registerElements } from "@vue-infinity/elements"
  → TypeScript resolves @vue-infinity/elements → packages/elements/src/index.ts
  → env.d.ts provides declare module "@vue-infinity/elements" { ... }
  → TypeScript finds the module declaration → no error
```

### Issue 5 (Demo Cleanup)

```
App.vue template: GhostDemo ✓ | InfiniteCarousel ✓ | GalleryDemo ✗ (removed)
App.vue script: imports GhostDemo ✓ | imports GalleryDemo ✗ (removed)
GalleryDemo.vue: ✗ (deleted)
```

---

## File Change Summary

| File | Issue | Action | Impact |
|------|-------|--------|--------|
| `packages/elements/src/elements.ts` | 1 | Edit: `"vue"` → `"@vue/runtime-dom"` | Bundle size reduction |
| `apps/demo-elements/mockApi.ts` | 2 | Create: copy from `apps/demo-vue/mockApi.ts` | Rich demo images |
| `apps/demo-elements/main.ts` | 2 | Edit: async init with `fetchMockImages` | Dynamic image loading |
| `apps/demo-elements/index.html` | 2 | Edit: remove `items` JSON attribute | Clean HTML, no static data |
| `packages/elements/src/env.d.ts` | 3 | Create: module declaration | TS compilation fix |
| `README.md` | 4 | Edit: monorepo structure, paths, commands | Accurate docs |
| `apps/demo-vue/App.vue` | 5 | Edit: remove GalleryDemo import/usage | Clean demo app |
| `apps/demo-vue/GalleryDemo.vue` | 5 | Delete | Remove unused file |

## Rollback Plan

Each issue is independent and can be rolled back individually:

1. **Issue 1:** Revert `elements.ts` import to `"vue"`, rebuild.
2. **Issue 2:** Revert `main.ts` and `index.html` to original; delete `mockApi.ts`.
3. **Issue 3:** Delete `env.d.ts`.
4. **Issue 4:** Revert `README.md` to git HEAD.
5. **Issue 5:** Restore `App.vue` and `GalleryDemo.vue` from git.

## Acceptance Criteria

1. **Bundle size:** `pnpm nx build elements` → bundle < 80KB (from ~173KB).
2. **Elements demo rich:** `pnpm nx serve demo-elements` → varied picsum.photos images, not 5 static URLs.
3. **No TS errors:** `pnpm nx build demo-elements` → exit code 0, no "Could not find a declaration file" error.
4. **README accurate:** Contains "Monorepo Structure" section, correct import paths (`@vue-infinity/elements`), correct dev commands (`dev:core`/`dev:elements`).
5. **demo-vue clean:** No "Gallery web component demo" section; `GalleryDemo.vue` does not exist.
6. **Tests pass:** `npm test` → all existing tests pass (14/14 baseline).
