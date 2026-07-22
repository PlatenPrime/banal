import type { CookieOptions, Response } from 'express';
import type { Env } from '../config/env.schema';
import { apiV1Path } from '../config/api-versioning';
import { REFRESH_TOKEN_TTL_MS } from './refresh-token.schema';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Access JWT / cookie lifetime (~15m). */
export const ACCESS_TOKEN_TTL = '15m';
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

export const REFRESH_TOKEN_TTL = '7d';

export type AuthCookieEnv = Pick<Env, 'NODE_ENV' | 'COOKIE_DOMAIN' | 'AUTH_COOKIE_SAMESITE'>;

function isSecureEnv(nodeEnv: Env['NODE_ENV']): boolean {
  return nodeEnv === 'production';
}

function baseCookieOptions(env: AuthCookieEnv): CookieOptions {
  const sameSite = env.AUTH_COOKIE_SAMESITE;
  const secure = sameSite === 'none' ? true : isSecureEnv(env.NODE_ENV);

  return {
    httpOnly: true,
    secure,
    sameSite,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  env: AuthCookieEnv,
): void {
  const base = baseCookieOptions(env);

  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_MS,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...base,
    path: apiV1Path('auth'),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(res: Response, env: AuthCookieEnv): void {
  const base = baseCookieOptions(env);

  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...base,
    path: '/',
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...base,
    path: apiV1Path('auth'),
  });
}
