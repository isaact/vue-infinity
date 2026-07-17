# Spec — rename-core-package

## Constraints

- The core package name MUST change from `@vue-infinity/core` to `vue-infinity`.
- The version MUST be bumped to `0.9.0`.
- The `@vue-infinity/elements` package name MUST remain unchanged.
- All internal workspace references, resolve aliases, and imports MUST be updated.
- The package-lock.json MUST be regenerated.

## Requirements

### Requirement: Package name and version updated

The `packages/core/package.json` MUST set `"name": "vue-infinity"` and `"version": "0.9.0"`.

### Requirement: Internal dependency references updated

All `package.json` files in the workspace that reference `@vue-infinity/core` as a dependency MUST be updated to `vue-infinity`:

- `packages/elements/package.json`
- `apps/demo-vue/package.json`

### Requirement: Resolve aliases updated

All Vite, Vitest, and TypeScript config files that alias `@vue-infinity/core` MUST be updated to alias `vue-infinity`:

- `packages/core/tsconfig.json`
- `packages/elements/tsconfig.json`
- `packages/elements/vite.config.ts`
- `packages/elements/vitest.config.ts`
- `apps/demo-vue/vite.config.ts`
- `apps/demo-vue/vitest.config.ts`
- `apps/demo-elements/vite.config.ts`
- `apps/demo-elements/vitest.config.ts`

### Requirement: Source imports updated

All source files importing from `@vue-infinity/core` MUST be updated to import from `vue-infinity`:

- `packages/elements/src/Gallery.ce.vue`
- `apps/demo-vue/App.vue`
- `apps/demo-vue/GhostDemo.vue`
- `apps/demo-vue/test/demo.test.ts`

### Requirement: Documentation updated

The README and canonical spec MUST reflect the new package name.

### Requirement: All tests pass

`npm test` MUST pass after all changes.

## Acceptance Criteria

- `packages/core/package.json` has `name: "vue-infinity"` and `version: "0.9.0"`
- All `@vue-infinity/core` string references are replaced with `vue-infinity` in all live source, config, and doc files
- `npm install` succeeds and `npm test` passes (14/14 tests)
- `nx build core` and `nx build elements` succeed
- `@vue-infinity/elements` is completely unaffected
