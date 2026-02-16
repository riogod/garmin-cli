/**
 * Activities command group: list, get, count, types, splits, details, download, upload, delete, fordate.
 * garmin activities <subcommand> [options]
 */

import type { Command } from 'commander';
import { createWriteStream, existsSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/client.js';
import {
  ACTIVITYLIST_SEARCH,
  ACTIVITYLIST_COUNT,
  ACTIVITY_SERVICE,
  ACTIVITY_TYPES,
  DOWNLOAD_FIT,
  DOWNLOAD_TCX,
  DOWNLOAD_GPX,
  DOWNLOAD_KML,
  DOWNLOAD_CSV,
  UPLOAD,
  ACTIVITYLIST_FOR_DAILY_SUMMARY,
  USERPROFILE_SOCIAL,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

/** Maximum limit for activity list. */
const MAX_ACTIVITY_LIMIT = 1000;

/** Formats for downloading activity. */
type DownloadFormat = 'fit' | 'tcx' | 'gpx' | 'kml' | 'csv';

/** Formats for uploading activity. */
type UploadFormat = 'fit' | 'gpx' | 'tcx';

/** MIME types for file upload. */
export const UPLOAD_MIME_TYPES: Record<UploadFormat, string> = {
  fit: 'application/vnd.ant.fit',
  gpx: 'application/gpx+xml',
  tcx: 'application/vnd.garmin.tcx+xml',
};

// ─── API paths ─────────────────────────────────────────────────────────────

export function activitiesListPath(start: number, limit: number, activityType?: string, subActivityType?: string): string {
  const params = new URLSearchParams({
    start: String(start),
    limit: String(Math.min(limit, MAX_ACTIVITY_LIMIT)),
  });
  if (activityType) params.set('activityType', activityType);
  if (subActivityType) params.set('subActivityType', subActivityType);
  return `${ACTIVITYLIST_SEARCH}?${params.toString()}`;
}

export function activityPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}`;
}

export function activitySplitsPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/splits`;
}

export function activityTypedSplitsPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/typedsplits`;
}

export function activitySplitSummariesPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/split_summaries`;
}

export function activityWeatherPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/weather`;
}

export function activityDetailsPath(activityId: string | number, maxChartSize = 2000, maxPolylineSize = 4000): string {
  const params = new URLSearchParams({
    maxChartSize: String(maxChartSize),
    maxPolylineSize: String(maxPolylineSize),
  });
  return `${ACTIVITY_SERVICE}/${activityId}/details?${params.toString()}`;
}

export function activityHrZonesPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/hrTimeInZones`;
}

export function activityPowerZonesPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/powerTimeInZones`;
}

export function activityExerciseSetsPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/exerciseSets`;
}

export function activityGearPath(activityId: string | number): string {
  return `${ACTIVITY_SERVICE}/${activityId}/gear?activityId=${activityId}`;
}

export function downloadPath(activityId: string | number, format: DownloadFormat): string {
  const paths: Record<DownloadFormat, string> = {
    fit: `${DOWNLOAD_FIT}/${activityId}`,
    tcx: `${DOWNLOAD_TCX}/${activityId}`,
    gpx: `${DOWNLOAD_GPX}/${activityId}`,
    kml: `${DOWNLOAD_KML}/${activityId}`,
    csv: `${DOWNLOAD_CSV}/${activityId}`,
  };
  return paths[format];
}

export function activitiesForDatePath(displayName: string, date: string): string {
  const params = new URLSearchParams({ calendarDate: date });
  return `${ACTIVITYLIST_FOR_DAILY_SUMMARY}/${encodeURIComponent(displayName)}?${params.toString()}`;
}

// ─── Actions ───────────────────────────────────────────────────────────────

/**
 * activities list [start] [limit] [activityType] [subActivityType]
 * List activities with pagination and filtering.
 */
async function listAction(
  startStr: string | undefined,
  limitStr: string | undefined,
  activityType: string | undefined,
  subActivityType: string | undefined,
  jsonMode: boolean
): Promise<void> {
  const start = startStr ? parseInt(startStr, 10) : 0;
  const limit = limitStr ? parseInt(limitStr, 10) : 20;

  if (isNaN(start) || start < 0) {
    throw new Error('start must be a non-negative integer');
  }
  if (isNaN(limit) || limit < 1) {
    throw new Error('limit must be a positive integer');
  }
  if (limit > MAX_ACTIVITY_LIMIT) {
    throw new Error(`limit cannot exceed ${MAX_ACTIVITY_LIMIT}`);
  }

  const config = loadConfig();
  const client = await GarminClient.create(config);
  const path = activitiesListPath(start, limit, activityType, subActivityType);
  debug('activities list', { start, limit, activityType, subActivityType, path });

  const data = await client.connectapi(path);
  print((data ?? []) as Record<string, unknown>, jsonMode);
}

/**
 * activities get <activity-id>
 * Get activity details by ID.
 */
async function getAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities get', { activityId });

  const data = await client.connectapi(activityPath(activityId));
  if (!data) {
    throw new Error(`Activity ${activityId} not found`);
  }
  print(data as Record<string, unknown>, jsonMode);
}

/**
 * activities count
 * Get total activity count.
 */
async function countAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities count');

  const data = await client.connectapi(ACTIVITYLIST_COUNT);
  if (!data || typeof data !== 'object') {
    throw new Error('Failed to get activity count');
  }
  print(data as Record<string, unknown>, jsonMode);
}

/**
 * activities types
 * Get list of activity types.
 */
async function typesAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities types');

  const data = await client.connectapi(ACTIVITY_TYPES);
  print((data ?? []) as Record<string, unknown>, jsonMode);
}

/**
 * activities splits <activity-id>
 * Get activity splits.
 */
async function splitsAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities splits', { activityId });

  const data = await client.connectapi(activitySplitsPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities typedsplits <activity-id>
 * Get activity typed splits.
 */
async function typedSplitsAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities typedsplits', { activityId });

  const data = await client.connectapi(activityTypedSplitsPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities split-summaries <activity-id>
 * Get activity split summaries.
 */
async function splitSummariesAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities split-summaries', { activityId });

  const data = await client.connectapi(activitySplitSummariesPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities weather <activity-id>
 * Get activity weather data.
 */
async function weatherAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities weather', { activityId });

  const data = await client.connectapi(activityWeatherPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities details <activity-id>
 * Get activity details data (with chart and polyline).
 */
async function detailsAction(
  activityId: string,
  maxChartSize: number,
  maxPolylineSize: number,
  jsonMode: boolean
): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities details', { activityId, maxChartSize, maxPolylineSize });

  const data = await client.connectapi(activityDetailsPath(activityId, maxChartSize, maxPolylineSize));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities hr-zones <activity-id>
 * Get heart rate time in zones for activity.
 */
async function hrZonesAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities hr-zones', { activityId });

  const data = await client.connectapi(activityHrZonesPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities power-zones <activity-id>
 * Get power time in zones for activity.
 */
async function powerZonesAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities power-zones', { activityId });

  const data = await client.connectapi(activityPowerZonesPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities exercise-sets <activity-id>
 * Get exercise sets for strength activity.
 */
async function exerciseSetsAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities exercise-sets', { activityId });

  const data = await client.connectapi(activityExerciseSetsPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities gear <activity-id>
 * Get gear used in activity.
 */
async function gearAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities gear', { activityId });

  const data = await client.connectapi(activityGearPath(activityId));
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities download <activity-id> [format]
 * Download activity in specified format (fit, tcx, gpx, kml, csv).
 */
async function downloadAction(
  activityId: string,
  format: DownloadFormat,
  outputPath: string | undefined,
  jsonMode: boolean
): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities download', { activityId, format, outputPath });

  const validFormats: DownloadFormat[] = ['fit', 'tcx', 'gpx', 'kml', 'csv'];
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid format "${format}". Valid formats: ${validFormats.join(', ')}`);
  }

  const path = downloadPath(activityId, format);
  const buffer = await client.download(path);

  // If path is specified — save to file
  if (outputPath) {
    const fullPath = resolve(outputPath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`);
    }
    const writeStream = createWriteStream(fullPath);
    writeStream.write(buffer);
    writeStream.end();
    if (jsonMode) {
      console.log(JSON.stringify({ success: true, path: fullPath, size: buffer.length }));
    } else {
      console.log(`Saved: ${fullPath} (${buffer.length} bytes)`);
    }
    return;
  }

  // Otherwise output to stdout (binary or base64 for JSON)
  if (jsonMode) {
    console.log(JSON.stringify({ data: buffer.toString('base64'), format, size: buffer.length }));
  } else {
    // For binary formats output to stdout as-is
    process.stdout.write(buffer);
  }
}

/**
 * activities upload <file>
 * Upload activity file (fit, gpx, tcx).
 */
async function uploadAction(filePath: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities upload', { filePath });

  // Check file
  const fullPath = resolve(filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const stats = statSync(fullPath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${fullPath}`);
  }

  // Determine format by extension
  const ext = basename(fullPath).split('.').pop()?.toLowerCase();
  const validFormats: UploadFormat[] = ['fit', 'gpx', 'tcx'];
  if (!ext || !validFormats.includes(ext as UploadFormat)) {
    throw new Error(`Invalid file format ".${ext}". Valid formats: ${validFormats.join(', ')}`);
  }

  // Read file
  const { default: fs } = await import('node:fs/promises');
  const fileBuffer = await fs.readFile(fullPath);
  const fileName = basename(fullPath);
  const mimeType = UPLOAD_MIME_TYPES[ext as UploadFormat];

  // Build multipart/form-data
  const boundary = `----GarminCLI${Date.now()}`;
  const boundaryBuffer = Buffer.from(`--${boundary}\r\n`);
  const contentDisposition = Buffer.from(
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`
  );
  const contentType = Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`);
  const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`);

  const multipartBuffer = Buffer.concat([
    boundaryBuffer,
    contentDisposition,
    contentType,
    fileBuffer,
    endBoundary,
  ]);

  // Send request
  const result = await client.connectapi(UPLOAD, 'POST', {
    _multipart: multipartBuffer,
    _contentType: `multipart/form-data; boundary=${boundary}`,
  });

  print((result ?? {}) as Record<string, unknown>, jsonMode);
}

/**
 * activities delete <activity-id>
 * Delete activity by ID.
 */
async function deleteAction(activityId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities delete', { activityId });

  await client.connectapi(activityPath(activityId), 'DELETE');

  if (jsonMode) {
    console.log(JSON.stringify({ success: true, activityId }));
  } else {
    console.log(`Activity ${activityId} deleted`);
  }
}

/**
 * activities fordate [date]
 * Get activities for specified date.
 */
async function forDateAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('activities fordate', { date });

  // Get displayName from profile
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const displayName = profile?.displayName ?? profile?.displayname;
  if (typeof displayName !== 'string' || !displayName.trim()) {
    throw new Error('Failed to get displayName from Garmin Connect profile');
  }

  const path = activitiesForDatePath(displayName.trim(), date);
  const data = await client.connectapi(path);
  print((data ?? []) as Record<string, unknown>, jsonMode);
}

// ─── Extended multipart support for client ─────────────────────────────────

declare module '../../garmin/client.js' {
  interface GarminClient {
    connectapi(
      path: string,
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
      body?: Record<string, unknown> | string
    ): Promise<unknown>;
  }
}

// Extend client to support multipart upload
// This will be handled in client.connectapi via special _multipart field
function setupMultipartSupport(): void {
  // File upload will use special field in body
  // See implementation in client.ts
}

// ─── Command registration ──────────────────────────────────────────────────

/**
 * Registers all activities subcommands.
 */
export function registerActivitiesSubcommands(cmd: Command): void {
  setupMultipartSupport();

  // activities list [start] [limit] [activityType] [subActivityType]
  cmd
    .command('list')
    .description('list activities (pagination: start, limit; filter: activityType, subActivityType)')
    .argument('[start]', 'offset (default 0)', '0')
    .argument('[limit]', 'count (default 20, max 1000)', '20')
    .option('-t, --activity-type <type>', 'filter by activity type')
    .option('-s, --sub-activity-type <type>', 'filter by sub-activity type')
    .action(async (start: string, limit: string, options: { activityType?: string; subActivityType?: string }) => {
      await listAction(start, limit, options.activityType, options.subActivityType, getJsonMode(cmd));
    });

  // activities get <activity-id>
  cmd
    .command('get <activity-id>')
    .description('get activity details by ID')
    .action(async (activityId: string) => {
      await getAction(activityId, getJsonMode(cmd));
    });

  // activities count
  cmd
    .command('count')
    .description('total activity count')
    .action(async () => {
      await countAction(getJsonMode(cmd));
    });

  // activities types
  cmd
    .command('types')
    .description('list activity types')
    .action(async () => {
      await typesAction(getJsonMode(cmd));
    });

  // activities splits <activity-id>
  cmd
    .command('splits <activity-id>')
    .description('activity splits')
    .action(async (activityId: string) => {
      await splitsAction(activityId, getJsonMode(cmd));
    });

  // activities typedsplits <activity-id>
  cmd
    .command('typedsplits <activity-id>')
    .description('activity typed splits')
    .action(async (activityId: string) => {
      await typedSplitsAction(activityId, getJsonMode(cmd));
    });

  // activities split-summaries <activity-id>
  cmd
    .command('split-summaries <activity-id>')
    .description('activity split summaries')
    .action(async (activityId: string) => {
      await splitSummariesAction(activityId, getJsonMode(cmd));
    });

  // activities weather <activity-id>
  cmd
    .command('weather <activity-id>')
    .description('activity weather data')
    .action(async (activityId: string) => {
      await weatherAction(activityId, getJsonMode(cmd));
    });

  // activities details <activity-id>
  cmd
    .command('details <activity-id>')
    .description('activity details data (chart, polyline)')
    .option('--max-chart-size <size>', 'maximum chart size', '2000')
    .option('--max-polyline-size <size>', 'maximum polyline size', '4000')
    .action(async (activityId: string, options: { maxChartSize: string; maxPolylineSize: string }) => {
      const maxChartSize = parseInt(options.maxChartSize, 10) || 2000;
      const maxPolylineSize = parseInt(options.maxPolylineSize, 10) || 4000;
      await detailsAction(activityId, maxChartSize, maxPolylineSize, getJsonMode(cmd));
    });

  // activities hr-zones <activity-id>
  cmd
    .command('hr-zones <activity-id>')
    .description('heart rate time in zones')
    .action(async (activityId: string) => {
      await hrZonesAction(activityId, getJsonMode(cmd));
    });

  // activities power-zones <activity-id>
  cmd
    .command('power-zones <activity-id>')
    .description('power time in zones')
    .action(async (activityId: string) => {
      await powerZonesAction(activityId, getJsonMode(cmd));
    });

  // activities exercise-sets <activity-id>
  cmd
    .command('exercise-sets <activity-id>')
    .description('exercise sets (for strength activities)')
    .action(async (activityId: string) => {
      await exerciseSetsAction(activityId, getJsonMode(cmd));
    });

  // activities gear <activity-id>
  cmd
    .command('gear <activity-id>')
    .description('gear used in activity')
    .action(async (activityId: string) => {
      await gearAction(activityId, getJsonMode(cmd));
    });

  // activities download <activity-id> [format] [output]
  cmd
    .command('download <activity-id>')
    .description('download activity (format: fit, tcx, gpx, kml, csv)')
    .argument('[format]', 'file format (fit, tcx, gpx, kml, csv)', 'fit')
    .option('-o, --output <path>', 'path to save file')
    .action(async (activityId: string, format: string, options: { output?: string }) => {
      await downloadAction(activityId, format as DownloadFormat, options.output, getJsonMode(cmd));
    });

  // activities upload <file>
  cmd
    .command('upload <file>')
    .description('upload activity file (fit, gpx, tcx)')
    .action(async (filePath: string) => {
      await uploadAction(filePath, getJsonMode(cmd));
    });

  // activities delete <activity-id>
  cmd
    .command('delete <activity-id>')
    .description('delete activity')
    .action(async (activityId: string) => {
      await deleteAction(activityId, getJsonMode(cmd));
    });

  // activities fordate [date]
  cmd
    .command('fordate [date]')
    .description('activities for date (format YYYY-MM-DD, default today)')
    .action(async (dateStr: string | undefined) => {
      await forDateAction(dateStr, getJsonMode(cmd));
    });
}