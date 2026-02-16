/**
 * Wellness command group: stress, Body Battery, heart-rate, SpO2, respiration,
 * intensity-minutes, floors, daily-summary, RHR.
 * garmin wellness <subcommand> [date]
 * Date in YYYY-MM-DD format; defaults to today.
 *
 * Garmin Connect wellness API requires displayName in path (per python-garminconnect):
 * path like .../dailyHeartRate/{displayName}?date=YYYY-MM-DD; for floors - date in path.
 */

import type { Command } from 'commander';
import { loadConfig } from '../../lib/config.js';
import { print } from '../../lib/output.js';
import { parseDate, getWeekRange } from '../../lib/date.js';
import { debug } from '../../lib/debug.js';
import { GarminClient, USERPROFILE_SOCIAL } from '../../garmin/index.js';
import {
  WELLNESS_DAILY_STRESS,
  WELLNESS_BODY_BATTERY_DAILY,
  WELLNESS_BODY_BATTERY_EVENTS,
  WELLNESS_DAILY_HEART_RATE,
  WELLNESS_DAILY_SPO2,
  WELLNESS_DAILY_RESPIRATION,
  WELLNESS_DAILY_IM,
  WELLNESS_FLOORS_DAILY,
  WELLNESS_DAILY_SUMMARY_CHART,
  WELLNESS_DAILY_EVENTS,
  WELLNESS_SPO2_ACCLIMATION,
  WELLNESS_STATS_ACCLIMATION,
  USERSTATS_WELLNESS_DAILY,
  USERSUMMARY_STATS_BODYBATTERY_DAILY,
} from '../../garmin/endpoints.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

/**
 * API path with displayName in path and date query parameter (wellness-service).
 */
function pathWithDisplayNameAndDate(base: string, displayName: string, date: string): string {
  const q = new URLSearchParams({ date });
  const encoded = encodeURIComponent(displayName);
  return `${base}/${encoded}?${q.toString()}`;
}

/**
 * API path with date in path segment (floors: .../daily/{date}; stress: .../dailyStress/{date}).
 */
function pathWithDateSegment(base: string, date: string): string {
  return `${base}/${date}`;
}

type WellnessPathFn = (date: string, displayName: string) => string;

type WellnessAction = (dateStr: string | undefined, jsonMode: boolean) => Promise<void>;

/** Copies only specified keys from object (per docs/wellness-commands.md). */
function pick<T extends Record<string, unknown>>(obj: T | null | undefined, keys: string[]): Record<string, unknown> {
  if (obj == null || typeof obj !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

/** Keys by schema (docs/wellness-commands.md). */
const SCHEMA_KEYS = {
  stress: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT',
    'startTimestampLocal', 'endTimestampLocal', 'maxStressLevel', 'avgStressLevel',
    'stressChartValueOffset', 'stressChartYAxisOrigin', 'stressValueDescriptorsDTOList', 'stressValuesArray',
  ],
  heartRate: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT',
    'startTimestampLocal', 'endTimestampLocal', 'maxHeartRate', 'minHeartRate', 'restingHeartRate',
    'lastSevenDaysAvgRestingHeartRate', 'heartRateValueDescriptors', 'heartRateValues',
  ],
  spo2: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT', 'startTimestampLocal', 'endTimestampLocal',
    'averageSpO2', 'lowestSpO2', 'lastSevenDaysAvgSpO2', 'latestSpO2', 'avgSleepSpO2',
    'spO2ValueDescriptorsDTOList', 'spO2SingleValues', 'spO2HourlyAverages',
  ],
  respiration: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT', 'startTimestampLocal', 'endTimestampLocal',
    'lowestRespirationValue', 'highestRespirationValue', 'avgWakingRespirationValue', 'avgSleepRespirationValue',
    'respirationValueDescriptorsDTOList', 'respirationValuesArray',
  ],
  intensityMinutes: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT', 'startTimestampLocal', 'endTimestampLocal',
    'weeklyModerate', 'weeklyVigorous', 'weeklyTotal', 'weekGoal', 'dayOfGoalMet',
    'startDayMinutes', 'endDayMinutes', 'moderateMinutes', 'vigorousMinutes', 'imValueDescriptorsDTOList', 'imValuesArray',
  ],
  floors: [
    'startTimestampGMT', 'endTimestampGMT', 'startTimestampLocal', 'endTimestampLocal',
    'floorsValueDescriptorDTOList', 'floorValuesArray',
  ],
  rhr: ['userProfileId', 'statisticsStartDate', 'statisticsEndDate', 'allMetrics'],
  spo2Acclimation: [
    'userProfilePK', 'calendarDate', 'startTimestampGMT', 'endTimestampGMT', 'startTimestampLocal', 'endTimestampLocal',
    'averageSpO2', 'lowestSpO2', 'lastSevenDaysAvgSpO2', 'latestSpO2', 'avgSleepSpO2',
    'spO2ValueDescriptorsDTOList', 'spO2HourlyAveragesDescriptorList', 'spO2HourlyAverages',
    'monitoringEnvironmentValueDescriptorList', 'monitoringEnvironmentValues',
  ],
  acclimation: [
    'userProfilePk', 'overallSpo2Average', 'spo2AccValueDescriptorList', 'spo2HourlyAverageArray',
    'spo2DailyAcclimationAverageDescriptorList', 'spo2DailyAverageArray',
    'monitoringEnvironmentValueDescriptorList', 'monitoringEnvironmentValuesArray',
  ],
} as const;

/** Body-battery item fields (excluded: averageStress, stressValueDescriptorsDTOList, stressValuesArray). */
const BODY_BATTERY_ITEM_KEYS = ['event', 'bodyBatteryValueDescriptorsDTOList', 'bodyBatteryValuesArray'];
const BODY_BATTERY_EVENT_KEYS = ['eventType', 'eventStartTimeGmt', 'durationInMilliseconds', 'bodyBatteryImpact', 'feedbackType'];
const DAILY_SUMMARY_ITEM_KEYS = ['startGMT', 'endGMT', 'steps', 'pushes', 'primaryActivityLevel', 'activityLevelConstant'];

function shapeBodyBatteryItem(item: Record<string, unknown>): Record<string, unknown> {
  const out = pick(item, BODY_BATTERY_ITEM_KEYS);
  if (out.event && typeof out.event === 'object' && out.event !== null) {
    out.event = pick(out.event as Record<string, unknown>, BODY_BATTERY_EVENT_KEYS);
  }
  return out;
}

function shapeDailySummaryItem(item: Record<string, unknown>): Record<string, unknown> {
  return pick(item, DAILY_SUMMARY_ITEM_KEYS);
}

/** Shape object by key list (for --json). */
function shapeObject(keys: readonly string[]): (data: unknown) => Record<string, unknown> {
  return (data: unknown) =>
    pick(data != null && typeof data === 'object' ? (data as Record<string, unknown>) : {}, [...keys]);
}

/** Shape array by shaping each item. */
function shapeArray(shapeItem: (item: Record<string, unknown>) => Record<string, unknown>) {
  return (data: unknown): unknown[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) =>
      shapeItem(item != null && typeof item === 'object' ? (item as Record<string, unknown>) : {}),
    );
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUserGuid(profile: Record<string, unknown> | null): string | undefined {
  if (!profile) return undefined;
  const raw =
    profile.userId ?? profile.userProfileId ?? profile.profileId ?? profile.id;
  const s = typeof raw === 'string' ? raw.trim() : '';
  return UUID_REGEX.test(s) ? s : undefined;
}

/**
 * Returns displayName from social profile.
 */
async function getDisplayName(client: GarminClient): Promise<string> {
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const name = profile?.displayName ?? profile?.displayname;
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Could not get displayName from Garmin Connect profile');
  }
  return name.trim();
}

/**
 * Returns social profile with displayName and optionally userGuid (UUID).
 * Used for body-battery, where some APIs require userGuid.
 */
function parseUserProfilePk(profile: Record<string, unknown> | null): number | undefined {
  if (!profile) return undefined;
  const raw = profile.userProfilePk ?? profile.profileId ?? profile.userId;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return undefined;
}

async function getWellnessProfile(client: GarminClient): Promise<{
  displayName: string;
  userGuid: string | undefined;
  userProfilePk: number | undefined;
}> {
  const profile = (await client.connectapi(USERPROFILE_SOCIAL)) as Record<string, unknown> | null;
  const name = profile?.displayName ?? profile?.displayname;
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Could not get displayName from Garmin Connect profile');
  }
  return {
    displayName: name.trim(),
    userGuid: parseUserGuid(profile),
    userProfilePk: parseUserProfilePk(profile),
  };
}

/**
 * Creates action for wellness subcommand: gets displayName, builds path and calls API.
 * With jsonMode and provided shape, response is trimmed per schema (docs/wellness-commands.md).
 */
function makeWellnessAction(
  pathFn: WellnessPathFn,
  shape?: (data: unknown) => unknown,
): WellnessAction {
  return async (dateStr: string | undefined, jsonMode: boolean): Promise<void> => {
    const date = parseDate(dateStr);
    const config = loadConfig();
    const client = await GarminClient.create(config);
    const displayName = await getDisplayName(client);
    const path = pathFn(date, displayName);
    let data: unknown = await client.connectapi(path);
    if (jsonMode && shape) data = shape(data ?? {});
    print((data ?? {}) as Record<string, unknown>, jsonMode);
  };
}

/**
 * Body Battery events path with date range (fromDate, toDate) - single day.
 */
function bodyBatteryEventsPath(date: string): string {
  const q = new URLSearchParams({ fromDate: date, toDate: date });
  return `${WELLNESS_BODY_BATTERY_EVENTS}?${q.toString()}`;
}

/** reports/daily path with calendarDate query (some APIs use calendarDate). */
function bodyBatteryDailyQueryPath(date: string, param: 'date' | 'calendarDate'): string {
  const q = new URLSearchParams({ [param]: date });
  return `${WELLNESS_BODY_BATTERY_DAILY}?${q.toString()}`;
}

/**
 * Path .../bodyBattery/daily/{date} (without "reports" segment).
 */
const WELLNESS_BODY_BATTERY_DAILY_ALT = '/wellness-service/wellness/bodyBattery/daily';

/**
 * userstats wellness/daily path with userGuid and metricId=41 (Body Battery). In HAR - weekly range (fromDate/untilDate).
 */
function bodyBatteryUserstatsPath(userGuid: string, date: string): string {
  const { fromDate, untilDate } = getWeekRange(date);
  const q = new URLSearchParams({ fromDate, untilDate, metricId: '41' });
  return `${USERSTATS_WELLNESS_DAILY}/${userGuid}?${q.toString()}`;
}

/**
 * usersummary stats/bodybattery/daily/{from}/{to} path. In HAR - weekly range (Mon-Sun).
 */
function bodyBatteryUsersummaryPath(date: string): string {
  const { fromDate, untilDate } = getWeekRange(date);
  return `${USERSUMMARY_STATS_BODYBATTERY_DAILY}/${fromDate}/${untilDate}`;
}

/** Extracts YYYY-MM-DD date from eventStartTimeGmt of body-battery item (before shaping). */
function getBodyBatteryEventStartDate(item: Record<string, unknown>): string | undefined {
  const event = item?.event;
  if (!event || typeof event !== 'object') return undefined;
  const start = (event as Record<string, unknown>).eventStartTimeGmt;
  if (typeof start !== 'string') return undefined;
  return start.slice(0, 10);
}

/**
 * Action for body-battery: tries API formats from HAR (connect.garmin.com) and previous variants.
 * With --debug logs each URL. At the end - fallback to dailySummaryChart.
 * Keeps only events with start date (eventStartTimeGmt) matching requested date.
 */
async function bodyBatteryAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const { displayName, userGuid } = await getWellnessProfile(client);

  const attempts: { name: string; path: string }[] = [
    { name: 'bodyBattery/events/{date} (HAR)', path: `${WELLNESS_BODY_BATTERY_EVENTS}/${date}` },
    { name: 'usersummary/stats/bodybattery/daily (HAR)', path: bodyBatteryUsersummaryPath(date) },
    ...(userGuid
      ? [{ name: 'userstats/wellness/daily metricId=41 (HAR)', path: bodyBatteryUserstatsPath(userGuid, date) }]
      : []),
    { name: 'reports/daily/{date}', path: pathWithDateSegment(WELLNESS_BODY_BATTERY_DAILY, date) },
    { name: 'bodyBattery/daily/{date}', path: pathWithDateSegment(WELLNESS_BODY_BATTERY_DAILY_ALT, date) },
    { name: 'reports/daily?date=', path: bodyBatteryDailyQueryPath(date, 'date') },
    { name: 'reports/daily?calendarDate=', path: bodyBatteryDailyQueryPath(date, 'calendarDate') },
    { name: 'events?fromDate&toDate', path: bodyBatteryEventsPath(date) },
    {
      name: 'reports/daily/{displayName}?date=',
      path: pathWithDisplayNameAndDate(WELLNESS_BODY_BATTERY_DAILY, displayName, date),
    },
  ];

  let lastErr: Error | null = null;
  for (const { name, path } of attempts) {
    debug(`body-battery try: ${name}`, path);
    try {
      let data: unknown = await client.connectapi(path);
      if (Array.isArray(data)) {
        const filtered = data.filter(
          (item) =>
            getBodyBatteryEventStartDate(
              item != null && typeof item === 'object' ? (item as Record<string, unknown>) : {},
            ) === date,
        );
        data = filtered.map((item) =>
          shapeBodyBatteryItem(item != null && typeof item === 'object' ? (item as Record<string, unknown>) : {}),
        );
      }
      print((data ?? {}) as Record<string, unknown>, jsonMode);
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Fallback: daily summary sometimes contains bodyBattery / bodyBatteryChart
  const summaryPath = pathWithDisplayNameAndDate(WELLNESS_DAILY_SUMMARY_CHART, displayName, date);
  debug('body-battery fallback: dailySummaryChart', summaryPath);
  try {
    const summary = (await client.connectapi(summaryPath)) as Record<string, unknown> | null;
    let bodyBatteryData: unknown =
      summary?.bodyBattery ?? summary?.bodyBatteryChart ?? summary?.bodyBatteryValues;
    if (bodyBatteryData != null && typeof bodyBatteryData === 'object') {
      if (Array.isArray(bodyBatteryData)) {
        const filtered = bodyBatteryData.filter(
          (item) =>
            getBodyBatteryEventStartDate(
              item != null && typeof item === 'object' ? (item as Record<string, unknown>) : {},
            ) === date,
        );
        bodyBatteryData = filtered.map((item) =>
          shapeBodyBatteryItem(item != null && typeof item === 'object' ? (item as Record<string, unknown>) : {}),
        );
      }
      print(bodyBatteryData as Record<string, unknown>, jsonMode);
      return;
    }
  } catch {
    // ignore, throw last error from main attempts
  }

  throw lastErr ?? new Error('Body Battery: all request variants failed');
}

/**
 * Endpoints with date in path (without displayName): stress, bodyBattery, spo2, respiration, im.
 * Others - with displayName in path and date query (heartRate, dailySummary, rhr) or date only (floors).
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- path fn (date, displayName) - displayName not needed for some endpoints */
export const wellnessApiPaths = {
  stress: (date: string, _displayName: string) =>
    pathWithDateSegment(WELLNESS_DAILY_STRESS, date),
  bodyBattery: (date: string, displayName: string) =>
    pathWithDisplayNameAndDate(WELLNESS_BODY_BATTERY_DAILY, displayName, date),
  heartRate: (date: string, displayName: string) =>
    pathWithDisplayNameAndDate(WELLNESS_DAILY_HEART_RATE, displayName, date),
  spo2: (date: string, _displayName: string) =>
    pathWithDateSegment(WELLNESS_DAILY_SPO2, date),
  respiration: (date: string, _displayName: string) =>
    pathWithDateSegment(WELLNESS_DAILY_RESPIRATION, date),
  intensityMinutes: (date: string, _displayName: string) =>
    pathWithDateSegment(WELLNESS_DAILY_IM, date),
  floors: (date: string, _displayName: string) => pathWithDateSegment(WELLNESS_FLOORS_DAILY, date),
  dailySummary: (date: string, displayName: string) =>
    pathWithDisplayNameAndDate(WELLNESS_DAILY_SUMMARY_CHART, displayName, date),
  rhr: (date: string, displayName: string) =>
    pathWithDisplayNameAndDate(USERSTATS_WELLNESS_DAILY, displayName, date),
  spo2Acclimation: (date: string, _displayName: string) =>
    pathWithDateSegment(WELLNESS_SPO2_ACCLIMATION, date),
};
/* eslint-enable @typescript-eslint/no-unused-vars */

/** dailyEvents path with user ID in segment and calendarDate (HAR: UUID). */
function dailyEventsPath(userId: string, date: string): string {
  const q = new URLSearchParams({ calendarDate: date });
  return `${WELLNESS_DAILY_EVENTS}/${userId}?${q.toString()}`;
}

/** dailyEvents path with only calendarDate query (for current user without id in path). */
function dailyEventsPathQueryOnly(date: string): string {
  const q = new URLSearchParams({ calendarDate: date });
  return `${WELLNESS_DAILY_EVENTS}?${q.toString()}`;
}

/** stats/daily/acclimation path with weekly range (HAR). */
function acclimationPath(date: string): string {
  const { fromDate, untilDate } = getWeekRange(date);
  const q = new URLSearchParams({ fromDate, untilDate });
  return `${WELLNESS_STATS_ACCLIMATION}?${q.toString()}`;
}

/**
 * Registers wellness command group and all subcommands.
 */
export function registerWellness(program: CliProgram): void {
  const wellnessCmd = (program as Command)
    .command('wellness')
    .description('wellness data for a day (stress, Body Battery, heart-rate, SpO2, etc.; date YYYY-MM-DD, defaults to today)');

  const dateArg = '[date]';
  const dateDesc = 'date in YYYY-MM-DD format';

  wellnessCmd
    .command('stress')
    .description('daily stress data')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.stress, shapeObject(SCHEMA_KEYS.stress))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('body-battery')
    .description('Body Battery for a day')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await bodyBatteryAction(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('heart-rate')
    .description('daily heart rate')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.heartRate, shapeObject(SCHEMA_KEYS.heartRate))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('spo2')
    .description('SpO2 (blood oxygen) for a day')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.spo2, shapeObject(SCHEMA_KEYS.spo2))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('respiration')
    .description('daily respiration')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.respiration, shapeObject(SCHEMA_KEYS.respiration))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('intensity-minutes')
    .description('daily intensity minutes')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.intensityMinutes, shapeObject(SCHEMA_KEYS.intensityMinutes))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('floors')
    .description('daily floors')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.floors, shapeObject(SCHEMA_KEYS.floors))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('daily-summary')
    .description('daily wellness summary (chart)')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.dailySummary, shapeArray(shapeDailySummaryItem))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('rhr')
    .description('RHR (resting heart rate) from wellness daily')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.rhr, shapeObject(SCHEMA_KEYS.rhr))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('daily-events')
    .description('wellness events for a day (requires userGuid in profile)')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await dailyEventsAction(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('spo2-acclimation')
    .description('SpO2 acclimation for a day')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await makeWellnessAction(wellnessApiPaths.spo2Acclimation, shapeObject(SCHEMA_KEYS.spo2Acclimation))(dateArg, getJsonMode(program));
    });

  wellnessCmd
    .command('acclimation')
    .description('acclimation (heat/altitude) for week containing date')
    .argument(dateArg, dateDesc)
    .action(async (dateArg: string | undefined) => {
      await acclimationAction(dateArg, getJsonMode(program));
    });
}

/**
 * Action for daily-events: tries path with userGuid, then query only, then userProfilePk, then displayName.
 */
async function dailyEventsAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const { displayName, userGuid, userProfilePk } = await getWellnessProfile(client);

  const attempts: { path: string }[] = [];
  if (userGuid) attempts.push({ path: dailyEventsPath(userGuid, date) });
  attempts.push({ path: dailyEventsPathQueryOnly(date) });
  if (userProfilePk !== undefined) attempts.push({ path: dailyEventsPath(String(userProfilePk), date) });
  attempts.push({ path: dailyEventsPath(encodeURIComponent(displayName), date) });

  let lastErr: Error | null = null;
  for (const { path } of attempts) {
    debug('daily-events try', path);
    try {
      const data = await client.connectapi(path);
      print(data ?? {}, jsonMode);
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr ?? new Error('wellness daily-events: no request variant succeeded');
}

/**
 * Action for acclimation: request for week (fromDate/untilDate).
 */
async function acclimationAction(dateStr: string | undefined, jsonMode: boolean): Promise<void> {
  const date = parseDate(dateStr);
  const config = loadConfig();
  const client = await GarminClient.create(config);
  const path = acclimationPath(date);
  let data: unknown = await client.connectapi(path);
  if (jsonMode) data = shapeObject(SCHEMA_KEYS.acclimation)(data);
  print((data ?? {}) as Record<string, unknown>, jsonMode);
}