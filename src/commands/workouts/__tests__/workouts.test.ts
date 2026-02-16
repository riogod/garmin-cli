/**
 * Unit tests for workouts command.
 */

import { describe, it, expect } from 'vitest';

describe('workouts API paths', () => {
  it('builds path for list', async () => {
    const { workoutsListPath } = await import('../workouts.js');

    const path = workoutsListPath(0, 20);
    expect(path).toContain('/workout-service/workouts');
    expect(path).toContain('start=0');
    expect(path).toContain('limit=20');
  });

  it('builds path for list with default values', async () => {
    const { workoutsListPath } = await import('../workouts.js');

    const path = workoutsListPath();
    expect(path).toContain('start=0');
    expect(path).toContain('limit=50');
  });

  it('builds path for get', async () => {
    const { workoutGetPath } = await import('../workouts.js');

    const path = workoutGetPath('12345');
    expect(path).toBe('/workout-service/workout/12345');
  });

  it('builds path for download', async () => {
    const { workoutDownloadPath } = await import('../workouts.js');

    const path = workoutDownloadPath('12345');
    expect(path).toBe('/workout-service/workout/FIT/12345');
  });

  it('builds path for create', async () => {
    const { workoutCreatePath } = await import('../workouts.js');

    const path = workoutCreatePath();
    expect(path).toBe('/workout-service/workout');
  });

  it('builds path for delete', async () => {
    const { workoutDeletePath } = await import('../workouts.js');

    const path = workoutDeletePath('12345');
    expect(path).toBe('/workout-service/workout/12345');
  });

  it('builds path for schedule', async () => {
    const { workoutSchedulePath } = await import('../workouts.js');

    const path = workoutSchedulePath('12345');
    expect(path).toBe('/workout-service/schedule/12345');
  });

  it('builds path for unschedule', async () => {
    const { workoutUnschedulePath } = await import('../workouts.js');

    const path = workoutUnschedulePath('67890');
    expect(path).toBe('/workout-service/schedule/67890');
  });
});