# Proposal — nx-monorepo

## Proposal question round

These questions are meant to improve the PRD/proposal by surfacing business rules, impact, edge cases, and tradeoffs. Please answer, skip, or request a second round.

1. **Package naming:** Which concrete package names under `@vue-infinity/*` should we adopt (e.g., `@vue-infinity/components` and `@vue-infinity/elements`), and should the root package remain publishable or become a private workspace-only package?
2. **Shared code boundaries:** Should shared composables/types be extracted into a third internal library, or should the web-component package depend directly on the Vue components package (accepting that it re-exports or wraps components)?
3. **Demo apps expectations:** Are the demo apps strictly local-dev only (no CI build/deploy), or do they need to be buildable in CI for validation even if not published?
4. **Versioning/release model:** Should both packages be versioned and released together (single version), or independently, and do you have existing release automation constraints?
5. **Compatibility expectations:** Are there any backwards-compatibility guarantees for import paths or bundle formats beyond matching ES/UMD/CSS/d.ts outputs?

## Confirmed decisions

- Package names: `@vue-infinity/core` and `@vue-infinity/elements`.
- The elements package depends on `@vue-infinity/core`.
- Demo apps are local-dev only (no deploy targets).
- Packages are versioned/released independently.
- The elements package must be drop-in and usable without Vue installed.

## Intent

Restructure the single-package Vue library into an Nx monorepo that splits Vue components and custom web components into two publishable packages, while preserving existing build outputs and maintaining local-only demo apps.

## Problem statement

The current repository ships both Vue components/composables and custom elements from a single package and a single Vite build. This coupling complicates publishing, makes package boundaries unclear, and prevents separately versioning or consuming Vue components vs. web components. The single playground also mixes workflows. A monorepo split is needed to align artifacts with their consumers, without breaking current outputs or developer workflows.

## Goals

- Create an **Nx monorepo** (npm workspace) with two publishable packages:
  - `@vue-infinity/core`: Vue components/composables/directives.
  - `@vue-infinity/elements`: custom elements that wrap/use core.
- Publish **both packages** under `@vue-infinity/*` with **independent versioning**.
- Preserve current **build outputs**: **ES + UMD bundles, CSS, and d.ts**.
- Ensure `@vue-infinity/elements` is **drop-in for any web app** (no Vue install required).
- Split the demo into **two apps** (Vue demo and web-component demo) for local development.
- Keep current test tooling (Vitest) and npm as the package manager.

## Non-goals

- Changing component APIs, styling, or behavior.
- Adding new product features or UX changes beyond demo separation.
- Introducing new package managers (pnpm/yarn) or build systems beyond Nx + Vite.
- Deploying or hosting the demo apps (local-dev only).

## Constraints

- npm remains the package manager.
- Project stays Node.js/TypeScript ESM.
- Build outputs must match current formats (ES + UMD + CSS + d.ts).
- Web components must use Vue custom element mode (`customElement: true`).
- Elements must be usable without a Vue dependency for consumers (drop-in).
- Demo apps are **local-dev only**.

## Proposed approach (high level)

1. **Nx workspace setup**: initialize Nx in the repo, configure npm workspaces, and set the root package as private workspace-only (unless you want it publishable).
2. **Packages**:
   - **Core package** (`@vue-infinity/core`): exports components/composables/directives and CSS.
   - **Elements package** (`@vue-infinity/elements`): exports custom elements and `registerElements()`, and depends on `@vue-infinity/core`.
3. **Build pipelines**:
   - Use Nx targets that call Vite library builds for each package, preserving ES/UMD/CSS/d.ts outputs.
   - Ensure the elements bundle is self-contained (Vue runtime included) so it can be dropped into any web app.
4. **Demo apps**:
   - Create two apps in `apps/`: Vue demo app and web-component demo app, each consuming the relevant package via workspace dependency.
   - Keep them local-dev only (no publish/deploy requirement).
5. **Testing**:
   - Retain Vitest for library tests, integrated with Nx targets.

## Scope

### In scope

- Nx workspace scaffolding and configuration.
- Two publishable packages under `@vue-infinity/*`.
- Vite build configs per package to produce ES/UMD/CSS/d.ts.
- Two local demo apps with appropriate dependencies.
- Updating exports/package metadata for each package.

### Out of scope

- API redesign or component refactors.
- Publishing workflow changes beyond package metadata.
- CI/CD or demo deployment.

## Affected areas

- **Repo structure**: new `apps/` and `packages/` (or `libs/`) layout.
- **Build tooling**: per-package Vite configs, Nx targets.
- **Package metadata**: `package.json` exports and entrypoints for each package.
- **Playground/demo**: new Vue demo and web-component demo apps.
- **Tests**: Vitest targets mapped into Nx.

## Risks and mitigations

- **Breaking imports/exports**: new package boundaries can change import paths.
  - *Mitigation*: preserve existing entry names and document migration.
- **Build output drift**: Vite configs for two packages may diverge from current output.
  - *Mitigation*: replicate current build settings and verify output artifacts.
- **Code duplication**: shared logic might be copied between packages.
  - *Mitigation*: elements depends on core rather than duplicating logic.
- **Elements drop-in requirement**: bundling Vue runtime can increase bundle size or duplicate Vue in Vue apps.
  - *Mitigation*: bundle Vue only in elements outputs and document expected usage.
- **Local demo coupling**: demos might inadvertently rely on source paths.
  - *Mitigation*: ensure demos consume workspace packages and use Nx build graph.

## Rollback plan

- Keep a branch/tag of the pre-Nx single-package layout.
- If issues arise, revert to the previous layout and Vite config, restoring the original playground app and package exports.

## Success criteria

- Nx workspace builds both packages with outputs matching ES/UMD/CSS/d.ts.
- Both packages publishable under `@vue-infinity/*` without build errors.
- `@vue-infinity/elements` works in a non-Vue app without installing Vue.
- Vue demo and web-component demo apps run locally and consume the correct package.
- Packages can be versioned/released independently.
- Vitest tests run successfully through Nx targets.

## Acceptance criteria

- **Workspace**: Nx configuration present; npm workspaces configured; root package marked private unless explicitly made publishable.
- **Packages**: Two publishable packages `@vue-infinity/core` and `@vue-infinity/elements`, each with correct `package.json` exports and `@vue-infinity/elements` depending on `@vue-infinity/core`.
- **Build outputs**: Each package produces ES + UMD bundles, CSS, and d.ts artifacts matching current expectations.
- **Web components**: Custom element build uses Vue custom element mode, exposes `registerElements()`, and is usable without installing Vue.
- **Versioning**: Packages can be released independently (separate versions).
- **Demos**: Two local demo apps exist and run independently against workspace packages.
- **Tests**: Vitest tests can be executed per-package via Nx targets.

## Open assumptions (pending confirmation)

- Root package publishability (private workspace-only vs. publishable) is still to be confirmed.
- Release automation constraints (if any) are TBD.
