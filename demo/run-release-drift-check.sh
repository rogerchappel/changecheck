#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${1:-$repo_root/tmp/release-drift-demo}"

rm -rf "$out_dir"
mkdir -p "$out_dir"

node "$repo_root/dist/cli.js" check "$repo_root/fixtures/sample-release" --format text > "$out_dir/clean.txt"

set +e
node "$repo_root/dist/cli.js" check "$repo_root/fixtures/sample-release-warnings" --format json > "$out_dir/warnings.json"
warning_status=$?
node "$repo_root/dist/cli.js" check "$repo_root/fixtures/sample-release-fail" --format text > "$out_dir/fail.txt"
fail_status=$?
set -e

if [ "$warning_status" -ne 1 ]; then
  echo "expected warning fixture to exit 1, got $warning_status" >&2
  exit 1
fi

if [ "$fail_status" -ne 1 ]; then
  echo "expected fail fixture to exit 1, got $fail_status" >&2
  exit 1
fi

grep -q "Summary: 0 errors, 0 warnings" "$out_dir/clean.txt"
grep -q '"severity": "error"' "$out_dir/warnings.json"
grep -q "Summary:" "$out_dir/fail.txt"

echo "wrote release drift demo outputs to $out_dir"
