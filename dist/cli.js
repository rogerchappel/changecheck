#!/usr/bin/env node
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
    .action(async (root, opts) => {
    try {
        const result = await runCheck({ rootPath: root, format: opts.format });
        process.stdout.write(formatOutput(result.findings, opts.format));
        process.exit(result.exitCode);
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err);
        process.exit(2);
    }
});
program
    .command('init')
    .description('Initialize a new release directory with sample files')
    .argument('[root]', 'path to initialize', '.')
    .action(() => {
    console.log('Init command is a placeholder - create your own release files');
});
program.parse();
