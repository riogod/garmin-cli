/**
 * Challenges command group: challenges.
 * garmin challenges <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import {
  ADHOC_CHALLENGE_HISTORICAL,
  BADGE_CHALLENGE_COMPLETED,
  BADGE_CHALLENGE_AVAILABLE,
  VIRTUAL_CHALLENGE_IN_PROGRESS,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for adhoc: /adhocchallenge-service/adHocChallenge/historical?start={start}&limit={limit} */
export function challengesAdhocPath(start = 0, limit = 50): string {
  const params = new URLSearchParams({ start: String(start), limit: String(limit) });
  return `${ADHOC_CHALLENGE_HISTORICAL}?${params.toString()}`;
}

/** Path for badge-completed: /badgechallenge-service/badgeChallenge/completed */
export function badgeChallengeCompletedPath(): string {
  return BADGE_CHALLENGE_COMPLETED;
}

/** Path for badge-available: /badgechallenge-service/badgeChallenge/available */
export function badgeChallengeAvailablePath(): string {
  return BADGE_CHALLENGE_AVAILABLE;
}

/** Path for virtual-in-progress: /badgechallenge-service/virtualChallenge/inProgress */
export function virtualChallengeInProgressPath(): string {
  return VIRTUAL_CHALLENGE_IN_PROGRESS;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** challenges adhoc [start] [limit] */
async function adhocAction(start: string | undefined, limit: string | undefined, jsonMode: boolean): Promise<void> {
  const startNum = start ? parseInt(start, 10) : 0;
  const limitNum = limit ? parseInt(limit, 10) : 50;

  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('challenges adhoc', { start: startNum, limit: limitNum });

  const path = challengesAdhocPath(startNum, limitNum);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** challenges badge-completed */
async function badgeCompletedAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('challenges badge-completed');

  const path = badgeChallengeCompletedPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** challenges badge-available */
async function badgeAvailableAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('challenges badge-available');

  const path = badgeChallengeAvailablePath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** challenges virtual-in-progress */
async function virtualInProgressAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('challenges virtual-in-progress');

  const path = virtualChallengeInProgressPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the challenges command group and all subcommands.
 */
export function registerChallengesSubcommands(challengesCmd: Command): void {
  challengesCmd
    .command('adhoc')
    .description('ad-hoc challenge history')
    .argument('[start]', 'offset (default 0)')
    .argument('[limit]', 'count (default 50)')
    .action(async (start: string | undefined, limit: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await adhocAction(start, limit, getJsonMode(program));
    });

  challengesCmd
    .command('badge-completed')
    .description('completed badge challenges')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await badgeCompletedAction(getJsonMode(program));
    });

  challengesCmd
    .command('badge-available')
    .description('available badge challenges')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await badgeAvailableAction(getJsonMode(program));
    });

  challengesCmd
    .command('virtual-in-progress')
    .description('virtual challenges in progress')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await virtualInProgressAction(getJsonMode(program));
    });
}