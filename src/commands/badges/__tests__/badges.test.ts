/**
 * Unit tests for badges command.
 */

import { describe, it, expect } from 'vitest';

describe('badges API paths', () => {
  it('builds path for earned', async () => {
    const { badgesEarnedPath } = await import('../badges.js');

    const path = badgesEarnedPath();
    expect(path).toBe('/badge-service/badge/earned');
  });

  it('builds path for available', async () => {
    const { badgesAvailablePath } = await import('../badges.js');

    const path = badgesAvailablePath();
    expect(path).toBe('/badge-service/badge/available?showExclusiveBadge=true');
  });
});