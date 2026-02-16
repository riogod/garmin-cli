import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDate } from '../../../lib/date.js';
import { sleepApiPath } from '../sleep.js';

describe('sleepApiPath', () => {
  it('returns path with date parameter', () => {
    const path = sleepApiPath('2025-02-14');
    expect(path).toContain('date=2025-02-14');
    expect(path).toMatch(/dailySleepData\?date=/);
  });

  it('includes sleep-service base path', () => {
    expect(sleepApiPath('2025-01-01')).toContain('/sleep-service/');
  });
});

describe('sleep command: date format', () => {
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
