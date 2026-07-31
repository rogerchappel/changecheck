import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const initFiles = ['package.json', 'CHANGELOG.md', 'RELEASE.md'] as const;

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

  for (const existingFile of initFiles) {
    it(`does not partially initialize when ${existingFile} already exists`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'changecheck-init-collision-'));
      const original = Buffer.from(`existing ${existingFile}\n`);

      try {
        await writeFile(join(root, existingFile), original);

        await assert.rejects(
          execFileAsync('node', ['dist/cli.js', 'init', root]),
          (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.equal((error as { code?: number }).code, 2);
            assert.match(String((error as { stderr?: string }).stderr), /already exists/);
            return true;
          },
        );

        assert.deepEqual(await readFile(join(root, existingFile)), original);
        for (const missingFile of initFiles.filter((file) => file !== existingFile)) {
          await assert.rejects(access(join(root, missingFile)));
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  it('overwrites all sample files with --force', async () => {
    const root = await mkdtemp(join(tmpdir(), 'changecheck-init-force-'));

    try {
      for (const file of initFiles) await writeFile(join(root, file), `old ${file}\n`);

      const { stdout } = await execFileAsync('node', [
        'dist/cli.js',
        'init',
        root,
        '--release-version',
        '2.0.0',
        '--force',
      ]);

      assert.match(stdout, /Initialized 3 release files/);
      assert.equal(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version, '2.0.0');
      assert.match(await readFile(join(root, 'CHANGELOG.md'), 'utf8'), /## \[2\.0\.0\]/);
      assert.match(await readFile(join(root, 'RELEASE.md'), 'utf8'), /# Release 2\.0\.0/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
