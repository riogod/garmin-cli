import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDate, addDays, getWeekRange } from '../date.js';

describe('parseDate', () => {
  const fixedDate = new Date(2025, 1, 14); // 2025-02-14

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today (YYYY-MM-DD) without argument', () => {
    expect(parseDate()).toBe('2025-02-14');
    expect(parseDate('')).toBe('2025-02-14');
  });

  it('accepts valid YYYY-MM-DD string', () => {
    expect(parseDate('2025-01-01')).toBe('2025-01-01');
    expect(parseDate('2024-12-31')).toBe('2024-12-31');
  });

  it('trims whitespace', () => {
    expect(parseDate('  2025-06-15  ')).toBe('2025-06-15');
  });

  it('throws on invalid format', () => {
    expect(() => parseDate('14.02.2025')).toThrow('expected YYYY-MM-DD');
    expect(() => parseDate('2025/02/14')).toThrow('expected YYYY-MM-DD');
    expect(() => parseDate('2025-2-14')).toThrow('expected YYYY-MM-DD');
  });

  it('throws on invalid month', () => {
    expect(() => parseDate('2025-00-01')).toThrow('Invalid month');
    expect(() => parseDate('2025-13-01')).toThrow('Invalid month');
  });

  it('throws on non-existent date', () => {
    expect(() => parseDate('2025-02-30')).toThrow('Invalid date');
    expect(() => parseDate('2025-04-31')).toThrow('Invalid date');
  });
});

describe('addDays', () => {
  it('adds days to date', () => {
    expect(addDays('2026-02-14', 1)).toBe('2026-02-15');
    expect(addDays('2026-02-14', -3)).toBe('2026-02-11');
  });
});

describe('getWeekRange', () => {
  it('returns Mon-Sun for date in middle of week', () => {
    const r = getWeekRange('2026-02-15'); // Sunday
    expect(r.fromDate).toBe('2026-02-09');
    expect(r.untilDate).toBe('2026-02-15');
  });
  it('Monday is first day of range', () => {
    const r = getWeekRange('2026-02-09'); // Monday
    expect(r.fromDate).toBe('2026-02-09');
    expect(r.untilDate).toBe('2026-02-15');
  });
});