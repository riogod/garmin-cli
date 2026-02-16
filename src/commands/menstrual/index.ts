/**
 * Registration of menstrual command group.
 * garmin menstrual <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerMenstrualSubcommands } from './menstrual.js';

/**
 * Registers menstrual command group and all subcommands.
 */
export function registerMenstrual(program: CliProgram): void {
  const menstrualCmd = (program as Command)
    .command('menstrual')
    .description('menstrual cycle: daily data, calendar, pregnancy');

  registerMenstrualSubcommands(menstrualCmd);
}