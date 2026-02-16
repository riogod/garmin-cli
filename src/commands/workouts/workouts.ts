/**
 * Workouts command group: workout management.
 * garmin workouts <subcommand> [options]
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient } from '../../garmin/index.js';
import { WORKOUT_SERVICE, WORKOUT_SCHEDULE } from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Path builders (exported for testing) ────────────────────────────────────

/** Path for list: /workout-service/workouts?start={start}&limit={limit} */
export function workoutsListPath(start = 0, limit = 50): string {
  const params = new URLSearchParams({ start: String(start), limit: String(limit) });
  return `${WORKOUT_SERVICE}/workouts?${params.toString()}`;
}

/** Path for get: /workout-service/workout/{id} */
export function workoutGetPath(workoutId: string | number): string {
  return `${WORKOUT_SERVICE}/workout/${workoutId}`;
}

/** Path for download: /workout-service/workout/FIT/{id} */
export function workoutDownloadPath(workoutId: string | number): string {
  return `${WORKOUT_SERVICE}/workout/FIT/${workoutId}`;
}

/** Path for create: /workout-service/workout */
export function workoutCreatePath(): string {
  return `${WORKOUT_SERVICE}/workout`;
}

/** Path for delete: /workout-service/workout/{id} */
export function workoutDeletePath(workoutId: string | number): string {
  return `${WORKOUT_SERVICE}/workout/${workoutId}`;
}

/** Path for schedule: /workout-service/schedule/{workoutId} */
export function workoutSchedulePath(workoutId: string | number): string {
  return `${WORKOUT_SCHEDULE}/${workoutId}`;
}

/** Path for unschedule: /workout-service/schedule/{scheduleId} */
export function workoutUnschedulePath(scheduleId: string | number): string {
  return `${WORKOUT_SCHEDULE}/${scheduleId}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** workouts list [start] [limit] */
async function listAction(start: string | undefined, limit: string | undefined, jsonMode: boolean): Promise<void> {
  const startNum = start ? parseInt(start, 10) : 0;
  const limitNum = limit ? parseInt(limit, 10) : 50;

  if (isNaN(startNum) || isNaN(limitNum)) {
    throw new Error('start and limit must be numbers');
  }

  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts list', { start: startNum, limit: limitNum });

  const path = workoutsListPath(startNum, limitNum);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** workouts get <id> */
async function getAction(workoutId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts get', { workoutId });

  const path = workoutGetPath(workoutId);
  const data = await client.connectapi(path);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}

/** workouts download <id> */
async function downloadAction(workoutId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts download', { workoutId });

  const path = workoutDownloadPath(workoutId);
  const buffer = await client.download(path);

  // Output base64 in JSON or binary data to stdout
  if (jsonMode) {
    print({
      workoutId,
      format: 'fit',
      size: buffer.length,
      data: buffer.toString('base64'),
    } as Record<string, unknown>, true);
  } else {
    process.stdout.write(buffer);
  }
}

/** workouts delete <id> */
async function deleteAction(workoutId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts delete', { workoutId });

  const path = workoutDeletePath(workoutId);
  await client.connectapi(path, 'DELETE');
  print({ success: true, workoutId } as Record<string, unknown>, jsonMode);
}

/** workouts schedule <id> <date> */
async function scheduleAction(workoutId: string, dateStr: string, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts schedule', { workoutId, date });

  const path = workoutSchedulePath(workoutId);
  const body = { date };
  const data = await client.connectapi(path, 'POST', body);
  print((data ?? { success: true, workoutId, date }) as Record<string, unknown>, jsonMode);
}

/** workouts unschedule <scheduleId> */
async function unscheduleAction(scheduleId: string, jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts unschedule', { scheduleId });

  const path = workoutUnschedulePath(scheduleId);
  await client.connectapi(path, 'DELETE');
  print({ success: true, scheduleId } as Record<string, unknown>, jsonMode);
}

/** workouts create - reads JSON from stdin */
async function createAction(jsonMode: boolean): Promise<void> {
  const config = loadConfig();
  const client = await GarminClient.create(config);
  debug('workouts create from stdin');

  // Read JSON from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks).toString('utf-8');

  let workoutData: unknown;
  try {
    workoutData = JSON.parse(input);
  } catch {
    throw new Error('Invalid JSON on stdin');
  }

  const path = workoutCreatePath();
  const data = await client.connectapi(path, 'POST', workoutData as Record<string, unknown>);
  print((data ?? { success: true }) as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the workouts command group and all subcommands.
 */
export function registerWorkoutsSubcommands(workoutsCmd: Command): void {
  workoutsCmd
    .command('list')
    .description('list workouts')
    .argument('[start]', 'offset (default 0)')
    .argument('[limit]', 'count (default 50)')
    .action(async (start: string | undefined, limit: string | undefined, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await listAction(start, limit, getJsonMode(program));
    });

  workoutsCmd
    .command('get')
    .description('get workout by ID')
    .argument('<workout-id>', 'workout ID')
    .action(async (workoutId: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await getAction(workoutId, getJsonMode(program));
    });

  workoutsCmd
    .command('download')
    .description('download workout in FIT format')
    .argument('<workout-id>', 'workout ID')
    .action(async (workoutId: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await downloadAction(workoutId, getJsonMode(program));
    });

  workoutsCmd
    .command('delete')
    .description('delete workout')
    .argument('<workout-id>', 'workout ID')
    .action(async (workoutId: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await deleteAction(workoutId, getJsonMode(program));
    });

  workoutsCmd
    .command('schedule')
    .description('schedule workout for a date')
    .argument('<workout-id>', 'workout ID')
    .argument('<date>', 'date in YYYY-MM-DD format')
    .action(async (workoutId: string, date: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await scheduleAction(workoutId, date, getJsonMode(program));
    });

  workoutsCmd
    .command('unschedule')
    .description('cancel scheduled workout')
    .argument('<schedule-id>', 'schedule ID')
    .action(async (scheduleId: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await unscheduleAction(scheduleId, getJsonMode(program));
    });

  workoutsCmd
    .command('create')
    .description('create workout from JSON (stdin)')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      await createAction(getJsonMode(program));
    });
}