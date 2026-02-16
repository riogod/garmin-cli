/**
 * URLs and constants for Garmin SSO: embed widget (garth) and Mobile API.
 * Mobile API — JSON endpoints of mobile app, often bypass Cloudflare.
 */

/**
 * SSO domain by region: garmin.com or garmin.cn.
 */
export function getSsoDomain(isCn?: boolean): string {
  return isCn ? 'garmin.cn' : 'garmin.com';
}

/** Base SSO URL (embed). */
export function getSsoBase(domain: string): string {
  return `https://sso.${domain}/sso`;
}

/** Embed widget URL (for garth-style login). */
export function getEmbedUrl(domain: string): string {
  return `${getSsoBase(domain)}/embed`;
}

// --- Mobile API (as in garmin-connect-client) ---

const CLIENT_ID_MOBILE = 'GCM_IOS_DARK';
const MOBILE_SERVICE_GLOBAL = 'https://mobile.integration.garmin.com/gcm/ios';

/**
 * Service for mobile OAuth (login-url in preauthorized).
 * For garmin.cn may differ; add variant if needed.
 */
export function getMobileServiceUrl(_domain: string): string {
  return MOBILE_SERVICE_GLOBAL;
}

/**
 * Mobile SSO sign-in page URL (GET for cookie setup).
 */
export function getMobileSignInPageUrl(domain: string): string {
  const service = encodeURIComponent(MOBILE_SERVICE_GLOBAL);
  return `https://sso.${domain}/mobile/sso/en-US/sign-in?clientId=${CLIENT_ID_MOBILE}&service=${service}`;
}

/**
 * Mobile login API URL (POST JSON: username, password).
 */
export function getMobileLoginApiUrl(domain: string, locale = 'en-US'): string {
  const service = encodeURIComponent(MOBILE_SERVICE_GLOBAL);
  return `https://sso.${domain}/mobile/api/login?clientId=${CLIENT_ID_MOBILE}&locale=${locale}&service=${service}`;
}

/**
 * MFA verification API URL (POST JSON: mfaVerificationCode, etc.).
 */
export function getMobileMfaVerifyUrl(domain: string, locale = 'en-US'): string {
  const service = encodeURIComponent(MOBILE_SERVICE_GLOBAL);
  return `https://sso.${domain}/mobile/api/mfa/verifyCode?clientId=${CLIENT_ID_MOBILE}&locale=${locale}&service=${service}`;
}

/**
 * Referer for Mobile login request.
 */
export function getMobileSignInReferer(domain: string): string {
  const service = encodeURIComponent(MOBILE_SERVICE_GLOBAL);
  return `https://sso.${domain}/mobile/sso/en-US/sign-in?clientId=${CLIENT_ID_MOBILE}&service=${service}`;
}

/**
 * Referer for Mobile MFA request.
 */
export function getMobileMfaReferer(domain: string): string {
  const service = encodeURIComponent(MOBILE_SERVICE_GLOBAL);
  return `https://sso.${domain}/mobile/sso/en-US/mfa?clientId=${CLIENT_ID_MOBILE}&service=${service}`;
}

/**
 * OAuth consumer for Mobile API (public keys from Garmin mobile app).
 * Used in preauthorized/exchange when logging in via Mobile API.
 */
export const MOBILE_OAUTH_CONSUMER = {
  consumer_key: 'fc3e99d2-118c-44b8-8ae3-03370dde24c0',
  consumer_secret: 'E08WAR897WEy2knn7aFBrvegVAf0AFdWBBF',
} as const;
