import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { runCheck } from '../checker.js';

const projectRoot = join(import.meta.dirname, '..', '..');
const fixtureRoot = join(projectRoot, 'fixtures');

describe('release note discovery', () => {
  async function projectWithReleaseNotes(files: Record<string, string>) {
    const rootPath = await mkdtemp(join(tmpdir(), 'changecheck-release-notes-'));
    await Promise.all([
      writeFile(join(rootPath, 'package.json'), JSON.stringify({ version: '1.2.3' })),
      writeFile(join(rootPath, 'CHANGELOG.md'), '## [1.2.3] - 2026-09-06\n'),
      ...Object.entries(files).map(([name, content]) => writeFile(join(rootPath, name), content)),
    ]);
    return rootPath;
  }

  it('checks RELEASE.md', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release'),
      format: 'text',
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.findings.summary.warnings, 0);
  });

  it('checks RELEASENOTES.md and exits nonzero for warning-only findings', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'release-notes-alternate'),
      format: 'text',
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.findings.summary.errors, 0);
    assert.equal(result.findings.summary.warnings, 1);
    assert.match(result.findings.findings[0]?.details ?? '', /RELEASENOTES\.md says 9\.9\.9/);
  });

  it('prefers RELEASE.md when both filenames exist', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'release-notes-both'),
      format: 'text',
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.findings.summary.warnings, 0);
  });

  it('allows release notes to be absent', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'release-notes-absent'),
      format: 'text',
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.findings.summary.info, 1);
  });

  it('rejects a present RELEASE.md without a parseable SemVer heading', async () => {
    const rootPath = await projectWithReleaseNotes({ 'RELEASE.md': '# Shipping notes\n\nNo version heading.\n' });
    const result = await runCheck({ rootPath, format: 'text' });

    assert.equal(result.exitCode, 1);
    assert.equal(result.findings.summary.errors, 1);
    assert.deepEqual(result.findings.findings[0], {
      severity: 'error',
      category: 'release-notes',
      message: 'RELEASE.md contains no valid SemVer release heading',
      details: join(rootPath, 'RELEASE.md'),
    });
  });

  it('rejects malformed fallback release notes', async () => {
    const rootPath = await projectWithReleaseNotes({ 'RELEASENOTES.md': '# Version next\n' });
    const result = await runCheck({ rootPath, format: 'text' });

    assert.equal(result.exitCode, 1);
    assert.match(result.findings.findings[0]?.message ?? '', /RELEASENOTES\.md contains no valid SemVer/);
  });

  it('does not fall back when a malformed RELEASE.md is present', async () => {
    const rootPath = await projectWithReleaseNotes({
      'RELEASE.md': '# Shipping notes\n',
      'RELEASENOTES.md': '# Release 1.2.3\n',
    });
    const result = await runCheck({ rootPath, format: 'text' });

    assert.equal(result.exitCode, 1);
    assert.match(result.findings.findings[0]?.message ?? '', /^RELEASE\.md/);
  });
});

describe('packaged CLI exit status', () => {
  it('exits 1 for a warning-only check', () => {
    const cli = join(projectRoot, 'dist', 'cli.js');
    const fixture = join(fixtureRoot, 'release-notes-alternate');
    const result = spawnSync(process.execPath, [cli, 'check', fixture, '--format', 'json'], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.summary.errors, 0);
    assert.equal(output.summary.warnings, 1);
  });

  it('exits 1 for malformed release notes', async () => {
    const rootPath = await mkdtemp(join(tmpdir(), 'changecheck-packaged-release-notes-'));
    await Promise.all([
      writeFile(join(rootPath, 'package.json'), JSON.stringify({ version: '1.2.3' })),
      writeFile(join(rootPath, 'CHANGELOG.md'), '## [1.2.3] - 2026-09-06\n'),
      writeFile(join(rootPath, 'RELEASE.md'), '# Shipping notes\n'),
    ]);
    const result = spawnSync(process.execPath, [join(projectRoot, 'dist', 'cli.js'), 'check', rootPath, '--format', 'json'], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1, result.stderr);
    assert.match(JSON.parse(result.stdout).findings[0].message, /RELEASE\.md contains no valid SemVer/);
  });
});
