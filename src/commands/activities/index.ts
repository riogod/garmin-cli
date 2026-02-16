/**
 * Registration of activities command group.
 * garmin activities <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerActivitiesSubcommands } from './activities.js';

/**
 * Registers activities command group and all subcommands.
 */
export function registerActivities(program: CliProgram): void {
  const activitiesCmd = (program as Command)
    .command('activities')
    .description('activity management: list, details, download, upload');

  registerActivitiesSubcommands(activitiesCmd);
}