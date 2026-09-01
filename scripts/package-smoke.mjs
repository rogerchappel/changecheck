import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const output = execFileSync('npm', ['pack', '--json'], {
  encoding: 'utf8',
});
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path));
const required = [
  'dist/cli.js',
  'dist/checker.js',
  'fixtures/sample-release/package.json',
  'fixtures/sample-release/CHANGELOG.md',
  'examples/01-clean-check.md',
  'demo/run-release-consistency-demo.sh',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
];

const missing = required.filter((file) => !files.has(file));
if (missing.length > 0) {
  console.error('Package smoke failed; missing expected release-candidate files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'changecheck-package-smoke-'));
try {
  execFileSync('npm', ['init', '-y'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('npm', ['install', join(process.cwd(), pack.filename)], {
    cwd: tmp,
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  const bin = join(tmp, 'node_modules', '.bin', 'changecheck');
  assertIncludes(execFileSync(bin, ['--help'], { encoding: 'utf8' }), 'Local-first release consistency checker');
  assertIncludes(execFileSync(bin, ['--version'], { encoding: 'utf8' }), packageJson.version);
  assertIncludes(
    execFileSync(bin, ['check', join(process.cwd(), 'fixtures/sample-release'), '--format', 'text'], {
      encoding: 'utf8',
    }),
    'Summary: 0 errors, 0 warnings, 1 info',
  );

  const invalidVersionTarget = join(tmp, 'invalid-version');
  mkdirSync(invalidVersionTarget);
  writeFileSync(join(invalidVersionTarget, 'package.json'), JSON.stringify({ version: 123 }));
  writeFileSync(join(invalidVersionTarget, 'CHANGELOG.md'), '## [1.2.3] - 2026-09-01\n');
  try {
    execFileSync(bin, ['check', invalidVersionTarget, '--format', 'json'], { encoding: 'utf8', stdio: 'pipe' });
    throw new Error('Package smoke failed; installed CLI accepted a numeric package version');
  } catch (error) {
    if (error.status !== 1) throw error;
    assertIncludes(error.stdout, 'package.json version must be a non-empty valid SemVer string');
  }

  const initTarget = join(tmp, 'atomic-init');
  mkdirSync(initTarget);
  writeFileSync(join(initTarget, 'CHANGELOG.md'), 'existing changelog\n');
  try {
    execFileSync(bin, ['init', initTarget], { encoding: 'utf8', stdio: 'pipe' });
    throw new Error('Package smoke failed; init unexpectedly accepted an existing target file');
  } catch (error) {
    if (error.status !== 2) throw error;
  }
  if (readFileSync(join(initTarget, 'CHANGELOG.md'), 'utf8') !== 'existing changelog\n') {
    throw new Error('Package smoke failed; init changed the colliding target file');
  }
  for (const missing of ['package.json', 'RELEASE.md']) {
    if (existsSync(join(initTarget, missing))) {
      throw new Error(`Package smoke failed; init partially created ${missing}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(pack.filename, { force: true });
}

console.log(`Package smoke OK: ${pack.name}@${pack.version} includes ${pack.files.length} files and a runnable changecheck bin.`);

function assertIncludes(output, expected) {
  if (!output.includes(expected)) {
    console.error(`Package smoke failed; expected output to include: ${expected}`);
    console.error(output);
    process.exit(1);
  }
}
