import type { ReleaseFindings } from './types.js';

export function formatText(findings: ReleaseFindings): string {
  const lines: string[] = [];
  lines.push('ChangeCheck Results');
  lines.push('==================');
  lines.push('');
  for (const finding of findings.findings) {
    const icon = finding.severity === 'error' ? '✖' : finding.severity === 'warning' ? '⚠' : 'ℹ';
    lines.push(`${icon} [${finding.severity.toUpperCase()}] ${finding.message}`);
    if (finding.details) {
      lines.push(`    ${finding.details}`);
    }
  }
  lines.push('');
  lines.push(`Summary: ${findings.summary.errors} errors, ${findings.summary.warnings} warnings, ${findings.summary.info} info`);
  lines.push('');
  return lines.join('\n');
}

export function formatJson(findings: ReleaseFindings): string {
  return JSON.stringify(findings, null, 2);
}

export function formatOutput(findings: ReleaseFindings, fmt: 'text' | 'json'): string {
  return fmt === 'json' ? formatJson(findings) : formatText(findings);
}
