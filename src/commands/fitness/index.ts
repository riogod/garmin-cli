/**
 * Registration of fitness command group.
 * garmin fitness <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerFitnessSubcommands } from './fitness.js';

/**
 * Registers fitness command group and all subcommands.
 */
export function registerFitness(program: CliProgram): void {
  const fitnessCmd = (program as Command)
    .command('fitness')
    .description('fitness statistics: age, summary, metrics, exercises');

  registerFitnessSubcommands(fitnessCmd);
}