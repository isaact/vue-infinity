# Design — nx-monorepo

## Overview

Convert the single npm package `vue-infinity` into an Nx monorepo with two publishable packages and two local demo apps, preserving existing build outputs and APIs.

---

## 1. Nx Workspace Structure

### Layout

```
vue-infinity/
├── nx.json                     # Nx configuration
├── package.json                # Root: private, npm workspaces
├── vite.config.ts              # (removed — per-package configs)
├── tsconfig.json               # Root base tsconfig
├── tsconfig.base.json          # Shared TS config (paths, strict)
├── packages/
│   ├── core/                   # @vue-infinity/core
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts        # Public API (re-exports)
│   │       ├── elements.ts     # (moved to elements pkg)
│   │       ├── types.ts
│   │       ├── components/     # Carousel, Gallery, Ghost, InfiniteCarousel
│   │       ├── composables/    # useAutoObserver, useInfiniteList, useSharedObserver
│   │       └── directives/     # vGhost
│   └── elements/               # @vue-infinity/elements
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts        # Public API (registerElements, Gallery CE)
│           ├── Gallery.ce.vue  # Custom element wrapper
│           └── elements.ts     # defineCustomElement + registerElements
├── apps/
│   ├── demo-vue/               # Vue demo (consumes @vue-infinity/core)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── App.vue
│   └── demo-elements/          # Web-component demo (consumes @vue-infinity/elements)
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── main.ts
└── test/                       # Existing tests (Vitest)
    └── useInfiniteList.test.ts
```

### Decision: `packages/` over `libs/`

- Nx supports both. `packages/` is conventional for publishable libraries in npm workspace monorepos and aligns with tools like changesets/lerna.
- `libs/` implies internal-only. Since both packages are published, `packages/` is more accurate.

### Root `package.json`

```jsonc
{
  "name": "vue-infinity",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "dev:core": "nx serve demo-vue",
    "dev:elements": "nx serve demo-elements"
  },
  "devDependencies": {
    "nx": "^20.x",
    "@nx/vite": "^20.x",
    "vite": "^6.x",
    "@vitejs/plugin-vue": "^5.x",
    "vite-plugin-dts": "^4.x",
    "vitest": "^3.x",
    "@vitest/ui": "^3.x",
    "typescript": "^5.x",
    "happy-dom": "^17.x",
    // other dev deps move to root
  }
}
```

### Decision: Nx as npm workspace overlay

- Nx detects npm workspaces. We do NOT switch to pnpm or yarn.
- `nx.json` declares `targetDefaults` for build, test, and lint.

---

## 2. Package: `@vue-infinity/core`

### Scope

Everything from `src/` **except** the custom element files:

- `src/index.ts` (public API)
- `src/types.ts`
- `src/components/Carousel.vue`
- `src/components/Ghost.vue`
- `src/components/InfiniteCarousel.vue`
- `src/components/Gallery.ce.vue` → **moved to elements package** (but core keeps the underlying `Carousel.vue`)
- `src/composables/*`
- `src/directives/*`

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VueInfinity',
      fileName: (format) => `vue-infinity.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
    cssCodeSplit: false,
  },
});
```

- **Outputs**: `dist/vue-infinity.es.js`, `dist/vue-infinity.umd.js`, `dist/vue-infinity.css`, `dist/index.d.ts`
- Vue is **external** (consumers bring their own Vue).

### `package.json` exports

```jsonc
{
  "name": "@vue-infinity/core",
  "version": "0.8.2",
  "type": "module",
  "main": "dist/vue-infinity.umd.js",
  "module": "dist/vue-infinity.es.js",
  "style": "dist/vue-infinity.css",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/vue-infinity.es.js",
      "require": "./dist/vue-infinity.umd.js"
    },
    "./style.css": "./dist/vue-infinity.css"
  },
  "files": ["dist"],
  "dependencies": {
    "@vueuse/components": "^13.1.0"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

---

## 3. Package: `@vue-infinity/elements`

### Scope

Custom element specific code, depending on core for the underlying Carousel component:

- `src/elements.ts` (moved from core) — `defineCustomElement(GalleryCe)`, `registerElements()`
- `src/Gallery.ce.vue` (moved from `src/components/`)

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    vue({ customElement: true }),
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'gallery-ce',
    },
    // NO external — Vue runtime is bundled for drop-in usage
    cssCodeSplit: false,
  },
});
```

### Bundle strategy for drop-in usage

- **Do NOT externalize Vue** in the elements build. This means `@vue-infinity/elements` bundles Vue's runtime inside the published bundle.
- Trade-off: larger bundle size (~40KB gzipped extra). But it satisfies the requirement that elements work without importing Vue.
- For consumers who already have Vue, this means Vue is duplicated. Mitigations:
  - Document that the elements bundle should be loaded once only (prevent double-registration).
  - Future optimization: offer both a standalone bundle (with Vue) and a light bundle (without Vue, for Vue-hosted apps).

### `package.json` exports

```jsonc
{
  "name": "@vue-infinity/elements",
  "version": "0.1.0",  // starts independent from core
  "type": "module",
  "main": "dist/gallery-ce.js",
  "module": "dist/gallery-ce.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/gallery-ce.js",
      "require": "./dist/gallery-ce.umd.cjs"
    }
  },
  "files": ["dist"],
  "dependencies": {
    "@vue-infinity/core": "^0.8.2",
    "vue": "^3.5.13"  // bundled, in dependencies so consumers get it
  }
}
```

### Decision: UMD for elements?

Current CE build outputs only `es` format. The spec says "match current outputs". We can add UMD via Vite config extension if needed, but the initial CE build only produced ES. Keep `formats: ['es']` as-is.

---

## 4. Independent Versioning

- Each package has its own `version` field in `package.json`.
- `@vue-infinity/core` starts at `0.8.2` (matching current root).
- `@vue-infinity/elements` starts at `0.1.0` (new package).
- Releases are managed per-package. No changesets or lerna in scope (no release automation constraints confirmed).
- Nx does not enforce version alignment; npm workspace `version` fields are independent.

---

## 5. Demo Apps

### `apps/demo-vue/` (Vue app consuming `@vue-infinity/core`)

Derived from current `playground/`:

- `package.json`: depends on `@vue-infinity/core` (workspace reference: `"@vue-infinity/core": "workspace:*"`)
- `vite.config.ts`: simple Vue plugin, no library build
- `main.ts`: `createApp(App).mount('#app')` — no `registerElements()` needed
- `App.vue`: same demo code as current playground, imports from `@vue-infinity/core`
- `GhostDemo.vue`, `GalleryDemo.vue`, `mockApi.ts`: ported from playground

### `apps/demo-elements/` (vanilla HTML/JS app consuming `@vue-infinity/elements`)

- Pure non-Vue app. Tests the drop-in requirement.
- `index.html`: loads the elements bundle, calls `registerElements()`.
- `main.ts` (or inline script): no `createApp`, no Vue import.
- `vite.config.ts`: no Vue plugin (or Vue plugin for development convenience only).
- `package.json`: depends on `@vue-infinity/elements` (workspace reference).

---

## 6. Test Integration (Vitest + Nx)

### Current state

- Tests live in `test/` at root.
- Run via `vitest` (with `--ui` flag).
- `vitest.config.ts` would be needed at root for Vitest 3.x (or config in `package.json`).

### Design

- Root `vitest.workspace.ts` or `vitest.config.ts` at root level configures project tests.
- Each package can have its own `vitest.config.ts` if needed.
- Nx target `test` runs `vitest run` via `@nx/vite:test` executor.
- Keep `test/` at root for shared tests, or move into `packages/core/test/` and `packages/elements/test/`.

**Decision**: Keep tests alongside source in each package (`packages/core/src/__tests__/` or `packages/core/test/`). The existing `test/useInfiniteList.test.ts` belongs to core.

---

## 7. Migration Strategy

### Phase 1 — Scaffold (in-place Nx init)

1. Install Nx: `npx nx@latest init` — this adds `nx.json` and detects npm workspaces.
2. Create `packages/` directory structure.
3. Create `apps/` directory structure.

### Phase 2 — Extract `@vue-infinity/core`

1. Copy `src/{index,types,components,composables,directives}` into `packages/core/src/`.
2. Write `packages/core/package.json` (scoped name, exports).
3. Write `packages/core/vite.config.ts` (same as current root lib build).
4. Write `packages/core/tsconfig.json`.
5. Update `packages/core/src/index.ts` to remove `Gallery.ce.vue` and `registerElements` exports.

### Phase 3 — Extract `@vue-infinity/elements`

1. Copy `src/components/Gallery.ce.vue`, `src/elements.ts` into `packages/elements/src/`.
2. Write `packages/elements/src/index.ts` (re-exports from `elements.ts`).
3. Write `packages/elements/package.json` (depends on `@vue-infinity/core`).
4. Write `packages/elements/vite.config.ts` (customElement mode, bundle Vue).
5. Write `packages/elements/tsconfig.json`.

### Phase 4 — Create demo apps

1. Copy relevant parts of `playground/` into `apps/demo-vue/`.
2. Re-point imports from `../src/` to `@vue-infinity/core`.
3. Create `apps/demo-elements/` from scratch.
4. Ensure both apps have independent `vite.config.ts`.

### Phase 5 — Clean up root

1. Remove root `vite.config.ts`.
2. Remove root `src/` directory (now in packages).
3. Update root `package.json` scripts to use Nx.
4. Move `test/` into `packages/core/test/`.

### Phase 6 — Verify

1. `nx build core` → produces ES + UMD + CSS + d.ts (compare outputs).
2. `nx build elements` → produces ES bundle with Vue runtime included.
3. `nx serve demo-vue` → runs correctly against workspace core.
4. `nx serve demo-elements` → runs correctly without Vue dependency.
5. `nx test core` → Vitest passes.
6. Create a minimal standalone HTML page importing the elements bundle → custom elements register without Vue.

---

## 8. Tradeoffs and Explicit Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Nx preset | No preset (manual `nx.json`) | `@nx/vite` plugin suffices; no need for `@nx/js` generator overhead |
| Package scope | `@vue-infinity/*` | User choice; future per-component packages use same scope |
| Elements Vue bundling | Bundle Vue in elements output | Drop-in requirement trumps bundle size |
| Elements output format | ES only (keep current) | Current CE build is ES-only; can add UMD later |
| Root package | Private workspace-only | Avoid accidental npm publish of root |
| Test location | Per-package `test/` dirs | Cleaner boundaries; Nx scopes test targets per project |
| Demo app framework | Plain Vite (no Nx app preset) | Simpler; demo apps are thin wrappers |
| Versioning start | Core `0.8.2`, Elements `0.1.0` | Core continues existing version; elements starts fresh |
| npm workspace syntax | `workspace:*` for cross-refs | Works with npm >= 8.5; publish replaces `workspace:*` with actual version |

---

## 9. Open Questions (to resolve during apply)

- Does the elements package also need a UMD output? Current CE build is ES-only; spec says "match current outputs".
- Exact Nx version to pin (`^20.0.0`). Check current latest before apply.
- Whether to keep `@vitest/ui` for local test dev experience alongside Nx test runner.

---

## Rollback

- Pre-migration state is the current git HEAD. Branch off before any changes.
- Each Phase step can be reverted individually.
- If Nx init fails, `git clean` restores original layout.
