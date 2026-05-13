# Example 01: Clean Check

All versions are aligned — no findings.

## Input

`fixtures/sample-release/`:

```json
{
  "name": "sample-release",
  "version": "1.0.0"
}
```

```markdown
# Changelog

## [1.0.0] - 2026-04-01

### Added

- Initial release.
```

```markdown
# Release 1.0.0

Notes match package.json.
```

## Command

```bash
node dist/cli.js check fixtures/sample-release --format text
```

## Expected Output

```
ChangeCheck · Release Consistency

✓ package.json version matches latest changelog entry
✓ changelog version matches release notes
✓ no issues found

Summary: 0 errors, 0 warnings
```

Exit code: `0`.
