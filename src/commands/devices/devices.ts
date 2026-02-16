/**
 * Devices command group: Garmin device management.
 * garmin devices <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate, getWeekRange } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import {
  DEVICE_LIST,
  DEVICE_SERVICE,
  DEVICE_PRIMARY,
  DEVICE_SOLAR,
  DEVICE_MY_LAST_USED,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for list: /device-service/deviceregistration/devices */
export function devicesListPath(): string {
  return DEVICE_LIST;
}

/** Path for settings: /device-service/deviceservice/user-device/{id} */
export function deviceSettingsPath(deviceId: string | number): string {
  return `${DEVICE_SERVICE}/user-device/${deviceId}`;
}

/** Path for primary: /web-gateway/device-info/primary-training-device */
export function primaryDevicePath(): string {
  return DEVICE_PRIMARY;
}

/** Path for solar: /web-gateway/solar/{deviceId}/{startDate}/{endDate} */
export function deviceSolarPath(deviceId: string | number, startDate: string, endDate: string): string {
  return `${DEVICE_SOLAR}/${deviceId}/${startDate}/${endDate}`;
}

/** Path for last-used: /device-service/deviceservice/mylastused */
export function lastUsedDevicePath(): string {
  return DEVICE_MY_LAST_USED;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** devices list */
async function listAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('devices list');

  const path = devicesListPath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** devices settings [device-id] */
async function settingsAction(deviceId: string | undefined, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);

  if (!deviceId) {
    // If device-id is not specified, get the list and use the first one
    const list = (await client.connectapi(devicesListPath())) as Array<{ deviceId?: number }> | null;
    if (!list || list.length === 0) {
      throw new Error('No devices found');
    }
    deviceId = String(list[0].deviceId);
    debug('devices settings auto-selected device', { deviceId });
  }

  debug('devices settings', { deviceId });
  const path = deviceSettingsPath(deviceId);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** devices primary */
async function primaryAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('devices primary');

  const path = primaryDevicePath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** devices solar [device-id] */
async function solarAction(deviceId: string | undefined, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);

  if (!deviceId) {
    // If device-id is not specified, get the list and use the first solar-capable device
    const list = (await client.connectapi(devicesListPath())) as Array<{ deviceId?: number; solarCapable?: boolean }> | null;
    if (!list || list.length === 0) {
      throw new Error('No devices found');
    }
    const solarDevice = list.find(d => d.solarCapable);
    if (!solarDevice) {
      throw new Error('No solar-capable devices found');
    }
    deviceId = String(solarDevice.deviceId);
    debug('devices solar auto-selected device', { deviceId });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { fromDate, untilDate } = getWeekRange(today);
  debug('devices solar', { deviceId, fromDate, untilDate });

  const path = deviceSolarPath(deviceId, fromDate, untilDate);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** devices last-used */
async function lastUsedAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('devices last-used');

  const path = lastUsedDevicePath();
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the devices command group and all subcommands.
 */
export function registerDevicesSubcommands(devicesCmd: Command): void {
  devicesCmd
    .command('list')
    .description('list of devices')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await listAction(getJsonMode(program));
    });

  devicesCmd
    .command('settings')
    .description('device settings')
    .argument('[device-id]', 'device ID (defaults to first device)')
    .action(async (deviceId: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await settingsAction(deviceId, getJsonMode(program));
    });

  devicesCmd
    .command('primary')
    .description('primary training device')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await primaryAction(getJsonMode(program));
    });

  devicesCmd
    .command('solar')
    .description('solar charging data')
    .argument('[device-id]', 'device ID (defaults to first solar-capable device)')
    .action(async (deviceId: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await solarAction(deviceId, getJsonMode(program));
    });

  devicesCmd
    .command('last-used')
    .description('last used device')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await lastUsedAction(getJsonMode(program));
    });
}