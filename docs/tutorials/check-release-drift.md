# Check release drift before publishing

This tutorial uses the checked-in release fixtures to show the three reviewer
states ChangeCheck can surface: clean, version drift, and missing release
metadata.

## Build the CLI

```bash
npm install
npm run build
```

## Run the demo

```bash
bash demo/run-release-drift-check.sh
```

The script writes outputs to `tmp/release-drift-demo/`:

- `clean.txt` shows aligned `package.json`, `CHANGELOG.md`, and `RELEASE.md`.
- `warnings.json` shows a version mismatch in machine-readable form.
- `fail.txt` shows missing or invalid release metadata.

## Why version drift exits non-zero

`fixtures/sample-release-warnings` intentionally declares a package version that
does not match the latest changelog entry. ChangeCheck exits `1` so CI can stop a
release before a tag, package, and release note disagree.

## CI pattern

```bash
npm run build
node dist/cli.js check . --format json > changecheck-report.json
```

Upload `changecheck-report.json` as a release artifact when reviewers need to
inspect the exact finding payload.
