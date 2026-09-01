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

Run consistency checks against package version, changelog, release notes, and
local release tags when the directory itself is a Git repository root. The
root must be an existing directory, and `--format` accepts only `text` or
`json`.

```bash
changecheck check . --format text
changecheck check ./my-release --format json
```

Exit codes:
- `0` — Clean. No errors or warnings found.
- `1` — Findings detected (errors or warnings).
- `2` — Invalid input or configuration, including a missing/non-directory root
  or unsupported output format.

### `changecheck init [directory]`

Create a minimal release directory that `changecheck check` can validate.

```bash
changecheck init ./my-release --release-version 1.2.3
changecheck check ./my-release --format text
```

The command writes `package.json`, `CHANGELOG.md`, and `RELEASE.md`. Without
`--force`, initialization is all-or-nothing: if any target file already exists,
the command exits without changing that file or creating either of the others.
Pass `--force` to overwrite all three sample files.

Release versions follow SemVer and may include prerelease identifiers, build
metadata, or both, such as `1.2.3-alpha.1`, `1.2.3+build.7`, and
`1.2.3-rc.1+build.7`. Numeric core and prerelease identifiers cannot contain
leading zeroes.

## How It Works

1. Reads `package.json` for the declared version.
2. Parses `CHANGELOG.md` for the latest version entry.
3. Optionally reads `RELEASE.md` or, when it is absent, `RELEASENOTES.md`.
4. When the checked directory is a Git repository root, compares the package
   version with its highest SemVer `vX.Y.Z` or `X.Y.Z` local tag, including
   valid prerelease and build forms. Directories without such tags and non-Git
   directories keep file-only behavior.
5. Compares versions deterministically — no network, no LLM.
6. Outputs human-readable text or machine-readable JSON.

The `package.json` version is required and must be a non-empty SemVer string.
Missing, null, numeric, or malformed versions are package errors and exit 1.
Valid prerelease and build metadata are supported.

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
├── sample-release-fail/         # Missing files — emits errors
├── release-notes-alternate/     # RELEASENOTES.md mismatch — exits 1
├── release-notes-both/          # RELEASE.md takes precedence
└── release-notes-absent/        # Optional release notes omitted
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

Valid SemVer prereleases participate in the local highest-tag check. This
runnable example accepts `v1.2.3-rc.1` ahead of the older stable `v1.2.2`:

```bash
release_dir="$(mktemp -d)"
node dist/cli.js init "$release_dir" --release-version 1.2.3-rc.1
git -C "$release_dir" init --quiet
git -C "$release_dir" add .
git -C "$release_dir" -c user.name=Example -c user.email=example@example.invalid \
  commit --quiet -m "Add release metadata"
git -C "$release_dir" tag v1.2.2
git -C "$release_dir" tag v1.2.3-rc.1
node dist/cli.js check "$release_dir" --format text
```

## Runnable demos

Generate clean, drift, and failing release metadata outputs from the checked-in
fixtures:

```bash
npm run build
bash demo/run-release-drift-check.sh
```

See [docs/tutorials/check-release-drift.md](docs/tutorials/check-release-drift.md)
for the walkthrough and [docs/promo/release-drift-brief.md](docs/promo/release-drift-brief.md)
for a short recording outline.

Run the release consistency walkthrough:

```bash
bash demo/run-release-consistency-demo.sh
```

The demo writes clean and warning fixture outputs under
`tmp/release-consistency-demo/`, then verifies the expected output markers.
Promotion notes for a short walkthrough live in
[`docs/promo/release-consistency-demo-brief.md`](docs/promo/release-consistency-demo-brief.md).

## Scripts

```bash
npm run build       # TypeScript → dist/
npm run check       # TypeScript type-check (no emit)
npm run lint        # Check source, tests, and scripts with ESLint
npm test            # Build and run every source test via node --test
npm run smoke       # Run a real CLI smoke against fixture
npm run package:smoke  # Preview the npm package contents
npm run release:check  # Run all checks and package smoke in sequence
bash scripts/validate.sh  # Full validation pipeline
```

## Design Principles

- **Local-first**: No network. Ever.
- **Deterministic**: Same input → same output, every time.
- **Fixture-backed**: Test against real directories, not stubs.
- **Safe defaults**: Dry-run first, no destructive writes.
- **Agent-friendly**: Structured JSON and clear exit codes for LLM workflows.

## Limitations

- ChangeCheck validates local release files; it does not query npm, GitHub Releases, PyPI, or other registries for published state.
- Git tag checks use local tags only. Valid SemVer prerelease tags participate
  in highest-tag selection; malformed tags, non-release tag names, and tags
  from a parent repository are ignored.
- Version and changelog parsing is intentionally conservative, so unusual custom changelog formats may need fixtures before being enforced in CI.
- Treat findings as release-review evidence, not as a replacement for human review of release notes and package contents.

## Development

Use Node.js 20 or newer. Run the same checks locally before opening a PR:

```sh
npm run check
npm run lint
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`npm test` performs a deterministic build first and verifies that every source
test has a compiled test before running the complete inventory. `npm run
release:check` is the CI entry point and runs every command above, including
lint.

## Publishing releases

Before publishing for the first time, configure `changecheck` on npm with a
[trusted publisher](https://docs.npmjs.com/trusted-publishers/) for this GitHub
repository and `.github/workflows/release.yml`. The workflow uses GitHub OIDC;
it does not require a long-lived npm token.

A `v*.*.*` tag runs the full release checks, builds and verifies one npm
tarball, publishes that exact file to npm with provenance and public access,
and only then creates the GitHub release with the same tarball attached. The
pull-request dry run executes `npm run release:contract` so registry setup,
OIDC permission, publication flags, artifact identity, and step ordering cannot
silently drift from this sequence.

## License

MIT — see [LICENSE](./LICENSE).
