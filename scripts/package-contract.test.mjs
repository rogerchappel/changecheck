import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { findDuplicateTopLevelKeys, validatePackageContract } from './package-contract.mjs';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('checked-in package runtime contract is valid', () => {
  assert.deepEqual(validatePackageContract(pkg, lockfile), []);
});

test('rejects a root Node engine below a runtime dependency minimum', () => {
  const driftedPackage = { ...pkg, engines: { node: '>=18' } };
  const driftedLockfile = structuredClone(lockfile);
  driftedLockfile.packages[''].engines.node = '>=18';

  assert.ok(validatePackageContract(driftedPackage, driftedLockfile)
    .some((error) => error.includes('commander >=20')));
});

test('rejects package-lock root engine drift', () => {
  const driftedLockfile = structuredClone(lockfile);
  driftedLockfile.packages[''].engines.node = '>=18';

  assert.ok(validatePackageContract(pkg, driftedLockfile)
    .some((error) => error.includes('must match package.json')));
});

test('checked-in package.json declares every top-level key exactly once', async () => {
  const raw = await readFile(new URL('../package.json', import.meta.url), 'utf8');

  assert.deepEqual(findDuplicateTopLevelKeys(raw), []);
});

test('finds a duplicated repository key like the one shipped in 0.1.0', () => {
  const duplicated = `{
  "name": "changecheck",
  "repository": { "type": "git", "url": "git+https://github.com/rogerchappel/changecheck.git" },
  "dependencies": { "commander": "^14.0.3", "repository": "nested is not top-level" },
  "repository": { "type": "git", "url": "git+https://github.com/rogerchappel/changecheck.git" }
}`;

  assert.deepEqual(findDuplicateTopLevelKeys(duplicated), ['repository']);
});

test('ignores nested keys, escaped quotes, and colons inside strings', () => {
  const tricky = `{
  "description": "a \\"quoted\\" words: colon, repository: decoy",
  "meta": { "repository": 1, "repository": 2 },
  "keywords": ["repository", "repository"]
}`;

  assert.deepEqual(findDuplicateTopLevelKeys(tricky), []);
});
