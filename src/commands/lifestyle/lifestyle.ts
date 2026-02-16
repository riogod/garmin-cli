/**
 * Lifestyle command group: lifestyle tracking.
 * garmin lifestyle <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { LIFESTYLE_DAILY_LOG } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for daily: /lifestylelogging-service/dailyLog/{date} */
export function lifestyleDailyPath(date: string): string {
  return `${LIFESTYLE_DAILY_LOG}/${date}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** lifestyle daily [date] */
async function dailyAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('lifestyle daily', { date });

  const path = lifestyleDailyPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the lifestyle command group and all subcommands.
 */
export function registerLifestyleSubcommands(lifestyleCmd: Command): void {
  lifestyleCmd
    .command('daily')
    .description('daily lifestyle log')
    .argument('[date]', 'date in YYYY-MM-DD format')
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await dailyAction(dateArg, getJsonMode(program));
    });
}