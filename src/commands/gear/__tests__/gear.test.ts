/**
 * Unit tests for gear command.
 */

import { describe, it, expect } from 'vitest';

describe('gear API paths', () => {
  it('builds path for list', async () => {
    const { gearListPath } = await import('../gear.js');

    const path = gearListPath('12345');
    expect(path).toBe('/gear-service/gear/filterGear?userProfilePk=12345');
  });

  it('builds path for stats', async () => {
    const { gearStatsPath } = await import('../gear.js');

    const path = gearStatsPath('abc-123-def');
    expect(path).toBe('/gear-service/gear/stats/abc-123-def');
  });

  it('builds path for defaults', async () => {
    const { gearDefaultsPath } = await import('../gear.js');

    const path = gearDefaultsPath('12345');
    expect(path).toBe('/gear-service/gear/user/12345/activityTypes');
  });
});