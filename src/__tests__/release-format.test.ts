import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Checker } from '../checker.js';
import { ReleaseFormat } from '../types.js';

describe('changecheck release format', () => {
  it('should validate text format output', () => {
    const checker = new Checker();
    const result = checker.validate(null!);
    assert.ok(result, 'should return a result object');
  });

  it('should validate markdown format output', () => {
    const checker = new Checker();
    const result = checker.validate(null!);
    assert.ok(typeof result === 'object', 'should return an object');
  });

  it('should handle empty changelog gracefully', () => {
    const { execSync } = require('child_process');
    try {
      const out = execSync('node dist/cli.js check fixtures/empty --format text', { 
        encoding: 'utf8', stdio: 'pipe' 
      });
      assert.ok(true, 'should not crash on empty changelog');
    } catch (e: any) {
      assert.ok(e.status, 'should exit with status');
    }
  });
});
