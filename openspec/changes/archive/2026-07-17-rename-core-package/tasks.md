# Tasks — rename-core-package

## Review Workload Forecast

- Estimated changed lines: ~25 (across 17 files, mostly single-line)
- 400-line budget risk: Low
- Chained PRs recommended: No
- Delivery strategy: single-pr

## Tasks

### GREEN

1. [x] Update `packages/core/package.json` — name `vue-infinity`, version `0.9.0`
2. [x] Update `packages/elements/package.json` — dependency `@vue-infinity/core` → `vue-infinity`
3. [x] Update `apps/demo-vue/package.json` — dependency `@vue-infinity/core` → `vue-infinity`
4. [x] Update `packages/core/tsconfig.json` — alias `@vue-infinity/core` → `vue-infinity`
5. [x] Update `packages/elements/tsconfig.json` — alias `@vue-infinity/core` → `vue-infinity`
6. [x] Update `packages/elements/vite.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
7. [x] Update `packages/elements/vitest.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
8. [x] Update `apps/demo-vue/vite.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
9. [x] Update `apps/demo-vue/vitest.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
10. [x] Update `apps/demo-elements/vite.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
11. [x] Update `apps/demo-elements/vitest.config.ts` — alias `@vue-infinity/core` → `vue-infinity`
12. [x] Update `packages/elements/src/Gallery.ce.vue` — import `@vue-infinity/core` → `vue-infinity`
13. [x] Update `apps/demo-vue/App.vue` — import `@vue-infinity/core` → `vue-infinity`
14. [x] Update `apps/demo-vue/GhostDemo.vue` — import `@vue-infinity/core` → `vue-infinity`
15. [x] Update `apps/demo-vue/test/demo.test.ts` — import `@vue-infinity/core` → `vue-infinity`
16. [x] Update `README.md` — replace all `@vue-infinity/core` with `vue-infinity`
17. [x] Update `openspec/specs/01-monorepo/spec.md` — replace `@vue-infinity/core` with `vue-infinity`

### TRIANGULATE

1. [x] Run `npm install` to regenerate package-lock.json
2. [x] Run `npm test` to verify all tests pass
3. [x] Run `nx build core` to verify core builds
4. [x] Run `nx build elements` to verify elements builds
