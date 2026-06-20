# ChangeCheck 🧭

> Local-first release consistency checker for changelogs, package versions, git tags, and release notes.

No hidden network calls. No telemetry. Just deterministic, fixture-backed checks that catch version drift before it ships.

## Why ChangeCheck?

Small OSS repos are notorious for **version drift**:
- `package.json` says `1.2.3`
- `CHANGELOG.md` says `1.2.2`
- Git tag is `v1.2.4`
- Release notes reference `1.2.0`

ChangeCheck catches this mismatch locally, before you push to npm, PyPI, or GitHub Releases.

## Getting Started

```bash
# Clone and install
git clone https://github.com/rogerchappel/changecheck.git
cd changecheck
npm install

# Run checks on a fixture directory
npm run build
node dist/cli.js check fixtures/sample-release --format text
```

## CLI Commands

### `changecheck check <directory>`

Run consistency checks against package version, changelog, and release notes.

```bash
changecheck check . --format text
changecheck check ./my-release --format json
```

Exit codes:
- `0` — Clean. No errors found.
- `1` — Findings detected (errors or warnings).
- `2` — Invalid input or configuration.

### `changecheck init [directory]`

(Placeholder) Initialize a release directory template.

## How It Works

1. Reads `package.json` for the declared version.
2. Parses `CHANGELOG.md` for the latest version entry.
3. Optionally reads `RELEASE.md` or `RELEASENOTES.md`.
4. Compares versions deterministically — no network, no LLM.
5. Outputs human-readable text or machine-readable JSON.

## Directory Layout

```
my-release/
├── package.json        # { "version": "1.2.3" }
├── CHANGELOG.md        # ## [1.2.3] - ...
└── RELEASE.md          # # Release 1.2.3
```

## Fixtures

The `fixtures/` directory ships with ready-made test cases:

```
fixtures/
├── sample-release/              # All versions match — exits 0
├── sample-release-warnings/     # Version mismatch — emits warnings
└── sample-release-fail/         # Missing files — emits errors
```

## Examples

```bash
# Text output (default)
node dist/cli.js check fixtures/sample-release --format text

# JSON output
node dist/cli.js check fixtures/sample-release --format json

# Pipe into CI
node dist/cli.js check . --format json | jq '.summary.errors'
```

## Scripts

```bash
npm run build       # TypeScript → dist/
npm run check       # TypeScript type-check (no emit)
npm test            # Run tests via node --test
npm run smoke       # Run a real CLI smoke against fixture
npm run package:smoke  # Inspect npm tarball contents
npm run release:check  # Run all checks in sequence
bash scripts/validate.sh  # Full validation pipeline
```

## Design Principles

- **Local-first**: No network. Ever.
- **Deterministic**: Same input → same output, every time.
- **Fixture-backed**: Test against real directories, not stubs.
- **Safe defaults**: Dry-run first, no destructive writes.
- **Agent-friendly**: Structured JSON and clear exit codes for LLM workflows.

## License

MIT — see [LICENSE](./LICENSE).
