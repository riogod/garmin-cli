import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isDebugEnabled, debug } from '../debug.js';

describe('debug', () => {
  const orig = process.env.GARMIN_DEBUG;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.GARMIN_DEBUG;
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (orig !== undefined) process.env.GARMIN_DEBUG = orig;
    else delete process.env.GARMIN_DEBUG;
    stderrSpy.mockRestore();
  });

  it('isDebugEnabled returns false without GARMIN_DEBUG', () => {
    expect(isDebugEnabled()).toBe(false);
  });

  it('isDebugEnabled returns true when GARMIN_DEBUG=1', () => {
    process.env.GARMIN_DEBUG = '1';
    expect(isDebugEnabled()).toBe(true);
  });

  it('isDebugEnabled returns true when GARMIN_DEBUG=true', () => {
    process.env.GARMIN_DEBUG = 'true';
    expect(isDebugEnabled()).toBe(true);
  });

  it('debug does not write to stderr when debugging is off', () => {
    debug('test', { a: 1 });
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('debug writes to stderr when GARMIN_DEBUG=1', () => {
    process.env.GARMIN_DEBUG = '1';
    debug('step', { status: 200 });
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy.mock.calls[0]![0]).toContain('[debug]');
    expect(stderrSpy.mock.calls[0]![0]).toContain('step');
    expect(stderrSpy.mock.calls[0]![0]).toContain('200');
  });
});
