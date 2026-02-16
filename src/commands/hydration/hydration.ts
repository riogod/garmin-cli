/**
 * Hydration command group: hydration tracking.
 * garmin hydration <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient, USERPROFILE_SOCIAL } from '../../garmin/index.js';
import { HYDRATION_DAILY, HYDRATION_LOG, HYDRATION_ALL } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for daily: /usersummary-service/usersummary/hydration/daily/{date} */
export function hydrationDailyPath(date: string): string {
  return `${HYDRATION_DAILY}/${date}`;
}

/** Path for range: /usersummary-service/stats/hydration/daily/{start}/{end} */
export function hydrationRangePath(start: string, end: string): string {
  return `/usersummary-service/stats/hydration/daily/${start}/${end}`;
}

/** Path for add: /usersummary-service/usersummary/hydration/log */
export function hydrationAddPath(): string {
  return HYDRATION_LOG;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

async function getUserProfileId(client: GarminClient): Promise<number> {
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const id = profile?.userProfileId ?? profile?.profileId;
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const n = Number(id);
    if (!isNaN(n)) return n;
  }
  throw new Error('Failed to get userProfileId from profile');
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** hydration daily [date] */
async function dailyAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('hydration daily', { date });

  const path = hydrationDailyPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** hydration range <start> <end> */
async function rangeAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('hydration range', { startDate, endDate });

  const path = hydrationRangePath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** hydration add <ml> [date] */
async function addAction(mlStr: string, dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const ml = parseInt(mlStr, 10);
  if (isNaN(ml) || ml <= 0) {
    throw new Error(`Invalid value: ${mlStr}`);
  }

  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const userProfileId = await getUserProfileId(client);
  debug('hydration add', { ml, date, userProfileId });

  const timestampLocal = `${date}T12:00:00.0`;
  const body = {
    valueInML: String(ml),
    timestampLocal,
    userProfileId: String(userProfileId),
  };

  await client.connectapi(hydrationAddPath(), 'PUT', body);
  print({ success: true, ml, date } as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the hydration command group and all subcommands.
 */
export function registerHydrationSubcommands(hydrationCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  hydrationCmd
    .command('daily')
    .description('daily hydration data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dailyAction(dateArg, getJsonMode(program));
    });

  hydrationCmd
    .command('range')
    .description('hydration data for a period')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await rangeAction(start, end, getJsonMode(program));
    });

  hydrationCmd
    .command('add')
    .description('add hydration entry')
    .argument('<ml>', 'volume in milliliters')
    .argument(dateArg, dateDesc)
    .action(async (ml: string, dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await addAction(ml, dateArg, getJsonMode(program));
    });
}