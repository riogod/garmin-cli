/**
 * Integration tests for wellness command group.
 * Tests argument parsing, --help, date format, --json, --debug without real API.
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
    proc.on('close', (code) => {
      resolvePromise({ stdout, stderr, code: code ?? null });
    });
  });
}

const subcommands = [
  'stress',
  'body-battery',
  'heart-rate',
  'spo2',
  'respiration',
  'intensity-minutes',
  'floors',
  'daily-summary',
  'rhr',
  'daily-events',
  'spo2-acclimation',
  'acclimation',
];

describe('wellness (integration tests)', () => {
  it('wellness --help outputs description and subcommands', async () => {
    const { stdout, code } = await runCli(['wellness', '--help']);
    expect(code).toBe(0);
    expect(stdout).toContain('wellness');
    for (const sub of subcommands) {
      expect(stdout).toContain(sub);
    }
  });

  it('wellness stress --help outputs [date] argument', async () => {
    const { stdout, code } = await runCli(['wellness', 'stress', '--help']);
    expect(code).toBe(0);
    expect(stdout).toMatch(/YYYY-MM-DD|date/);
  });

  it('each subcommand accepts --help', async () => {
    for (const sub of subcommands) {
      const { stdout, code } = await runCli(['wellness', sub, '--help']);
      expect(code, `wellness ${sub} --help`).toBe(0);
      expect(stdout).toMatch(/YYYY-MM-DD|date/);
    }
  });

  it('wellness stress with invalid date format exits with code 1', async () => {
    const { stderr, stdout, code } = await runCli(['wellness', 'stress', '14.02.2025']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/YYYY-MM-DD|Invalid date format|Invalid date|Invalid month/);
  });

  it('wellness rhr with non-existent date exits with code 1', async () => {
    const { stderr, stdout, code } = await runCli(['wellness', 'rhr', '2025-02-30']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/Invalid date|Error/);
  });

  it('wellness body-battery with invalid month exits with code 1', async () => {
    const { stderr, stdout, code } = await runCli(['wellness', 'body-battery', '2025-13-01']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/Invalid month|Error/);
  });

  it('wellness heart-rate without argument does not fail on date parsing (code 0 or 1)', async () => {
    const { stderr, stdout, code } = await runCli(['wellness', 'heart-rate']);
    expect(code).toBeLessThanOrEqual(1);
    const out = stderr + stdout;
    expect(out).not.toMatch(/Invalid date format|Invalid date|Invalid month/);
  }, 15000);

  it('with --json and error, stdout does not contain valid JSON', async () => {
    const { stdout, code } = await runCli(['wellness', 'stress', '--json', '2025-02-30']);
    expect(code).toBe(1);
    const trimmed = stdout.trim();
    if (trimmed) {
      expect(() => JSON.parse(trimmed)).toThrow();
    }
  });

  it('with --debug debug info is output to stderr', async () => {
    const { stderr, code } = await runCli(['--debug', 'wellness', 'spo2', '14.02.2025']);
    expect(code).toBe(1);
    expect(stderr).toContain('[debug]');
  });

  it('global --json before wellness outputs JSON on success', async () => {
    const { stdout, code } = await runCli(['--json', 'wellness', 'daily-summary', '2025-01-15']);
    if (code === 0 && stdout.trim()) {
      expect(() => JSON.parse(stdout)).not.toThrow();
    }
  }, 15000);

  it('unknown wellness subcommand outputs error', async () => {
    const { stdout, stderr, code } = await runCli(['wellness', 'unknown-sub']);
    expect(code).not.toBe(0);
    const out = (stdout + stderr).toLowerCase();
    expect(out).toMatch(/unknown command|unknown option|help/);
  });
});