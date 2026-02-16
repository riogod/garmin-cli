/**
 * Registration of devices command group.
 * garmin devices <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerDevicesSubcommands } from './devices.js';

/**
 * Registers devices command group and all subcommands.
 */
export function registerDevices(program: CliProgram): void {
  const devicesCmd = (program as Command)
    .command('devices')
    .description('device management: list, settings, solar, primary, last-used');

  registerDevicesSubcommands(devicesCmd);
}