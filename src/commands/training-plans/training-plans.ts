/**
 * Training plans command group: training plans.
 * garmin training-plans <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { TRAINING_PLAN, TRAINING_PLAN_PLANS } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for list: /trainingplan-service/trainingplan/plans?limit=50 */
export function trainingPlansListPath(limit = 50): string {
  return `${TRAINING_PLAN_PLANS}?limit=${limit}`;
}

/** Path for get: /trainingplan-service/trainingplan/phased/{id} */
export function trainingPlanGetPath(planId: string | number): string {
  return `${TRAINING_PLAN}/phased/${planId}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** training-plans list */
async function listAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('training-plans list');

  const path = trainingPlansListPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** training-plans get <id> */
async function getAction(planId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('training-plans get', { planId });

  const path = trainingPlanGetPath(planId);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the training-plans command group and all subcommands.
 */
export function registerTrainingPlansSubcommands(tpCmd: Command): void {
  tpCmd
    .command('list')
    .description('list of training plans')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await listAction(getJsonMode(program));
    });

  tpCmd
    .command('get')
    .description('get training plan by ID')
    .argument('<plan-id>', 'plan ID')
    .action(async (planId: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await getAction(planId, getJsonMode(program));
    });
}