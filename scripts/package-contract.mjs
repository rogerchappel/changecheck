import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function minimumNodeMajor(range) {
  const match = /^>=(\d+)(?:\.\d+){0,2}$/.exec(range);
  if (!match) throw new Error(`unsupported Node engine range: ${range}`);
  return Number(match[1]);
}

export function validatePackageContract(pkg, lockfile) {
  const errors = [];
  const rootRange = pkg.engines?.node;
  if (!rootRange) return ['package.json must declare engines.node'];

  let rootMinimum;
  try {
    rootMinimum = minimumNodeMajor(rootRange);
  } catch (error) {
    return [error.message];
  }

  if (lockfile.packages?.['']?.engines?.node !== rootRange) {
    errors.push('package-lock root engines.node must match package.json');
  }

  for (const dependency of Object.keys(pkg.dependencies ?? {})) {
    const dependencyRange = lockfile.packages?.[`node_modules/${dependency}`]?.engines?.node;
    if (!dependencyRange) continue;
    try {
      if (rootMinimum < minimumNodeMajor(dependencyRange)) {
        errors.push(`engines.node ${rootRange} is less restrictive than ${dependency} ${dependencyRange}`);
      }
    } catch {
      errors.push(`cannot compare ${dependency} Node engine range: ${dependencyRange}`);
    }
  }

  return errors;
}

export async function checkPackageContract(root = process.cwd()) {
  const [pkg, lockfile] = await Promise.all([
    readFile(`${root}/package.json`, 'utf8').then(JSON.parse),
    readFile(`${root}/package-lock.json`, 'utf8').then(JSON.parse),
  ]);
  const errors = validatePackageContract(pkg, lockfile);
  if (errors.length) throw new Error(`Package contract failed:\n- ${errors.join('\n- ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkPackageContract().then(
    () => console.log('Package runtime contract is valid.'),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
