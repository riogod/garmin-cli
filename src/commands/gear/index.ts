/**
 * Registration of gear command group.
 * garmin gear <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerGearSubcommands } from './gear.js';

/**
 * Registers gear command group and all subcommands.
 */
export function registerGear(program: CliProgram): void {
  const gearCmd = (program as Command)
    .command('gear')
    .description('gear: list, stats, defaults');

  registerGearSubcommands(gearCmd);
}