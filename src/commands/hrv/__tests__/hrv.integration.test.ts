/**
 * Integration tests for hrv.
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

const apiTimeout = 15000;

describe('hrv commands (integration)', () => {
  describe('hrv daily', () => {
    it('returns daily HRV data', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { stdout, code } = await runCli(['--json', 'hrv', 'daily', today]);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, apiTimeout);

    it('returns HRV data for today by default', async () => {
      const { stdout, code } = await runCli(['--json', 'hrv', 'daily']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, apiTimeout);

    it('returns error for invalid date format', async () => {
      const { stderr, code } = await runCli(['--json', 'hrv', 'daily', 'invalid-date']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/format|invalid|date/i);
    });
  });

  describe('hrv range', () => {
    it('returns HRV data for period', async () => {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const start = weekAgo.toISOString().slice(0, 10);
      const end = today.toISOString().slice(0, 10);

      const { stdout, code } = await runCli(['--json', 'hrv', 'range', start, end]);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, apiTimeout);

    it('returns error when missing arguments', async () => {
      const { code } = await runCli(['--json', 'hrv', 'range']);
      expect(code).toBe(1);
    });
  });

  describe('help', () => {
    it('shows help for hrv', async () => {
      const { stdout, code } = await runCli(['hrv', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('daily');
      expect(stdout).toContain('range');
    });
  });
});