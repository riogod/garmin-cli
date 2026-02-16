/**
 * Menstrual command group: menstrual cycle tracking.
 * garmin menstrual <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { PERIODIC_HEALTH_DAYVIEW, PERIODIC_HEALTH_CALENDAR, PERIODIC_HEALTH_PREGNANCY } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for day: /periodichealth-service/menstrualcycle/dayview/{date} */
export function menstrualDayPath(date: string): string {
  return `${PERIODIC_HEALTH_DAYVIEW}/${date}`;
}

/** Path for calendar: /periodichealth-service/menstrualcycle/calendar/{start}/{end} */
export function menstrualCalendarPath(start: string, end: string): string {
  return `${PERIODIC_HEALTH_CALENDAR}/${start}/${end}`;
}

/** Path for pregnancy: /periodichealth-service/menstrualcycle/pregnancysnapshot */
export function pregnancyPath(): string {
  return PERIODIC_HEALTH_PREGNANCY;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** menstrual day [date] */
async function dayAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('menstrual day', { date });

  const path = menstrualDayPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** menstrual calendar <start> <end> */
async function calendarAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('menstrual calendar', { startDate, endDate });

  const path = menstrualCalendarPath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** menstrual pregnancy */
async function pregnancyAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('menstrual pregnancy');

  const path = pregnancyPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the menstrual command group and all subcommands.
 */
export function registerMenstrualSubcommands(menstrualCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  menstrualCmd
    .command('day')
    .description('daily menstrual cycle data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dayAction(dateArg, getJsonMode(program));
    });

  menstrualCmd
    .command('calendar')
    .description('menstrual cycle calendar')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await calendarAction(start, end, getJsonMode(program));
    });

  menstrualCmd
    .command('pregnancy')
    .description('pregnancy snapshot')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await pregnancyAction(getJsonMode(program));
    });
}