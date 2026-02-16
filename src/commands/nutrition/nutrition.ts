/**
 * Nutrition command group: nutrition tracking.
 * garmin nutrition <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { NUTRITION_CALORIE_SUMMARY, NUTRITION_FOOD_LOGS, NUTRITION_MEALS } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for calories: /nutrition-service/calorie/summary/daily?startDate=...&endDate=... */
export function nutritionCaloriesPath(start: string, end: string): string {
  const params = new URLSearchParams({ startDate: start, endDate: end });
  return `${NUTRITION_CALORIE_SUMMARY}?${params.toString()}`;
}

/** Path for food-logs: /nutrition-service/food/logs/{date} */
export function nutritionFoodLogsPath(date: string): string {
  return `${NUTRITION_FOOD_LOGS}/${date}`;
}

/** Path for meals: /nutrition-service/meals/{date} */
export function nutritionMealsPath(date: string): string {
  return `${NUTRITION_MEALS}/${date}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** nutrition calories <start> <end> */
async function caloriesAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('nutrition calories', { startDate, endDate });

  const path = nutritionCaloriesPath(startDate, endDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** nutrition food-logs [date] */
async function foodLogsAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('nutrition food-logs', { date });

  const path = nutritionFoodLogsPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** nutrition meals [date] */
async function mealsAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('nutrition meals', { date });

  const path = nutritionMealsPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the nutrition command group and all subcommands.
 */
export function registerNutritionSubcommands(nutritionCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  nutritionCmd
    .command('calories')
    .description('calorie summary for a period')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await caloriesAction(start, end, getJsonMode(program));
    });

  nutritionCmd
    .command('food-logs')
    .description('food logs')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await foodLogsAction(dateArg, getJsonMode(program));
    });

  nutritionCmd
    .command('meals')
    .description('meals')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await mealsAction(dateArg, getJsonMode(program));
    });
}