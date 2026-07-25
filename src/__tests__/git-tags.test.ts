import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, it } from 'node:test';
import { runCheck } from '../checker.js';

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

async function releaseDirectory(version = '1.2.3'): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'changecheck-tags-'));
  temporaryDirectories.push(root);
  await Promise.all([
    writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fixture', version })),
    writeFile(join(root, 'CHANGELOG.md'), `# Changelog\n\n## [${version}] - 2026-07-25\n`),
    writeFile(join(root, 'RELEASE.md'), `# Release ${version}\n`),
  ]);
  return root;
}

async function initializeGitRepository(root: string, tags: string[]): Promise<void> {
  await execFileAsync('git', ['init', '--quiet', root]);
  await execFileAsync('git', ['-C', root, 'add', '.']);
  await execFileAsync('git', [
    '-C', root,
    '-c', 'user.name=ChangeCheck Test',
    '-c', 'user.email=changecheck@example.invalid',
    'commit', '--quiet', '-m', 'fixture',
  ]);
  for (const tag of tags) await execFileAsync('git', ['-C', root, 'tag', tag]);
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('local git tag consistency', () => {
  it('accepts a matching latest release tag', async () => {
    const root = await releaseDirectory();
    await initializeGitRepository(root, ['v1.2.2', 'v1.2.3']);
    const result = await runCheck({ rootPath: root, format: 'text' });
    assert.equal(result.exitCode, 0);
    assert.equal(result.findings.summary.errors, 0);
  });

  it('reports the highest mismatching release tag', async () => {
    const root = await releaseDirectory();
    await initializeGitRepository(root, ['v1.2.3', 'v1.2.10', 'not-a-release']);
    const result = await runCheck({ rootPath: root, format: 'text' });
    assert.equal(result.exitCode, 1);
    const mismatch = result.findings.findings.find(
      (finding) => finding.message === 'Latest local git tag differs from package version',
    );
    assert.match(mismatch?.details ?? '', /git tag v1\.2\.10 says 1\.2\.10/);
    assert.match(mismatch?.details ?? '', /package\.json says 1\.2\.3/);
  });

  it('skips comparison when no release tags exist', async () => {
    const root = await releaseDirectory();
    await initializeGitRepository(root, ['preview']);
    assert.equal((await runCheck({ rootPath: root, format: 'text' })).exitCode, 0);
  });

  it('skips comparison for a non-git release directory', async () => {
    const root = await releaseDirectory();
    assert.equal((await runCheck({ rootPath: root, format: 'text' })).exitCode, 0);
  });
});
