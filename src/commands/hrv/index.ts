/**
 * Registration of hrv command group.
 * garmin hrv <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerHrvSubcommands } from './hrv.js';

/**
 * Registers hrv command group and all subcommands.
 */
export function registerHrv(program: CliProgram): void {
  const hrvCmd = (program as Command)
    .command('hrv')
    .description('heart rate variability (HRV)');

  registerHrvSubcommands(hrvCmd);
}