# Nx Monorepo Specification

## Purpose

Provide a clear Nx-based monorepo split for Vue components and custom elements that preserves existing build outputs, enables independent versioning, and maintains local-only demo workflows without changing component behavior.

## Constraints

- The repository MUST remain Node.js/TypeScript ESM.
- npm MUST remain the package manager.
- Build outputs MUST preserve the current formats: ES modules, UMD bundles, CSS, and d.ts.
- Web components MUST use Vue custom element mode (`customElement: true`).
- Demo apps are local-development only (no publish/deploy requirement).
- The root package MUST be workspace-only by default (private unless explicitly changed).

## User Stories

- As a maintainer, I can release `@vue-infinity/core` and `@vue-infinity/elements` independently.
- As a consumer, I can drop `@vue-infinity/elements` into a non-Vue app without installing Vue.
- As a developer, I can run a Vue demo and a web-component demo locally against workspace packages.

## Requirements

### Requirement: Nx workspace and npm workspaces are established

The system MUST configure an Nx workspace alongside npm workspaces for the repo, with the root package set as private by default.

#### Scenario: Workspace root configuration

- GIVEN the repository root
- WHEN the root `package.json` and Nx config files are inspected
- THEN the root package is marked `private: true`
- AND npm workspaces include the apps and packages locations
- AND Nx configuration exists to define projects for the packages and demo apps

### Requirement: Two publishable packages with correct boundaries

The system MUST define two publishable packages named `@vue-infinity/core` and `@vue-infinity/elements`, and `@vue-infinity/elements` MUST declare a dependency on `@vue-infinity/core`.

#### Scenario: Package metadata and dependency boundary

- GIVEN the workspace packages
- WHEN each package’s `package.json` is inspected
- THEN one package is named `@vue-infinity/core`
- AND one package is named `@vue-infinity/elements`
- AND `@vue-infinity/elements` declares a dependency on `@vue-infinity/core`

### Requirement: Independent versioning

Each package MUST be versioned independently, without any requirement that `@vue-infinity/core` and `@vue-infinity/elements` share the same version.

#### Scenario: Version fields are independent

- GIVEN the two package manifests
- WHEN their `version` fields are compared
- THEN the versions may differ without violating tooling or workspace configuration

### Requirement: Build outputs match existing formats

Each package MUST produce ES module bundles, UMD bundles, CSS assets, and d.ts files that preserve the current output formats and entry names.

#### Scenario: Build artifacts are present per package

- GIVEN a successful Nx build of each package
- WHEN the output directories are inspected
- THEN ES module bundles, UMD bundles, CSS assets, and d.ts files are present
- AND the entry names and artifact types match the pre-monorepo expectations

### Requirement: Elements are drop-in without Vue installation

`@vue-infinity/elements` MUST be usable in applications that do not install Vue, including bundling the Vue runtime in its published outputs, and MUST expose a `registerElements()` entry point.

#### Scenario: Non-Vue consumer usage

- GIVEN a clean web app with no Vue dependency installed
- WHEN the app imports the published `@vue-infinity/elements` bundle and calls `registerElements()`
- THEN the custom elements register successfully
- AND no Vue installation is required to render the custom elements

### Requirement: Custom element build uses Vue custom element mode

The elements package MUST build custom elements using Vue custom element mode (`customElement: true`).

#### Scenario: Build configuration indicates custom element mode

- GIVEN the elements package build configuration
- WHEN the custom element build settings are inspected
- THEN Vue custom element mode is enabled (`customElement: true`)

### Requirement: Two local demo apps

The system MUST provide two local-only demo apps, one consuming `@vue-infinity/core` and one consuming `@vue-infinity/elements` via workspace dependencies.

#### Scenario: Demo apps consume workspace packages

- GIVEN the demo app manifests
- WHEN dependencies are inspected
- THEN the Vue demo app depends on `@vue-infinity/core`
- AND the web-component demo app depends on `@vue-infinity/elements`

### Requirement: Vitest targets remain available via Nx

The system MUST retain Vitest tests and expose Nx targets to run package tests.

#### Scenario: Nx test targets exist

- GIVEN the Nx project configuration for each package
- WHEN test targets are listed
- THEN each package exposes a test target that runs Vitest

## Acceptance Criteria

- Nx configuration is present, npm workspaces are configured, and the root package is private by default.
- `@vue-infinity/core` and `@vue-infinity/elements` are publishable packages with correct package metadata and dependency boundaries.
- Packages can be versioned independently without tooling conflicts.
- Both packages produce ES/UMD/CSS/d.ts outputs with entry names matching pre-monorepo expectations.
- `@vue-infinity/elements` is drop-in for non-Vue apps, bundles the Vue runtime, and exposes `registerElements()`.
- The elements build uses Vue custom element mode (`customElement: true`).
- Two local demo apps exist and consume the correct workspace packages.
- Vitest can be run per package via Nx targets.

## Test Considerations

- Verify build outputs per package match the previous artifact types and entry names.
- Validate `@vue-infinity/elements` works in a minimal non-Vue app with no Vue dependency.
- Run Nx test targets for each package to confirm Vitest integration.
- Smoke-test both demo apps against workspace packages in local development.
