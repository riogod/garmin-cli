/**
 * Unit tests for wellness commands: API paths and date format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDate } from '../../../lib/date.js';
import { wellnessApiPaths } from '../wellness.js';

const date = '2025-02-14';
const displayName = 'test_user';

describe('wellnessApiPaths', () => {
  it('stress: date in path segment', () => {
    const path = wellnessApiPaths.stress(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/dailyStress\/2025-02-14/);
  });

  it('bodyBattery: path with displayName and query date', () => {
    const path = wellnessApiPaths.bodyBattery(date, displayName);
    expect(path).toContain('date=2025-02-14');
    expect(path).toMatch(/bodyBattery/);
  });

  it('heartRate: path with displayName and query date', () => {
    const path = wellnessApiPaths.heartRate(date, displayName);
    expect(path).toContain('date=2025-02-14');
    expect(path).toMatch(/dailyHeartRate/);
  });

  it('spo2: date in path segment', () => {
    const path = wellnessApiPaths.spo2(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/spo2|daily/);
  });

  it('respiration: date in path segment', () => {
    const path = wellnessApiPaths.respiration(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/respiration/);
  });

  it('intensityMinutes: date in path segment', () => {
    const path = wellnessApiPaths.intensityMinutes(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/daily\/im|wellness/);
  });

  it('floors: date in path segment (without displayName in path)', () => {
    const path = wellnessApiPaths.floors(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/floors.*daily/);
  });

  it('dailySummary: path with displayName and query date', () => {
    const path = wellnessApiPaths.dailySummary(date, displayName);
    expect(path).toContain('date=2025-02-14');
    expect(path).toMatch(/dailySummaryChart/);
  });

  it('rhr: path with displayName and query date', () => {
    const path = wellnessApiPaths.rhr(date, displayName);
    expect(path).toContain('date=2025-02-14');
    expect(path).toContain('test_user');
    expect(path).toMatch(/wellness\/daily\//);
  });

  it('spo2Acclimation: date in path segment', () => {
    const path = wellnessApiPaths.spo2Acclimation(date, displayName);
    expect(path).toContain('/2025-02-14');
    expect(path).toMatch(/spo2acclimation/);
  });

  it('all paths contain wellness or userstats', () => {
    expect(wellnessApiPaths.stress(date, displayName)).toMatch(/wellness-service|userstats/);
    expect(wellnessApiPaths.bodyBattery(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.heartRate(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.spo2(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.respiration(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.intensityMinutes(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.floors(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.dailySummary(date, displayName)).toMatch(/wellness/);
    expect(wellnessApiPaths.rhr(date, displayName)).toMatch(/userstats|wellness/);
    expect(wellnessApiPaths.spo2Acclimation(date, displayName)).toMatch(/wellness/);
  });
});

describe('wellness command: date format', () => {
  const fixedDate = new Date(2025, 1, 14); // 2025-02-14

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('without argument parseDate returns today', () => {
    expect(parseDate()).toBe('2025-02-14');
  });

  it('with argument parseDate returns YYYY-MM-DD', () => {
    expect(parseDate('2025-12-31')).toBe('2025-12-31');
  });
});
