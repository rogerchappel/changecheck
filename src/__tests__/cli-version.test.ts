import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);

describe('CLI version', () => {
  it('reports the version declared by package.json', async () => {
    const packageMetadata = JSON.parse(
      await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string };
    const { stdout } = await execFileAsync(
      process.execPath,
      [new URL('../cli.js', import.meta.url).pathname, '--version'],
      { encoding: 'utf8' },
    );
    assert.equal(stdout.trim(), packageMetadata.version);
  });
});
