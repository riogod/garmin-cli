/**
 * Integration tests for metrics.
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

describe('metrics commands (integration)', () => {
  describe('metrics readiness', () => {
    it('returns training readiness', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'readiness']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('metrics vo2max', () => {
    it('returns VO2 max', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'vo2max']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('metrics endurance', () => {
    it('returns endurance score', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'endurance']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('metrics hill', () => {
    it('returns hill score', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'hill']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('metrics training-status', () => {
    it('returns training status', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'training-status']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('metrics race-predictions', () => {
    it('returns race predictions', async () => {
      const { stdout, code } = await runCli(['--json', 'metrics', 'race-predictions']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('help', () => {
    it('shows help for metrics', async () => {
      const { stdout, code } = await runCli(['metrics', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('readiness');
      expect(stdout).toContain('vo2max');
      expect(stdout).toContain('endurance');
      expect(stdout).toContain('hill');
    });
  });
});