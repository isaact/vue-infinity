# Post-Migration Fixes Specification

## Purpose

Resolve five concrete issues discovered after the Nx monorepo migration that affect build correctness, bundle size, developer experience, and project documentation. Each fix is independent but scoped to a single change for efficient delivery.

## Requirements

### Requirement: Elements package imports from `@vue/runtime-dom` instead of full `vue`

The `@vue-infinity/elements` package MUST import `defineCustomElement` from `@vue/runtime-dom` instead of the full `vue` module in `packages/elements/src/elements.ts`.

#### Scenario: Import path change in elements.ts

- GIVEN the file `packages/elements/src/elements.ts`
- WHEN the import statement is inspected
- THEN the import source for `defineCustomElement` is `"@vue/runtime-dom"`
- AND the import source is NOT `"vue"`
- AND no other runtime-breaking changes are introduced by the import change

#### Scenario: Elements build succeeds with reduced bundle

- GIVEN the elements package with the updated import
- WHEN `pnpm nx build elements` (or equivalent build command) is executed
- THEN the build exits with exit code 0
- AND the built bundle (e.g., `packages/elements/dist/gallery-ce.js`) is smaller than 80KB uncompressed
- AND the built bundle is smaller than the current ~173KB bundle

#### Scenario: Elements bundle is functionally correct

- GIVEN the built elements bundle
- WHEN it is loaded in a browser context and `registerElements()` is called
- THEN the `<gallery-ce>` custom element registers successfully
- AND the custom element renders gallery images correctly with the Vue runtime behavior intact

### Requirement: Elements demo app uses `mockApi.ts` for dynamic images

The `apps/demo-elements` app MUST reuse the mock API from `apps/demo-vue/mockApi.ts` to provide a rich, varied set of images to the `<gallery-ce>` custom element, replacing the hardcoded 5-item JSON attribute.

#### Scenario: mockApi.ts is added to demo-elements

- GIVEN the `apps/demo-elements` directory
- WHEN the file `apps/demo-elements/mockApi.ts` is inspected
- THEN a file named `mockApi.ts` exists
- AND its content is functionally equivalent to `apps/demo-vue/mockApi.ts` (same `GalleryItem` interface, same `fetchMockImages` function signature, same picsum.photos URL generation logic)

#### Scenario: main.ts uses async initialization with fetchMockImages

- GIVEN the file `apps/demo-elements/main.ts`
- WHEN the source code is inspected
- THEN it imports `fetchMockImages` and `GalleryItem` (or equivalent types) from `./mockApi`
- AND it calls `fetchMockImages()` to obtain an array of gallery images
- AND it passes the fetched images to the `<gallery-ce>` element's `updateImages()` method
- AND the element shows varied picsum.photos images (not only the 5 original hardcoded URLs)

#### Scenario: Hardcoded items attribute is removed from index.html

- GIVEN the file `apps/demo-elements/index.html`
- WHEN the `<gallery-ce>` element in the HTML is inspected
- THEN the element does NOT have a hardcoded `items` JSON string attribute
- AND the element is rendered (with empty initial state or placeholder) before the async images load

### Requirement: TypeScript declaration for `@vue-infinity/elements`

The `@vue-infinity/elements` package MUST provide a TypeScript declaration that allows `import { registerElements } from "@vue-infinity/elements"` to resolve without `Could not find a declaration file` errors.

#### Scenario: Declaration file exists in elements package

- GIVEN the elements package source directory (`packages/elements/src/`)
- WHEN the project is inspected for declaration files
- THEN either:
  - A file `packages/elements/src/env.d.ts` (or similarly named `.d.ts`) exists that declares the `@vue-infinity/elements` module, OR
  - The `vite-plugin-dts` plugin generates a `dist/index.d.ts` file that correctly exports `registerElements`, `Gallery`, and `GalleryImage`

#### Scenario: TypeScript compilation succeeds for demo-elements

- GIVEN the elements package with the declaration in place
- WHEN TypeScript type-checks `apps/demo-elements/main.ts` (e.g., via `pnpm nx build demo-elements` or `vue-tsc --noEmit`)
- THEN the compilation exits with exit code 0
- AND no `Could not find a declaration file for module '@vue-infinity/elements'` error is reported

#### Scenario: Declaration exports correct public API

- GIVEN the declaration file for `@vue-infinity/elements`
- WHEN the declaration is inspected
- THEN it exports at minimum:
  - A `registerElements()` function
  - A `Gallery` class (typeof `HTMLElement`)
  - A `GalleryImage` interface with fields `url` (string), `title` (string, optional), and `thumbUrl` (string, optional)

### Requirement: Root README is updated for monorepo structure

The root `README.md` MUST be updated to accurately reflect the monorepo structure with two packages (`@vue-infinity/core` and `@vue-infinity/elements`) and two demo apps.

#### Scenario: Monorepo structure section is present

- GIVEN the root `README.md`
- WHEN the file is inspected
- THEN it includes a section (or sub-section) describing the monorepo structure
- AND that section names `@vue-infinity/core` and `@vue-infinity/elements` as the two packages
- AND it mentions the two demo apps (`demo-vue` for core components, `demo-elements` for web components)

#### Scenario: Gallery web component import paths are corrected

- GIVEN the "Gallery Web Component" section in `README.md`
- WHEN the code examples in that section are inspected
- THEN all imports of `registerElements` use `@vue-infinity/elements` (not `vue-infinity`)

#### Scenario: Development commands are updated

- GIVEN the "Run Playground App" or equivalent section in `README.md`
- WHEN the commands listed are inspected
- THEN the instructions reference `npm run dev:core` (or `pnpm nx serve demo-vue`) for the Vue demo
- AND the instructions reference `npm run dev:elements` (or `pnpm nx serve demo-elements`) for the elements demo
- AND the instructions no longer reference the non-existent `npm run playground` command

#### Scenario: Core package examples remain correct

- GIVEN the Carousel, InfiniteCarousel, and Ghost sections in `README.md`
- WHEN the code examples in those sections are inspected
- THEN imports from `vue-infinity` are preserved (unchanged) since `vue-infinity` maps to the root `@vue-infinity/core` package via npm

### Requirement: Gallery component demo is removed from demo-vue

The `apps/demo-vue/App.vue` file MUST no longer include the "Gallery web component demo" section, and the associated `apps/demo-vue/GalleryDemo.vue` file MUST be removed.

#### Scenario: GalleryDemo import and usage are removed from App.vue

- GIVEN the file `apps/demo-vue/App.vue`
- WHEN the source code is inspected
- THEN there is NO `import GalleryDemo from './GalleryDemo.vue'` statement
- AND there is NO `<GalleryDemo />` usage in the template
- AND there is NO "Gallery web component demo" heading text in the template

#### Scenario: GalleryDemo.vue file is deleted

- GIVEN the file system under `apps/demo-vue/`
- WHEN the file `apps/demo-vue/GalleryDemo.vue` is checked
- THEN the file does not exist (or is empty/removed)
- AND no other file references `GalleryDemo.vue` or `GalleryDemo`

#### Scenario: demo-vue app still renders remaining components

- GIVEN the updated `apps/demo-vue/App.vue`
- WHEN the app is served (e.g., `pnpm nx serve demo-vue`)
- THEN the page displays the Ghost component demo section
- AND the page displays the InfiniteCarousel component demo section
- AND the page does NOT display a "Gallery web component demo" section

## Acceptance Criteria

1. **Bundle size:** `packages/elements/src/elements.ts` imports `defineCustomElement` from `@vue/runtime-dom`; the built bundle is < 80KB (reduced from ~173KB).
2. **Elements demo rich:** `apps/demo-elements` shows varied picsum.photos images from `mockApi.ts`, not 5 hardcoded static URLs.
3. **No TS errors:** TypeScript compilation of `apps/demo-elements` succeeds without `Could not find a declaration file` errors for `@vue-infinity/elements`.
4. **README accurate:** Root `README.md` includes monorepo structure, corrected import paths (`@vue-infinity/elements`), and correct dev commands (`dev:core`/`dev:elements`).
5. **demo-vue clean:** `apps/demo-vue/App.vue` has no `GalleryDemo` import or usage; `apps/demo-vue/GalleryDemo.vue` is removed.
6. **Tests pass:** `npm test` passes all existing tests (14/14 baseline).

## Test Considerations

- Verify that the elements bundle size is measurably smaller by comparing pre- and post-fix bundle sizes using `ls -lh packages/elements/dist/gallery-ce.js`.
- Validate that `fetchMockImages` called from `apps/demo-elements/main.ts` returns at least 20 unique image objects with correct `GalleryItem` shape.
- Run TypeScript type-checking (`vue-tsc --noEmit` or `pnpm nx typecheck demo-elements` if available) to confirm no declaration errors.
- Manual smoke-test: serve `demo-elements` and verify the page loads with varied images (not static 5); serve `demo-vue` and verify no "Gallery web component demo" section appears.
- Run `grep -r "GalleryDemo" apps/demo-vue/` to confirm no residual references after cleanup.
- Run `npm test` to confirm no regressions.
