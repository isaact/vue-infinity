# Proposal — rename-core-package

## Intent

Rename the core package from `@vue-infinity/core` back to `vue-infinity` so consumers install via `npm install vue-infinity` (restoring the original package name), while keeping `@vue-infinity/elements` as a scoped second package. Bump version to `0.9.0` to reflect the major restructuring.

## Problem

The monorepo split renamed the core package to `@vue-infinity/core`, but `npm install @vue-infinity/core` is cumbersome and breaks continuity with the project's existing identity. The original package was `vue-infinity` and consumers expect that name.

## Goals

- Rename `@vue-infinity/core` → `vue-infinity` (package name)
- Bump version to `0.9.0`
- Keep `@vue-infinity/elements` as-is
- Update all internal workspace references, resolve aliases, and imports
- Update canonical spec and README

## Non-goals

- No API changes, no source code restructuring
- No changes to `@vue-infinity/elements` package name
- No changes to build outputs or entry points

## Affected files

### Package metadata

- `packages/core/package.json` — name → `vue-infinity`, version → `0.9.0`
- `packages/elements/package.json` — dependency `@vue-infinity/core` → `vue-infinity`
- `apps/demo-vue/package.json` — dependency `@vue-infinity/core` → `vue-infinity`

### Resolve aliases (vite/vitest/tsconfig)

- `packages/core/tsconfig.json`
- `packages/elements/tsconfig.json`
- `packages/elements/vite.config.ts`
- `packages/elements/vitest.config.ts`
- `apps/demo-vue/vite.config.ts`
- `apps/demo-vue/vitest.config.ts`
- `apps/demo-elements/vite.config.ts`
- `apps/demo-elements/vitest.config.ts`

### Source imports

- `packages/elements/src/Gallery.ce.vue`
- `apps/demo-vue/App.vue`
- `apps/demo-vue/GhostDemo.vue`
- `apps/demo-vue/test/demo.test.ts`

### Documentation

- `README.md`
- `openspec/specs/01-monorepo/spec.md`

## Acceptance criteria

- `npm install vue-infinity` installs the core package
- All internal imports and aliases resolve correctly
- `npm test` passes (14/14 tests)
- `nx build core` and `nx build elements` succeed
- `@vue-infinity/elements` is unaffected
- Version is `0.9.0`
