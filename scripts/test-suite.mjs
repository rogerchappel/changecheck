import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function findTests(directory, extension, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return findTests(path, extension, root);
    return entry.isFile() && entry.name.endsWith(extension) ? [relative(root, path)] : [];
  }));
  return tests.flat();
}

export async function compiledTestInventory(sourceDirectory, compiledDirectory) {
  const sourceTests = (await findTests(sourceDirectory, '.test.ts')).sort();
  if (sourceTests.length === 0) throw new Error(`No source tests found in ${sourceDirectory}`);

  const compiledTests = new Set(await findTests(compiledDirectory, '.test.js'));
  const expectedTests = sourceTests.map((path) => path.replace(/\.ts$/, '.js'));
  const missingTests = expectedTests.filter((path) => !compiledTests.has(path));
  if (missingTests.length > 0) {
    throw new Error(`Compiled test suite is missing:\n${missingTests.map((path) => `- ${path}`).join('\n')}`);
  }
  return expectedTests.map((path) => resolve(compiledDirectory, path));
}

export async function runTestSuite(projectRoot) {
  const tests = await compiledTestInventory(
    resolve(projectRoot, 'src/__tests__'),
    resolve(projectRoot, 'dist/__tests__'),
  );
  const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  process.exitCode = await runTestSuite(projectRoot);
}
