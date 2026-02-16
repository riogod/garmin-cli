/**
 * Unit tests for goals command.
 */

import { describe, it, expect } from 'vitest';

describe('goals API paths', () => {
  it('builds path for list without status', async () => {
    const { goalsListPath } = await import('../goals.js');

    const path = goalsListPath();
    expect(path).toBe('/goal-service/goal/goals');
  });

  it('builds path for list with status', async () => {
    const { goalsListPath } = await import('../goals.js');

    const path = goalsListPath('active');
    expect(path).toContain('/goal-service/goal/goals');
    expect(path).toContain('status=active');
  });

  it('builds path for weight', async () => {
    const { weightGoalPath } = await import('../goals.js');

    const path = weightGoalPath('2026-01-01', '2026-12-31');
    expect(path).toBe('/goal-service/goal/user/effective/weightgoal/2026-01-01/2026-12-31');
  });
});