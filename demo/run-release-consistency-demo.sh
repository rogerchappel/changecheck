#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="$repo_root/tmp/release-consistency-demo"

cd "$repo_root"
rm -rf "$out_dir"
mkdir -p "$out_dir"

npm run build

node dist/cli.js check fixtures/sample-release --format text > "$out_dir/clean.txt"

set +e
node dist/cli.js check fixtures/sample-release-warnings --format json > "$out_dir/warnings.json"
warning_status=$?
set -e

if [ "$warning_status" -eq 0 ]; then
  echo "Expected warning fixture to return a non-zero status" >&2
  exit 1
fi

grep -q 'All checked versions are consistent' "$out_dir/clean.txt"
grep -q '"severity"' "$out_dir/warnings.json"

printf 'Clean release check: %s\n' "$out_dir/clean.txt"
printf 'Warning release check: %s\n' "$out_dir/warnings.json"
