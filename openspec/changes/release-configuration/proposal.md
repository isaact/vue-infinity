# Proposal — release-configuration

## Intent

1. Bump `@vue-infinity/elements` version to `0.9.0` to match the core package.
2. Configure Nx release management for independent versioning and publishing.

## Changes

### 1. Version bump

- `packages/elements/package.json`: version `0.1.0` → `0.9.0`
- Demo apps' dependency on elements uses `*` (workspace reference), no version constraint update needed

### 2. Nx release configuration

- Add `release` section to `nx.json` with:
  - Independent versioning (`projectsRelationship: "independent"`)
  - Conventional commits for automatic version bumps
  - Git tag pattern per package
  - Changelog generation
  - Scope releases to publishable projects only (`vue-infinity` and `@vue-infinity/elements`)

## Acceptance Criteria

- `packages/elements/package.json` has `version: "0.9.0"`
- `nx release --dry-run` shows correct version bumps
- Both packages can be versioned independently
- Existing `npm test`, `nx build`, and `nx serve` commands are unaffected
