import { describe, expect, it, vi } from 'vitest';
import { apiV1Path } from '../config/api-versioning';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from './auth-cookies';
import { REFRESH_TOKEN_TTL_MS } from './refresh-token.schema';

function createMockResponse() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

describe('auth cookies', () => {
  it('sets httpOnly access and refresh cookies with ADR paths and TTLs', () => {
    const res = createMockResponse();

    setAuthCookies(
      res as never,
      { accessToken: 'access.jwt', refreshToken: 'refresh.jwt' },
      {
        NODE_ENV: 'development',
        AUTH_COOKIE_SAMESITE: 'lax',
      },
    );

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'access.jwt',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_MS,
      }),
    );

    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh.jwt',
      expect.objectContaining({
        httpOnly: true,
        path: apiV1Path('auth'),
        maxAge: REFRESH_TOKEN_TTL_MS,
      }),
    );
  });

  it('forces Secure when SameSite=none', () => {
    const res = createMockResponse();

    setAuthCookies(
      res as never,
      { accessToken: 'a', refreshToken: 'r' },
      {
        NODE_ENV: 'development',
        AUTH_COOKIE_SAMESITE: 'none',
        COOKIE_DOMAIN: '.example.com',
      },
    );

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'a',
      expect.objectContaining({
        secure: true,
        sameSite: 'none',
        domain: '.example.com',
      }),
    );
  });

  it('clears both cookies with matching paths', () => {
    const res = createMockResponse();

    clearAuthCookies(res as never, {
      NODE_ENV: 'production',
      AUTH_COOKIE_SAMESITE: 'lax',
    });

    expect(res.clearCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      expect.objectContaining({ path: '/', httpOnly: true, secure: true }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ path: apiV1Path('auth') }),
    );
  });
});
