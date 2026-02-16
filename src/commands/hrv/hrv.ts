/**
 * HRV command group: heart rate variability.
 * garmin hrv <subcommand> [options]
 * Date in YYYY-MM-DD format; defaults to today.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient, GRAPHQL } from '../../garmin/index.js';
import { HRV_SERVICE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for daily: /hrv-service/hrv/{date} */
export function hrvDailyPath(date: string): string {
  return `${HRV_SERVICE}/${date}`;
}

/** GraphQL query for range */
export const HRV_RANGE_QUERY = `query($startDate: Date!, $endDate: Date!) {
  heartRateVariabilityScalar(startDate: $startDate, endDate: $endDate)
}`;

// ─── Actions ──────────────────────────────────────────────────────────────────

/** hrv daily [date] */
async function dailyAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('hrv daily', { date });

  const path = hrvDailyPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** hrv range <start> <end> */
async function rangeAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('hrv range', { startDate, endDate });

  const result = (await client.queryGarminGraphql({
    query: HRV_RANGE_QUERY,
    variables: { startDate, endDate },
  })) as { data?: { heartRateVariabilityScalar?: unknown }; heartRateVariabilityScalar?: unknown } | null;

  const data = result?.data?.heartRateVariabilityScalar ?? result?.heartRateVariabilityScalar ?? result;
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the hrv command group and all subcommands.
 */
export function registerHrvSubcommands(hrvCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  hrvCmd
    .command('daily')
    .description('daily HRV data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dailyAction(dateArg, getJsonMode(program));
    });

  hrvCmd
    .command('range')
    .description('HRV data for a period (GraphQL)')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await rangeAction(start, end, getJsonMode(program));
    });
}