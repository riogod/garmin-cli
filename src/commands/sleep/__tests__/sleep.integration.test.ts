import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const cliPath = resolve(process.cwd(), 'dist/cli.js');

/**
 * Runs CLI with arguments and returns stdout/stderr and exit code.
 */
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

describe('sleep (integration tests)', () => {
  it('sleep --help outputs description and [date] argument', async () => {
    const { stdout, code } = await runCli(['sleep', '--help']);
    expect(code).toBe(0);
    expect(stdout).toContain('sleep');
    expect(stdout).toMatch(/YYYY-MM-DD|date/);
  });

  it('sleep with invalid date format exits with code 1 and date error message', async () => {
    const { stderr, stdout, code } = await runCli(['sleep', '14.02.2025']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/YYYY-MM-DD|Invalid date format|Invalid date|Invalid month/);
  });

  it('sleep with non-existent date exits with code 1', async () => {
    const { stderr, stdout, code } = await runCli(['sleep', '2025-02-30']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/Invalid date|Error/);
  });

  it('sleep with invalid month exits with code 1', async () => {
    const { stderr, stdout, code } = await runCli(['sleep', '2025-13-01']);
    expect(code).toBe(1);
    const out = stderr + stdout;
    expect(out).toMatch(/Invalid month|Error/);
  });

  it('sleep without argument exits without date parsing error (code 0 or 1)', async () => {
    const { stderr, stdout, code } = await runCli(['sleep']);
    expect(code).toBeLessThanOrEqual(1);
    const out = stderr + stdout;
    expect(out).not.toMatch(/Invalid date format|Invalid date|Invalid month/);
  });

  it('with --json and error, stdout does not contain valid JSON', async () => {
    const { stdout, code } = await runCli(['sleep', '--json', '2025-02-30']);
    expect(code).toBe(1);
    const trimmed = stdout.trim();
    if (trimmed) {
      expect(() => JSON.parse(trimmed)).toThrow();
    }
  });

  it('with --debug debug info is output to stderr', async () => {
    const { stderr, code } = await runCli(['--debug', 'sleep', '14.02.2025']);
    expect(code).toBe(1);
    expect(stderr).toContain('[debug]');
  });
});