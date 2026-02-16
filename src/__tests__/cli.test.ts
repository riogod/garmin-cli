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

describe('CLI', () => {
  it('--version outputs version to stdout', async () => {
    const { stdout, code } = await runCli(['--version']);
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('--help outputs help with options', async () => {
    const { stdout, code } = await runCli(['--help']);
    expect(code).toBe(0);
    expect(stdout).toContain('--version');
    expect(stdout).toContain('--json');
    expect(stdout).toContain('--debug');
  });

  it('--debug writes to stderr when called with command', async () => {
    const { stderr, code } = await runCli(['--debug', 'version']);
    expect(code).toBe(0);
    expect(stderr).toContain('[debug]');
  });

  it('version command outputs version to stdout', async () => {
    const { stdout, code } = await runCli(['version']);
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('help command outputs help with options', async () => {
    const { stdout, code } = await runCli(['help']);
    expect(code).toBe(0);
    expect(stdout).toContain('--version');
    expect(stdout).toContain('--json');
    expect(stdout).toContain('--debug');
  });
});