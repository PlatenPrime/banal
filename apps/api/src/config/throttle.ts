import { minutes } from '@nestjs/throttler';

/** Global default: 100 requests per minute per IP. */
export const THROTTLE_GLOBAL_LIMIT = 100;
export const THROTTLE_GLOBAL_TTL_MS = minutes(1);

/** Stricter login: 5 requests per minute per IP. */
export const THROTTLE_LOGIN_LIMIT = 5;
export const THROTTLE_LOGIN_TTL_MS = minutes(1);
