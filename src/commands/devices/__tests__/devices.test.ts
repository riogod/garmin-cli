/**
 * Unit tests for devices command.
 */

import { describe, it, expect } from 'vitest';

describe('devices API paths', () => {
  it('builds path for list', async () => {
    const { devicesListPath } = await import('../devices.js');

    const path = devicesListPath();
    expect(path).toBe('/device-service/deviceregistration/devices');
  });

  it('builds path for settings', async () => {
    const { deviceSettingsPath } = await import('../devices.js');

    const path = deviceSettingsPath('12345');
    expect(path).toBe('/device-service/deviceservice/user-device/12345');
  });

  it('builds path for primary', async () => {
    const { primaryDevicePath } = await import('../devices.js');

    const path = primaryDevicePath();
    expect(path).toBe('/web-gateway/device-info/primary-training-device');
  });

  it('builds path for solar', async () => {
    const { deviceSolarPath } = await import('../devices.js');

    const path = deviceSolarPath('12345', '2026-02-01', '2026-02-07');
    expect(path).toBe('/web-gateway/solar/12345/2026-02-01/2026-02-07');
  });

  it('builds path for last-used', async () => {
    const { lastUsedDevicePath } = await import('../devices.js');

    const path = lastUsedDevicePath();
    expect(path).toBe('/device-service/deviceservice/mylastused');
  });
});