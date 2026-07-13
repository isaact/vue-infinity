# Apply Progress — nx-monorepo (PR 1: Phases 1-3)

## Status

- **PR boundary**: PR 1 (scaffold + core + elements packages)
- **Chained PR strategy**: stacked-to-main (PR 1 → PR 2)
- **All Phase 1-3 tasks completed**: ✓
- **Tests passing**: 8/8 (core: 6, elements: 2)

---

## Phase 1: Nx Workspace Scaffold — ✓ Complete

### T1.1 Install Nx and initialize workspace — ✓ Complete

**Files created/modified:**

- `nx.json` — Nx configuration with `@nx/vite/plugin`, targetDefaults with `vitest run`
- `tsconfig.base.json` — shared compilerOptions (strict, ESNext, bundler moduleResolution, vitest/globals types)
- `package.json` — updated: `"private": true`, added `"workspaces": ["packages/*", "apps/*"]`, updated scripts (`build`, `test`, `dev:core`, `dev:elements`), added `nx` and `@nx/vite` devDependencies
- `tsconfig.json` — updated to extend `tsconfig.base.json`, includes `["src", "test", "packages", "vitest.workspace.ts"]`

### T1.2 Create vitest workspace config root — ✓ Complete

- `vitest.workspace.ts` — references `packages/*/vitest.config.ts`

**T1.3** deferred to PR 2 (Phase 5 cleanup — remove root vite.config.ts)

---

## Phase 2: Extract `@vue-infinity/core` Package — ✓ Complete

### T2.1 Create core package directory and config — ✓ Complete

**Files created:**

- `packages/core/package.json` — `@vue-infinity/core@0.8.2`, exports ES/UMD/CSS/d.ts, `@vueuse/components` dependency, Vue peer dependency
- `packages/core/vite.config.ts` — Vue externalized, ES + UMD + CSS + d.ts, test config included (globals, happy-dom)
- `packages/core/tsconfig.json` — extends `../../tsconfig.base.json`, includes `["src", "test"]`
- `packages/core/vitest.config.ts` — workspace-compatible vitest config

### T2.2 Copy source files to core package — ✓ Complete

**Files created:**

- `packages/core/src/index.ts` — exports components/composables/directives, **removed** `Gallery.ce.vue` and `registerElements`
- `packages/core/src/types.ts` — `GalleryImage` interface
- `packages/core/src/components/Carousel.vue` — full source (imports from local composables)
- `packages/core/src/components/Ghost.vue` — full source (imports `../composables/useSharedObserver`)
- `packages/core/src/components/InfiniteCarousel.vue` — full source (imports local composables)
- `packages/core/src/composables/useAutoObserver.ts`
- `packages/core/src/composables/useInfiniteList.ts`
- `packages/core/src/composables/useSharedObserver.ts`
- `packages/core/src/directives/vGhost.ts` — imports `../composables/useSharedObserver`

**Deviations from design:** None. `Gallery.ce.vue` and `elements.ts` intentionally excluded from core.

### T2.3 Move test file to core — ✓ Complete

- Copied `test/useInfiniteList.test.ts` → `packages/core/test/useInfiniteList.test.ts`
- Import paths unchanged (`../src/composables/useInfiniteList` resolves correctly from `packages/core/test/`)
- Original root `test/useInfiniteList.test.ts` retained (will be removed in PR 2 Phase 5)

### T2.4 Nx project configuration — ✓ Complete

- Nx auto-detected `@vue-infinity/core` via `package.json` name and `vite.config.ts`
- Build and test targets configured via `@nx/vite` plugin

---

## Phase 3: Extract `@vue-infinity/elements` Package — ✓ Complete

### T3.1 Create elements package directory and config — ✓ Complete

**Files created:**

- `packages/elements/package.json` — `@vue-infinity/elements@0.1.0`, depends on `@vue-infinity/core` and `vue`, ES output
- `packages/elements/vite.config.ts` — `customElement: true`, NO externals (Vue bundled), `formats: ['es']`, includes resolve alias for `@vue-infinity/core` → `../core/src/index.ts`
- `packages/elements/tsconfig.json` — extends `../../tsconfig.base.json`, includes `["src"]`
- `packages/elements/vitest.config.ts` — workspace-compatible vitest config with same resolve alias

### T3.2 Move custom-element source files to elements — ✓ Complete

**Files created:**

- `packages/elements/src/index.ts` — re-exports `registerElements`, `Gallery`, `GalleryImage`
- `packages/elements/src/elements.ts` — `defineCustomElement(GalleryCe)`, `registerElements()`, exports `Gallery` and `GalleryImage`
- `packages/elements/src/Gallery.ce.vue` — CE component, with updated imports: `import { Carousel } from '@vue-infinity/core'` (instead of `'./Carousel.vue'`), `import type { GalleryImage } from './types'` (instead of `'../types'`)
- `packages/elements/src/types.ts` — `GalleryImage` interface (copy from core types)

### T3.3 Wire elements dependency on core — ✓ Complete

- `packages/elements/package.json`: `"@vue-infinity/core": "*"` (npm workspace protocol)
- `packages/elements/vite.config.ts`: resolve alias `@vue-infinity/core` → `../core/src/index.ts`
- `packages/elements/vitest.config.ts`: same alias for test resolution
- `Gallery.ce.vue` imports `{ Carousel }` from `@vue-infinity/core`

### Elements Tests

- `packages/elements/test/elements.test.ts` — 2 tests verifying module exports

---

## Test Results

### Command: `npx nx run-many -t test`

| Project | Test File | Tests | Status |
|---------|-----------|-------|--------|
| `@vue-infinity/core` | `test/useInfiniteList.test.ts` | 6/6 | ✓ Pass |
| `vue-infinity` (root workspace) | workspace discovery | 8/8 | ✓ Pass |
| `@vue-infinity/elements` | `test/elements.test.ts` | 2/2 | ✓ Pass |

**Total: 8 unique tests, all passing.**

### TDD Cycle Evidence

| Cycle | Phase | RED | GREEN | REFACTOR |
|-------|-------|-----|-------|----------|
| 1 | T1.1 (scaffold) | No nx.json/workspace structure | Created nx.json, updated package.json, tsconfig.base.json | Added targetDefaults for vitest run |
| 2 | T1.2 (vitest workspace) | No package vitest configs | Created vitest.workspace.ts, package vitest configs | — |
| 3 | T2.1-T2.4 (core) | Tests not discoverable in new location | Created core package, copied sources, moved test | Updated vitest configs |
| 4 | T3.1-T3.3 (elements) | Package not resolvable without alias | Created elements package, added resolve alias | Fixed npm workspace protocol (`workspace:*` → `*`) |

---

## Files Changed (Phase 1-3)

### New Files Created (23)

1. `nx.json` — Nx workspace configuration
2. `tsconfig.base.json` — shared TypeScript config
3. `vitest.workspace.ts` — Vitest workspace
4. `packages/core/package.json` — core package metadata
5. `packages/core/vite.config.ts` — core build config
6. `packages/core/tsconfig.json` — core TS config
7. `packages/core/vitest.config.ts` — core test config
8. `packages/core/src/index.ts` — core public API
9. `packages/core/src/types.ts` — core types
10. `packages/core/src/components/Carousel.vue`
11. `packages/core/src/components/Ghost.vue`
12. `packages/core/src/components/InfiniteCarousel.vue`
13. `packages/core/src/composables/useAutoObserver.ts`
14. `packages/core/src/composables/useInfiniteList.ts`
15. `packages/core/src/composables/useSharedObserver.ts`
16. `packages/core/src/directives/vGhost.ts`
17. `packages/core/test/useInfiniteList.test.ts` (moved from root)
18. `packages/elements/package.json` — elements package metadata
19. `packages/elements/vite.config.ts` — elements build config (customElement mode)
20. `packages/elements/tsconfig.json` — elements TS config
21. `packages/elements/vitest.config.ts` — elements test config
22. `packages/elements/src/index.ts` — elements public API
23. `packages/elements/src/elements.ts` — CE definitions + registerElements
24. `packages/elements/src/Gallery.ce.vue` — CE component (updated imports)
25. `packages/elements/src/types.ts` — element types
26. `packages/elements/test/elements.test.ts` — elements smoke tests

### Files Modified (3)

1. `package.json` — private, workspaces, scripts, devDeps
2. `tsconfig.json` — extends tsconfig.base.json
3. `nx.json` — added targetDefaults

### Estimated Line Count (PR 1)

- **New/modified lines**: ~400 (within budget for PR 1)

---

## Remaining Tasks (PR 2)

- [ ] T1.3 Remove root vite.config.ts
- [ ] T4.1 Create Vue demo app
- [ ] T4.2 Create web-component demo app
- [ ] T5.1 Remove old playground directory
- [ ] T5.2 Remove old root src/ directory
- [ ] T5.3 Update root package.json scripts
- [ ] T5.4 Verify root ESM/type config
- [ ] T6.1 Build core package
- [ ] T6.2 Build elements package
- [ ] T6.3 Run tests
- [ ] T6.4 Serve Vue demo
- [ ] T6.5 Serve elements demo
- [ ] T6.6 Verify independent versioning

---

## Risks

- **`workspace:*` protocol not supported by npm**: Used `*` instead for npm workspace cross-references
- **`defineEmits` compiler macro warning in elements tests**: `defineEmits` is imported but Vue 3.5+ SFC compiler handles it automatically — cosmetic only
- **Root project tests run twice**: The root workspace vitest config discovers the same tests as individual package test targets — will be resolved in Phase 5 cleanup
