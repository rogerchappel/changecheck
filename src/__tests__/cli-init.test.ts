import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('changecheck init command', () => {
  it('creates a checkable release fixture', async () => {
    const root = await mkdtemp(join(tmpdir(), 'changecheck-init-'));

    try {
      const { stdout } = await execFileAsync('node', [
        'dist/cli.js',
        'init',
        root,
        '--release-version',
        '1.2.3',
      ]);

      assert.match(stdout, /Initialized 3 release files/);

      const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
      assert.equal(pkg.version, '1.2.3');

      await execFileAsync('node', ['dist/cli.js', 'check', root, '--format', 'json']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
