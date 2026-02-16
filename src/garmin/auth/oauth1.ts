/**
 * OAuth 1.0a HMAC-SHA1 request signing.
 * Used for preauthorized and exchange in Garmin SSO (based on garth/requests_oauthlib).
 */

import { createHmac, randomBytes } from 'node:crypto';

/** Parameters for signing: consumer + optional resource owner (token). */
export interface OAuth1Params {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
}

/**
 * Builds Authorization header for OAuth 1.0a (HMAC-SHA1).
 * @param method — HTTP method (GET, POST, …)
 * @param url — full request URL
 * @param params — query/body parameters (without oauth_*)
 * @param oauth — consumer keys and optional token
 * @returns String for Authorization header
 */
export function buildOAuth1AuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  oauth: OAuth1Params
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: oauth.consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_version: '1.0',
  };
  if (oauth.token) {
    oauthParams.oauth_token = oauth.token;
  }

  const allParams = { ...params, ...oauthParams };
  const baseString = buildSignatureBaseString(method, url, allParams);
  const signingKey = [oauth.consumerSecret, oauth.tokenSecret ?? ''].map(encodeURIComponent).join('&');
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;

  const parts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k]!)}"`);
  return `OAuth ${parts.join(', ')}`;
}

/**
 * Builds signature base string (OAuth 1.0a).
 */
function buildSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const parsed = new URL(url);
  const normalizedUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  const allEntries: [string, string][] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      allEntries.push([encodeURIComponent(k), encodeURIComponent(v)]);
    }
  }
  for (const [k, v] of parsed.searchParams.entries()) {
    allEntries.push([encodeURIComponent(k), encodeURIComponent(v)]);
  }
  allEntries.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
  const paramString = allEntries.map(([k, v]) => `${k}=${v}`).join('&');
  return [method.toUpperCase(), encodeURIComponent(normalizedUrl), encodeURIComponent(paramString)].join('&');
}
