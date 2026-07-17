# Proposal — post-migration-fixes

## Intent

Resolve five concrete issues discovered after the `nx-monorepo` migration that affect build correctness, bundle size, developer experience, and project documentation. These are independent fixes scoped to a single change for efficient delivery.

## Issues

### Issue 1: Elements bundle too large (173KB)

**Problem:** The `@vue-infinity/elements` package bundles the full `vue` module, including the template compiler (`@vue/compiler-sfc`), which is not needed for pre-compiled custom elements. This inflates the bundle to ~173KB.

**Fix:** Replace `import { defineCustomElement } from "vue"` with `import { defineCustomElement } from "@vue/runtime-dom"` in `packages/elements/src/elements.ts`. The runtime-dom subpath exports only the runtime, excluding the compiler. The elements package uses `@vitejs/plugin-vue` with `customElement: true`, which pre-compiles the SFC — so only the Vue runtime is needed at runtime.

**Affected files:**

- `packages/elements/src/elements.ts` — change import source

**Expected outcome:** Bundle size reduction from ~173KB to ~50KB (runtime-dom is ~50KB gzipped vs ~115KB for full Vue + compiler).

### Issue 2: Elements demo app needs more pictures

**Problem:** `apps/demo-elements/index.html` hardcodes 5 static image URLs for the `<gallery-ce>` web component. This makes for a sparse, unrepresentative demo. The `apps/demo-vue/mockApi.ts` already provides a `fetchMockImages()` function that generates varied images from picsum.photos.

**Fix:** Reuse `mockApi.ts` in the elements demo app. Two options:

- **Option A (recommended — simplest):** Copy `apps/demo-vue/mockApi.ts` to `apps/demo-elements/mockApi.ts`. Update `apps/demo-elements/main.ts` to call `fetchMockImages` and pass the result to the `<gallery-ce>` element's `updateImages()` method. Remove the hardcoded `items` JSON attribute from the HTML.
- **Option B:** Share via a symlink or a third shared package — over-engineered for this use case; Option A is preferred.

**Affected files:**

- `apps/demo-elements/mockApi.ts` — new file (copied from `apps/demo-vue/mockApi.ts`)
- `apps/demo-elements/main.ts` — add async initialization with `fetchMockImages`
- `apps/demo-elements/index.html` — remove hardcoded `items` JSON from `<gallery-ce>`

**Expected outcome:** Elements demo shows a rich, varied gallery of images with realistic loading, mirroring the demo-vue experience.

### Issue 3: TypeScript error — missing declaration module for `@vue-infinity/elements`

**Problem:** When TypeScript resolves `import { registerElements } from "@vue-infinity/elements"` in `apps/demo-elements/main.ts`, it cannot find a declaration file. The elements package's `package.json` declares `"types": "dist/index.d.ts"`, but no `.d.ts` file exists for the module because the package is consumed directly from source during development (via workspace/* protocol + resolve alias in vite.config.ts). However, the TS compiler in strict mode still looks for the declaration.

**Fix:** Add a `packages/elements/src/env.d.ts` (or `elements.d.ts`) file that declares the module. Given the package's simple public API, a hand-written declaration is sufficient:

```typescript
// packages/elements/src/env.d.ts — or added inline
declare module "@vue-infinity/elements" {
  export interface GalleryImage { ... }
  export function registerElements(): void;
  export const Gallery: typeof HTMLElement;
}
```

Alternatively, ensure `vite-plugin-dts` configured in `packages/elements/vite.config.ts` generates the correct output. Since it's already configured (`dts({ include: ["src"] })`), verify it generates `dist/index.d.ts`. If the generated declaration is missing the module augmentation, create a manual shim file.

**Affected files:**

- `packages/elements/src/env.d.ts` — new file (module declaration for `@vue-infinity/elements`)

**Expected outcome:** TypeScript compiles `apps/demo-elements/main.ts` without errors.

### Issue 4: README is outdated

**Problem:** The root `README.md` still references the old single-package structure:

- Installation shows `npm install vue-infinity` (still correct for the published package)
- "Gallery Web Component" section references `registerElements` from `vue-infinity`, but the web component now lives in the separate `@vue-infinity/elements` package
- Usage examples import from `vue-infinity` instead of `@vue-infinity/elements`
- The "Run Playground App" section says `npm run playground`, which no longer exists — the correct command is `npm run dev:core` or `npm run dev:elements`

**Fix:** Update the root README:

1. Add a "Monorepo Structure" section explaining the two packages (`@vue-infinity/core` and `@vue-infinity/elements`) and two demo apps.
2. Update Gallery Web Component usage examples to import from `@vue-infinity/elements`.
3. Update the "Run Playground App" instructions to `npm run dev:core` (Vue demo) and `npm run dev:elements` (elements demo).
4. Keep the core package examples (Carousel, Ghost, InfiniteCarousel) as-is since they still import from `vue-infinity` (which maps to the root `@vue-infinity/core` package via npm).

**Affected files:**

- `README.md` — comprehensive update

**Expected outcome:** README accurately reflects the monorepo structure and correct commands.

### Issue 5: Gallery web component demo section in demo-vue should be removed

**Problem:** `apps/demo-vue/App.vue` includes a "Gallery web component demo" section that renders `<GalleryDemo />`, which imports `Carousel` from `@vue-infinity/core`. This is a **Carousel** component demo, not a web component demo — the gallery web component (`<gallery-ce>`) belongs in the elements demo app. The section is redundant given that `apps/demo-elements` already demonstrates the custom element.

**Fix:** Remove the GalleryDemo import, the `<GalleryDemo />` component, and the "Gallery web component demo" section heading from `apps/demo-vue/App.vue`. Optionally remove `apps/demo-vue/GalleryDemo.vue` if nothing else references it.

**Affected files:**

- `apps/demo-vue/App.vue` — remove `<GalleryDemo />` and its import
- `apps/demo-vue/GalleryDemo.vue` — remove (optional, if not referenced elsewhere)

**Expected outcome:** demo-vue focuses on core package components (InfiniteCarousel, Ghost) as intended; elements demo covers the web component.

---

## Scope

### In scope

1. Bundle size fix for `@vue-infinity/elements` (import path change)
2. Rich images for `apps/demo-elements` (reuse mockApi.ts)
3. TypeScript declaration fix for `@vue-infinity/elements`
4. Root README update for monorepo structure
5. Gallery demo removal from `apps/demo-vue`

### Out of scope (not in this change)

- Publish pipeline or release scripts
- CI/CD configuration
- Nx cache tuning or build speed optimization
- Adding new components or features
- Test coverage improvements (beyond what's needed to verify these fixes)
- Migration of the Carousel component to the elements package (that is a separate design decision)

## Affected Areas

| Package/App | Issue(s) | Impact |
|---|---|---|
| `packages/elements/src/elements.ts` | 1 | Import path changed; no API change |
| `packages/elements/src/env.d.ts` | 3 | New file; no runtime impact |
| `apps/demo-elements/main.ts` | 2 | Async initialization added |
| `apps/demo-elements/mockApi.ts` | 2 | New file |
| `apps/demo-elements/index.html` | 2 | Hardcoded items removed |
| `apps/demo-vue/App.vue` | 5 | Section + import removed |
| `apps/demo-vue/GalleryDemo.vue` | 5 | File removed |
| `README.md` | 4 | Comprehensive update |

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `@vue/runtime-dom` import breaks if version mismatch | Low | Pin to same version as root `vue` peer dep; runtime-dom ships within Vue 3 package |
| demo-elements async init makes page flash before images load | Low | Use `onBeforeMount` or initial `items="[]"` to render empty state |
| Readme drift again after next change | Medium | Minimal — the update brings it current; treat readme as part of PR review gate |
| GalleryDemo.vue removal leaves dead import somewhere | Low | Grep all files before deleting; only App.vue imports it |

## Rollback

Each issue is independent. Rollback per issue:

1. Revert import path in `elements.ts` to `"vue"`
2. Revert `main.ts` and `index.html` changes; delete `mockApi.ts`
3. Delete `env.d.ts`
4. Revert `README.md` to git HEAD
5. Restore `App.vue` and `GalleryDemo.vue` from git

## Success Criteria

1. **Bundle size:** `pnpm nx build elements` produces a bundle < 60KB (down from 173KB). Verify with `ls -lh packages/elements/dist/`.
2. **Elements demo rich:** `pnpm nx serve demo-elements` shows varied images from picsum.photos, not 5 static hardcoded URLs.
3. **No TS errors:** `pnpm nx build demo-elements` exits with code 0 (no `Could not find a declaration file` error).
4. **README accurate:** `cat README.md` shows correct monorepo commands (`dev:core`/`dev:elements`), correct import paths for elements package, and a "Monorepo Structure" section.
5. **demo-vue clean:** `pnpm nx serve demo-vue` shows Ghost and InfiniteCarousel sections but no "Gallery web component demo" section.
6. **Tests pass:** `pnpm test` passes all existing tests (14/14).

## Proposal question round

Before finalizing and executing, here are 3 questions to validate the proposal framing:

1. **Bundle size target (Issue 1):** Is reducing from 173KB to ~50KB the right goal, or is there a specific threshold (e.g., < 30KB for mobile) that matters more? Using `@vue/runtime-dom` is the standard approach, but there's also a `@vue/runtime-core` path if we want to strip even more — at the cost of losing some Vue runtime features.

2. **Elements demo approach (Issue 2):** Should the elements demo use the same `fetchMockImages` with picsum.photos URLs (option A — copy the file), or would a more curated set of demo images be preferable? If picsum.photos is acceptable, should we also add pagination/controls to match the demo-vue feature set?

3. **Demo app scope (Issue 5):** Removing the "Gallery web component demo" from `demo-vue` also removes the `Carousel` component demo that was using the `GalleryDemo.vue` file. Is the `Carousel` component (not the web component, but the Vue `<Carousel>` from core) still something you want demonstrated in the Vue demo app? If so, we should keep a `CarouselDemo` but re-label it properly and remove only the "web component" misnomer.
