/**
 * Registration of badges command group.
 * garmin badges <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerBadgesSubcommands } from './badges.js';

/**
 * Registers badges command group and all subcommands.
 */
export function registerBadges(program: CliProgram): void {
  const badgesCmd = (program as Command)
    .command('badges')
    .description('badges: earned, available');

  registerBadgesSubcommands(badgesCmd);
}