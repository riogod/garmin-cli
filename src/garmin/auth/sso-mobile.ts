/**
 * SSO via Garmin Mobile API (JSON): sign-in page → /mobile/api/login → [MFA] → serviceTicketId.
 * Alternative to embed widget; often not blocked by Cloudflare.
 * Based on prj/garmin-connect-client (authentication-service.ts).
 */

import axios from 'axios';
import type { GarminConfig } from '../../lib/config.js';
import { debug } from '../../lib/debug.js';
import { collectCookiesFromAxiosResponse, cookieHeader } from './sso-headers.js';
import {
  getMobileLoginApiUrl,
  getMobileMfaReferer,
  getMobileMfaVerifyUrl,
  getMobileSignInPageUrl,
  getMobileSignInReferer,
  getSsoDomain,
} from './sso-urls.js';
import { InvalidCredentialsError, MfaCodeInvalidError } from './auth-error.js';
import type { NeedsMfaState } from '../types.js';

/** User-Agent for Mobile SSO (iOS browser, as in garmin-connect-client). */
const USER_AGENT_MOBILE_IO =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function getSsoOrigin(domain: string): string {
  return `https://sso.${domain}`;
}

/**
 * Response from /mobile/api/login or /mobile/api/mfa/verifyCode.
 */
interface MobileLoginResponse {
  serviceTicketId?: string | null;
  serviceURL?: string | null;
  responseStatus?: { type: string; message?: string };
  customerMfaInfo?: {
    mfaLastMethodUsed?: string;
    defaultMfaMethod?: string | null;
  };
}

/**
 * Result of attempting to get ticket via Mobile API.
 */
export type MobileTicketResult =
  | { type: 'success'; ticket: string; cookies: string }
  | { type: 'mfa_required'; state: NeedsMfaState };

/**
 * MFA state for resume (mobile): domain + cookies + MFA method.
 * NeedsMfaState in types.ts is used for embed; for mobile we store additional method field.
 */
export interface MobileNeedsMfaState extends NeedsMfaState {
  mfaMethod?: 'email' | 'sms' | 'phone';
}

/**
 * Gets service ticket via Mobile API: GET sign-in → POST login → on MFA POST verifyCode.
 * Does not perform OAuth1/OAuth2 — only returns ticket and cookies (or MFA state).
 *
 * @param config — email, password, isCn
 * @param options — returnOnMfa, mfaCode, timeout
 * @returns ticket + cookies on success; mfa_required when MFA is requested
 */
export async function getTicketViaMobileApi(
  config: GarminConfig,
  options: { returnOnMfa?: boolean; mfaCode?: string; timeout?: number } = {}
): Promise<MobileTicketResult> {
  const { returnOnMfa = false, mfaCode, timeout = 15_000 } = options;
  const domain = getSsoDomain(config.isCn);
  const email = config.email?.trim();
  const password = config.password;
  if (!email || !password) {
    throw new Error('Login requires email and password');
  }

  const cookies = new Map<string, string>();
  const origin = getSsoOrigin(domain);

  const jsonHeaders = (referer: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    Origin: origin,
    Referer: referer,
    'User-Agent': process.env.GARMIN_UA?.trim() || USER_AGENT_MOBILE_IO,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  });

  // 1) GET sign-in page (establish session)
  const signInPageUrl = getMobileSignInPageUrl(domain);
  const ua = process.env.GARMIN_UA?.trim() || USER_AGENT_MOBILE_IO;
  let res = await axios.get(signInPageUrl, {
    headers: { 'User-Agent': ua },
    maxRedirects: 0,
    timeout,
    validateStatus: () => true,
  });
  collectCookiesFromAxiosResponse(res, cookies);
  debug('SSO mobile sign-in GET', { status: res.status, cookies: cookies.size });

  const referer = getMobileSignInReferer(domain);

  // 2) POST login
  const loginUrl = getMobileLoginApiUrl(domain);
  res = await axios.post(
    loginUrl,
    { username: email, password, rememberMe: true, captchaToken: '' },
    {
      headers: { ...jsonHeaders(referer), Cookie: cookieHeader(cookies) },
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
    }
  );
  collectCookiesFromAxiosResponse(res, cookies);
  let data: MobileLoginResponse;
  try {
    data = typeof res.data === 'object' && res.data !== null ? (res.data as MobileLoginResponse) : JSON.parse(String(res.data));
  } catch {
    throw new Error(`Mobile login failed: ${res.status} ${String(res.data)}`);
  }

  if (data.responseStatus?.type === 'INVALID_USERNAME_PASSWORD') {
    throw new InvalidCredentialsError(
      data.responseStatus?.message || 'Invalid email or password.'
    );
  }

  if (data.serviceTicketId) {
    return { type: 'success', ticket: data.serviceTicketId, cookies: cookieHeader(cookies) };
  }

  if (data.responseStatus?.type === 'MFA_REQUIRED') {
    const mfaMethod = (data.customerMfaInfo?.mfaLastMethodUsed || data.customerMfaInfo?.defaultMfaMethod || 'email')
      .toLowerCase();
    const state: MobileNeedsMfaState = {
      signinParams: {},
      cookies: cookieHeader(cookies),
      domain,
      csrf: '',
      source: 'mobile',
      mfaMethod: mfaMethod === 'sms' ? 'sms' : mfaMethod === 'phone' ? 'phone' : 'email',
    };
    if (returnOnMfa) {
      return { type: 'mfa_required', state };
    }
    const code = mfaCode ?? process.env.GARMIN_MFA_CODE?.trim();
    if (!code && !process.stdin.isTTY) {
      return { type: 'mfa_required', state };
    }
    const mfaCodeToUse = code || (await promptMfa());
    const mfaResult = await verifyMobileMfa(domain, cookieHeader(cookies), mfaCodeToUse, state.mfaMethod!, timeout);
    if (!mfaResult.serviceTicketId) {
      throw mobileMfaErrorFromResponse(mfaResult.responseStatus);
    }
    return { type: 'success', ticket: mfaResult.serviceTicketId, cookies: cookieHeader(cookies) };
  }

  throw new Error(
    data.responseStatus?.message || `Unexpected login response: ${data.responseStatus?.type ?? res.status}`
  );
}

async function promptMfa(): Promise<string> {
  const { createInterface } = await import('node:readline');
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question('MFA code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * POST /mobile/api/mfa/verifyCode with current cookies.
 */
async function verifyMobileMfa(
  domain: string,
  cookieStr: string,
  mfaCode: string,
  mfaMethod: 'email' | 'sms' | 'phone',
  timeout: number
): Promise<MobileLoginResponse> {
  const url = getMobileMfaVerifyUrl(domain);
  const referer = getMobileMfaReferer(domain);
  const origin = getSsoOrigin(domain);
  const res = await axios.post<MobileLoginResponse>(
    url,
    {
      mfaMethod,
      mfaVerificationCode: mfaCode,
      rememberMyBrowser: true,
      reconsentList: [],
      mfaSetup: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        Origin: origin,
        Referer: referer,
        Cookie: cookieStr,
        'User-Agent': process.env.GARMIN_UA?.trim() || USER_AGENT_MOBILE_IO,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
    }
  );
  const data = typeof res.data === 'object' && res.data !== null ? res.data : (JSON.parse(String(res.data)) as MobileLoginResponse);
  if (data.responseStatus?.type === 'MFA_CODE_INVALID') {
    throw new MfaCodeInvalidError(data.responseStatus?.message || 'Invalid MFA code.');
  }
  if (data.responseStatus?.type === 'SESSION_EXPIRED') {
    throw new MfaCodeInvalidError(
      data.responseStatus?.message || 'MFA session expired. Please login again.'
    );
  }
  return data;
}

/**
 * Creates MfaCodeInvalidError from Mobile API responseStatus (when no ticket after verify).
 */
function mobileMfaErrorFromResponse(
  responseStatus?: { type?: string; message?: string }
): MfaCodeInvalidError {
  const type = responseStatus?.type ?? '';
  const msg = responseStatus?.message;
  if (type === 'SESSION_EXPIRED') {
    return new MfaCodeInvalidError(msg || 'MFA session expired. Please login again.');
  }
  if (type === 'MFA_CODE_INVALID') {
    return new MfaCodeInvalidError(msg || 'Invalid MFA code.');
  }
  return new MfaCodeInvalidError(msg || 'MFA not accepted or session expired. Please login again.');
}

/**
 * Completes login after MFA (mobile): re-verification and returns ticket.
 * Used from resumeLogin for mobile state.
 */
export async function resumeMobileMfa(
  state: MobileNeedsMfaState,
  mfaCode: string,
  timeout = 15_000
): Promise<{ ticket: string; cookies: string }> {
  const res = await verifyMobileMfa(
    state.domain,
    state.cookies,
    mfaCode,
    state.mfaMethod ?? 'email',
    timeout
  );
  if (!res.serviceTicketId) {
    throw mobileMfaErrorFromResponse(res.responseStatus);
  }
  return { ticket: res.serviceTicketId, cookies: state.cookies };
}
