/**
 * Registration of challenges command group.
 * garmin challenges <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerChallengesSubcommands } from './challenges.js';

/**
 * Registers challenges command group and all subcommands.
 */
export function registerChallenges(program: CliProgram): void {
  const challengesCmd = (program as Command)
    .command('challenges')
    .description('challenges: ad-hoc, badge, virtual');

  registerChallengesSubcommands(challengesCmd);
}