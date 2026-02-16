/**
 * Unit tests for activities command.
 * Tests argument parsing, API path formation, validation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDate } from '../../../lib/date.js';

// Mock GarminClient
vi.mock('../../../garmin/client.js', () => ({
  GarminClient: {
    create: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/config.js', () => ({
  loadConfig: vi.fn(() => ({
    tokenDir: '/tmp/garmin-test',
  })),
}));

import { GarminClient } from '../../../garmin/client.js';

const mockConnectapi = vi.fn();
const mockDownload = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (GarminClient.create as ReturnType<typeof vi.fn>).mockResolvedValue({
    connectapi: mockConnectapi,
    download: mockDownload,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('activities API paths', () => {
  it('builds path for list without filters', async () => {
    mockConnectapi.mockResolvedValue([]);
    const { activitiesListPath } = await import('../activities.js');

    const path = activitiesListPath(0, 20);
    expect(path).toContain('/activitylist-service/activities/search/activities');
    expect(path).toContain('start=0');
    expect(path).toContain('limit=20');
    expect(path).not.toContain('activityType');
  });

  it('builds path for list with type filter', async () => {
    const { activitiesListPath } = await import('../activities.js');

    const path = activitiesListPath(0, 10, 'running');
    expect(path).toContain('activityType=running');
  });

  it('builds path for list with subtype', async () => {
    const { activitiesListPath } = await import('../activities.js');

    const path = activitiesListPath(0, 10, 'running', 'trail');
    expect(path).toContain('activityType=running');
    expect(path).toContain('subActivityType=trail');
  });

  it('limits limit to MAX_ACTIVITY_LIMIT', async () => {
    const { activitiesListPath } = await import('../activities.js');

    const path = activitiesListPath(0, 5000);
    expect(path).toContain('limit=1000');
  });
});

describe('activities download paths', () => {
  it('builds path for FIT format', async () => {
    const { downloadPath } = await import('../activities.js');

    const path = downloadPath('12345', 'fit');
    expect(path).toContain('/download-service/files/activity/12345');
  });

  it('builds path for TCX format', async () => {
    const { downloadPath } = await import('../activities.js');

    const path = downloadPath('12345', 'tcx');
    expect(path).toContain('/download-service/export/tcx/activity/12345');
  });

  it('builds path for GPX format', async () => {
    const { downloadPath } = await import('../activities.js');

    const path = downloadPath('12345', 'gpx');
    expect(path).toContain('/download-service/export/gpx/activity/12345');
  });

  it('builds path for KML format', async () => {
    const { downloadPath } = await import('../activities.js');

    const path = downloadPath('12345', 'kml');
    expect(path).toContain('/download-service/export/kml/activity/12345');
  });

  it('builds path for CSV format', async () => {
    const { downloadPath } = await import('../activities.js');

    const path = downloadPath('12345', 'csv');
    expect(path).toContain('/download-service/export/csv/activity/12345');
  });
});

describe('activities activity paths', () => {
  it('builds path for get', async () => {
    const { activityPath } = await import('../activities.js');

    const path = activityPath('12345');
    expect(path).toBe('/activity-service/activity/12345');
  });

  it('builds path for splits', async () => {
    const { activitySplitsPath } = await import('../activities.js');

    const path = activitySplitsPath('12345');
    expect(path).toBe('/activity-service/activity/12345/splits');
  });

  it('builds path for typed splits', async () => {
    const { activityTypedSplitsPath } = await import('../activities.js');

    const path = activityTypedSplitsPath('12345');
    expect(path).toBe('/activity-service/activity/12345/typedsplits');
  });

  it('builds path for split summaries', async () => {
    const { activitySplitSummariesPath } = await import('../activities.js');

    const path = activitySplitSummariesPath('12345');
    expect(path).toBe('/activity-service/activity/12345/split_summaries');
  });

  it('builds path for weather', async () => {
    const { activityWeatherPath } = await import('../activities.js');

    const path = activityWeatherPath('12345');
    expect(path).toBe('/activity-service/activity/12345/weather');
  });

  it('builds path for details with parameters', async () => {
    const { activityDetailsPath } = await import('../activities.js');

    const path = activityDetailsPath('12345', 1000, 2000);
    expect(path).toContain('/activity-service/activity/12345/details');
    expect(path).toContain('maxChartSize=1000');
    expect(path).toContain('maxPolylineSize=2000');
  });

  it('builds path for hr-zones', async () => {
    const { activityHrZonesPath } = await import('../activities.js');

    const path = activityHrZonesPath('12345');
    expect(path).toBe('/activity-service/activity/12345/hrTimeInZones');
  });

  it('builds path for power-zones', async () => {
    const { activityPowerZonesPath } = await import('../activities.js');

    const path = activityPowerZonesPath('12345');
    expect(path).toBe('/activity-service/activity/12345/powerTimeInZones');
  });

  it('builds path for exercise-sets', async () => {
    const { activityExerciseSetsPath } = await import('../activities.js');

    const path = activityExerciseSetsPath('12345');
    expect(path).toBe('/activity-service/activity/12345/exerciseSets');
  });

  it('builds path for gear', async () => {
    const { activityGearPath } = await import('../activities.js');

    const path = activityGearPath('12345');
    expect(path).toContain('/activity-service/activity/12345/gear');
    expect(path).toContain('activityId=12345');
  });
});

describe('activities fordate path', () => {
  it('builds path with displayName and date', async () => {
    const { activitiesForDatePath } = await import('../activities.js');

    const path = activitiesForDatePath('john.doe', '2025-02-15');
    expect(path).toContain('/activitylist-service/activities/fordailysummary/john.doe');
    expect(path).toContain('calendarDate=2025-02-15');
  });

  it('encodes displayName', async () => {
    const { activitiesForDatePath } = await import('../activities.js');

    const path = activitiesForDatePath('john doe', '2025-02-15');
    expect(path).toContain('john%20doe');
  });
});

describe('date parsing', () => {
  it('parses date in YYYY-MM-DD format', () => {
    const date = parseDate('2025-02-15');
    expect(date).toBe('2025-02-15');
  });

  it('returns current date when no argument provided', () => {
    const today = new Date().toISOString().slice(0, 10);
    const date = parseDate(undefined);
    expect(date).toBe(today);
  });

  it('throws on invalid format', () => {
    expect(() => parseDate('15-02-2025')).toThrow();
    expect(() => parseDate('invalid')).toThrow();
  });
});

describe('MIME types for upload', () => {
  it('returns correct MIME types', async () => {
    const { UPLOAD_MIME_TYPES } = await import('../activities.js');

    expect(UPLOAD_MIME_TYPES['fit']).toBe('application/vnd.ant.fit');
    expect(UPLOAD_MIME_TYPES['gpx']).toBe('application/gpx+xml');
    expect(UPLOAD_MIME_TYPES['tcx']).toBe('application/vnd.garmin.tcx+xml');
  });
});