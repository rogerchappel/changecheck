# ChangeCheck Tasks

## Release Readiness

- Keep `npm run release:check` green before opening release PRs.
- Run package smoke after metadata or file allowlist changes.
- Verify CLI `check` output for the clean, warning, and failure fixtures.

## Promotion

- Refresh README examples when CLI flags or output formats change.
- Update release notes with fixture-backed behavior changes.
- Confirm package contents include trust and install documents before tagging.
