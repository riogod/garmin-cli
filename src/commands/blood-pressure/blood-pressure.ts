/**
 * Blood pressure command group: blood pressure tracking.
 * garmin blood-pressure <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { BLOOD_PRESSURE_RANGE, BLOOD_PRESSURE, BLOOD_PRESSURE_DAYVIEW } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for range: /bloodpressure-service/bloodpressure/range/{start}/{end} */
export function bloodPressureRangePath(start: string, end: string): string {
  return `${BLOOD_PRESSURE_RANGE}/${start}/${end}`;
}

/** Path for daily: /bloodpressure-service/bloodpressure/dayview/{date} */
export function bloodPressureDailyPath(date: string): string {
  return `${BLOOD_PRESSURE_DAYVIEW}/${date}`;
}

/** Path for add: /bloodpressure-service/bloodpressure */
export function bloodPressureAddPath(): string {
  return BLOOD_PRESSURE;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** blood-pressure range <start> <end> */
async function rangeAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('blood-pressure range', { startDate, endDate });

  const path = bloodPressureRangePath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** blood-pressure daily [date] */
async function dailyAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('blood-pressure daily', { date });

  const path = bloodPressureDailyPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** blood-pressure add <systolic> <diastolic> [date] */
async function addAction(systolicStr: string, diastolicStr: string, dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);

  if (isNaN(systolic) || isNaN(diastolic) || systolic <= 0 || diastolic <= 0) {
    throw new Error(`Invalid values: ${systolicStr}/${diastolicStr}`);
  }

  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('blood-pressure add', { systolic, diastolic, date });

  const body = {
    date,
    systolic,
    diastolic,
    measuredAt: `${date}T12:00:00`,
  };

  const data = await client.connectapi(bloodPressureAddPath(), 'POST', body);
  print((data ?? { success: true, systolic, diastolic, date }) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the blood-pressure command group and all subcommands.
 */
export function registerBloodPressureSubcommands(bpCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  bpCmd
    .command('range')
    .description('blood pressure data for a period')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await rangeAction(start, end, getJsonMode(program));
    });

  bpCmd
    .command('daily')
    .description('daily blood pressure data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dailyAction(dateArg, getJsonMode(program));
    });

  bpCmd
    .command('add')
    .description('add blood pressure entry')
    .argument('<systolic>', 'systolic pressure')
    .argument('<diastolic>', 'diastolic pressure')
    .argument(dateArg, dateDesc)
    .action(async (systolic: string, diastolic: string, dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await addAction(systolic, diastolic, dateArg, getJsonMode(program));
    });
}