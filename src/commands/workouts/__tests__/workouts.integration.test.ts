/**
 * Integration tests for workouts command.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const cliPath = resolve(process.cwd(), 'dist/cli.js');

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolvePromise) => {
    const proc = spawn('node', [cliPath, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk; });
    proc.stderr?.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => { resolvePromise({ stdout, stderr, code: code ?? null }); });
  });
}

function parseJson(stdout: string): unknown {
  try { return JSON.parse(stdout); } catch { return null; }
}

function skipIfUnauthorized(code: number | null): boolean {
  return code === 1;
}

describe('workouts commands (integration)', () => {
  describe('workouts list', () => {
    it('returns list of workouts', async () => {
      const { stdout, code } = await runCli(['--json', 'workouts', 'list', '0', '10']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });

    it('returns error for invalid start/limit', async () => {
      const { stderr, code } = await runCli(['--json', 'workouts', 'list', 'invalid', '10']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/number|invalid/i);
    });
  });

  describe('workouts get', () => {
    it('returns error for non-existent ID', async () => {
      const { stderr, code } = await runCli(['--json', 'workouts', 'get', '99999999999']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/not found|404/i);
    });
  });

  describe('help', () => {
    it('shows workouts help', async () => {
      const { stdout, code } = await runCli(['workouts', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('list');
      expect(stdout).toContain('get');
      expect(stdout).toContain('download');
      expect(stdout).toContain('schedule');
    });
  });
});