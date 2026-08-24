import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const cli = new URL('../cli.js', import.meta.url).pathname;

async function expectExit(
  args: string[],
  code: number,
  stderrPattern?: RegExp,
): Promise<void> {
  if (code === 0) {
    const result = await execFileAsync(process.execPath, [cli, ...args]);
    assert.equal(result.stderr, '');
    return;
  }

  await assert.rejects(execFileAsync(process.execPath, [cli, ...args]), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal((error as { code?: number }).code, code);
    if (stderrPattern) {
      assert.match(String((error as { stderr?: string }).stderr), stderrPattern);
    }
    return true;
  });
}

describe('changecheck check command exit statuses', () => {
  it('exits 0 for a clean release directory', async () => {
    await expectExit(['check', 'fixtures/sample-release', '--format', 'text'], 0);
  });

  it('exits 1 for consistency findings', async () => {
    await expectExit(['check', 'fixtures/sample-release-fail', '--format', 'json'], 1);
  });

  it('exits 2 for an unsupported output format', async () => {
    await expectExit(['check', 'fixtures/sample-release', '--format', 'xml'], 2, /Unsupported format.*xml/i);
  });

  it('exits 2 when the check root is missing', async () => {
    await expectExit(['check', 'fixtures/does-not-exist', '--format', 'json'], 2, /not a directory/i);
  });

  it('exits 2 when the check root is a file', async () => {
    await expectExit(['check', 'package.json', '--format', 'text'], 2, /not a directory/i);
  });
});
