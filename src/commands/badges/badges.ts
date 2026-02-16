/**
 * Badges command group: badges.
 * garmin badges <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { BADGE_EARNED, BADGE_AVAILABLE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for earned: /badge-service/badge/earned */
export function badgesEarnedPath(): string {
  return BADGE_EARNED;
}

/** Path for available: /badge-service/badge/available?showExclusiveBadge=true */
export function badgesAvailablePath(): string {
  return `${BADGE_AVAILABLE}?showExclusiveBadge=true`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** badges earned */
async function earnedAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('badges earned');

  const path = badgesEarnedPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** badges available */
async function availableAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('badges available');

  const path = badgesAvailablePath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the badges command group and all subcommands.
 */
export function registerBadgesSubcommands(badgesCmd: Command): void {
  badgesCmd
    .command('earned')
    .description('earned badges')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await earnedAction(getJsonMode(program));
    });

  badgesCmd
    .command('available')
    .description('available badges')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await availableAction(getJsonMode(program));
    });
}