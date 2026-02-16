/**
 * Registration of hydration command group.
 * garmin hydration <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerHydrationSubcommands } from './hydration.js';

/**
 * Registers hydration command group and all subcommands.
 */
export function registerHydration(program: CliProgram): void {
  const hydrationCmd = (program as Command)
    .command('hydration')
    .description('hydration: view, add');

  registerHydrationSubcommands(hydrationCmd);
}