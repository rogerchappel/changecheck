import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function validateReleaseContract(workflow, config) {
  const errors = [];
  const publishAt = workflow.indexOf('npm publish "$PACKAGE_TARBALL" --provenance --access public');
  const releaseAt = workflow.indexOf('gh release create ');

  if (!/^\s*id-token:\s*write\s*$/m.test(workflow)) errors.push('release workflow must grant id-token: write');
  if (!/registry-url:\s*https:\/\/registry\.npmjs\.org\/?\s*$/m.test(workflow)) errors.push('setup-node must configure the npm registry');
  if (!/PACKAGE_TARBALL=.*npm pack --json/m.test(workflow)) errors.push('release workflow must capture the tarball produced by npm pack');
  if (publishAt < 0) errors.push('release workflow must publish the exact packed tarball with provenance and public access');
  if (!/gh release create[^\n]*"\$PACKAGE_TARBALL"/m.test(workflow)) errors.push('GitHub release must upload the exact packed tarball');
  if (publishAt >= 0 && releaseAt >= 0 && publishAt > releaseAt) errors.push('npm publication must happen before GitHub release creation');
  if (config.release?.publishNpm !== true) errors.push('releasebox.config.json must enable npm publication');
  if (!config.packageManagers?.includes('npm')) errors.push('releasebox.config.json must declare npm as a package manager');

  return errors;
}

export async function checkReleaseContract(root = process.cwd()) {
  const [workflow, configText] = await Promise.all([
    readFile(`${root}/.github/workflows/release.yml`, 'utf8'),
    readFile(`${root}/releasebox.config.json`, 'utf8'),
  ]);
  const errors = validateReleaseContract(workflow, JSON.parse(configText));
  if (errors.length) throw new Error(`Release contract failed:\n- ${errors.join('\n- ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkReleaseContract().then(
    () => console.log('Release publication contract is valid.'),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
