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

- [x] ### T1.3 Remove root vite.config.ts
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

- [x] ### T4.1 Create Vue demo app

- **Files created**:
  - `apps/demo-vue/package.json`
  - `apps/demo-vue/vite.config.ts`
  - `apps/demo-vue/tsconfig.json`
  - `apps/demo-vue/vitest.config.ts`
  - `apps/demo-vue/index.html`
  - `apps/demo-vue/main.ts`
  - `apps/demo-vue/App.vue`
  - `apps/demo-vue/GhostDemo.vue`
  - `apps/demo-vue/GalleryDemo.vue`
  - `apps/demo-vue/mockApi.ts`
  - `apps/demo-vue/public/gliding.mp4`
  - `apps/demo-vue/public/logo.svg`
  - `apps/demo-vue/test/demo.test.ts`
- **Details**:
  - Ported from `playground/`, changed imports from `../src/` to `@vue-infinity/core`
  - Removed `registerElements()` call (elements are separate)
  - `package.json` depends on `@vue-infinity/core: "*"` and `vue`

- [x] ### T4.2 Create web-component demo app

- **Files created**:
  - `apps/demo-elements/package.json`
  - `apps/demo-elements/vite.config.ts`
  - `apps/demo-elements/tsconfig.json`
  - `apps/demo-elements/vitest.config.ts`
  - `apps/demo-elements/index.html`
  - `apps/demo-elements/main.ts`
  - `apps/demo-elements/test/demo.test.ts`
- **Details**:
  - Pure non-Vue app: loads elements bundle, calls `registerElements()`, uses `<gallery-ce>` in HTML
  - `package.json` depends on `@vue-infinity/elements: "*"`
  - `vite.config.ts`: no Vue plugin (Vue is bundled in elements dependency)
  - Shows that elements work without `createApp` or Vue import

---

## Phase 5: Cleanup root

- [x] ### T5.1 Remove old playground directory

- **Files deleted**:
  - `playground/` (entire directory — replaced by `apps/demo-vue` and `apps/demo-elements`)
- **Details**: all assets ported to demo apps first

- [x] ### T5.2 Remove old root src/ directory

- **Files deleted**:
  - `src/` (entire directory — moved to `packages/core/` and `packages/elements/`)
- **Details**: fixed root test import to point to packages/core/ before deletion

- [x] ### T5.3 Update root package.json scripts

- **Details**: already done in PR 1. Current scripts are all Nx-based:
  - `"build": "nx run-many -t build"`
  - `"test": "nx run-many -t test"`
  - `"dev:core": "nx serve demo-vue"`
  - `"dev:elements": "nx serve demo-elements"`

- [x] ### T5.4 Verify root ESM/type config

- **Details**: `tsconfig.base.json` has `"moduleResolution": "bundler"` which is correct for Vite/TS 5+

---

## Phase 6: Verify

- [x] ### T6.1 Build core package

- **Command**: `npx nx build core` — ✓ success
- **Outputs**: `dist/vue-infinity.es.js` (26.91 KB), `dist/vue-infinity.umd.js` (19.58 KB), `dist/core.css` (2.02 KB), `dist/index.d.ts`

- [x] ### T6.2 Build elements package

- **Command**: `npx nx build elements` — ✓ success
- **Outputs**: `dist/gallery-ce.js` (172.99 KB, Vue runtime bundled inside — gzip 53.34 KB)

- [x] ### T6.3 Run tests

- **Command**: `npm test` — ✓ all 14 tests pass across 4 projects
- **Projects**: @vue-infinity/core (6), @vue-infinity/elements (2), demo-vue (3), demo-elements (3)

- [x] ### T6.4 Serve Vue demo (verified config)

- **Command**: `npx nx serve demo-vue`
- **Check**: vite config valid, resolve alias configured for @vue-infinity/core → packages/core/src/index.ts

- [x] ### T6.5 Serve elements demo (verified config)

- **Command**: `npx nx serve demo-elements`
- **Check**: minimal vite config (no Vue plugin), resolve alias configured, no Vue import in main.ts

- [x] ### T6.6 Verify independent versioning

- **Check**: `packages/core/package.json` → `0.8.2`, `packages/elements/package.json` → `0.1.0`
- **Result**: versions differ freely, no coupling

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
