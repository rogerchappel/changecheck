# changecheck Orchestration

## Release Readiness Flow

1. Run `npm ci` from a clean checkout.
2. Run `npm run release:check`.
3. Run `node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check .` when ReleaseBox is available locally.
4. Inspect `npm pack --dry-run` output before publishing or drafting a GitHub release.

## Promotion Notes

- Keep checks local and deterministic.
- Rebuild `dist` before testing because the published CLI runs from compiled output.
- Include fixtures and examples in the tarball so users can reproduce smoke checks.
