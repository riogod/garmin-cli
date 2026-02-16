/**
 * Registration of metrics command group.
 * garmin metrics <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerMetricsSubcommands } from './metrics.js';

/**
 * Registers metrics command group and all subcommands.
 */
export function registerMetrics(program: CliProgram): void {
  const metricsCmd = (program as Command)
    .command('metrics')
    .description('training metrics: readiness, vo2max, endurance, hill, training-status, load-balance, acclimation, race-predictions, power-curve');

  registerMetricsSubcommands(metricsCmd);
}