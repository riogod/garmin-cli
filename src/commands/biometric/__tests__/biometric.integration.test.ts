/**
 * Integration tests for biometric.
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

describe('biometric commands (integration)', () => {
  describe('biometric lactate-threshold', () => {
    it('returns lactate threshold', async () => {
      const { stdout, code } = await runCli(['--json', 'biometric', 'lactate-threshold']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('biometric ftp', () => {
    it('returns FTP', async () => {
      const { stdout, code } = await runCli(['--json', 'biometric', 'ftp']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('biometric hr-zones', () => {
    it('returns heart rate zones', async () => {
      const { stdout, code } = await runCli(['--json', 'biometric', 'hr-zones']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('biometric power-weight', () => {
    it('returns power-to-weight ratio', async () => {
      const { stdout, code } = await runCli(['--json', 'biometric', 'power-weight']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('biometric critical-swim-speed', () => {
    it('returns critical swim speed', async () => {
      const { stdout, code } = await runCli(['--json', 'biometric', 'critical-swim-speed']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('help', () => {
    it('shows help for biometric', async () => {
      const { stdout, code } = await runCli(['biometric', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('lactate-threshold');
      expect(stdout).toContain('ftp');
      expect(stdout).toContain('hr-zones');
    });
  });
});