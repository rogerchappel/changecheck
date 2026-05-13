import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { runCheck } from '../checker.js';
import { formatOutput } from '../formatter.js';

const fixtureRoot = join(import.meta.dirname, '..', '..', 'fixtures');

describe('checker', () => {
  it('passes on a clean release fixture', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release'),
      format: 'text',
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.findings.summary.errors, 0);
    const text = formatOutput(result.findings, 'text');
    assert.ok(text.includes('All checked versions are consistent'));
  });

  it('returns text output', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release'),
      format: 'text',
    });
    const text = formatOutput(result.findings, 'text');
    assert.ok(text.includes('ChangeCheck Results'));
  });

  it('returns json output', async () => {
    const result = await runCheck({
      rootPath: join(fixtureRoot, 'sample-release'),
      format: 'json',
    });
    const json = formatOutput(result.findings, 'json');
    const parsed = JSON.parse(json);
    assert.ok(parsed.findings);
    assert.ok(parsed.summary);
  });
});
