import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parseChangelog } from './changelog.js';
import { versionFromText } from './semver.js';
import type { CheckOptions, CheckResult, Finding } from './types.js';

const execFileAsync = promisify(execFile);

async function latestLocalReleaseTag(rootPath: string): Promise<{ name: string; version: string } | null> {
  try {
    const [{ stdout: topLevel }, rootRealPath] = await Promise.all([
      execFileAsync('git', ['-C', rootPath, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }),
      realpath(rootPath),
    ]);
    if (topLevel.trim() !== rootRealPath) return null;

    const { stdout } = await execFileAsync('git', ['-C', rootPath, 'tag', '--list'], {
      encoding: 'utf8',
    });
    const releaseTags = stdout
      .split(/\r?\n/)
      .map((name) => {
        const match = name.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
        return match ? {
          name,
          version: `${match[1]}.${match[2]}.${match[3]}`,
          parts: [Number(match[1]), Number(match[2]), Number(match[3])],
        } : null;
      })
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
      .sort((left, right) => {
        for (let index = 0; index < left.parts.length; index += 1) {
          const difference = (right.parts[index] ?? 0) - (left.parts[index] ?? 0);
          if (difference !== 0) return difference;
        }
        return left.name.localeCompare(right.name);
      });
    const latest = releaseTags[0];
    return latest ? { name: latest.name, version: latest.version } : null;
  } catch {
    return null;
  }
}

export async function runCheck(options: CheckOptions): Promise<CheckResult> {
  const { rootPath } = options;
  const findings: Finding[] = [];

  const packageJsonPath = join(rootPath, 'package.json');
  const changelogPath = join(rootPath, 'CHANGELOG.md');
  const releaseNoteNames = ['RELEASE.md', 'RELEASENOTES.md'] as const;

  let packageVersion: string | null = null;
  let changelogLatest: string | null = null;
  let releaseVersion: string | null = null;
  let releaseNotesName: (typeof releaseNoteNames)[number] | null = null;

  try {
    const pkgRaw = await readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw);
    packageVersion = pkg.version ?? null;
  } catch {
    findings.push({
      severity: 'error',
      category: 'package',
      message: 'Missing or unreadable package.json',
      details: packageJsonPath,
    });
  }

  try {
    const changelog = await parseChangelog(changelogPath);
    if (changelog.versions.length === 0) {
      findings.push({
        severity: 'error',
        category: 'changelog',
        message: 'CHANGELOG.md contains no version entries',
        details: changelogPath,
      });
    } else {
      changelogLatest = changelog.versions[0]?.version ?? null;
    }
  } catch {
    findings.push({
      severity: 'error',
      category: 'changelog',
      message: 'Missing or unreadable CHANGELOG.md',
      details: changelogPath,
    });
  }

  if (packageVersion && changelogLatest && packageVersion !== changelogLatest) {
    findings.push({
      severity: 'error',
      category: 'consistency',
      message: 'Version mismatch',
      details: `package.json says ${packageVersion}, CHANGELOG.md says ${changelogLatest}`,
    });
  }

  for (const fileName of releaseNoteNames) {
    try {
      const releaseRaw = await readFile(join(rootPath, fileName), 'utf-8');
      const headingMatch = releaseRaw.match(/(?:Release|Version)\s+([^\s]+)/i);
      releaseVersion = headingMatch ? versionFromText(headingMatch[1]) : null;
      releaseNotesName = fileName;
      break;
    } catch {
      // Release notes are optional; try the fallback filename.
    }
  }

  if (releaseVersion && releaseNotesName && packageVersion && releaseVersion !== packageVersion) {
    findings.push({
      severity: 'warning',
      category: 'consistency',
      message: 'Release notes version differs from package version',
      details: `${releaseNotesName} says ${releaseVersion}, package.json says ${packageVersion}`,
    });
  }

  const latestTag = await latestLocalReleaseTag(rootPath);
  if (latestTag && packageVersion && latestTag.version !== packageVersion) {
    findings.push({
      severity: 'error',
      category: 'consistency',
      message: 'Latest local git tag differs from package version',
      details: `git tag ${latestTag.name} says ${latestTag.version}, package.json says ${packageVersion}`,
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      category: 'consistency',
      message: 'All checked versions are consistent',
    });
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;

  const exitCode: CheckResult['exitCode'] = errors + warnings > 0 ? 1 : 0;

  return {
    exitCode,
    findings: {
      findings,
      summary: {
        errors,
        warnings,
        info: infos,
        total: findings.length,
      },
    },
  };
}
