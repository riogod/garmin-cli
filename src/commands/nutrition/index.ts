/**
 * Registration of nutrition command group.
 * garmin nutrition <subcommand> [options]
 */

import type { Command } from 'commander';
import type { CliProgram } from '../../cli-types.js';
import { registerNutritionSubcommands } from './nutrition.js';

/**
 * Registers nutrition command group and all subcommands.
 */
export function registerNutrition(program: CliProgram): void {
  const nutritionCmd = (program as Command)
    .command('nutrition')
    .description('nutrition: calories, food logs, meals');

  registerNutritionSubcommands(nutritionCmd);
}