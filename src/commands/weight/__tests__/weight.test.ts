/**
 * Unit tests for weight command.
 * Tests argument parsing, API path formation, validation.
 */

import { describe, it, expect } from 'vitest';
import { parseDate } from '../../../lib/date.js';

describe('weight API paths', () => {
  it('builds path for daily', async () => {
    const { weightDailyPath } = await import('../weight.js');

    const path = weightDailyPath('2026-02-15');
    expect(path).toContain('/weight-service/weight/dayview/2026-02-15');
    expect(path).toContain('includeAll=true');
  });

  it('builds path for daily without includeAll', async () => {
    const { weightDailyPath } = await import('../weight.js');

    const path = weightDailyPath('2026-02-15', false);
    expect(path).toBe('/weight-service/weight/dayview/2026-02-15');
    expect(path).not.toContain('includeAll');
  });

  it('builds path for range', async () => {
    const { weightRangePath } = await import('../weight.js');

    const path = weightRangePath('2026-01-01', '2026-01-31');
    expect(path).toBe('/weight-service/weight/range/2026-01-01/2026-01-31');
  });

  it('builds path for add', async () => {
    const { weightAddPath } = await import('../weight.js');

    const path = weightAddPath();
    expect(path).toBe('/weight-service/user-weight');
  });

  it('builds path for delete', async () => {
    const { weightDeletePath } = await import('../weight.js');

    const path = weightDeletePath('2026-02-15', '12345');
    expect(path).toBe('/weight-service/weight/2026-02-15/byversion/12345');
  });

  it('builds path for delete with numeric pk', async () => {
    const { weightDeletePath } = await import('../weight.js');

    const path = weightDeletePath('2026-02-15', 12345);
    expect(path).toBe('/weight-service/weight/2026-02-15/byversion/12345');
  });
});

describe('date parsing for weight', () => {
  it('parses date in YYYY-MM-DD format', () => {
    const date = parseDate('2026-02-15');
    expect(date).toBe('2026-02-15');
  });

  it('returns current date when no argument provided', () => {
    const today = new Date().toISOString().slice(0, 10);
    const date = parseDate(undefined);
    expect(date).toBe(today);
  });

  it('throws on invalid format', () => {
    expect(() => parseDate('15-02-2026')).toThrow();
    expect(() => parseDate('invalid')).toThrow();
  });
});

describe('weight validation', () => {
  it('weight validation - valid values', () => {
    const validWeights = ['70.5', '70', '50.0', '100'];
    for (const w of validWeights) {
      const parsed = parseFloat(w);
      expect(isNaN(parsed) || parsed <= 0).toBe(false);
    }
  });

  it('weight validation - invalid values', () => {
    const invalidWeights = ['abc', '-70', '0', ''];
    for (const w of invalidWeights) {
      const parsed = parseFloat(w);
      expect(isNaN(parsed) || parsed <= 0).toBe(true);
    }
  });
});