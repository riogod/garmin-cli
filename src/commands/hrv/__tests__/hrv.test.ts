/**
 * Unit tests for hrv command.
 */

import { describe, it, expect } from 'vitest';
import { parseDate } from '../../../lib/date.js';

describe('hrv API paths', () => {
  it('builds path for daily', async () => {
    const { hrvDailyPath } = await import('../hrv.js');

    const path = hrvDailyPath('2026-02-15');
    expect(path).toBe('/hrv-service/hrv/2026-02-15');
  });
});

describe('hrv GraphQL query', () => {
  it('contains correct query', async () => {
    const { HRV_RANGE_QUERY } = await import('../hrv.js');

    expect(HRV_RANGE_QUERY).toContain('heartRateVariabilityScalar');
    expect(HRV_RANGE_QUERY).toContain('startDate');
    expect(HRV_RANGE_QUERY).toContain('endDate');
  });
});

describe('date parsing for hrv', () => {
  it('parses date in YYYY-MM-DD format', () => {
    const date = parseDate('2026-02-15');
    expect(date).toBe('2026-02-15');
  });

  it('returns current date when no argument provided', () => {
    const today = new Date().toISOString().slice(0, 10);
    const date = parseDate(undefined);
    expect(date).toBe(today);
  });
});