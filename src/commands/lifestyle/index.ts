/**
 * Registration of lifestyle command group.
 * garmin lifestyle <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerLifestyleSubcommands } from './lifestyle.js';

/**
 * Registers lifestyle command group and all subcommands.
 */
export function registerLifestyle(program: CliProgram): void {
  const lifestyleCmd = (program as Command)
    .command('lifestyle')
    .description('lifestyle log');

  registerLifestyleSubcommands(lifestyleCmd);
}