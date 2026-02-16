/**
 * Goals command group: goals.
 * garmin goals <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { GOAL_GOALS, GOAL_WEIGHT_EFFECTIVE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for list: /goal-service/goal/goals?status={status} */
export function goalsListPath(status?: string): string {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString();
  return `${GOAL_GOALS}${query ? `?${query}` : ''}`;
}

/** Path for weight: /goal-service/goal/user/effective/weightgoal/{start}/{end} */
export function weightGoalPath(start: string, end: string): string {
  return `${GOAL_WEIGHT_EFFECTIVE}/${start}/${end}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** goals list [status] */
async function listAction(status: string | undefined, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('goals list', { status });

  const path = goalsListPath(status);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** goals weight <start> <end> */
async function weightAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('goals weight', { start, end });

  const path = weightGoalPath(start, end);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the goals command group and all subcommands.
 */
export function registerGoalsSubcommands(goalsCmd: Command): void {
  goalsCmd
    .command('list')
    .description('list of goals')
    .argument('[status]', 'status: active, future, past')
    .action(async (status: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await listAction(status, getJsonMode(program));
    });

  goalsCmd
    .command('weight')
    .description('weight goal')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await weightAction(start, end, getJsonMode(program));
    });
}