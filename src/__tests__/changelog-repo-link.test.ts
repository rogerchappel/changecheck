import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('changelog repo link consistency', () => {
  const repoRoot = join(import.meta.dirname, '..', '..');

  it('CHANGELOG.md release links must derive from package.json repository url', async () => {
    const pkg = JSON.parse(
      await readFile(join(repoRoot, 'package.json'), 'utf-8')
    );
    const repoUrl = pkg.repository?.url;
    assert.ok(repoUrl, 'package.json must declare a repository.url field');

    // Extract the owner and repo name from git+https://github.com/owner/repo.git
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    assert.ok(match, `repository.url is not a GitHub URL: ${repoUrl}`);
    const owner = match[1];
    const repo = match[2];

    const changelog = await readFile(join(repoRoot, 'CHANGELOG.md'), 'utf-8');

    // Find all GitHub URLs in the Release Links section
    const githubUrls = changelog.match(/https:\/\/github\.com\/[^"\s)]+/g) || [];

    if (githubUrls.length === 0) {
      return; // no links to validate yet
    }

    for (const url of githubUrls) {
      const slugMatch = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
      assert.ok(slugMatch, `GitHub URL lacks slug: ${url}`);
      const [, urlOwner, urlRepo] = slugMatch;
      assert.equal(
        `${urlOwner}/${urlRepo}`,
        `${owner}/${repo}`,
        `CHANGELOG.md links to ${urlOwner}/${urlRepo}, but package.json repository.url points to ${owner}/${repo}`
      );
    }
  });

  it('CHANGELOG.md release links use the correct org and repo names', async () => {
    const pkg = JSON.parse(
      await readFile(join(repoRoot, 'package.json'), 'utf-8')
    );
    const repoUrl = pkg.repository?.url;
    assert.ok(repoUrl);

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    assert.ok(match);

    const changelog = await readFile(join(repoRoot, 'CHANGELOG.md'), 'utf-8');

    // Ensure no stray references to unrelated repos (e.g. tmp-* placeholders)
    const strayRefs = changelog.match(/github\.com\/tmp-[^\s)]+/g) || [];
    assert.equal(
      strayRefs.length,
      0,
      `Found stray GitHub references to unrelated repos: ${strayRefs.join(', ')}. All release links must resolve to the canonical repository.`
    );
  });
});
