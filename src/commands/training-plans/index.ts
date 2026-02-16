/**
 * Registration of training-plans command group.
 * garmin training-plans <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerTrainingPlansSubcommands } from './training-plans.js';

/**
 * Registers training-plans command group and all subcommands.
 */
export function registerTrainingPlans(program: CliProgram): void {
  const tpCmd = (program as Command)
    .command('training-plans')
    .description('training plans: list, view');

  registerTrainingPlansSubcommands(tpCmd);
}