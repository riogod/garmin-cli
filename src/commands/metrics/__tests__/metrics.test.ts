/**
 * Unit tests for metrics command.
 */

import { describe, it, expect } from 'vitest';
import { parseDate } from '../../../lib/date.js';

describe('metrics API paths', () => {
  it('builds path for readiness', async () => {
    const { trainingReadinessPath } = await import('../metrics.js');

    const path = trainingReadinessPath('2026-02-15');
    expect(path).toBe('/metrics-service/metrics/trainingreadiness/2026-02-15');
  });

  // vo2max now uses GraphQL instead of REST endpoint

  it('builds path for endurance', async () => {
    const { endurancePath } = await import('../metrics.js');

    const path = endurancePath('2026-02-15');
    expect(path).toContain('/metrics-service/metrics/endurancescore');
    expect(path).toContain('calendarDate=2026-02-15');
  });

  it('builds path for hill', async () => {
    const { hillPath } = await import('../metrics.js');

    const path = hillPath('2026-02-15');
    expect(path).toContain('/metrics-service/metrics/hillscore');
    expect(path).toContain('calendarDate=2026-02-15');
  });

  it('builds path for training-status', async () => {
    const { trainingStatusPath } = await import('../metrics.js');

    const path = trainingStatusPath('2026-02-15');
    expect(path).toBe('/metrics-service/metrics/trainingstatus/aggregated/2026-02-15');
  });

  it('builds path for race-predictions', async () => {
    const { racePredictionsPath } = await import('../metrics.js');

    const path = racePredictionsPath('john.doe');
    expect(path).toContain('/metrics-service/metrics/racepredictions/latest/john.doe');
  });

  it('encodes displayName in race-predictions', async () => {
    const { racePredictionsPath } = await import('../metrics.js');

    const path = racePredictionsPath('john doe');
    expect(path).toContain('john%20doe');
  });

  it('builds path for power-curve', async () => {
    const { powerCurvePath } = await import('../metrics.js');

    const path = powerCurvePath('2026-01-01', '2026-01-31');
    expect(path).toContain('/fitnessstats-service/powerCurve');
    expect(path).toContain('startDate=2026-01-01');
    expect(path).toContain('endDate=2026-01-31');
    expect(path).not.toContain('sport');
  });

  it('builds path for power-curve with sport', async () => {
    const { powerCurvePath } = await import('../metrics.js');

    const path = powerCurvePath('2026-01-01', '2026-01-31', 'cycling');
    expect(path).toContain('sport=cycling');
  });
});

describe('metrics GraphQL queries', () => {
  it('contains correct vo2max-range query', async () => {
    const { VO2MAX_RANGE_QUERY } = await import('../metrics.js');

    expect(VO2MAX_RANGE_QUERY).toContain('vo2MaxScalar');
    expect(VO2MAX_RANGE_QUERY).toContain('startDate');
    expect(VO2MAX_RANGE_QUERY).toContain('endDate');
  });

  it('contains correct load-balance query', async () => {
    const { LOAD_BALANCE_QUERY } = await import('../metrics.js');

    expect(LOAD_BALANCE_QUERY).toContain('trainingLoadBalanceScalar');
    expect(LOAD_BALANCE_QUERY).toContain('calendarDate');
    expect(LOAD_BALANCE_QUERY).toContain('fullHistoryScan');
  });

  it('contains correct acclimation query', async () => {
    const { ACCLIMATION_QUERY } = await import('../metrics.js');

    expect(ACCLIMATION_QUERY).toContain('heatAltitudeAcclimationScalar');
    expect(ACCLIMATION_QUERY).toContain('date');
  });
});

describe('date parsing for metrics', () => {
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