/**
 * SSO via Garmin embed widget (garth-style): embed → signin → [MFA] → ticket.
 * Alternative to Mobile API; used as fallback with strategy auto.
 */

import { createInterface } from 'node:readline';
import axios from 'axios';
import type { GarminConfig } from '../../lib/config.js';
import { debug } from '../../lib/debug.js';
import {
  collectCookiesFromAxiosResponse,
  cookieHeader,
  getCsrfToken,
  getSsoHeaders,
  getTitle,
  getTicketFromResponse,
} from './sso-headers.js';
import { InvalidCredentialsError, MfaCodeInvalidError } from './auth-error.js';
import type { NeedsMfaState } from '../types.js';

/**
 * Result of getting ticket via embed: either ticket, or MFA required.
 */
export type EmbedTicketResult =
  | { type: 'success'; ticket: string }
  | { type: 'mfa_required'; state: NeedsMfaState };

/**
 * Gets service ticket via embed widget: GET embed → GET signin → POST signin → [POST verifyMFA] → ticket.
 * Does not perform OAuth1/OAuth2 — only returns ticket (or MFA state).
 *
 * @param config — email, password, isCn
 * @param options — returnOnMfa, mfaCode, timeout
 */
export async function getTicketViaEmbed(
  config: GarminConfig,
  options: { returnOnMfa?: boolean; mfaCode?: string; timeout?: number } = {}
): Promise<EmbedTicketResult> {
  const { returnOnMfa = false, mfaCode, timeout = 15_000 } = options;
  const domain = config.isCn ? 'garmin.cn' : 'garmin.com';
  const email = config.email?.trim();
  const password = config.password;
  if (!email || !password) {
    throw new Error('Login requires email and password (config or GARMIN_EMAIL, GARMIN_PASSWORD)');
  }

  const cookies = new Map<string, string>();
  const ssoBase = `https://sso.${domain}/sso`;
  const embedUrl = `${ssoBase}/embed`;
  const signinParams: Record<string, string> = {
    id: 'gauth-widget',
    embedWidget: 'true',
    gauthHost: embedUrl,
    service: embedUrl,
    source: embedUrl,
    redirectAfterAccountLoginUrl: embedUrl,
    redirectAfterAccountCreationUrl: embedUrl,
  };

  let res = await axios.get(
    `${embedUrl}?${new URLSearchParams({ id: 'gauth-widget', embedWidget: 'true', gauthHost: ssoBase })}`,
    { headers: getSsoHeaders(), maxRedirects: 0, timeout, validateStatus: () => true, responseType: 'text' }
  );
  collectCookiesFromAxiosResponse(res, cookies);
  let firstHtml = typeof res.data === 'string' ? res.data : String(res.data);
  debug('SSO embed', { status: res.status, cookies: cookies.size, title: getTitle(firstHtml).slice(0, 40) });
  if (getTitle(firstHtml).includes('Cloudflare')) {
    throw new Error(
      'Garmin returned Cloudflare page (bot protection). Try: different connection (home network/VPN), retry later, or login via browser and copy tokens from GARTH_HOME.'
    );
  }

  const signinGetUrl = `${ssoBase}/signin?${new URLSearchParams(signinParams)}`;
  res = await axios.get(signinGetUrl, {
    headers: { ...getSsoHeaders(), Cookie: cookieHeader(cookies) },
    maxRedirects: 0,
    timeout,
    validateStatus: () => true,
    responseType: 'text',
  });
  collectCookiesFromAxiosResponse(res, cookies);
  let signinHtml = typeof res.data === 'string' ? res.data : String(res.data);
  debug('SSO signin GET', { status: res.status, title: getTitle(signinHtml).slice(0, 50) });
  if (getTitle(signinHtml).includes('Cloudflare')) {
    throw new Error(
      'Garmin returned Cloudflare page (bot protection). Try a different connection or retry later.'
    );
  }
  const csrfToken = getCsrfToken(signinHtml);

  res = await axios.post(
    `${ssoBase}/signin`,
    new URLSearchParams({ username: email, password, embed: 'true', _csrf: csrfToken }).toString(),
    {
      headers: {
        ...getSsoHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader(cookies),
        Referer: signinGetUrl,
        Origin: `https://sso.${domain}`,
      },
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
      responseType: 'text',
    }
  );
  collectCookiesFromAxiosResponse(res, cookies);

  // On 302, follow Location and get final page body (Success / MFA)
  let html: string;
  if (res.status === 302 && res.headers.location) {
    const location = String(res.headers.location).trim();
    const redirectUrl = location.startsWith('http') ? location : `https://sso.${domain}${location.startsWith('/') ? '' : '/'}${location}`;
    const redirectRes = await axios.get(redirectUrl, {
      headers: { ...getSsoHeaders(), Cookie: cookieHeader(cookies) },
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
      responseType: 'text',
    });
    collectCookiesFromAxiosResponse(redirectRes, cookies);
    html = typeof redirectRes.data === 'string' ? redirectRes.data : String(redirectRes.data);
    debug('SSO signin POST 302 follow', { status: redirectRes.status, title: getTitle(html).slice(0, 50) });
  } else {
    html = typeof res.data === 'string' ? res.data : String(res.data);
  }
  let title = getTitle(html);
  debug('SSO signin POST', { status: res.status, title: title.slice(0, 50) });

  if (title.includes('Cloudflare')) {
    throw new Error(
      'After submitting login/password, Garmin returned Cloudflare page. Try: different connection (home network, different VPN); or different UA: GARMIN_UA="Mozilla/5.0 ..." (Chrome)'
    );
  }

  if (title.includes('MFA') || title.toLowerCase().includes('mfa')) {
    debug('SSO MFA required', { returnOnMfa });
    if (returnOnMfa) {
      return {
        type: 'mfa_required',
        state: {
          signinParams,
          cookies: cookieHeader(cookies),
          domain,
          csrf: getCsrfToken(html),
          source: 'embed',
        },
      };
    }
    const mfaCodeToUse = mfaCode ?? process.env.GARMIN_MFA_CODE?.trim();
    let code: string;
    if (mfaCodeToUse) code = mfaCodeToUse;
    else if (process.stdin.isTTY) code = await promptMfa();
    else throw new Error('MFA code required. Set GARMIN_MFA_CODE or run in interactive mode.');
    const csrfMfa = getCsrfToken(html);
    res = await axios.post(
      `${ssoBase}/verifyMFA/loginEnterMfaCode`,
      new URLSearchParams({
        'mfa-code': code,
        embed: 'true',
        _csrf: csrfMfa,
        fromPage: 'setupEnterMfaCode',
      }).toString(),
      {
        headers: {
          ...getSsoHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader(cookies),
          Referer: signinGetUrl,
          Origin: `https://sso.${domain}`,
        },
        maxRedirects: 0,
        timeout,
        validateStatus: () => true,
        responseType: 'text',
      }
    );
    html = typeof res.data === 'string' ? res.data : String(res.data);
    title = getTitle(html);
    debug('SSO verifyMFA POST', { status: res.status, title: title.slice(0, 50) });
  }

  if (title !== 'Success') {
    if (/GARMIN\s+Authentication|Sign\s*In/i.test(title)) {
      throw new InvalidCredentialsError('Invalid email or password.');
    }
    throw new MfaCodeInvalidError(
      `Login failed: server returned "${title}". Invalid MFA code or session expired — please login again.`
    );
  }

  const ticket = getTicketFromResponse(html);
  debug('SSO ticket received', { ticketLength: ticket.length });
  return { type: 'success', ticket };
}

/**
 * Completes embed login after MFA: POST verifyMFA → ticket.
 */
export async function resumeEmbedMfa(
  state: NeedsMfaState,
  mfaCode: string,
  timeout = 15_000
): Promise<string> {
  const { signinParams, csrf, cookies: cookieStr, domain } = state;
  const ssoBase = `https://sso.${domain}/sso`;
  const signinGetUrl = `${ssoBase}/signin?${new URLSearchParams(signinParams)}`;

  const res = await axios.post(
    `${ssoBase}/verifyMFA/loginEnterMfaCode`,
    new URLSearchParams({
      'mfa-code': mfaCode,
      embed: 'true',
      _csrf: csrf,
      fromPage: 'setupEnterMfaCode',
    }).toString(),
    {
      headers: {
        ...getSsoHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieStr,
        Referer: signinGetUrl,
        Origin: `https://sso.${domain}`,
      },
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
      responseType: 'text',
    }
  );
  const html = typeof res.data === 'string' ? res.data : String(res.data);
  const title = getTitle(html);
  if (title !== 'Success') {
    throw new MfaCodeInvalidError(
      title && /Sign\s*In|Authentication/i.test(title)
        ? 'MFA session expired or invalid MFA code. Please login again.'
        : `MFA not accepted: ${title}. Check code or login again.`
    );
  }
  return getTicketFromResponse(html);
}

function promptMfa(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question('MFA code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
