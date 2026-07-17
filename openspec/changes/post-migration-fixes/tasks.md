# Tasks — post-migration-fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 70–90 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Tasks (ordered; RED → GREEN → TRIANGULATE → REFACTOR)

### RED

- [x] Run `pnpm nx build demo-elements` (or `vue-tsc --noEmit`) to capture the current missing declaration error pointing at `apps/demo-elements/main.ts` for `@vue-infinity/elements`.

### GREEN

- [x] Update `packages/elements/src/elements.ts` to import `defineCustomElement` from `@vue/runtime-dom` (replacing the `vue` import).
- [x] Copy `apps/demo-vue/mockApi.ts` to `apps/demo-elements/mockApi.ts`.
- [x] Rewrite `apps/demo-elements/main.ts` to fetch images via `fetchMockImages()` from `./mockApi` and call `updateImages()` on the `gallery-ce` element.
- [x] Remove the hardcoded `items` JSON attribute from `<gallery-ce>` in `apps/demo-elements/index.html`.
- [x] Add `packages/elements/src/env.d.ts` declaring the `@vue-infinity/elements` module exports (`registerElements`, `Gallery`, `GalleryImage`).
- [x] Update `README.md` with a monorepo structure section, corrected `@vue-infinity/elements` imports in the Gallery Web Component examples, and updated dev commands (`dev:core`, `dev:elements`).
- [x] Edit `apps/demo-vue/App.vue` to remove the `GalleryDemo` import, heading, and `<GalleryDemo />` usage.
- [x] Delete `apps/demo-vue/GalleryDemo.vue`.

### TRIANGULATE

- [x] Rebuild `elements` and confirm `packages/elements/dist/gallery-ce.js` is < 80KB (`pnpm nx build elements` + `ls -lh`).
- [x] Re-run the TypeScript build for `apps/demo-elements` (`pnpm nx build demo-elements` or `vue-tsc --noEmit`) and serve `apps/demo-elements` to verify dynamic picsum.photos images render.
- [x] Run `grep -r "GalleryDemo" apps/demo-vue/` and serve `apps/demo-vue` to confirm only Ghost + InfiniteCarousel sections remain.

### REFACTOR

- [x] Run `npm test` (Vitest) to ensure `test/useInfiniteList.test.ts` still passes; clean up any unused imports or formatting in modified files if the run flags issues.
