const CORE_IDENTIFIER = '(?:0|[1-9]\\d*)';
const PRERELEASE_IDENTIFIER = '(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)';
const BUILD_IDENTIFIER = '[0-9A-Za-z-]+';
export const SEMVER_SOURCE = `${CORE_IDENTIFIER}\\.${CORE_IDENTIFIER}\\.${CORE_IDENTIFIER}` +
    `(?:-${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*)?` +
    `(?:\\+${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*)?`;
const EXACT_SEMVER_RE = new RegExp(`^${SEMVER_SOURCE}$`);
const EMBEDDED_SEMVER_RE = new RegExp(`(?:^|[^0-9A-Za-z])v?(${SEMVER_SOURCE})(?![0-9A-Za-z.+-])`);
export function isSemanticVersion(value) {
    return EXACT_SEMVER_RE.test(value);
}
export function versionFromText(value) {
    return value.match(EMBEDDED_SEMVER_RE)?.[1] ?? null;
}
