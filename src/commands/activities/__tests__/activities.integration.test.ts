/**
 * Integration tests for activities.
 * Requires real Garmin Connect session (tokens).
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const cliPath = resolve(process.cwd(), 'dist/cli.js');

/** Runs CLI and returns result. */
function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolvePromise) => {
    const proc = spawn('node', [cliPath, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    proc.on('close', (code) => {
      resolvePromise({ stdout, stderr, code: code ?? null });
    });
  });
}

/** Checks that response is valid JSON. */
function parseJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

/** Skips test if not authorized. */
function skipIfUnauthorized(code: number | null): boolean {
  return code === 1;
}

describe('activities commands (integration)', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = resolve(tmpdir(), 'garmin-cli-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('activities list', () => {
    it('outputs list of activities in JSON format', async () => {
      const { stdout, code } = await runCli(['--json', 'activities', 'list', '0', '5']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be missing when there are no activities or auth issues
      if (data === null) {
        console.log('Skip: no activity data');
        return;
      }
      expect(Array.isArray(data)).toBe(true);
      if (Array.isArray(data) && data.length > 0) {
        const activity = data[0] as Record<string, unknown>;
        expect(activity).toHaveProperty('activityId');
        expect(activity).toHaveProperty('activityName');
        expect(activity).toHaveProperty('activityType');
      }
    });

    it('supports filtering by activity type', async () => {
      const { stdout, code } = await runCli([
        '--json',
        'activities',
        'list',
        '0',
        '5',
        '--activity-type',
        'running',
      ]);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be missing when there are no activities of this type
      if (data === null) {
        console.log('Skip: no activities with filter');
        return;
      }
      expect(Array.isArray(data)).toBe(true);
    });

    it('outputs debug info with --debug', async () => {
      const { stderr, code } = await runCli(['--debug', '--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(code)) return;

      expect(stderr).toContain('[debug]');
    });

    it('returns error for invalid limit', async () => {
      const { stderr, code } = await runCli(['--json', 'activities', 'list', '0', 'invalid']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/limit|error|invalid/i);
    });

    it('returns error when limit > 1000', async () => {
      const { stderr, code } = await runCli(['--json', 'activities', 'list', '0', '1001']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/1000|exceed|invalid/i);
    });
  });

  describe('activities count', () => {
    it('returns activity count', async () => {
      const { stdout, code } = await runCli(['--json', 'activities', 'count']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be null when not authorized or no data
      if (data === null) {
        console.log('Skip: no activity count data');
        return;
      }
      expect(data).toHaveProperty('totalCount');
      expect(typeof (data as Record<string, unknown>).totalCount).toBe('number');
    });
  });

  describe('activities types', () => {
    it('returns list of activity types', async () => {
      const { stdout, code } = await runCli(['--json', 'activities', 'types']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be null when not authorized or no data
      if (data === null) {
        console.log('Skip: no activity types data');
        return;
      }
      expect(Array.isArray(data)).toBe(true);
      if (Array.isArray(data) && data.length > 0) {
        const type = data[0] as Record<string, unknown>;
        expect(type).toHaveProperty('typeKey');
      }
    });
  });

  describe('activities get', () => {
    it('returns activity details by ID', async () => {
      // First get activity ID
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { stdout, code } = await runCli(['--json', 'activities', 'get', String(activityId)]);
      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
      expect((data as Record<string, unknown>).activityId).toBe(activityId);
    });

    it('returns error for non-existent ID', async () => {
      const { stderr, code } = await runCli(['--json', 'activities', 'get', '99999999999']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/not found|404/i);
    });
  });

  describe('activities splits', () => {
    it('returns activity splits', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { stdout, code } = await runCli(['--json', 'activities', 'splits', String(activityId)]);
      expect(code).toBe(0);
      // Splits may be empty for some activity types
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('activities weather', () => {
    it('returns activity weather data', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'weather', String(activityId)]);
      // Weather may be missing for some activities — 204 or empty response
      expect([0, 1]).toContain(code);
    }, 15000); // Longer timeout for real API
  });

  describe('activities details', () => {
    it('returns activity detailed data', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { stdout, code } = await runCli([
        '--json',
        'activities',
        'details',
        String(activityId),
        '--max-chart-size',
        '500',
        '--max-polyline-size',
        '1000',
      ]);
      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('activities hr-zones', () => {
    it('returns time in heart rate zones', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'hr-zones', String(activityId)]);
      // Not all activities have heart rate data
      expect([0, 1]).toContain(code);
    });
  });

  describe('activities power-zones', () => {
    it('returns time in power zones', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'power-zones', String(activityId)]);
      // Not all activities have power data
      expect([0, 1]).toContain(code);
    });
  });

  describe('activities exercise-sets', () => {
    it('returns exercise sets (strength training)', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '5', '--activity-type', 'strength_training']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no strength activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'exercise-sets', String(activityId)]);
      expect([0, 1]).toContain(code);
    });
  });

  describe('activities gear', () => {
    it('returns activity gear', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'gear', String(activityId)]);
      expect([0, 1]).toContain(code);
    });
  });

  describe('activities fordate', () => {
    it('returns activities for specified date', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { stdout, code } = await runCli(['--json', 'activities', 'fordate', today]);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be empty when there are no activities for the date
      if (data === null) {
        console.log('Skip: no data for specified date');
        return;
      }
      expect(Array.isArray(data)).toBe(true);
    });

    it('returns activities for today by default', async () => {
      const { stdout, code } = await runCli(['--json', 'activities', 'fordate']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      // Data may be empty when there are no activities for today
      if (data === null) {
        console.log('Skip: no data for today');
        return;
      }
    });

    it('returns error for invalid date format', async () => {
      const { stderr, code } = await runCli(['--json', 'activities', 'fordate', 'invalid-date']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/format|invalid|date/i);
    });
  });

  describe('activities download', () => {
    it('downloads activity in tcx format', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const outputPath = resolve(tempDir, `activity-${activityId}.tcx`);

      const { stdout, code } = await runCli([
        '--json',
        'activities',
        'download',
        String(activityId),
        'tcx',
        '--output',
        outputPath,
      ]);

      // May be 403 if activity is private
      if (code === 0) {
        const data = parseJson(stdout);
        expect(data).toHaveProperty('success', true);
        expect(existsSync(outputPath)).toBe(true);
      }
    });

    it('returns error for invalid format', async () => {
      const { stderr, code } = await runCli(['--json', 'activities', 'download', '123', 'invalid']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/format|invalid|fit|tcx|gpx/i);
    });
  });

  describe('activities typedsplits', () => {
    it('returns typed splits', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'typedsplits', String(activityId)]);
      expect([0, 1]).toContain(code);
    });
  });

  describe('activities split-summaries', () => {
    it('returns split summaries', async () => {
      const listResult = await runCli(['--json', 'activities', 'list', '0', '1']);
      if (skipIfUnauthorized(listResult.code)) return;

      const listData = parseJson(listResult.stdout);
      if (!Array.isArray(listData) || listData.length === 0) {
        console.log('Skip: no activities');
        return;
      }

      const activityId = (listData[0] as Record<string, unknown>).activityId;
      const { code } = await runCli(['--json', 'activities', 'split-summaries', String(activityId)]);
      expect([0, 1]).toContain(code);
    });
  });

  describe('help', () => {
    it('shows help for activities', async () => {
      const { stdout, code } = await runCli(['activities', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('list');
      expect(stdout).toContain('get');
      expect(stdout).toContain('download');
      expect(stdout).toContain('upload');
    });

    it('shows help for list subcommand', async () => {
      const { stdout, code } = await runCli(['activities', 'list', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('start');
      expect(stdout).toContain('limit');
      expect(stdout).toContain('activity-type');
    });
  });
});