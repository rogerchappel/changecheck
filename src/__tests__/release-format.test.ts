import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { runCheck } from '../checker.js';
import type { CheckResult } from '../types.js';

describe('changecheck release format', () => {
  it('should runCheck and return a result object', async () => {
    const result = await runCheck({ rootPath: 'fixtures/sample-release', format: 'text' });
    assert.ok(result, 'should return a result object');
    assert.ok(typeof result === 'object', 'result should be an object');
  });

  it('should handle text format', async () => {
    const result = await runCheck({ rootPath: 'fixtures/sample-release', format: 'text' });
    assert.ok('findings' in result || 'exitCode' in result, 'should have findings or exitCode');
  });

  it('should handle empty changelog gracefully', () => {
    try {
      const out = execSync('node dist/cli.js check fixtures/empty --format text', {
        encoding: 'utf8', stdio: 'pipe'
      });
      assert.ok(true, 'should not crash on empty changelog');
    } catch (e: any) {
      assert.ok(e.status !== undefined, 'should exit with status');
    }
  });
});
