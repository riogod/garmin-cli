/**
 * OAuth 1.0a preauthorized and exchange to OAuth2.
 * Consumer keys are loaded from thegarth (or cached); used in Mobile and embed flows.
 */

import axios from 'axios';
import { debug } from '../../lib/debug.js';
import { buildOAuth1AuthHeader } from './oauth1.js';
import { getOAuthUserAgent } from './sso-headers.js';
import { getMobileServiceUrl } from './sso-urls.js';
import type { OAuth1Token, OAuth2Token } from '../types.js';

const OAUTH_CONSUMER_URL = 'https://thegarth.s3.amazonaws.com/oauth_consumer.json';

let oauthConsumer: { consumer_key: string; consumer_secret: string } | null = null;

/**
 * Returns OAuth consumer (embed widget keys). Caches after first load.
 */
export async function getOAuthConsumer(): Promise<{
  consumer_key: string;
  consumer_secret: string;
}> {
  if (oauthConsumer) return oauthConsumer;
  const res = await axios.get<{ consumer_key?: string; consumer_secret?: string }>(OAUTH_CONSUMER_URL);
  const json = res.data;
  if (!json?.consumer_key || !json?.consumer_secret) {
    throw new Error('Invalid OAuth consumer format');
  }
  oauthConsumer = { consumer_key: json.consumer_key, consumer_secret: json.consumer_secret };
  return oauthConsumer;
}

export interface OAuthConsumerKeys {
  consumer_key: string;
  consumer_secret: string;
}

/**
 * Gets OAuth1 token by ticket (preauthorized).
 * @param loginUrlOverride — for Mobile API pass getMobileServiceUrl(domain), otherwise sso/embed.
 */
export async function getOAuth1Token(
  ticket: string,
  domain: string,
  consumer: OAuthConsumerKeys,
  timeout: number,
  loginUrlOverride?: string
): Promise<OAuth1Token> {
  const loginUrl = loginUrlOverride ?? `https://sso.${domain}/sso/embed`;
  const baseUrl = `https://connectapi.${domain}/oauth-service/oauth`;
  const url = `${baseUrl}/preauthorized?ticket=${encodeURIComponent(ticket)}&login-url=${encodeURIComponent(loginUrl)}&accepts-mfa-tokens=true`;
  const authHeader = buildOAuth1AuthHeader('GET', url, {}, {
    consumerKey: consumer.consumer_key,
    consumerSecret: consumer.consumer_secret,
  });
  const res = await axios.get<string>(url, {
    headers: { 'User-Agent': getOAuthUserAgent(), Authorization: authHeader },
    timeout,
    responseType: 'text',
  });
  debug('OAuth1 preauthorized', { status: res.status, url: url.slice(0, 80) });
  if (res.status >= 400) throw new Error(`Preauthorized failed: ${res.status} ${res.data}`);
  const params = new URLSearchParams(res.data);
  const oauthToken = params.get('oauth_token');
  const oauthTokenSecret = params.get('oauth_token_secret');
  if (!oauthToken || !oauthTokenSecret) {
    throw new Error('No oauth_token/oauth_token_secret in preauthorized response');
  }
  const token: OAuth1Token = {
    oauth_token: oauthToken,
    oauth_token_secret: oauthTokenSecret,
    domain,
  };
  const mfaToken = params.get('mfa_token');
  if (mfaToken) token.mfa_token = mfaToken;
  return token;
}

/**
 * Exchanges OAuth1 for OAuth2 (access_token, refresh_token).
 */
export async function exchangeOAuth2(
  oauth1: OAuth1Token,
  domain: string,
  consumer: OAuthConsumerKeys,
  timeout: number
): Promise<OAuth2Token> {
  const baseUrl = `https://connectapi.${domain}/oauth-service/oauth`;
  const url = `${baseUrl}/exchange/user/2.0`;
  const body: Record<string, string> = {};
  if (oauth1.mfa_token) body.mfa_token = oauth1.mfa_token;
  const authHeader = buildOAuth1AuthHeader('POST', url, body, {
    consumerKey: consumer.consumer_key,
    consumerSecret: consumer.consumer_secret,
    token: oauth1.oauth_token,
    tokenSecret: oauth1.oauth_token_secret,
  });
  const res = await axios.post<Record<string, unknown>>(url, new URLSearchParams(body), {
    headers: {
      'User-Agent': getOAuthUserAgent(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authHeader,
    },
    timeout,
  });
  debug('OAuth2 exchange', { status: res.status });
  if (res.status >= 400) throw new Error(`Exchange failed: ${res.status} ${JSON.stringify(res.data)}`);
  const raw = res.data;
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(raw.expires_in) || 0;
  const refreshExpiresIn = Number(raw.refresh_token_expires_in) || 0;
  return {
    scope: String(raw.scope ?? ''),
    jti: String(raw.jti ?? ''),
    token_type: String(raw.token_type ?? 'Bearer'),
    access_token: String(raw.access_token ?? ''),
    refresh_token: String(raw.refresh_token ?? ''),
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    refresh_token_expires_in: refreshExpiresIn,
    refresh_token_expires_at: now + refreshExpiresIn,
  };
}
