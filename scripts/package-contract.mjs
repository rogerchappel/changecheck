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

export function findDuplicateTopLevelKeys(rawManifest) {
  const counts = new Map();
  let depth = 0;
  let inString = false;
  let escaped = false;
  let stringStart = -1;
  for (let i = 0; i < rawManifest.length; i += 1) {
    const char = rawManifest[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
        if (depth === 1) {
          let next = i + 1;
          while (next < rawManifest.length && /\s/.test(rawManifest[next])) next += 1;
          if (rawManifest[next] === ':') {
            const key = rawManifest.slice(stringStart + 1, i);
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
        }
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      stringStart = i;
    } else if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
    }
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([key]) => key).sort();
}

export async function checkPackageContract(root = process.cwd()) {
  const rawManifest = await readFile(`${root}/package.json`, 'utf8');
  const [pkg, lockfile] = await Promise.all([
    Promise.resolve(JSON.parse(rawManifest)),
    readFile(`${root}/package-lock.json`, 'utf8').then(JSON.parse),
  ]);
  const errors = validatePackageContract(pkg, lockfile);
  const duplicates = findDuplicateTopLevelKeys(rawManifest);
  if (duplicates.length > 0) {
    errors.push(`package.json declares duplicate top-level keys: ${duplicates.join(', ')}`);
  }
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
