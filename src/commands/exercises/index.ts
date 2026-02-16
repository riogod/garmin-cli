/**
 * Registration of exercises command group.
 * garmin exercises <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerExercisesSubcommands } from './exercises.js';

/**
 * Registers exercises command group and all subcommands.
 */
export function registerExercises(program: CliProgram): void {
  const exercisesCmd = (program as Command)
    .command('exercises')
    .description('exercise library: categories, muscles, equipment, search');

  registerExercisesSubcommands(exercisesCmd);
}