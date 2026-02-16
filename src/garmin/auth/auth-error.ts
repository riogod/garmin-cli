/**
 * Authentication errors. Separated into its own module to avoid circular imports (sso-embed -> auth).
 * All subclasses are instanceof AuthError, can be caught by type or generic AuthError.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/** Invalid email or password. */
export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid email or password.') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/** MFA code entry required (returnOnMfa or interactive step). */
export class MfaRequiredError extends AuthError {
  constructor(message = 'MFA required.') {
    super(message);
    this.name = 'MfaRequiredError';
    Object.setPrototypeOf(this, MfaRequiredError.prototype);
  }
}

/** Invalid or expired MFA code, or MFA session expired. */
export class MfaCodeInvalidError extends AuthError {
  constructor(message = 'Invalid MFA code or session expired.') {
    super(message);
    this.name = 'MfaCodeInvalidError';
    Object.setPrototypeOf(this, MfaCodeInvalidError.prototype);
  }
}