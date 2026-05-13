import { readFile } from 'node:fs/promises';
import type { ParsedChangelog, ChangelogVersion } from './types.js';

const VERSION_HEADING_RE = /^## \[?v?(\d+\.\d+\.\d+(?:-[a-z0-9.+]+)?)\]?(-.*)?/i;
const SECTION_HEADING_RE = /^### (.+)/i;

export async function parseChangelog(changelogPath: string): Promise<ParsedChangelog> {
  const raw = await readFile(changelogPath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const versions: ChangelogVersion[] = [];
  let currentVersion: ChangelogVersion | null = null;
  let currentSection: string | null = null;

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

export function versionFromString(str: string): string | null {
  const match = str.match(/v?(\d+\.\d+\.\d+(?:-[a-z0-9.+]+)?)/i);
  return match ? match[1] : null;
}
