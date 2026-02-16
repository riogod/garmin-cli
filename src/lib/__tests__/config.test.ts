import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { getConfigDir, getConfigPath, getDataDir, loadConfig } from '../config.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.mocked(existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfigDir', () => {
    it('returns path ending with garmin-cli', () => {
      const dir = getConfigDir();
      expect(dir).toMatch(/garmin-cli$/);
    });
  });

  describe('getConfigPath', () => {
    it('returns path to config.json inside config directory', () => {
      const path = getConfigPath();
      expect(path).toMatch(/garmin-cli[\\/]config\.json$/);
    });
  });

  describe('getDataDir', () => {
    it('returns path ending with garmin-cli', () => {
      const dir = getDataDir();
      expect(dir).toMatch(/garmin-cli$/);
    });

    it('on Unix uses XDG_DATA_HOME when set', () => {
      process.env.XDG_DATA_HOME = '/custom/data';
      const dir = getDataDir();
      expect(dir).toBe('/custom/data/garmin-cli');
    });
  });

  describe('loadConfig', () => {
    it('reads GARMIN_EMAIL and GARMIN_PASSWORD from env', () => {
      process.env.GARMIN_EMAIL = 'u@example.com';
      process.env.GARMIN_PASSWORD = 'secret';
      const config = loadConfig();
      expect(config.email).toBe('u@example.com');
      expect(config.password).toBe('secret');
    });

    it('reads GARMIN_TOKEN_DIR from env', () => {
      process.env.GARMIN_TOKEN_DIR = '/tmp/garmin-tokens';
      const config = loadConfig();
      expect(config.tokenDir).toBe('/tmp/garmin-tokens');
    });

    it('reads GARMIN_REQUEST_TIMEOUT from env (number, ms)', () => {
      process.env.GARMIN_REQUEST_TIMEOUT = '90000';
      const config = loadConfig();
      expect(config.requestTimeout).toBe(90000);
    });

    it('ignores invalid GARMIN_REQUEST_TIMEOUT', () => {
      process.env.GARMIN_REQUEST_TIMEOUT = 'not-a-number';
      const config = loadConfig();
      expect(config.requestTimeout).toBeUndefined();
    });

    it('without env and without file returns only default tokenDir (getDataDir)', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      delete process.env.GARMIN_EMAIL;
      delete process.env.GARMIN_PASSWORD;
      delete process.env.GARMIN_TOKEN_DIR;
      const config = loadConfig();
      expect(config.email).toBeUndefined();
      expect(config.password).toBeUndefined();
      expect(config.tokenDir).toBe(getDataDir());
    });

    it('when config file exists merges file and env (env takes priority)', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          email: 'file@example.com',
          tokenDir: '/from/file',
        })
      );
      process.env.GARMIN_EMAIL = 'env@example.com';
      const config = loadConfig();
      expect(config.email).toBe('env@example.com');
      expect(config.tokenDir).toBe('/from/file');
    });

    it('ignores invalid JSON in file and uses only env', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('not json');
      process.env.GARMIN_TOKEN_DIR = '/env-tokens';
      const config = loadConfig();
      expect(config.tokenDir).toBe('/env-tokens');
    });

    it('if tokenDir not set in env or file, uses getDataDir()', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ email: 'file@example.com' })
      );
      delete process.env.GARMIN_TOKEN_DIR;
      const config = loadConfig();
      expect(config.tokenDir).toBe(getDataDir());
    });

    it('reads GARMIN_IS_CN from env (true/1/yes => true)', () => {
      process.env.GARMIN_IS_CN = 'true';
      expect(loadConfig().isCn).toBe(true);
      process.env.GARMIN_IS_CN = '1';
      expect(loadConfig().isCn).toBe(true);
      process.env.GARMIN_IS_CN = 'yes';
      expect(loadConfig().isCn).toBe(true);
      process.env.GARMIN_IS_CN = 'false';
      expect(loadConfig().isCn).toBe(false);
      delete process.env.GARMIN_IS_CN;
      expect(loadConfig().isCn).toBeUndefined();
    });

    it('reads isCn from config file (boolean or string)', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ isCn: true })
      );
      expect(loadConfig().isCn).toBe(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ isCn: false })
      );
      expect(loadConfig().isCn).toBe(false);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ isCn: 'yes' })
      );
      expect(loadConfig().isCn).toBe(true);
    });

    it('env GARMIN_IS_CN overrides isCn from file', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ isCn: true })
      );
      process.env.GARMIN_IS_CN = 'false';
      expect(loadConfig().isCn).toBe(false);
    });

    it('default authStrategy = auto (Mobile API first, then embed on error)', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      delete process.env.GARMIN_AUTH_STRATEGY;
      expect(loadConfig().authStrategy).toBe('auto');
    });

    it('reads GARMIN_AUTH_STRATEGY from env (mobile, embed, auto)', () => {
      process.env.GARMIN_AUTH_STRATEGY = 'mobile';
      expect(loadConfig().authStrategy).toBe('mobile');
      process.env.GARMIN_AUTH_STRATEGY = 'embed';
      expect(loadConfig().authStrategy).toBe('embed');
      process.env.GARMIN_AUTH_STRATEGY = 'auto';
      expect(loadConfig().authStrategy).toBe('auto');
    });
  });
});
