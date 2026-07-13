# SDD Explore — nx-monorepo

## Problem Statement

The current repository is a single npm package that builds both Vue components/composables and a custom element (web component) build from the same Vite config, with a single Vite playground app. We need to convert it to an Nx monorepo that separates Vue components and custom web components into distinct packages and splits the demo into two apps (Vue demo and web-component demo). This requires re-structuring source code, build configuration, and demo app dependencies while preserving existing functionality and outputs.

## Current State (observed)

- **Package manager:** npm (root `package.json`).
- **Build system:** Vite in root (`vite.config.ts`) with:
  - Standard library build (`src/index.ts`) outputting UMD/ES bundles.
  - Custom elements build when `mode === 'ce'`, entry `src/components/Gallery.ce.vue`, format `es`, file name `gallery-ce`.
  - `@vitejs/plugin-vue`, `vite-plugin-dts`.
- **Exports:** root `package.json` exports for `.` and `./style.css`.
- **Custom elements:** `src/elements.ts` defines/exports `Gallery` custom element and `registerElements()`.
- **Playground app:** under `playground/` with its own `vite.config.ts`, `index.html`, `main.ts`, `App.vue`. Uses root dependencies and `registerElements()` from `src/elements`.
- **Source layout:** `src/` contains components, composables, directives, types, and web component implementation (`Gallery.ce.vue`).
- **Tests:** Vitest (`npm test`), no Nx config present.

## Target Outcomes (from request)

- Convert repository into **Nx monorepo**.
- **Separate packages**:
  - One package for Vue components/composables/directives.
  - One package for custom web components.
- **Split demo** into two apps:
  - Vue demo app.
  - Web-component demo app.

## Constraints

- Must keep **npm** as package manager (per OpenSpec context).
- Project is **Node.js/TypeScript ESM**.
- Existing build produces **library bundles + CSS**; need to preserve similar publishable outputs.
- Web component build requires **Vue custom element mode** (`customElement: true`).
- Tests currently run with **Vitest**; Nx integration should account for this.

## Risks

- **Breaking existing package exports**: separating packages may change import paths or published artifacts.
- **Build divergence** between Vue component package and custom-element package (e.g., CSS handling, d.ts generation).
- **Shared code duplication** if common code is needed by both packages and not factored into a shared library.
- **Demo app coupling**: playground currently imports from local `src/`; splitting requires re-pointing to Nx libs or local workspace package references.
- **Custom elements registration**: `registerElements()` location and distribution must move to the web-component package.

## Unknowns / Clarifications Needed

- Desired **package names/scopes** for the new libs (retain `vue-infinity`? add `vue-infinity-ce`?).
- Should both packages be **published** independently or only used internally?
- Expected **build outputs** for each package (UMD/ES? CSS file? d.ts paths?).
- Whether to create a **shared** library for composables/types used by both packages.
- Nx **preset/version** preference and use of Nx tooling for Vite builds.
- How to handle **playground assets** and whether both demo apps should be deployable in CI.

## Assumptions

- None recorded yet; to confirm during proposal Q&A.
