/**
 * Registration of blood-pressure command group.
 * garmin blood-pressure <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerBloodPressureSubcommands } from './blood-pressure.js';

/**
 * Registers blood-pressure command group and all subcommands.
 */
export function registerBloodPressure(program: CliProgram): void {
  const bpCmd = (program as Command)
    .command('blood-pressure')
    .description('blood pressure: view, add');

  registerBloodPressureSubcommands(bpCmd);
}