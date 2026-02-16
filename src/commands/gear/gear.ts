/**
 * Gear command group: equipment/gear.
 * garmin gear <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { debug } from '../../lib/debug.js';
import { GarminClient, USERPROFILE_SOCIAL } from '../../garmin/index.js';
import { GEAR_FILTER, GEAR_BASE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for list: /gear-service/gear/filterGear?userProfilePk={pk} */
export function gearListPath(userProfilePk: string | number): string {
  return `${GEAR_FILTER}?userProfilePk=${userProfilePk}`;
}

/** Path for stats: /gear-service/gear/stats/{uuid} */
export function gearStatsPath(uuid: string): string {
  return `${GEAR_BASE}/stats/${uuid}`;
}

/** Path for defaults: /gear-service/gear/user/{pk}/activityTypes */
export function gearDefaultsPath(userProfilePk: string | number): string {
  return `${GEAR_BASE}/user/${userProfilePk}/activityTypes`;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

async function getUserProfilePk(client: GarminClient): Promise<number> {
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const pk = profile?.userProfilePk ?? profile?.profileId;
  if (typeof pk === 'number') return pk;
  if (typeof pk === 'string') {
    const n = Number(pk);
    if (!isNaN(n)) return n;
  }
  throw new Error('Failed to get userProfilePk from profile');
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** gear list */
async function listAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const userProfilePk = await getUserProfilePk(client);
  debug('gear list', { userProfilePk });

  const path = gearListPath(userProfilePk);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** gear stats <uuid> */
async function statsAction(uuid: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('gear stats', { uuid });

  const path = gearStatsPath(uuid);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** gear defaults */
async function defaultsAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const userProfilePk = await getUserProfilePk(client);
  debug('gear defaults', { userProfilePk });

  const path = gearDefaultsPath(userProfilePk);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the gear command group and all subcommands.
 */
export function registerGearSubcommands(gearCmd: Command): void {
  gearCmd
    .command('list')
    .description('list of gear')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await listAction(getJsonMode(program));
    });

  gearCmd
    .command('stats')
    .description('gear statistics')
    .argument('<uuid>', 'gear UUID')
    .action(async (uuid: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await statsAction(uuid, getJsonMode(program));
    });

  gearCmd
    .command('defaults')
    .description('default gear for activity types')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await defaultsAction(getJsonMode(program));
    });
}