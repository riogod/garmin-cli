/**
 * Garmin Connect authentication: SSO orchestration (Mobile + embed), OAuth exchange, session.
 * Single entry point: login(), ensureSession(), resumeLogin(), refreshOAuth2().
 * SSO details in sso-mobile, sso-embed; tokens in token-store; OAuth in oauth-exchange.
 */

import type { GarminConfig } from '../../lib/config.js';
import { debug } from '../../lib/debug.js';
import { exchangeOAuth2, getOAuth1Token, getOAuthConsumer } from './oauth-exchange.js';
import { getTicketViaEmbed, resumeEmbedMfa } from './sso-embed.js';
import { getTicketViaMobileApi, resumeMobileMfa } from './sso-mobile.js';
import { getMobileServiceUrl, MOBILE_OAUTH_CONSUMER } from './sso-urls.js';
import { isOAuth2Expired, loadTokenStore, saveTokenStore } from './token-store.js';
import type { GarminSession, NeedsMfaState } from '../types.js';
import { AuthError, MfaRequiredError } from './auth-error.js';

export {
  clearMfaState,
  clearTokenStore,
  isOAuth2Expired,
  loadMfaState,
  loadTokenStore,
  saveMfaState,
  saveTokenStore,
} from './token-store.js';

export {
  AuthError,
  InvalidCredentialsError,
  MfaCodeInvalidError,
  MfaRequiredError,
} from './auth-error.js';

export interface LoginOptions {
  returnOnMfa?: boolean;
  mfaCode?: string;
  timeout?: number;
}

/**
 * Performs login: Mobile API (or auto → embed on error), then OAuth1/OAuth2 and session save.
 * @returns Session or needsMfa when returnOnMfa is enabled and MFA is requested.
 */
export async function login(
  config: GarminConfig,
  options: LoginOptions = {}
): Promise<{ session: GarminSession } | { needsMfa: NeedsMfaState }> {
  const { returnOnMfa = false, mfaCode, timeout = 15_000 } = options;
  const domain = config.isCn ? 'garmin.cn' : 'garmin.com';
  const email = config.email?.trim();
  const password = config.password;
  if (!email || !password) {
    throw new AuthError(
      'Authentication required. Run: garmin login — or provide email and password in config or GARMIN_EMAIL, GARMIN_PASSWORD environment variables.'
    );
  }

  const strategy = config.authStrategy ?? 'auto';
  debug('login start', { domain, strategy, email: email ? `${email.slice(0, 3)}***` : undefined });

  if (strategy === 'mobile' || strategy === 'auto') {
    try {
      const mobileResult = await getTicketViaMobileApi(config, { returnOnMfa, mfaCode, timeout });
      if (mobileResult.type === 'mfa_required') {
        return { needsMfa: mobileResult.state };
      }
      const loginUrlMobile = getMobileServiceUrl(domain);
      const oauth1 = await getOAuth1Token(
        mobileResult.ticket,
        domain,
        MOBILE_OAUTH_CONSUMER,
        timeout,
        loginUrlMobile
      );
      const oauth2 = await exchangeOAuth2(oauth1, domain, MOBILE_OAUTH_CONSUMER, timeout);
      const session: GarminSession = { oauth1: { ...oauth1, domain }, oauth2, domain };
      if (config.tokenDir) saveTokenStore(config.tokenDir, session);
      debug('login done (mobile)', { domain, tokenDir: config.tokenDir || undefined });
      return { session };
    } catch (err) {
      if (strategy === 'mobile') throw err;
      debug('login mobile failed, fallback to embed', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const embedResult = await getTicketViaEmbed(config, { returnOnMfa, mfaCode, timeout });
  if (embedResult.type === 'mfa_required') {
    return { needsMfa: embedResult.state };
  }
  const consumer = await getOAuthConsumer();
  const oauth1 = await getOAuth1Token(embedResult.ticket, domain, consumer, timeout);
  const oauth2 = await exchangeOAuth2(oauth1, domain, consumer, timeout);
  const session: GarminSession = { oauth1: { ...oauth1, domain }, oauth2, domain };
  if (config.tokenDir) saveTokenStore(config.tokenDir, session);
  debug('login done (embed)', { domain, tokenDir: config.tokenDir || undefined });
  return { session };
}

/**
 * Completes login after MFA: retrieves ticket from state (mobile or embed) and performs OAuth exchange.
 */
export async function resumeLogin(
  state: NeedsMfaState,
  mfaCode: string,
  tokenDir?: string
): Promise<GarminSession> {
  const { domain } = state;

  if (state.source === 'mobile') {
    const { ticket } = await resumeMobileMfa(state, mfaCode, 15_000);
    const loginUrlMobile = getMobileServiceUrl(domain);
    const oauth1 = await getOAuth1Token(ticket, domain, MOBILE_OAUTH_CONSUMER, 15_000, loginUrlMobile);
    const oauth2 = await exchangeOAuth2(oauth1, domain, MOBILE_OAUTH_CONSUMER, 15_000);
    const session: GarminSession = { oauth1: { ...oauth1, domain }, oauth2, domain };
    if (tokenDir) saveTokenStore(tokenDir, session);
    return session;
  }

  const ticket = await resumeEmbedMfa(state, mfaCode, 15_000);
  const consumer = await getOAuthConsumer();
  const oauth1 = await getOAuth1Token(ticket, domain, consumer, 15_000);
  const oauth2 = await exchangeOAuth2(oauth1, domain, consumer, 15_000);
  const session: GarminSession = { oauth1: { ...oauth1, domain }, oauth2, domain };
  if (tokenDir) saveTokenStore(tokenDir, session);
  return session;
}

/**
 * Refreshes OAuth2 from OAuth1 (exchange). Used by client when access_token expires.
 */
export async function refreshOAuth2(
  session: GarminSession,
  tokenDir?: string
): Promise<GarminSession> {
  debug('refreshOAuth2');
  const consumer = await getOAuthConsumer();
  const oauth2 = await exchangeOAuth2(session.oauth1, session.domain, consumer, 15_000);
  const next: GarminSession = { ...session, oauth2 };
  if (tokenDir) saveTokenStore(tokenDir, next);
  return next;
}

/**
 * Returns a valid session: from tokenDir or after login. Refreshes if OAuth2 is expired.
 */
export async function ensureSession(
  config: GarminConfig,
  options: LoginOptions = {}
): Promise<GarminSession> {
  const tokenDir = config.tokenDir ?? '';
  let session = tokenDir ? loadTokenStore(tokenDir, config.isCn) : null;

  if (session && isOAuth2Expired(session.oauth2)) {
    debug('ensureSession OAuth2 expired, refreshing');
    try {
      session = await refreshOAuth2(session, tokenDir);
    } catch {
      session = null;
    }
  }

  if (!session) {
    debug('ensureSession no valid session, calling login');
    const result = await login(config, options);
    if ('needsMfa' in result) {
      throw new MfaRequiredError(
        'MFA required. Set GARMIN_MFA_CODE or run from interactive TTY.'
      );
    }
    return result.session;
  }
  return session;
}
