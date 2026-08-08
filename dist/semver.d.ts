export declare const SEMVER_SOURCE: string;
export declare function isSemanticVersion(value: string): boolean;
export declare function versionFromText(value: string): string | null;
export interface SemanticVersion {
    raw: string;
    major: number;
    minor: number;
    patch: number;
    prerelease: string[];
}
export declare function parseSemanticVersion(value: string): SemanticVersion | null;
export declare function compareSemanticVersions(left: SemanticVersion, right: SemanticVersion): number;
