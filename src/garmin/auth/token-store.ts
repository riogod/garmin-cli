/**
 * Garmin session storage: load/save tokens to tokenDir, check OAuth2 expiration.
 * Single source of truth for tokenstore (oauth1_token.json, oauth2_token.json).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { debug } from '../../lib/debug.js';
import { getSsoDomain } from './sso-urls.js';
import type { GarminSession, NeedsMfaState, OAuth1Token, OAuth2Token } from '../types.js';

const MFA_STATE_FILE = 'mfa_state.json';

/**
 * Loads session from tokenDir directory (oauth1_token.json + oauth2_token.json).
 * @param tokenDir — path to token directory
 * @param isCn — true for garmin.cn (used as domain when missing from file)
 * @returns Session or null if files are missing/invalid
 */
export function loadTokenStore(tokenDir: string, isCn?: boolean): GarminSession | null {
  const oauth1Path = join(tokenDir, 'oauth1_token.json');
  const oauth2Path = join(tokenDir, 'oauth2_token.json');
  if (!existsSync(oauth1Path) || !existsSync(oauth2Path)) {
    debug('loadTokenStore miss', { tokenDir });
    return null;
  }
  try {
    const oauth1 = JSON.parse(readFileSync(oauth1Path, 'utf-8')) as OAuth1Token;
    const oauth2 = JSON.parse(readFileSync(oauth2Path, 'utf-8')) as OAuth2Token;
    if (!oauth1.oauth_token || !oauth1.oauth_token_secret || !oauth2.access_token) return null;
    const domain = oauth1.domain ?? getSsoDomain(isCn);
    debug('loadTokenStore hit', { tokenDir, domain });
    return { oauth1: { ...oauth1, domain }, oauth2, domain };
  } catch {
    return null;
  }
}

/**
 * Saves session to tokenDir (creates directory if needed).
 * @param tokenDir — path to data directory
 * @param session — current session
 */
export function saveTokenStore(tokenDir: string, session: GarminSession): void {
  mkdirSync(tokenDir, { recursive: true });
  writeFileSync(
    join(tokenDir, 'oauth1_token.json'),
    JSON.stringify({ ...session.oauth1, domain: session.domain }, null, 2),
    'utf-8'
  );
  writeFileSync(
    join(tokenDir, 'oauth2_token.json'),
    JSON.stringify(session.oauth2, null, 2),
    'utf-8'
  );
  debug('saveTokenStore', { tokenDir, domain: session.domain });
}

/**
 * Deletes saved session from tokenDir (oauth1_token.json, oauth2_token.json).
 * Used by logout command. Does not throw if files don't exist.
 * @param tokenDir — path to token directory
 */
export function clearTokenStore(tokenDir: string): void {
  const oauth1Path = join(tokenDir, 'oauth1_token.json');
  const oauth2Path = join(tokenDir, 'oauth2_token.json');
  if (existsSync(oauth1Path)) {
    unlinkSync(oauth1Path);
    debug('clearTokenStore', { removed: 'oauth1_token.json', tokenDir });
  }
  if (existsSync(oauth2Path)) {
    unlinkSync(oauth2Path);
    debug('clearTokenStore', { removed: 'oauth2_token.json', tokenDir });
  }
}

/**
 * Saves MFA state (for step-by-step login) to tokenDir.
 * @param tokenDir — path to data directory
 * @param state — needsMfa state from login(..., { returnOnMfa: true })
 */
export function saveMfaState(tokenDir: string, state: NeedsMfaState): void {
  mkdirSync(tokenDir, { recursive: true });
  const path = join(tokenDir, MFA_STATE_FILE);
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8');
  debug('saveMfaState', { tokenDir, source: state.source });
}

/**
 * Loads saved MFA state from tokenDir (for login manual mfa command).
 * @param tokenDir — path to data directory
 * @returns State or null if file is missing/invalid
 */
export function loadMfaState(tokenDir: string): NeedsMfaState | null {
  const path = join(tokenDir, MFA_STATE_FILE);
  if (!existsSync(path)) {
    debug('loadMfaState miss', { tokenDir });
    return null;
  }
  try {
    const raw = readFileSync(path, 'utf-8');
    const state = JSON.parse(raw) as NeedsMfaState;
    if (!state || typeof state !== 'object' || !state.domain || !state.cookies) return null;
    debug('loadMfaState hit', { tokenDir, source: state.source });
    return state;
  } catch {
    return null;
  }
}

/**
 * Deletes saved MFA state from tokenDir (after successful resumeLogin or on logout).
 * @param tokenDir — path to data directory
 */
export function clearMfaState(tokenDir: string): void {
  const path = join(tokenDir, MFA_STATE_FILE);
  if (existsSync(path)) {
    unlinkSync(path);
    debug('clearMfaState', { tokenDir });
  }
}

/**
 * Checks if access_token is expired (with marginSeconds buffer before actual expiration).
 * @param token — OAuth2 token
 * @param marginSeconds — buffer in seconds (default 60)
 */
export function isOAuth2Expired(token: OAuth2Token, marginSeconds = 60): boolean {
  return token.expires_at - marginSeconds < Math.floor(Date.now() / 1000);
}
