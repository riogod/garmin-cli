/**
 * Registration of biometric command group.
 * garmin biometric <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerBiometricSubcommands } from './biometric.js';

/**
 * Registers biometric command group and all subcommands.
 */
export function registerBiometric(program: CliProgram): void {
  const biometricCmd = (program as Command)
    .command('biometric')
    .description('biometric measurements: lactate-threshold, ftp, hr-zones, power-weight, critical-swim-speed');

  registerBiometricSubcommands(biometricCmd);
}