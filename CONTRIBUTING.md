# Contributing to ChangeCheck

Thanks for caring! Here's how to jump in.

## Ground Rules

- Be kind. Be clear. Be concise.
- Changes should be small, atomic, and reversible.
- Every code change should include tests or a fixture.

## How to Contribute

1. Fork the repo and create a branch from `main`.
2. Make your fix, feature, or doc improvement.
3. Run the checks: `npm run build && npm test && npm run smoke`.
4. Commit with a descriptive message.
5. Open a pull request against `main`.

## Reporting Bugs

Use the [issue template](.github/pull_request_template.md) and include:
- Expected vs actual behavior
- Steps to reproduce
- Output from the CLI

## Development Workflow

```bash
npm install
npm run build
npm test
npm run smoke
```

Happy building! 🧭
