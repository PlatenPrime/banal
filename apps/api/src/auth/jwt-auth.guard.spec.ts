import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.schema';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  };
  const jwtService = {
    verifyAsync: vi.fn(),
  };
  const config = {
    get: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') {
        return 'test-access-secret-min-32-characters!!';
      }
      return undefined;
    }),
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService<Env, true>,
    );
  });

  function createContext(cookies?: Record<string, string>) {
    const request = { cookies, user: undefined as { userId: string } | undefined };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  }

  it('allows @Public() routes without a cookie', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createContext();

    await expect(guard.canActivate(ctx as never)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects missing access cookie with 401', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createContext({});

    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches userId from a valid access token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', typ: 'access' });
    const ctx = createContext({ [ACCESS_TOKEN_COOKIE]: 'good.jwt' });

    await expect(guard.canActivate(ctx as never)).resolves.toBe(true);
    expect(ctx.request.user).toEqual({ userId: 'user-1' });
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, expect.any(Array));
  });
});
