/**
 * Sleep command: daily sleep data for a specified date.
 * garmin sleep [date]
 * Date in YYYY-MM-DD format; defaults to today.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { GarminClient, SLEEP_DAILY } from '../../garmin/index.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

/**
 * Returns API path for daily sleep with date parameter.
 * @param date — date in YYYY-MM-DD format
 */
export function sleepApiPath(date: string): string {
  const q = new URLSearchParams({ date });
  return `${SLEEP_DAILY}?${q.toString()}`;
}

/**
 * Action: garmin sleep [date] - GET daily sleep data.
 */
async function sleepAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const path = sleepApiPath(date);
  const data = await client.connectapi(path);
  print(data ?? {}, jsonMode);
}

/**
 * Registers the sleep command with optional [date] argument.
 */
export function registerSleep(program: CliProgram): void {
  (program as Command)
    .command('sleep')
    .description('sleep data for a day (date format YYYY-MM-DD, defaults to today)')
    .argument('[date]', 'date in YYYY-MM-DD format')
    .action(async (dateArg: string | undefined) => {
      await sleepAction(dateArg, getJsonMode(program));
    });
}
