import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validatePackageContract } from './package-contract.mjs';

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
