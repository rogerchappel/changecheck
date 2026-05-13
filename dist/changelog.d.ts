import type { ParsedChangelog } from './types.js';
export declare function parseChangelog(changelogPath: string): Promise<ParsedChangelog>;
export declare function versionFromString(str: string): string | null;
