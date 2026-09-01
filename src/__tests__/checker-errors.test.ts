import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { runCheck } from '../checker.js';

const fixtureRoot = join(import.meta.dirname, '..', '..', 'fixtures');

describe('checker error cases', () => {
  it('rejects a fixture with a malformed package version', async () => {
    const result = await runCheck({ rootPath: join(fixtureRoot, 'invalid-package-version'), format: 'json' });
    assert.equal(result.exitCode, 1);
    assert.ok(result.findings.findings.some(
      (finding) => finding.category === 'package' && finding.message.includes('valid SemVer string')
    ));
  });

  for (const [label, version] of [['missing', undefined], ['null', null], ['numeric', 123]] as const) {
    it(`rejects a ${label} package version`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'changecheck-invalid-version-'));
      try {
        await writeFile(join(root, 'package.json'), JSON.stringify(version === undefined ? {} : { version }));
        await writeFile(join(root, 'CHANGELOG.md'), '## [1.2.3] - 2026-09-01\n');
        const result = await runCheck({ rootPath: root, format: 'json' });
        assert.equal(result.exitCode, 1);
        assert.equal(result.findings.summary.errors, 1);
        assert.equal(result.findings.findings[0]?.category, 'package');
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  for (const version of ['1.2.3-alpha.1', '1.2.3+build.7', '1.2.3-rc.1+build.7']) {
    it(`accepts valid SemVer ${version}`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'changecheck-valid-version-'));
      try {
        await writeFile(join(root, 'package.json'), JSON.stringify({ version }));
        await writeFile(join(root, 'CHANGELOG.md'), `## [${version}] - 2026-09-01\n`);
        const result = await runCheck({ rootPath: root, format: 'json' });
        assert.equal(result.exitCode, 0);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }

  it('reports error when changelog is missing', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release-fail'),
      format: 'text',
    });
    assert.equal(result.exitCode, 1);
    const errors = result.findings.findings.filter(
      (f) => f.severity === 'error'
    );
    assert.ok(errors.length >= 1, 'should have at least one error');
    assert.ok(
      errors.some((f) => f.category === 'changelog'),
      'should report missing CHANGELOG.md'
    );
  });

  it('reports error when changelog version mismatches package.json', async () => {
    // sample-release-warnings has package.json 2.0.0 but CHANGELOG [1.9.0]
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release-warnings'),
      format: 'text',
    });
    assert.equal(result.exitCode, 1);
    const mismatch = result.findings.findings.find(
      (f) => f.category === 'consistency' && f.severity === 'error'
    );
    assert.ok(mismatch, 'should report version mismatch as error');
    assert.ok(
      mismatch!.details?.includes('2.0.0'),
      'should mention package.json version'
    );
    assert.ok(
      mismatch!.details?.includes('1.9.0'),
      'should mention changelog version'
    );
  });

  it('exits non-zero when changelog is unreadable', async () => {
    // sample-release-fail has package.json but no CHANGELOG.md at all
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release-fail'),
      format: 'json',
    });
    assert.ok(result.exitCode !== 0, 'should exit non-zero on missing changelog');
    assert.ok(result.findings.summary.errors >= 1, 'should report at least 1 error');
  });

  it('reports all findings for mismatch fixture', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release-warnings'),
      format: 'json',
    });
    const findings = result.findings.findings;
    // Missing CHANGELOG → error, version mismatch → error
    assert.ok(findings.length >= 1, 'should report at least the mismatch');
    assert.ok(
      findings.some((f) => f.severity === 'error'),
      'should have at least one error'
    );
  });
});
