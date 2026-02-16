/**
 * Unit tests for challenges command.
 */

import { describe, it, expect } from 'vitest';

describe('challenges API paths', () => {
  it('builds path for adhoc', async () => {
    const { challengesAdhocPath } = await import('../challenges.js');

    const path = challengesAdhocPath(0, 20);
    expect(path).toContain('/adhocchallenge-service/adHocChallenge/historical');
    expect(path).toContain('start=0');
    expect(path).toContain('limit=20');
  });

  it('builds path for badge-completed', async () => {
    const { badgeChallengeCompletedPath } = await import('../challenges.js');

    const path = badgeChallengeCompletedPath();
    expect(path).toBe('/badgechallenge-service/badgeChallenge/completed');
  });

  it('builds path for badge-available', async () => {
    const { badgeChallengeAvailablePath } = await import('../challenges.js');

    const path = badgeChallengeAvailablePath();
    expect(path).toBe('/badgechallenge-service/badgeChallenge/available');
  });

  it('builds path for virtual-in-progress', async () => {
    const { virtualChallengeInProgressPath } = await import('../challenges.js');

    const path = virtualChallengeInProgressPath();
    expect(path).toBe('/badgechallenge-service/virtualChallenge/inProgress');
  });
});