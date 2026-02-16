/**
 * Public API for Garmin Connect authentication.
 * Re-exports: login, ensureSession, token-store, types — for import from garmin/auth.
 */

export {
  AuthError,
  clearMfaState,
  clearTokenStore,
  ensureSession,
  InvalidCredentialsError,
  isOAuth2Expired,
  loadMfaState,
  loadTokenStore,
  login,
  MfaCodeInvalidError,
  MfaRequiredError,
  refreshOAuth2,
  resumeLogin,
  saveMfaState,
  saveTokenStore,
} from './auth.js';
export type { LoginOptions } from './auth.js';
