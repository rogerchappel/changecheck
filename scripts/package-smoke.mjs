import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
