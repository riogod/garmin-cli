/**
 * Registration of goals command group.
 * garmin goals <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerGoalsSubcommands } from './goals.js';

/**
 * Registers goals command group and all subcommands.
 */
export function registerGoals(program: CliProgram): void {
  const goalsCmd = (program as Command)
    .command('goals')
    .description('goals: list, weight goal');

  registerGoalsSubcommands(goalsCmd);
}