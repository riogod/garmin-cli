/**
 * Integration tests for weight.
 * Requires real Garmin Connect session (tokens).
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
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

describe('weight commands (integration)', () => {
  const testTimeout = 15000; // real API / auth
  let tempDir: string;

  beforeAll(() => {
    tempDir = resolve(tmpdir(), 'garmin-cli-weight-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('weight daily', () => {
    it('returns daily weight data', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { stdout, code } = await runCli(['--json', 'weight', 'daily', today]);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, testTimeout);

    it('returns weight data for today by default', async () => {
      const { stdout, code } = await runCli(['--json', 'weight', 'daily']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, testTimeout);

    it('returns error for invalid date format', async () => {
      const { stderr, code } = await runCli(['--json', 'weight', 'daily', 'invalid-date']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/format|invalid|date/i);
    });
  });

  describe('weight range', () => {
    it('returns weight data for period', async () => {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const start = weekAgo.toISOString().slice(0, 10);
      const end = today.toISOString().slice(0, 10);

      const { stdout, code } = await runCli(['--json', 'weight', 'range', start, end]);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    }, testTimeout);

    it('returns error when missing arguments', async () => {
      const { code } = await runCli(['--json', 'weight', 'range']);
      expect(code).toBe(1);
    });
  });

  describe('weight add', () => {
    it('returns error for invalid weight value', async () => {
      const { stderr, code } = await runCli(['--json', 'weight', 'add', 'invalid']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/weight|invalid/i);
    });

    it('returns error for negative weight', async () => {
      const { stderr, code } = await runCli(['--json', 'weight', 'add', '-70']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/weight|invalid/i);
    });
  });

  describe('weight delete', () => {
    it('returns error for invalid pk', async () => {
      const { stderr, code } = await runCli(['--json', 'weight', 'delete', '2026-02-15', 'invalid']);
      expect(code).toBe(1);
      expect(stderr).toMatch(/pk|invalid/i);
    });
  });

  describe('help', () => {
    it('shows help for weight', async () => {
      const { stdout, code } = await runCli(['weight', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('daily');
      expect(stdout).toContain('range');
      expect(stdout).toContain('add');
      expect(stdout).toContain('delete');
    });

    it('shows help for daily subcommand', async () => {
      const { stdout, code } = await runCli(['weight', 'daily', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('date');
    });
  });
});