const CORE_IDENTIFIER = '(?:0|[1-9]\\d*)';
const PRERELEASE_IDENTIFIER = '(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)';
const BUILD_IDENTIFIER = '[0-9A-Za-z-]+';

export const SEMVER_SOURCE =
  `${CORE_IDENTIFIER}\\.${CORE_IDENTIFIER}\\.${CORE_IDENTIFIER}` +
  `(?:-${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*)?` +
  `(?:\\+${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*)?`;

const EXACT_SEMVER_RE = new RegExp(`^${SEMVER_SOURCE}$`);
const EMBEDDED_SEMVER_RE = new RegExp(
  `(?:^|[^0-9A-Za-z])v?(${SEMVER_SOURCE})(?![0-9A-Za-z.+-])`,
);

export function isSemanticVersion(value: string): boolean {
  return EXACT_SEMVER_RE.test(value);
}

export function versionFromText(value: string): string | null {
  return value.match(EMBEDDED_SEMVER_RE)?.[1] ?? null;
}

export interface SemanticVersion {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

export function parseSemanticVersion(value: string): SemanticVersion | null {
  if (!isSemanticVersion(value)) return null;
  const [precedence] = value.split('+');
  const separator = precedence!.indexOf('-');
  const core = separator === -1 ? precedence! : precedence!.slice(0, separator);
  const prerelease = separator === -1 ? '' : precedence!.slice(separator + 1);
  const [major, minor, patch] = core!.split('.').map(Number);
  return {
    raw: value,
    major: major!,
    minor: minor!,
    patch: patch!,
    prerelease: prerelease ? prerelease.split('.') : [],
  };
}

export function compareSemanticVersions(left: SemanticVersion, right: SemanticVersion): number {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length;
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) return Number(leftPart) - Number(rightPart);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftPart.localeCompare(rightPart);
  }
  return 0;
}
