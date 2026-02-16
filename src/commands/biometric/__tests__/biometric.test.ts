/**
 * Unit tests for biometric command.
 */

import { describe, it, expect } from 'vitest';

describe('biometric API paths', () => {
  it('builds path for lactate-threshold', async () => {
    const { lactateThresholdPath } = await import('../biometric.js');

    const path = lactateThresholdPath();
    expect(path).toBe('/biometric-service/biometric/latestLactateThreshold');
  });

  it('builds path for ftp', async () => {
    const { ftpPath } = await import('../biometric.js');

    const path = ftpPath();
    expect(path).toBe('/biometric-service/biometric/latestFunctionalThresholdPower/CYCLING');
  });

  it('builds path for hr-zones', async () => {
    const { hrZonesPath } = await import('../biometric.js');

    const path = hrZonesPath();
    expect(path).toBe('/biometric-service/heartRateZones');
  });

  it('builds path for power-weight', async () => {
    const { powerWeightPath } = await import('../biometric.js');

    const path = powerWeightPath();
    expect(path).toBe('/biometric-service/biometric/stats/powerWeight');
  });

  it('builds path for critical-swim-speed', async () => {
    const { criticalSwimSpeedPath } = await import('../biometric.js');

    const path = criticalSwimSpeedPath('2026-02-15');
    expect(path).toBe('/biometric-service/criticalSwimSpeed/latest/2026-02-15');
  });

  it('builds path for ftp range', async () => {
    const { ftpRangePath } = await import('../biometric.js');

    const path = ftpRangePath('2026-01-01', '2026-01-31');
    expect(path).toBe('/biometric-service/stats/functionalThresholdPower/range/2026-01-01/2026-01-31');
  });
});