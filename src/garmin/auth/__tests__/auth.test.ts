/**
 * Auth tests: tokenstore (load/save), session types.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isOAuth2Expired,
  loadTokenStore,
  saveTokenStore,
} from '../auth.js';
import type { GarminSession } from '../../types.js';

describe('auth tokenstore', () => {
  it('saveTokenStore creates directory and files oauth1_token.json, oauth2_token.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'garmin-cli-test-'));
    try {
      const session: GarminSession = {
        domain: 'garmin.com',
        oauth1: {
          oauth_token: 'oauth1-token',
          oauth_token_secret: 'oauth1-secret',
          domain: 'garmin.com',
        },
        oauth2: {
          scope: 'scope',
          jti: 'jti',
          token_type: 'Bearer',
          access_token: 'access',
          refresh_token: 'refresh',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token_expires_in: 86400,
          refresh_token_expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      };
      saveTokenStore(dir, session);
      const loaded = loadTokenStore(dir);
      expect(loaded).not.toBeNull();
      expect(loaded!.domain).toBe('garmin.com');
      expect(loaded!.oauth1.oauth_token).toBe('oauth1-token');
      expect(loaded!.oauth2.access_token).toBe('access');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('loadTokenStore returns null for nonexistent directory', () => {
    const loaded = loadTokenStore(join(tmpdir(), 'nonexistent-garmin-cli-' + Date.now()));
    expect(loaded).toBeNull();
  });

  it('isOAuth2Expired returns false for token with future expires_at', () => {
    const token = {
      scope: '',
      jti: '',
      token_type: 'Bearer',
      access_token: 'x',
      refresh_token: 'y',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token_expires_in: 86400,
      refresh_token_expires_at: Math.floor(Date.now() / 1000) + 86400,
    };
    expect(isOAuth2Expired(token)).toBe(false);
  });

  it('isOAuth2Expired returns true for token with expired expires_at', () => {
    const token = {
      scope: '',
      jti: '',
      token_type: 'Bearer',
      access_token: 'x',
      refresh_token: 'y',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) - 60,
      refresh_token_expires_in: 86400,
      refresh_token_expires_at: Math.floor(Date.now() / 1000) + 86400,
    };
    expect(isOAuth2Expired(token)).toBe(true);
  });
});
