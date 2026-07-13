# ChangeCheck release consistency demo brief

## Demo angle

Show how ChangeCheck catches version drift between package metadata, changelog entries, and release notes before a release is published.

## 60 second flow

1. Run `bash demo/run-release-consistency-demo.sh`.
2. Open `tmp/release-consistency-demo/clean.txt` to show the clean fixture output.
3. Open `tmp/release-consistency-demo/warnings.json` to show a machine-readable warning fixture.
4. Point to `fixtures/sample-release*` so viewers can see the exact inputs.
5. Close with the local-first behavior: no registry, GitHub, or LLM calls are needed to catch version drift.

## Useful hooks

- "Release notes drift is easier to prevent than explain."
- "Before publishing, make package versions and changelogs agree."
- "ChangeCheck gives agents a deterministic release sanity check."

## Verification for the demo

Run:

```bash
bash demo/run-release-consistency-demo.sh
```

The script builds the CLI, captures clean and warning fixture outputs, and verifies the expected markers in both generated files.
