/** Failed password attempts before temporary lockout. */
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;

/** Lockout window after max failed attempts. */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export const AUTH_INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password';
export const AUTH_REQUIRED_MESSAGE = 'Authentication required';
