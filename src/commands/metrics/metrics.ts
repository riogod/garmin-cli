/**
 * Metrics command group: training metrics (readiness, vo2max, endurance, hill, training-status, load-balance, acclimation, race-predictions, power-curve).
 * garmin metrics <subcommand> [options]
 * Date in YYYY-MM-DD format; defaults to today.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient, USERPROFILE_SOCIAL } from '../../garmin/index.js';
import {
  METRICS_TRAINING_READINESS,
  METRICS_MAXMET_DAILY,
  METRICS_ENDURANCE_SCORE,
  METRICS_HILL_SCORE,
  METRICS_TRAINING_STATUS,
  METRICS_RACE_PREDICTIONS,
  FITNESSSTATS_POWER_CURVE,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for training readiness: /metrics-service/metrics/trainingreadiness/{date} */
export function trainingReadinessPath(date: string): string {
  return `${METRICS_TRAINING_READINESS}/${date}`;
}

/** Path for vo2max daily: use GraphQL instead of REST */
// REST endpoint /metrics-service/metrics/maxmet/daily/{date} returns 404
// Use GraphQL query as in vo2max-range for a single day
export function vo2maxDailyPath(date: string): string {
  // Stub for backward compatibility with tests
  return `graphql://vo2max/${date}`;
}

/** Path for endurance: /metrics-service/metrics/endurancescore?calendarDate={date} */
export function endurancePath(date: string): string {
  const params = new URLSearchParams({ calendarDate: date });
  return `${METRICS_ENDURANCE_SCORE}?${params.toString()}`;
}

/** Path for hill: /metrics-service/metrics/hillscore?calendarDate={date} */
export function hillPath(date: string): string {
  const params = new URLSearchParams({ calendarDate: date });
  return `${METRICS_HILL_SCORE}?${params.toString()}`;
}

/** Path for training status: /metrics-service/metrics/trainingstatus/aggregated/{date} */
export function trainingStatusPath(date: string): string {
  return `${METRICS_TRAINING_STATUS}/${date}`;
}

/** Path for race predictions: /metrics-service/metrics/racepredictions/latest/{displayName} */
export function racePredictionsPath(displayName: string): string {
  return `${METRICS_RACE_PREDICTIONS}/latest/${encodeURIComponent(displayName)}`;
}

/** Path for power curve: /fitnessstats-service/powerCurve?startDate=...&endDate=...&sport=... */
export function powerCurvePath(start: string, end: string, sport?: string): string {
  const params = new URLSearchParams({ startDate: start, endDate: end });
  if (sport) params.set('sport', sport);
  return `${FITNESSSTATS_POWER_CURVE}?${params.toString()}`;
}

// ─── GraphQL queries ──────────────────────────────────────────────────────────

export const VO2MAX_RANGE_QUERY = `query($startDate: Date!, $endDate: Date!) {
  vo2MaxScalar(startDate: $startDate, endDate: $endDate)
}`;

export const LOAD_BALANCE_QUERY = `query($calendarDate: Date!, $fullHistoryScan: Boolean!) {
  trainingLoadBalanceScalar(calendarDate: $calendarDate, fullHistoryScan: $fullHistoryScan)
}`;

export const ACCLIMATION_QUERY = `query($date: Date!) {
  heatAltitudeAcclimationScalar(date: $date)
}`;

// ─── Helper functions ─────────────────────────────────────────────────────────

async function getDisplayName(client: GarminClient): Promise<string> {
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const name = profile?.displayName ?? profile?.displayname;
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Failed to get displayName from Garmin Connect profile');
  }
  return name.trim();
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** metrics readiness [date] */
async function readinessAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics readiness', { date });

  const path = trainingReadinessPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics vo2max [date] */
async function vo2maxAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics vo2max', { date });

  // Use GraphQL for a single day (REST endpoint returns 404)
  const result = (await client.queryGarminGraphql({
    query: VO2MAX_RANGE_QUERY,
    variables: { startDate: date, endDate: date },
  })) as { data?: { vo2MaxScalar?: unknown }; vo2MaxScalar?: unknown } | null;

  const data = result?.data?.vo2MaxScalar ?? result?.vo2MaxScalar ?? result;
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics vo2max-range <start> <end> */
async function vo2maxRangeAction(start: string, end: string, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics vo2max-range', { startDate, endDate });

  const result = (await client.queryGarminGraphql({
    query: VO2MAX_RANGE_QUERY,
    variables: { startDate, endDate },
  })) as { data?: { vo2MaxScalar?: unknown }; vo2MaxScalar?: unknown } | null;

  const data = result?.data?.vo2MaxScalar ?? result?.vo2MaxScalar ?? result;
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics endurance [date] */
async function enduranceAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics endurance', { date });

  const path = endurancePath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics hill [date] */
async function hillAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics hill', { date });

  const path = hillPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics training-status [date] */
async function trainingStatusAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics training-status', { date });

  const path = trainingStatusPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics load-balance [date] */
async function loadBalanceAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics load-balance', { date });

  const result = (await client.queryGarminGraphql({
    query: LOAD_BALANCE_QUERY,
    variables: { calendarDate: date, fullHistoryScan: true },
  })) as { data?: { trainingLoadBalanceScalar?: unknown }; trainingLoadBalanceScalar?: unknown } | null;

  const data = result?.data?.trainingLoadBalanceScalar ?? result?.trainingLoadBalanceScalar ?? result;
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics acclimation [date] */
async function acclimationAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics acclimation', { date });

  const result = (await client.queryGarminGraphql({
    query: ACCLIMATION_QUERY,
    variables: { date },
  })) as { data?: { heatAltitudeAcclimationScalar?: unknown }; heatAltitudeAcclimationScalar?: unknown } | null;

  const data = result?.data?.heatAltitudeAcclimationScalar ?? result?.heatAltitudeAcclimationScalar ?? result;
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics race-predictions [date] */
async function racePredictionsAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const displayName = await getDisplayName(client);
  debug('metrics race-predictions', { date, displayName });

  const path = racePredictionsPath(displayName);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** metrics power-curve <start> <end> [sport] */
async function powerCurveAction(start: string, end: string, sport: string | undefined, jsonMode: boolean): Promise<void> {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('metrics power-curve', { startDate, endDate, sport });

  const path = powerCurvePath(startDate, endDate, sport);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the metrics command group and all subcommands.
 */
export function registerMetricsSubcommands(metricsCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  metricsCmd
    .command('readiness')
    .description('training readiness')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await readinessAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('vo2max')
    .description('daily VO2 max')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await vo2maxAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('vo2max-range')
    .description('VO2 max for a period (GraphQL)')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .action(async (start: string, end: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await vo2maxRangeAction(start, end, getJsonMode(program));
    });

  metricsCmd
    .command('endurance')
    .description('endurance score')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await enduranceAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('hill')
    .description('hill score')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await hillAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('training-status')
    .description('training status')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await trainingStatusAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('load-balance')
    .description('training load balance (GraphQL)')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await loadBalanceAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('acclimation')
    .description('heat/altitude acclimation (GraphQL)')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await acclimationAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('race-predictions')
    .description('race predictions')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await racePredictionsAction(dateArg, getJsonMode(program));
    });

  metricsCmd
    .command('power-curve')
    .description('power curve')
    .argument('<start>', 'start date (YYYY-MM-DD)')
    .argument('<end>', 'end date (YYYY-MM-DD)')
    .argument('[sport]', 'sport type (cycling, running)')
    .action(async (start: string, end: string, sport: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await powerCurveAction(start, end, sport, getJsonMode(program));
    });
}