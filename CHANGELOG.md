# Changelog

## Unreleased

- Report a deterministic error when a present release-notes file has no valid
  SemVer release/version heading, without changing optional-file precedence.
- Keep compiled test suites out of `dist/` by building them into a separate
  ignored `.test-build/` tree, so the published tarball ships only runtime
  modules; `package:smoke` now rejects any packed `__tests__` or source-map
  entry.
- Stop tracking generated `dist/` output; `.gitignore` is authoritative and
  CI rebuilds from source.
- Declare `repository` exactly once in `package.json` and extend the package
  contract to reject any duplicate top-level manifest key.
- Document the packaging and dist policy in README and CONTRIBUTING.

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- Initial project setup.

### Changed

- Refresh development dependencies and pin audited transitive glob-matching
  packages to patched releases.
- Preserve SemVer prerelease and build metadata consistently across generated
  package, changelog, and release-note files.

## Release Links

- Unreleased: [compare](https://github.com/rogerchappel/changecheck/compare/...HEAD)
- Latest release: [releases](https://github.com/rogerchappel/changecheck/releases/latest)

Placeholder links; update with real tags after the first version is published.
