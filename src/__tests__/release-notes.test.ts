import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { runCheck } from '../checker.js';

const projectRoot = join(import.meta.dirname, '..', '..');
const fixtureRoot = join(projectRoot, 'fixtures');

describe('release note discovery', () => {
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
});
