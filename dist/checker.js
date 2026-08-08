import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parseChangelog } from './changelog.js';
import { compareSemanticVersions, parseSemanticVersion, versionFromText } from './semver.js';
const execFileAsync = promisify(execFile);
async function latestLocalReleaseTag(rootPath) {
    try {
        const [{ stdout: topLevel }, rootRealPath] = await Promise.all([
            execFileAsync('git', ['-C', rootPath, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }),
            realpath(rootPath),
        ]);
        if (topLevel.trim() !== rootRealPath)
            return null;
        const { stdout } = await execFileAsync('git', ['-C', rootPath, 'tag', '--list'], {
            encoding: 'utf8',
        });
        const releaseTags = stdout
            .split(/\r?\n/)
            .map((name) => {
            const version = parseSemanticVersion(name.startsWith('v') ? name.slice(1) : name);
            return version ? {
                name,
                version,
            } : null;
        })
            .filter((tag) => tag !== null)
            .sort((left, right) => {
            const precedence = compareSemanticVersions(right.version, left.version);
            if (precedence !== 0)
                return precedence;
            return left.name.localeCompare(right.name);
        });
        const latest = releaseTags[0];
        return latest ? { name: latest.name, version: latest.version.raw } : null;
    }
    catch {
        return null;
    }
}
export async function runCheck(options) {
    const { rootPath } = options;
    const findings = [];
    const packageJsonPath = join(rootPath, 'package.json');
    const changelogPath = join(rootPath, 'CHANGELOG.md');
    const releaseNoteNames = ['RELEASE.md', 'RELEASENOTES.md'];
    let packageVersion = null;
    let changelogLatest = null;
    let releaseVersion = null;
    let releaseNotesName = null;
    try {
        const pkgRaw = await readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgRaw);
        packageVersion = pkg.version ?? null;
    }
    catch {
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
        }
        else {
            changelogLatest = changelog.versions[0]?.version ?? null;
        }
    }
    catch {
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
        }
        catch {
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
    const exitCode = errors + warnings > 0 ? 1 : 0;
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
