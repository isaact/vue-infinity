# Tasks — nx-monorepo

## Review workload estimate

- **Estimated changed lines**: ~650 (across ~25 files)
- **Review risk**: moderate — restructuring affects build configs, package metadata, and source layout
- **Recommendation**: split into **2 chained PRs** (scaffold + packages, then demos + cleanup)

---

## Phase 1: Nx workspace scaffold

- [x] ### T1.1 Install Nx and initialize workspace

- **Files to modify**:
  - `package.json`: add `"private": true`, add `"workspaces"` config, add Nx/Vite devDependencies, update scripts
  - `nx.json`: create with targetDefaults for build/test
  - `tsconfig.base.json`: create with shared compilerOptions (paths, strict, target, module)
  - `tsconfig.json`: update to extend `tsconfig.base.json`
- **Details**:
  - `dependencies` → keep `@vueuse/components`
  - `devDependencies` → add `nx`, `@nx/vite`; keep `vite`, `@vitejs/plugin-vue`, `vite-plugin-dts`, `vitest`, `@vitest/ui`, `typescript`, `happy-dom`, `@types/node`
  - scripts: `"build": "nx run-many -t build"`, `"test": "nx run-many -t test"`, remove root `vite build` scripts
  - npm workspaces: `["packages/*", "apps/*"]`

- [x] ### T1.2 Create vitest workspace config root

- **Files to create**:
  - `vitest.workspace.ts`: reference test configs from packages
- **Details**: allow per-package vitest configs to merge

- [ ] ### T1.3 Remove root vite.config.ts
  - **Note**: deferred to PR 2 (Phase 5 cleanup)

- **Files to modify**:
  - `vite.config.ts`: delete (build config moves to packages)
- **Note**: keep this for last after packages build correctly

---

## Phase 2: Extract `@vue-infinity/core` package

- [x] ### T2.1 Create core package directory and config

- **Files to create**:
  - `packages/core/package.json`
  - `packages/core/vite.config.ts`
  - `packages/core/tsconfig.json`
- **Details**:
  - `package.json`: name `@vue-infinity/core`, version `0.8.2`, exports same as current root
  - `vite.config.ts`: identical to current root lib build (Vue externalized, ES + UMD + CSS + d.ts)
  - `tsconfig.json`: extends root `tsconfig.base.json`, references `src/`

- [x] ### T2.2 Copy source files to core package

- **Files to create** (copy from root `src/`):
  - `packages/core/src/index.ts` — export components/composables/directives, **remove** `Gallery.ce.vue` and `registerElements`
  - `packages/core/src/types.ts`
  - `packages/core/src/components/Carousel.vue`
  - `packages/core/src/components/Ghost.vue`
  - `packages/core/src/components/InfiniteCarousel.vue`
  - `packages/core/src/composables/useAutoObserver.ts`
  - `packages/core/src/composables/useInfiniteList.ts`
  - `packages/core/src/composables/useSharedObserver.ts`
  - `packages/core/src/directives/vGhost.ts`
- **Details**: do NOT copy `Gallery.ce.vue`, `elements.ts`

- [x] ### T2.3 Move test file to core

- **Files to modify**:
  - `test/useInfiniteList.test.ts` → move to `packages/core/test/useInfiniteList.test.ts`
- **Details**: update any import paths if needed (likely none, tests import from `../src`)

- [x] ### T2.4 Add core Nx project configuration

- **Details**:
  - Nx auto-detects via `package.json` name and `vite.config.ts`
  - Ensure `nx.json` targetDefaults picks up `build` and `test` for `@vue-infinity/core`

---

## Phase 3: Extract `@vue-infinity/elements` package

- [x] ### T3.1 Create elements package directory and config

- **Files to create**:
  - `packages/elements/package.json`
  - `packages/elements/vite.config.ts`
  - `packages/elements/tsconfig.json`
- **Details**:
  - `package.json`: name `@vue-infinity/elements`, version `0.1.0`, depends on `@vue-infinity/core` and `vue` (bundled)
  - `vite.config.ts`: `customElement: true`, NO external (Vue bundled), formats `['es']`, fileName `gallery-ce`
  - `tsconfig.json`: extends root `tsconfig.base.json`

- [x] ### T3.2 Move custom-element source files to elements

- **Files to create** (copy from root `src/`):
  - `packages/elements/src/index.ts` — re-export `registerElements`, `Gallery`, `GalleryImage` types
  - `packages/elements/src/elements.ts` — `defineCustomElement(GalleryCe)`, `registerElements()`
  - `packages/elements/src/Gallery.ce.vue` — the CE component (originally `src/components/Gallery.ce.vue`)
  - `packages/elements/src/types.ts` — copy `GalleryImage` interface (shared types used by CE)

- [x] ### T3.3 Wire elements dependency on core

- **Details**:
  - `packages/elements/package.json`: `"dependencies": { "@vue-infinity/core": "workspace:*", "vue": "^3.5.13" }`
  - Elements imports `Carousel.vue` from core at build time (or via re-export)

---

## Phase 4: Create demo apps

### T4.1 Create Vue demo app

- **Files to create**:
  - `apps/demo-vue/package.json`
  - `apps/demo-vue/vite.config.ts`
  - `apps/demo-vue/tsconfig.json`
  - `apps/demo-vue/index.html`
  - `apps/demo-vue/main.ts`
  - `apps/demo-vue/App.vue`
  - `apps/demo-vue/GhostDemo.vue`
  - `apps/demo-vue/GalleryDemo.vue`
  - `apps/demo-vue/mockApi.ts`
  - `apps/demo-vue/public/` (assets from playground)
- **Details**:
  - Port from `playground/`, BUT change imports from `../src/` to `@vue-infinity/core`
  - Remove `registerElements()` call (elements are separate)
  - `package.json` depends on `@vue-infinity/core: "workspace:*"` and `vue` (peer)

### T4.2 Create web-component demo app

- **Files to create**:
  - `apps/demo-elements/package.json`
  - `apps/demo-elements/vite.config.ts`
  - `apps/demo-elements/tsconfig.json`
  - `apps/demo-elements/index.html`
  - `apps/demo-elements/main.ts`
- **Details**:
  - Pure non-Vue app: load elements bundle, call `registerElements()`, use `<gallery-ce>` in HTML
  - `package.json` depends on `@vue-infinity/elements: "workspace:*"`
  - `vite.config.ts`: minimal Vite with or without Vue plugin (Vue is not needed at dev time for the elements bundle since it's imported as a dependency)
  - Show that elements work without `createApp`

---

## Phase 5: Cleanup root

### T5.1 Remove old playground directory

- **Files to delete**:
  - `playground/` (entire directory — replaced by `apps/demo-vue` and `apps/demo-elements`)
- **Details**: ensure all needed assets are ported first

### T5.2 Remove old root src/ directory

- **Files to delete**:
  - `src/` (entire directory — moved to `packages/core/` and `packages/elements/`)
- **Details**: ensure nothing references `../src/` from out-of-package locations

### T5.3 Update root package.json scripts

- **Details**:
  - Remove `"build": "vite build && vite build --mode ce"`
  - Remove `"build:ce": "vite build --mode ce"`
  - Remove `"playground": "cd playground && vite dev"`
  - Update `"dev": "cd playground && vite dev"` → `"dev": "nx run-many -t serve --parallel"`
  - Keep `"test": "nx run-many -t test"`

### T5.4 Verify root ESM/type config

- **Details**: ensure `tsconfig.base.json` has correct `moduleResolution: "bundler"` (Node is deprecated for Vite/TS 5+)

---

## Phase 6: Verify

### T6.1 Build core package

- **Command**: `npx nx build core` (or `npm run build`)
- **Check**: produces `dist/vue-infinity.es.js`, `dist/vue-infinity.umd.js`, `dist/vue-infinity.css`, `dist/index.d.ts`

### T6.2 Build elements package

- **Command**: `npx nx build elements`
- **Check**: produces `dist/gallery-ce.js` with Vue runtime bundled inside (check bundle contents for Vue)

### T6.3 Run tests

- **Command**: `npx nx test core`
- **Check**: all Vitest tests pass

### T6.4 Serve Vue demo

- **Command**: `npx nx serve demo-vue`
- **Check**: app loads, components render, InfiniteCarousel works

### T6.5 Serve elements demo

- **Command**: `npx nx serve demo-elements`
- **Check**: app loads without Vue installed, `<gallery-ce>` renders via `registerElements()`

### T6.6 Verify independent versioning

- **Check**: `packages/core/package.json` has version `0.8.2`, `packages/elements/package.json` has `0.1.0`, versions can differ freely

---

## Dependency chain

```
T1.1 ─┬→ T1.2 ─┬→ T2.1 ─┬→ T2.2 ─┬→ T2.3 ─┬→ T2.4
      │         │         │         │         │
      └→ T1.3   │         │         │         └→ T3.1 ─┬→ T3.2 ─┬→ T3.3
                │         │         │                   │         │
                │         │         │                   │         └→ T4.1 ─┬→ T5.1
                │         │         │                   │                   │
                │         │         │                   └→ T4.2 ────────────┤
                │         │         │                                      │
                └─────────┴─────────┴──────────────────────────────────────┴→ T5.2 ─┬→ T5.3 ─┬→ T5.4 ─┬→ T6.x
```

## Chained PR recommendation

Given ~650 estimated changed lines across 25+ files, I recommend **2 chained PRs**:

- **PR 1**: Phases 1–3 (scaffold + core + elements packages) — ~400 lines
- **PR 2**: Phases 4–6 (demo apps + cleanup + verify) — ~250 lines

This keeps each PR under the 400-line review budget and allows independent review of the package extraction vs. the demo/cleanup work.
