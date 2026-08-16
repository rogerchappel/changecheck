import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { compiledTestInventory } from './test-suite.mjs';

async function fixture(sourceTests, compiledTests) {
  const root = await mkdtemp(join(tmpdir(), 'changecheck-test-suite-'));
  const source = join(root, 'src');
  const compiled = join(root, 'dist');
  for (const path of sourceTests) {
    await mkdir(join(source, path, '..'), { recursive: true });
    await writeFile(join(source, path), '');
  }
  for (const path of compiledTests) {
    await mkdir(join(compiled, path, '..'), { recursive: true });
    await writeFile(join(compiled, path), '');
  }
  return { source, compiled };
}

test('returns every compiled test derived from the source inventory', async () => {
  const { source, compiled } = await fixture(
    ['alpha.test.ts', 'nested/beta.test.ts'],
    ['alpha.test.js', 'nested/beta.test.js'],
  );

  assert.deepEqual(await compiledTestInventory(source, compiled), [
    join(compiled, 'alpha.test.js'),
    join(compiled, 'nested/beta.test.js'),
  ]);
});

test('rejects a build that omits a source test', async () => {
  const { source, compiled } = await fixture(
    ['included.test.ts', 'omitted.test.ts'],
    ['included.test.js'],
  );

  await assert.rejects(
    compiledTestInventory(source, compiled),
    /Compiled test suite is missing:\n- omitted\.test\.js/,
  );
});
