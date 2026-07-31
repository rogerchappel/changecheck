import { readFile } from 'node:fs/promises';
import { SEMVER_SOURCE, versionFromText } from './semver.js';
const VERSION_HEADING_RE = new RegExp(`^## \\[?v?(${SEMVER_SOURCE})\\]?(?:\\s+-.*)?$`);
const SECTION_HEADING_RE = /^### (.+)/i;
export async function parseChangelog(changelogPath) {
    const raw = await readFile(changelogPath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const versions = [];
    let currentVersion = null;
    let currentSection = null;
    for (const line of lines) {
        const versionMatch = line.match(VERSION_HEADING_RE);
        if (versionMatch) {
            if (currentVersion) {
                versions.push(currentVersion);
            }
            currentVersion = {
                version: versionMatch[1],
                sections: {},
                raw: '',
            };
            currentSection = null;
            continue;
        }
        const sectionMatch = line.match(SECTION_HEADING_RE);
        if (sectionMatch && currentVersion) {
            currentSection = sectionMatch[1].trim();
            if (!currentVersion.sections[currentSection]) {
                currentVersion.sections[currentSection] = [];
            }
            continue;
        }
        if (currentVersion && currentSection && line.trim().startsWith('-')) {
            currentVersion.sections[currentSection].push(line.trim());
        }
        if (currentVersion) {
            currentVersion.raw = (currentVersion.raw || '') + line + '\n';
        }
    }
    if (currentVersion) {
        versions.push(currentVersion);
    }
    return { versions };
}
export function versionFromString(str) {
    return versionFromText(str);
}
