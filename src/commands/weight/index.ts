/**
 * Registration of weight command group.
 * garmin weight <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerWeightSubcommands } from './weight.js';

/**
 * Registers weight command group and all subcommands.
 */
export function registerWeight(program: CliProgram): void {
  const weightCmd = (program as Command)
    .command('weight')
    .description('weight management: view, add, delete');

  registerWeightSubcommands(weightCmd);
}