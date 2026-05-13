# ChangeCheck PRD

Status: complete

## Pitch

A local release consistency checker for changelogs, package versions, git tags, and release notes. 🧭

## Why It Matters

Small OSS repos often ship version drift: package says one thing, changelog another, tags another. This catches it before publish.

## Target users

- CLI authors who want deterministic local checks.
- Agentic coding workflows that need safe, inspectable fixtures.
- Maintainers who prefer useful small tools over SaaS dashboards.

## V1 Scope

- TypeScript Node.js CLI, local-first, no hidden network calls.
- Fixture-backed parser and planner core.
- Human-readable text output and JSON output.
- `init`, primary check/run command, and `explain`/`report` style command where appropriate.
- Useful examples under `examples/` and tests under `fixtures/`.
- Safety defaults: dry-run first, explicit paths, no destructive writes unless a future version adds opt-in mutation.

## Out of Scope

- Hosted service.
- Telemetry.
- Automatic destructive changes.
- LLM dependency.

## CLI/API Sketch

```bash
changecheck --help
changecheck init ./demo
changecheck check ./demo --format text
changecheck check ./demo --format json
changecheck explain ./demo
```

## Functional requirements

- Reads only the requested workspace or fixture paths.
- Produces deterministic ordered findings.
- Exits `0` when clean, `1` when findings exceed default policy, `2` for invalid input/config.
- Includes enough context for another developer or agent to act safely.
- Ships fixture-backed tests for clean, warning, and failure cases.

## Verification

- `npm test`
- `npm run check`
- `npm run build`
- `npm run smoke`
- `bash scripts/validate.sh`
- At least one real CLI smoke against `fixtures/` or `examples/`.

## Source attribution

Inspired by release tooling and conventional changelog workflows, reframed as a deterministic pre-release audit CLI.
