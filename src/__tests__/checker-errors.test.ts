import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { join } from 'node:path';
import { runCheck } from '../checker.js';

const fixtureRoot = join(import.meta.dirname, '..', '..', 'fixtures');

describe('checker error cases', () => {
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
