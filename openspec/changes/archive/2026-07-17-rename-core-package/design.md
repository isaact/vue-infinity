# Design — rename-core-package

## Approach

Mechanical search-and-replace across 17 files. No structural changes, no API changes, no build config changes beyond the package name string.

## Files to change

### Package metadata (3 files)

- `packages/core/package.json`: `name` → `vue-infinity`, `version` → `0.9.0`
- `packages/elements/package.json`: dependency `@vue-infinity/core` → `vue-infinity`
- `apps/demo-vue/package.json`: dependency `@vue-infinity/core` → `vue-infinity`

### Resolve aliases (8 files)

Replace `@vue-infinity/core` with `vue-infinity` in resolve alias entries:

- `packages/core/tsconfig.json`
- `packages/elements/tsconfig.json`
- `packages/elements/vite.config.ts`
- `packages/elements/vitest.config.ts`
- `apps/demo-vue/vite.config.ts`
- `apps/demo-vue/vitest.config.ts`
- `apps/demo-elements/vite.config.ts`
- `apps/demo-elements/vitest.config.ts`

### Source imports (4 files)

Replace `from '@vue-infinity/core'` with `from 'vue-infinity'`:

- `packages/elements/src/Gallery.ce.vue`
- `apps/demo-vue/App.vue`
- `apps/demo-vue/GhostDemo.vue`
- `apps/demo-vue/test/demo.test.ts`

### Documentation (2 files)

- `README.md`
- `openspec/specs/01-monorepo/spec.md`

## Order of operations

1. Edit package metadata files
2. Edit resolve aliases
3. Edit source imports
4. Edit documentation
5. Run `npm install` to regenerate lockfile
6. Run `npm test` to verify
7. Run `nx build core` and `nx build elements` to verify builds

## Risks

- None significant — this is a pure string rename with no logic changes
- Ensure archived files are NOT modified
