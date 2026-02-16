#!/usr/bin/env node

/**
 * CLI entry point for garmin-cli.
 * Global options: --json, --debug, --version.
 * Commands are registered via register* from src/commands/.
 *
 * npm does not pass flags (--json, --debug) to the script without -- separator.
 * Working methods:
 * 1) With separator: npm run garmin -- sleep 2025-08-08 --json --debug
 * 2) Via environment: GARMIN_JSON=1 GARMIN_DEBUG=1 npm run garmin -- sleep 2025-08-08
 * 3) After build: garmin-cli sleep 2025-08-08 --json --debug
 */

import { createRequire } from 'node:module';
import { program } from 'commander';
import { registerCommands } from './commands/index.js';
import { AuthError } from './garmin/index.js';
import { debug, isDebugEnabled } from './lib/debug.js';
import type { CliProgram } from './cli-types.js';

// Inject --json and --debug from env before parsing (workaround for npm run without --)
const envJson = process.env.GARMIN_JSON;
const envDebug = process.env.GARMIN_DEBUG;
if (envJson && (envJson === '1' || envJson.toLowerCase() === 'true' || envJson.toLowerCase() === 'yes')) {
  if (!process.argv.includes('--json')) process.argv.push('--json');
}
if (envDebug && (envDebug === '1' || envDebug.toLowerCase() === 'true' || envDebug.toLowerCase() === 'yes')) {
  if (!process.argv.includes('--debug')) process.argv.push('--debug');
}

// Unhandled rejections: print message and exit with code 1
process.on('unhandledRejection', (reason: unknown) => {
  if (reason instanceof AuthError) {
    console.error('Error:', reason.message);
  } else if (reason instanceof Error) {
    console.error('Error:', reason.message);
  } else {
    console.error('Error:', String(reason));
  }
  process.exit(1);
});

// Enable debug before parse(): by argv (--debug) or by env
if (process.argv.includes('--debug') || process.env.npm_config_debug) process.env.GARMIN_DEBUG = '1';
if (envDebug && (envDebug === '1' || envDebug.toLowerCase() === 'true' || envDebug.toLowerCase() === 'yes')) {
  process.env.GARMIN_DEBUG = '1';
}
if (isDebugEnabled()) debug('garmin-cli started', { debug: true });

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const cli = program as CliProgram;

cli
  .name('garmin-cli')
  .description('CLI for Garmin Connect API')
  .version(pkg.version, '-V, --version', 'output version')
  .option('--json', 'JSON output for machine processing')
  .option('--debug', 'verbose output for debugging')
  .addHelpText(
    'after',
    [
      '',
      'Working methods to run (npm does not pass --json/--debug flags without --):',
      '  1) With separator --:  npm run garmin -- sleep 2025-08-08 --json --debug',
      '  2) Via environment:     GARMIN_JSON=1 GARMIN_DEBUG=1 npm run garmin -- sleep 2025-08-08',
      '  3) After build:        garmin-cli sleep 2025-08-08 --json --debug',
    ].join('\n')
  );

cli
  .command('version')
  .description('output version')
  .action(() => {
    console.log(pkg.version);
  });

cli
  .command('help')
  .description('show help')
  .action(() => {
    cli.outputHelp();
  });

registerCommands(cli);

(async () => {
  try {
    await cli.parseAsync(process.argv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error:', msg);
    process.exit(1);
  }
})();
