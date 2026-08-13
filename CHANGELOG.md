# Changelog

All notable changes to CodexKit are documented here.

## [Unreleased]

## [0.1.9] - 2026-08-13

### Added

- Restored the Codex statusline entrypoint and its integration coverage.
- Added a supported root `npm test` command with optional dashboard checks.

### Fixed

- Aligned the package name and installation instructions with the published
  npm scope `@manhnv319/codexkit` while keeping the GitHub source repository at
  `manhvann/codexkit`.
- Corrected the worktree test compatibility wrapper path.
- Repaired markdown viewer dashboard test paths and rendering assertions.
- Added npm package metadata and README-link validation.

## [0.1.8] - 2026-08-13

### Added

- Public OSS project documentation and contribution guidelines.
- Repository-wide `.gitignore` coverage for secrets, caches, logs, and generated artifacts.
- Codex `$skill` invocation examples and help output.

### Changed

- Renamed legacy provider references and environment examples to CodexKit.
- Removed an unused external-provider key placeholder from the environment template.
- Added public npm metadata for the scoped `@manhnv319/codexkit` package.

### Security

- Audited the repository for personal data, credentials, and legacy provider identifiers.
