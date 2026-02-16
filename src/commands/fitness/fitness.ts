/**
 * Fitness command group: fitness age and statistics.
 * garmin fitness <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import {
  FITNESSAGE,
  FITNESSSTATS_ACTIVITY,
  FITNESSSTATS_AVAILABLE_METRICS,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for age: /fitnessage-service/fitnessage/{date} */
export function fitnessAgePath(date: string): string {
  return `${FITNESSAGE}/${date}`;
}

/** Path for stats-summary: /fitnessstats-service/activity?startDate=...&endDate=...&aggregation=...&metric=... */
export function fitnessStatsSummaryPath(start: string, end: string, aggregation = 'weekly', metric = 'all'): string {
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    aggregation,
    metric,
    groupByParentActivityType: 'true',
  });
  return `${FITNESSSTATS_ACTIVITY}?${params.toString()}`;
}

/** Path for stats-metrics: /fitnessstats-service/activity/availableMetrics?startDate=...&endDate=... */
export function fitnessAvailableMetricsPath(start: string, end: string, activityType?: string): string {
  const params = new URLSearchParams({ startDate: start, endDate: end });
  if (activityType) params.set('activityType', activityType);
  return `${FITNESSSTATS_AVAILABLE_METRICS}?${params.toString()}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** fitness age [date] */
async function ageAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('fitness age', { date });

  const path = fitnessAgePath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** fitness stats-summary <start> <end> */
async function statsSummaryAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('fitness stats-summary', { startDate, endDate });

  const path = fitnessStatsSummaryPath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** fitness stats-metrics <start> <end> [activity-type] */
async function statsMetricsAction(start: string, end: string, activityType: string | undefined, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('fitness stats-metrics', { startDate, endDate, activityType });

  const path = fitnessAvailableMetricsPath(startDate, endDate, activityType);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the fitness command group and all subcommands.
 */
export function registerFitnessSubcommands(fitnessCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  fitnessCmd
    .command('age')
    .description('fitness age')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await ageAction(dateArg, getJsonMode(program));
    });

  fitnessCmd
    .command('stats-summary')
    .description('fitness statistics summary for a period')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await statsSummaryAction(start, end, getJsonMode(program));
    });

  fitnessCmd
    .command('stats-metrics')
    .description('available fitness statistics metrics')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .argument('[activity-type]', 'activity type (running, cycling)')
    .action(async (start: string, end: string, activityType: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await statsMetricsAction(start, end, activityType, getJsonMode(program));
    });
}