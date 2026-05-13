# Example 02: Version Warning

Package version does not match changelog — warning emitted.

## Input

`fixtures/sample-release-warnings/`:

```json
{
  "name": "sample-release-warnings",
  "version": "2.0.0"
}
```

```markdown
# Changelog

## [1.9.0] - 2026-05-10

### Added

- Older feature
```

## Command

```bash
node dist/cli.js check fixtures/sample-release-warnings --format text
```

## Expected Output

```
ChangeCheck · Release Consistency

⚠ version mismatch: package.json (2.0.0) ≠ changelog latest (1.9.0)
✓ changelog version matches release notes

Summary: 0 errors, 1 warnings
```

Exit code: `1`.
