import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseChangelog } from './changelog.js';
import type { CheckOptions, CheckResult, Finding } from './types.js';

export async function runCheck(options: CheckOptions): Promise<CheckResult> {
  const { rootPath, format } = options;
  const findings: Finding[] = [];

  const packageJsonPath = join(rootPath, 'package.json');
  const changelogPath = join(rootPath, 'CHANGELOG.md');
  const releaseNotesPath = join(rootPath, 'RELEASE.md');

  let packageVersion: string | null = null;
  let changelogLatest: string | null = null;
  let releaseVersion: string | null = null;

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
      severity: 'warning',
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

  try {
    const releaseRaw = await readFile(releaseNotesPath, 'utf-8');
    const versionMatch = releaseRaw.match(/(?:Release|Version)\s+v?(\d+\.\d+\.\d+)/i);
    releaseVersion = versionMatch ? versionMatch[1] : null;
  } catch {
    // Release notes are optional
  }

  if (releaseVersion && packageVersion && releaseVersion !== packageVersion) {
    findings.push({
      severity: 'warning',
      category: 'consistency',
      message: 'Release notes version differs from package version',
      details: `RELEASE.md says ${releaseVersion}, package.json says ${packageVersion}`,
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

  const exitCode: CheckResult['exitCode'] = errors > 0 ? 1 : 0;

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
