/**
 * Profile command: social profile, settings, display name.
 * garmin profile social | settings | display
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { GarminClient, USERPROFILE_SETTINGS, USERPROFILE_SOCIAL } from '../../garmin/index.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

/**
 * Action: garmin profile social - GET socialProfile.
 */
async function profileSocialAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const data = await client.connectapi(USERPROFILE_SOCIAL);
  print(data ?? {}, jsonMode);
}

/**
 * Action: garmin profile settings - GET user-settings.
 */
async function profileSettingsAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const data = await client.connectapi(USERPROFILE_SETTINGS);
  print(data ?? {}, jsonMode);
}

/**
 * Action: garmin profile display - display data (displayName, userProfileFullName, etc. from socialProfile).
 */
async function profileDisplayAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const data = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown>;
  if (!data || typeof data !== 'object') {
    print({ displayName: null, userProfileFullName: null, username: null }, jsonMode);
    return;
  }
  const display = {
    displayName: data.displayName ?? data.displayname ?? null,
    userProfileFullName: data.userProfileFullName ?? null,
    username: data.username ?? null,
    profileId: data.profileId ?? data.userProfilePk ?? null,
    userRoles: Array.isArray(data.userRoles) ? data.userRoles : (data.userRoles ?? null),
  };
  print(display, jsonMode);
}

/**
 * Registers the profile command and subcommands social, settings, display.
 */
export function registerProfile(program: CliProgram): void {
  const profileCmd = (program as Command)
    .command('profile')
    .description('Garmin Connect user profile');

  profileCmd
    .command('social')
    .description('social profile (full JSON from socialProfile)')
    .action(async () => {
      await profileSocialAction(getJsonMode(program));
    });

  profileCmd
    .command('settings')
    .description('profile settings (user-settings)')
    .action(async () => {
      await profileSettingsAction(getJsonMode(program));
    });

  profileCmd
    .command('display')
    .description('display name and identifier (displayName, userProfileFullName, username)')
    .action(async () => {
      await profileDisplayAction(getJsonMode(program));
    });
}
