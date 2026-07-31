import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseChangelog, versionFromString } from '../changelog.js';

const validVersions = [
  '1.2.3',
  '1.2.3-alpha.1',
  '1.2.3+build.7',
  '1.2.3-rc.1+build.7',
];

describe('changelog semantic versions', () => {
  it('preserves supported semantic version forms', async () => {
    const root = await mkdtemp(join(tmpdir(), 'changecheck-changelog-semver-'));

    try {
      const path = join(root, 'CHANGELOG.md');
      await writeFile(
        path,
        `# Changelog\n\n${validVersions.map((version) => `## [${version}] - 2026-07-31`).join('\n\n')}\n`,
      );

      const changelog = await parseChangelog(path);
      assert.deepEqual(changelog.versions.map(({ version }) => version), validVersions);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not extract malformed semantic versions', () => {
    for (const version of ['1.2.3-', '1.2.3+', '1.2.3-alpha..1', '01.2.3', '1.2.3-01']) {
      assert.equal(versionFromString(version), null, version);
    }
  });
});
