/**
 * CLI configuration: environment variables and XDG config file.
 * Priority: environment variables override file values.
 * Secrets are not hardcoded; source is env and user config.
 *
 * MFA (two-factor authentication): code is not stored in config. When MFA is requested,
 * login will prompt for code interactively (TTY) or from GARMIN_MFA_CODE variable
 * in non-interactive mode (implemented in auth, not here).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';

/** Configuration load result (email, password, tokens, region). */
export interface GarminConfig {
  /** Email for Garmin Connect login (if set). */
  email?: string;
  /** Password (if set; preferably not stored in file). */
  password?: string;
  /** Directory for storing session tokens (analogous to GARTH_HOME / ~/.garminconnect). */
  tokenDir?: string;
  /**
   * true — use garmin.cn domain (China), false — garmin.com (default).
   * Corresponds to is_cn in python-garminconnect / tmp_py_lib.
   */
  isCn?: boolean;
  /**
   * SSO strategy: "mobile" — Mobile API only (JSON), "embed" — embed widget only (garth),
   * "auto" — try mobile first, fallback to embed on error.
   */
  authStrategy?: 'mobile' | 'embed' | 'auto';
  /**
   * HTTP request timeout in milliseconds (default 60000).
   * Environment variable GARMIN_REQUEST_TIMEOUT.
   */
  requestTimeout?: number;
}

/** Application name in XDG / APPDATA paths. */
const APP_DIR_NAME = 'garmin-cli';
const CONFIG_FILE_NAME = 'config.json';

/**
 * Returns the path to the application configuration directory (settings, not secrets).
 * XDG: $XDG_CONFIG_HOME/garmin-cli or ~/.config/garmin-cli; Windows: %APPDATA%\garmin-cli.
 * @returns Absolute path to config directory
 */
export function getConfigDir(): string {
  if (platform() === 'win32') {
    const base = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(base, APP_DIR_NAME);
  }
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
  return join(base, APP_DIR_NAME);
}

/**
 * Returns the path to the application data directory (tokens, cache, session state).
 * XDG: $XDG_DATA_HOME/garmin-cli or ~/.local/share/garmin-cli; Windows: %APPDATA%\garmin-cli.
 * Used by default for tokenDir to avoid mixing secrets with config.
 * @returns Absolute path to data directory
 */
export function getDataDir(): string {
  if (platform() === 'win32') {
    const base = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
    return join(base, APP_DIR_NAME);
  }
  const base = process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
  return join(base, APP_DIR_NAME);
}

/**
 * Returns the path to config.json file in the configuration directory.
 * @returns Absolute path to config.json
 */
export function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE_NAME);
}

/**
 * Parses boolean value from env or JSON (for isCn).
 * true: "true", "1", "yes" (case-insensitive); otherwise false.
 */
function parseBoolean(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * Loads configuration: first from file (if exists), then override from env.
 * Environment variables: GARMIN_EMAIL, GARMIN_PASSWORD, GARMIN_TOKEN_DIR, GARMIN_IS_CN.
 * MFA code is not part of config — only interactive input or GARMIN_MFA_CODE during login.
 * @returns Configuration object (fields may be unset)
 */
export function loadConfig(): GarminConfig {
  const timeoutEnv = process.env.GARMIN_REQUEST_TIMEOUT;
  const timeoutMs =
    timeoutEnv !== undefined && timeoutEnv !== '' ? parseInt(timeoutEnv, 10) : undefined;
  const fromEnv: GarminConfig = {
    email: process.env.GARMIN_EMAIL,
    password: process.env.GARMIN_PASSWORD,
    tokenDir: process.env.GARMIN_TOKEN_DIR,
    requestTimeout: Number.isFinite(timeoutMs) && (timeoutMs as number) > 0 ? timeoutMs : undefined,
    isCn:
      process.env.GARMIN_IS_CN !== undefined && process.env.GARMIN_IS_CN !== ''
        ? parseBoolean(process.env.GARMIN_IS_CN)
        : undefined,
    authStrategy:
      process.env.GARMIN_AUTH_STRATEGY === 'mobile' || process.env.GARMIN_AUTH_STRATEGY === 'embed'
        ? process.env.GARMIN_AUTH_STRATEGY
        : process.env.GARMIN_AUTH_STRATEGY === 'auto'
          ? 'auto'
          : undefined,
  };

  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    const tokenDir = fromEnv.tokenDir ?? getDataDir();
    const authStrategy = fromEnv.authStrategy ?? 'auto';
    return stripUndefined({ ...fromEnv, tokenDir, authStrategy });
  }

  let fromFile: GarminConfig = {};
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      const fileIsCn =
        typeof parsed.isCn === 'boolean'
          ? parsed.isCn
          : typeof parsed.isCn === 'string'
            ? parseBoolean(parsed.isCn)
            : undefined;
      const fileTimeout =
        typeof parsed.requestTimeout === 'number' && Number.isFinite(parsed.requestTimeout)
          ? parsed.requestTimeout
          : undefined;
      fromFile = {
        email: typeof parsed.email === 'string' ? parsed.email : undefined,
        password: typeof parsed.password === 'string' ? parsed.password : undefined,
        tokenDir: typeof parsed.tokenDir === 'string' ? parsed.tokenDir : undefined,
        requestTimeout: fileTimeout,
        isCn: fileIsCn,
        authStrategy:
          parsed.authStrategy === 'mobile' || parsed.authStrategy === 'embed' || parsed.authStrategy === 'auto'
            ? parsed.authStrategy
            : undefined,
      };
    }
  } catch {
    // Invalid or inaccessible file — use only env, default tokenDir
    const tokenDir = fromEnv.tokenDir ?? getDataDir();
    return stripUndefined({ ...fromEnv, tokenDir });
  }

  // Env overrides file; default tokenDir is data directory (XDG_DATA_HOME), not config
  const tokenDir =
    fromEnv.tokenDir ?? fromFile.tokenDir ?? getDataDir();
  const isCn = fromEnv.isCn ?? fromFile.isCn;
  const authStrategy = fromEnv.authStrategy ?? fromFile.authStrategy ?? 'auto';
  const mergedRequestTimeout = fromEnv.requestTimeout ?? fromFile.requestTimeout;
  return stripUndefined({
    email: fromEnv.email ?? fromFile.email,
    password: fromEnv.password ?? fromFile.password,
    tokenDir,
    requestTimeout: mergedRequestTimeout,
    isCn: isCn === true ? true : isCn === false ? false : undefined,
    authStrategy,
  });
}

/**
 * Removes undefined fields from object (for clean return).
 */
function stripUndefined(c: GarminConfig): GarminConfig {
  const out: GarminConfig = {};
  if (c.email !== undefined) out.email = c.email;
  if (c.password !== undefined) out.password = c.password;
  if (c.tokenDir !== undefined) out.tokenDir = c.tokenDir;
  if (c.requestTimeout !== undefined) out.requestTimeout = c.requestTimeout;
  if (c.isCn !== undefined) out.isCn = c.isCn;
  if (c.authStrategy !== undefined) out.authStrategy = c.authStrategy;
  return out;
}
