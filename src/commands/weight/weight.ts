/**
 * Weight command group: weight, weight record management.
 * garmin weight <subcommand> [options]
 * Date in YYYY-MM-DD format; default is today.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { WEIGHT_SERVICE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for daily: /weight-service/weight/dayview/{date}?includeAll=true */
export function weightDailyPath(date: string, includeAll = true): string {
  const params = new URLSearchParams();
  if (includeAll) params.set('includeAll', 'true');
  const query = params.toString();
  return `${WEIGHT_SERVICE}/weight/dayview/${date}${query ? `?${query}` : ''}`;
}

/** Path for range: /weight-service/weight/range/{start}/{end} */
export function weightRangePath(start: string, end: string): string {
  return `${WEIGHT_SERVICE}/weight/range/${start}/${end}`;
}

/** Path for add (POST): /weight-service/user-weight */
export function weightAddPath(): string {
  return `${WEIGHT_SERVICE}/user-weight`;
}

/** Path for delete: /weight-service/weight/{date}/byversion/{pk} */
export function weightDeletePath(date: string, pk: string | number): string {
  return `${WEIGHT_SERVICE}/weight/${date}/byversion/${pk}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** weight daily [date] */
async function dailyAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('weight daily', { date });

  const path = weightDailyPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** weight range <start> <end> */
async function rangeAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('weight range', { startDate, endDate });

  const path = weightRangePath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** weight add <weight> [date] */
async function addAction(weightStr: string, dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const weight = parseFloat(weightStr);
  if (isNaN(weight) || weight <= 0) {
    throw new Error(`Invalid weight value: ${weightStr}`);
  }

  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('weight add', { weight, date });

  const body = {
    date,
    weight,
    unit: 'kg',
  };

  const data = await client.connectapi(weightAddPath(), 'POST', body);
  print((data ?? { success: true, weight, date }) as Record<string, unknown>, jsonMode);
}

/** weight delete <date> <pk> */
async function deleteAction(dateStr: string, pkStr: string, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const pk = parseInt(pkStr, 10);
  if (isNaN(pk)) {
    throw new Error(`Invalid pk: ${pkStr}`);
  }

  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('weight delete', { date, pk });

  const path = weightDeletePath(date, pk);
  await client.connectapi(path, 'DELETE');
  print({ success: true, date, pk } as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers weight command group and all subcommands.
 */
export function registerWeightSubcommands(weightCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  weightCmd
    .command('daily')
    .description('daily weight data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dailyAction(dateArg, getJsonMode(program));
    });

  weightCmd
    .command('range')
    .description('weight data for period')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await rangeAction(start, end, getJsonMode(program));
    });

  weightCmd
    .command('add')
    .description('add weight record')
    .argument('<weight>', 'weight in kg')
    .argument(dateArg, dateDesc)
    .action(async (weight: string, dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await addAction(weight, dateArg, getJsonMode(program));
    });

  weightCmd
    .command('delete')
    .description('delete weight record')
    .argument('<date>', 'record date (YYYY-MM-DD)')
    .argument('<pk>', 'record identifier')
    .action(async (date: string, pk: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await deleteAction(date, pk, getJsonMode(program));
    });
}