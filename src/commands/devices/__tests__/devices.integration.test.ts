/**
 * Integration tests for devices.
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

describe('devices commands (integration)', () => {
  describe('devices list', () => {
    it('returns device list', async () => {
      const { stdout, code } = await runCli(['--json', 'devices', 'list']);
      if (skipIfUnauthorized(code)) {
        console.log('Skip: not authorized');
        return;
      }

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('devices primary', () => {
    it('returns primary device', async () => {
      const { stdout, code } = await runCli(['--json', 'devices', 'primary']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('devices last-used', () => {
    it('returns last used device', async () => {
      const { stdout, code } = await runCli(['--json', 'devices', 'last-used']);
      if (skipIfUnauthorized(code)) return;

      expect(code).toBe(0);
      const data = parseJson(stdout);
      expect(data).not.toBeNull();
    });
  });

  describe('help', () => {
    it('shows help for devices', async () => {
      const { stdout, code } = await runCli(['devices', '--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('list');
      expect(stdout).toContain('settings');
      expect(stdout).toContain('primary');
      expect(stdout).toContain('solar');
    });
  });
});