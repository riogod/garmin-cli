/**
 * Headers and utilities for Garmin SSO: User-Agent, cookies, HTML response parsing (CSRF, ticket).
 * Used in embed flow and optionally in Mobile API.
 */

/** Default SSO User-Agent (mobile app, often passes Cloudflare). */
const SSO_UA_DEFAULT = 'com.garmin.android.apps.connectmobile';
/** User-Agent for OAuth (preauthorized, exchange). */
const OAUTH_UA_DEFAULT = 'com.garmin.android.apps.connectmobile';

/** GARMIN_UA variable overrides SSO and OAuth. */
export function getSsoUserAgent(): string {
  const env = process.env.GARMIN_UA?.trim();
  return env || SSO_UA_DEFAULT;
}

export function getOAuthUserAgent(): string {
  const env = process.env.GARMIN_UA?.trim();
  return env || OAUTH_UA_DEFAULT;
}

/**
 * Headers for SSO (embed: signin, verifyMFA). With mobile UA — minimal fields.
 */
export function getSsoHeaders(): Record<string, string> {
  const ua = getSsoUserAgent();
  const isMobileUa = !ua.includes('Mozilla');
  return {
    'User-Agent': ua,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...(isMobileUa
      ? {}
      : {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        }),
  };
}

/**
 * Parses a single Set-Cookie line (name=value; Path=/; ...). Per spec, attributes after ; are not sent in Cookie.
 */
export function parseOneSetCookie(header: string): [string, string] | null {
  const [pair] = header.split(';').map((s) => s.trim());
  const eq = pair.indexOf('=');
  if (eq <= 0) return null;
  return [pair.slice(0, eq).trim(), pair.slice(eq + 1).trim()];
}

/** Collects cookies from response headers (set-cookie — string or string array). */
export function collectCookiesFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  cookies: Map<string, string>
): void {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return;
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const header of parts) {
    const parsed = parseOneSetCookie(String(header));
    if (parsed) cookies.set(parsed[0], parsed[1]);
  }
}

/** Collects cookies from axios response (normalizes headers for collectCookiesFromHeaders). */
export function collectCookiesFromAxiosResponse(
  res: { headers: Record<string, unknown> },
  cookies: Map<string, string>
): void {
  const headers: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(res.headers)) {
    if (v == null) continue;
    headers[k] = Array.isArray(v) ? (v as string[]) : String(v);
  }
  collectCookiesFromHeaders(headers, cookies);
}

export function cookieHeader(cookies: Map<string, string>): string {
  return Array.from(cookies.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TITLE_RE = /<title[^>]*>\s*(.+?)\s*<\/title>/s;
/** As in garth: ticket until next quote (URL may contain &). */
const TICKET_RE = /embed\?ticket=([^"]+)/;

export function getCsrfToken(html: string): string {
  const m = CSRF_RE.exec(html);
  if (!m) throw new Error('CSRF token not found on login page');
  return m[1]!;
}

export function getTitle(html: string): string {
  const m = TITLE_RE.exec(html);
  if (!m) return '';
  return m[1]!.trim();
}

export function getTicketFromResponse(html: string): string {
  const m = TICKET_RE.exec(html);
  if (!m) throw new Error('Ticket not found in response after login');
  return m[1]!;
}
