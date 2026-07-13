#!/usr/bin/env node
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Command } from 'commander';
import { runCheck } from './checker.js';
import { formatOutput } from './formatter.js';

const program = new Command();

program
  .name('changecheck')
  .description('Local-first release consistency checker')
  .version('0.1.0');

program
  .command('check')
  .description('Run consistency checks on a release directory')
  .argument('<root>', 'path to release directory')
  .option('--format <text|json>', 'output format', 'text')
  .action(async (root: string, opts: { format: string }) => {
    try {
      const result = await runCheck({ rootPath: root, format: opts.format as 'text' | 'json' });
      process.stdout.write(formatOutput(result.findings, opts.format as 'text' | 'json'));
      process.exit(result.exitCode);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
      process.exit(2);
    }
  });

program
  .command('init')
  .description('Initialize a new release directory with sample files')
  .argument('[root]', 'path to initialize', '.')
  .option('--release-version <version>', 'release version to write into sample files', '0.1.0')
  .option('--force', 'overwrite existing sample files')
  .action(async (root: string, opts: { releaseVersion: string; force?: boolean }) => {
    try {
      const written = await initReleaseDirectory(root, opts.releaseVersion, Boolean(opts.force));
      console.log(`Initialized ${written.length} release files in ${root}`);
      for (const file of written) {
        console.log(`- ${file}`);
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
      process.exit(2);
    }
  });

program.parse();

async function initReleaseDirectory(root: string, version: string, force: boolean): Promise<string[]> {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  await mkdir(root, { recursive: true });

  const files = new Map<string, string>([
    [
      'package.json',
      `${JSON.stringify({ name: 'my-release', version, private: true }, null, 2)}\n`,
    ],
    [
      'CHANGELOG.md',
      `# Changelog\n\n## [${version}] - ${new Date().toISOString().slice(0, 10)}\n\n- Describe the release changes here.\n`,
    ],
    [
      'RELEASE.md',
      `# Release ${version}\n\nSummarize the release, verification, and rollout notes here.\n`,
    ],
  ]);

  const written: string[] = [];

  for (const [fileName, contents] of files) {
    const target = join(root, fileName);
    if (!force && (await exists(target))) {
      throw new Error(`${fileName} already exists; pass --force to overwrite sample files`);
    }
    await writeFile(target, contents, 'utf8');
    written.push(fileName);
  }

  return written;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
