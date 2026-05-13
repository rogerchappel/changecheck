import type { Stats } from 'node:fs';

export interface ReleaseFindings {
  findings: Finding[];
  summary: FindingsSummary;
}

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details?: string;
}

export interface FindingsSummary {
  errors: number;
  warnings: number;
  info: number;
  total: number;
}

export interface CheckResult {
  exitCode: 0 | 1 | 2;
  findings: ReleaseFindings;
  outputPath?: string;
}

export interface CheckOptions {
  rootPath: string;
  format: 'text' | 'json';
  outputPath?: string;
}

export interface ParsedChangelog {
  versions: ChangelogVersion[];
}

export interface ChangelogVersion {
  version: string;
  date?: string;
  sections: { [key: string]: string[] };
  raw?: string;
}
