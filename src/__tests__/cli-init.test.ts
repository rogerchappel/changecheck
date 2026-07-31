import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('changecheck init command', () => {
  for (const version of ['1.2.3', '1.2.3-alpha.1', '1.2.3+build.7', '1.2.3-rc.1+build.7']) {
    it(`creates a checkable release fixture for ${version}`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'changecheck-init-'));

      try {
        const { stdout } = await execFileAsync('node', [
          'dist/cli.js',
          'init',
          root,
          '--release-version',
          version,
        ]);

        assert.match(stdout, /Initialized 3 release files/);

        const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
        assert.equal(pkg.version, version);

        await execFileAsync('node', ['dist/cli.js', 'check', root, '--format', 'json']);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  it('rejects malformed semantic versions', async () => {
    for (const version of ['1.2.3-', '1.2.3+', '1.2.3-alpha..1', '01.2.3', '1.2.3-01']) {
      const root = await mkdtemp(join(tmpdir(), 'changecheck-init-invalid-'));
      try {
        await assert.rejects(
          execFileAsync('node', ['dist/cli.js', 'init', root, '--release-version', version]),
          (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.match(String((error as { stderr?: string }).stderr), /Invalid semantic version/);
            return true;
          },
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });
});
