import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateReleaseContract } from './release-contract.mjs';

const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const config = JSON.parse(await readFile(new URL('../releasebox.config.json', import.meta.url), 'utf8'));

test('checked-in release publication contract is valid', () => {
  assert.deepEqual(validateReleaseContract(workflow, config), []);
});

for (const [name, mutate, expected] of [
  ['OIDC permission', (value) => value.replace('id-token: write', 'id-token: read'), 'id-token: write'],
  ['npm registry setup', (value) => value.replace('registry-url: https://registry.npmjs.org', ''), 'npm registry'],
  ['provenance', (value) => value.replace(' --provenance', ''), 'provenance'],
  ['public access', (value) => value.replace(' --access public', ''), 'public access'],
  ['exact tarball publication', (value) => value.replace('npm publish "$PACKAGE_TARBALL"', 'npm publish'), 'exact packed tarball'],
]) {
  test(`rejects drift in ${name}`, () => {
    assert.ok(validateReleaseContract(mutate(workflow), config).some((error) => error.includes(expected)));
  });
}

test('rejects GitHub release creation before npm publication', () => {
  const publish = '        run: npm publish "$PACKAGE_TARBALL" --provenance --access public';
  const release = '        run: gh release create "${GITHUB_REF_NAME}" --notes-file RELEASE_NOTES.md "$PACKAGE_TARBALL"';
  const reordered = workflow.replace(publish, 'TEMP').replace(release, publish).replace('TEMP', release);
  assert.ok(validateReleaseContract(reordered, config).some((error) => error.includes('before GitHub')));
});

test('rejects ReleaseBox npm publication drift', () => {
  assert.ok(validateReleaseContract(workflow, { ...config, release: { ...config.release, publishNpm: false } }).some((error) => error.includes('enable npm')));
});
