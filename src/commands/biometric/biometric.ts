/**
 * Biometric command group: biometric measurements (lactate-threshold, ftp, hr-zones, power-weight, critical-swim-speed).
 * garmin biometric <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import {
  BIOMETRIC,
  BIOMETRIC_HEART_RATE_ZONES,
  BIOMETRIC_LACTATE_THRESHOLD,
  BIOMETRIC_CRITICAL_SWIM_SPEED,
  BIOMETRIC_STATS_FTP,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for lactate-threshold: /biometric-service/biometric/latestLactateThreshold */
export function lactateThresholdPath(): string {
  return BIOMETRIC_LACTATE_THRESHOLD;
}

/** Path for ftp: /biometric-service/biometric/latestFunctionalThresholdPower/CYCLING */
export function ftpPath(): string {
  return `${BIOMETRIC}/latestFunctionalThresholdPower/CYCLING`;
}

/** Path for ftp stats range: /biometric-service/stats/functionalThresholdPower/range/{start}/{end} */
export function ftpRangePath(start: string, end: string): string {
  return `${BIOMETRIC_STATS_FTP}/${start}/${end}`;
}

/** Path for hr-zones: /biometric-service/heartRateZones */
export function hrZonesPath(): string {
  return BIOMETRIC_HEART_RATE_ZONES;
}

/** Path for power-weight: /biometric-service/stats/powerWeight */
export function powerWeightPath(): string {
  return `${BIOMETRIC}/stats/powerWeight`;
}

/** Path for critical-swim-speed: /biometric-service/criticalSwimSpeed/latest/{date} */
export function criticalSwimSpeedPath(date: string): string {
  return `${BIOMETRIC_CRITICAL_SWIM_SPEED}/${date}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** biometric lactate-threshold */
async function lactateThresholdAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('biometric lactate-threshold');

  const path = lactateThresholdPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** biometric ftp */
async function ftpAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('biometric ftp');

  const path = ftpPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** biometric hr-zones */
async function hrZonesAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('biometric hr-zones');

  const path = hrZonesPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** biometric power-weight */
async function powerWeightAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('biometric power-weight');

  const path = powerWeightPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** biometric critical-swim-speed [date] */
async function criticalSwimSpeedAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('biometric critical-swim-speed', { date });

  const path = criticalSwimSpeedPath(date);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the biometric command group and all subcommands.
 */
export function registerBiometricSubcommands(biometricCmd: Command): void {
  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  biometricCmd
    .command('lactate-threshold')
    .description('lactate threshold')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await lactateThresholdAction(getJsonMode(program));
    });

  biometricCmd
    .command('ftp')
    .description('functional threshold power (FTP) for cycling')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await ftpAction(getJsonMode(program));
    });

  biometricCmd
    .command('hr-zones')
    .description('heart rate zones')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await hrZonesAction(getJsonMode(program));
    });

  biometricCmd
    .command('power-weight')
    .description('power-to-weight ratio')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await powerWeightAction(getJsonMode(program));
    });

  biometricCmd
    .command('critical-swim-speed')
    .description('critical swim speed')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await criticalSwimSpeedAction(dateArg, getJsonMode(program));
    });
}