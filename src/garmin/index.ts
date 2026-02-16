/**
 * Public API of the Garmin module: client, auth, types.
 * Single entry import: import { GarminClient, ensureSession, AuthError } from './garmin.js'.
 */

export { GarminClient } from './client.js';
export {
  GRAPHQL,
  PERSONALRECORD_PRS,
  SLEEP_DAILY,
  USERPROFILE_SETTINGS,
  USERPROFILE_SOCIAL,
} from './endpoints.js';
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
} from './auth/index.js';
export type { LoginOptions } from './auth/index.js';
export type {
  GarminSession,
  LoginResult,
  NeedsMfaState,
  OAuth1Token,
  OAuth2Token,
} from './types.js';
