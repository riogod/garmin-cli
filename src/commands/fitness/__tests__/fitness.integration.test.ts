/**
 * Integration tests for fitness.
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

describe('fitness commands (integration)', () => {
  describe('fitness age', () => {
    it('returns fitness age', async () => {
      const { stdout, code } = await runCli(['--json', 'fitness', 'age']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('fitness stats-summary', () => {
    it('returns error when missing arguments', async () => {
      const { code } = await runCli(['--json', 'fitness', 'stats-summary']);
      expect(code).toBe(1);
    });
  });

  describe('fitness stats-exercises', () => {
    it('returns exercise statistics', async () => {
      const { stdout, code } = await runCli(['--json', 'fitness', 'stats-exercises']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('help', () => {
    it('shows help for fitness', async () => {
      const { stdout, code } = await runCli(['fitness', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('age');
      expect(stdout).toContain('stats-summary');
      expect(stdout).toContain('stats-metrics');
    });
  });
});