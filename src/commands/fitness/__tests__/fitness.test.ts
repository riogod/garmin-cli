/**
 * Unit tests for fitness command.
 */

import { describe, it, expect } from 'vitest';

describe('fitness API paths', () => {
  it('builds path for age', async () => {
    const { fitnessAgePath } = await import('../fitness.js');

    const path = fitnessAgePath('2026-02-15');
    expect(path).toBe('/fitnessage-service/fitnessage/2026-02-15');
  });

  it('builds path for stats-summary', async () => {
    const { fitnessStatsSummaryPath } = await import('../fitness.js');

    const path = fitnessStatsSummaryPath('2026-01-01', '2026-01-31');
    expect(path).toContain('/fitnessstats-service/activity');
    expect(path).toContain('startDate=2026-01-01');
    expect(path).toContain('endDate=2026-01-31');
    expect(path).toContain('aggregation=weekly');
  });

  it('builds path for stats-metrics', async () => {
    const { fitnessAvailableMetricsPath } = await import('../fitness.js');

    const path = fitnessAvailableMetricsPath('2026-01-01', '2026-01-31');
    expect(path).toContain('/fitnessstats-service/activity/availableMetrics');
    expect(path).toContain('startDate=2026-01-01');
    expect(path).toContain('endDate=2026-01-31');
  });

  it('builds path for stats-metrics with activity-type', async () => {
    const { fitnessAvailableMetricsPath } = await import('../fitness.js');

    const path = fitnessAvailableMetricsPath('2026-01-01', '2026-01-31', 'running');
    expect(path).toContain('activityType=running');
  });
});