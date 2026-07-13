# ChangeCheck Orchestration

## Local Release Check

Run the full local gate before release promotion:

```bash
npm run release:check
```

This runs type-checking, build, tests, fixture smoke, and npm package dry-run.

## CI Expectations

Pull requests should keep the default CI workflow green. Release promotion should also pass ReleaseBox readiness checks before tags are created.

## Manual Review

Review package contents for:

- CLI entrypoint in `dist/cli.js`.
- README, license, and security policy.
- Fixture coverage for clean, warning, and failure release states.
