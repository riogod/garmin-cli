/**
 * Types for Garmin Connect API: session tokens and responses.
 * Match garth structures (OAuth1Token, OAuth2Token) for tokenstore compatibility.
 */

/** OAuth1 token (long-lived, ~1 year). Stored in oauth1_token.json. */
export interface OAuth1Token {
  oauth_token: string;
  oauth_token_secret: string;
  mfa_token?: string | null;
  mfa_expiration_timestamp?: string | null;
  /** Domain: garmin.com or garmin.cn */
  domain?: string | null;
}

/** OAuth2 token (access + refresh). Stored in oauth2_token.json. */
export interface OAuth2Token {
  scope: string;
  jti: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  /** Unix timestamp (seconds) when access_token expires */
  expires_at: number;
  refresh_token_expires_in: number;
  /** Unix timestamp (seconds) when refresh_token expires */
  refresh_token_expires_at: number;
}

/** Session after successful login: both tokens and domain. */
export interface GarminSession {
  oauth1: OAuth1Token;
  oauth2: OAuth2Token;
  domain: string;
}

/** "MFA required" state for subsequent call with code. */
export interface NeedsMfaState {
  signinParams: Record<string, string>;
  cookies: string;
  domain: string;
  /** CSRF from MFA page for POST verifyMFA (embed). */
  csrf: string;
  /** Source: embed (widget) or mobile (Mobile API). */
  source?: 'embed' | 'mobile';
  /** MFA method for mobile: email | sms | phone. */
  mfaMethod?: 'email' | 'sms' | 'phone';
}

/** Login result: either session or MFA request. */
export type LoginResult = { session: GarminSession } | { needsMfa: NeedsMfaState };