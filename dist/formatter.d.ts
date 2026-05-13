import type { ReleaseFindings } from './types.js';
export declare function formatText(findings: ReleaseFindings): string;
export declare function formatJson(findings: ReleaseFindings): string;
export declare function formatOutput(findings: ReleaseFindings, fmt: 'text' | 'json'): string;
