# Demo brief: release drift check

## Hook

"Catch package, changelog, and release-note drift before the release command ever
runs."

## Recording outline

1. Show `fixtures/sample-release` and `fixtures/sample-release-warnings`.
2. Run `npm run build`.
3. Run `bash demo/run-release-drift-check.sh`.
4. Open `tmp/release-drift-demo/clean.txt`.
5. Open `tmp/release-drift-demo/warnings.json` to show CI-friendly drift
   findings.

## Social hooks

- Version drift is easier to catch before a package is published.
- ChangeCheck turns release metadata into a deterministic local gate.
- One fixture shows clean metadata; one fixture shows a changelog mismatch.

## Grounding notes

The demo uses only local fixtures and the built CLI. It does not query package
registries, GitHub releases, or remote tags.
