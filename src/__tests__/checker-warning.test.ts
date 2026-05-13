import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { runCheck } from '../checker.js';

describe('checker with warnings fixture', () => {
  it('produces a warning on version mismatch', async () => {
    const result = await runCheck({ rootPath: 'fixtures/sample-release-warnings', format: 'text' });
    const rf = result.findings;
    assert.strictEqual(rf.findings.length, 1);
    assert.strictEqual(rf.findings[0].severity, 'error');
  });

  it('returns json summary with warning count', async () => {
    const result = await runCheck({ rootPath: 'fixtures/sample-release-warnings', format: 'json' });
    assert.strictEqual(result.findings.summary.errors, 1);
  });
});
