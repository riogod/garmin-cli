/**
 * Registration of workouts command group.
 * garmin workouts <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerWorkoutsSubcommands } from './workouts.js';

/**
 * Registers workouts command group and all subcommands.
 */
export function registerWorkouts(program: CliProgram): void {
  const workoutsCmd = (program as Command)
    .command('workouts')
    .description('workout management: list, view, download, create, schedule');

  registerWorkoutsSubcommands(workoutsCmd);
}