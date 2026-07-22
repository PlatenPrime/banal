import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.schema';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  const userModel = {
    exists: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
  };
  const refreshTokenModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    updateMany: vi.fn(),
  };
  const passwordService = {
    hash: vi.fn(),
    verify: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };
  const config = {
    get: vi.fn((key: string) => {
      const values: Record<string, unknown> = {
        AUTH_REGISTRATION_ENABLED: true,
        JWT_ACCESS_SECRET: 'access-secret-min-32-characters!!!!',
        JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters!!!',
      };
      return values[key];
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      const values: Record<string, unknown> = {
        AUTH_REGISTRATION_ENABLED: true,
        JWT_ACCESS_SECRET: 'access-secret-min-32-characters!!!!',
        JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters!!!',
      };
      return values[key];
    });
    service = new AuthService(
      userModel as never,
      refreshTokenModel as never,
      passwordService as unknown as PasswordService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService<Env, true>,
    );
  });

  it('rejects register when AUTH_REGISTRATION_ENABLED is false', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'AUTH_REGISTRATION_ENABLED') {
        return false;
      }
      return 'secret-min-32-characters!!!!!!!!!!!!';
    });

    await expect(
      service.register({
        email: 'a@example.com',
        username: 'alice',
        password: 'password1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('registers a user and issues cookies without logging the password', async () => {
    userModel.exists.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('argon2-hash');
    const createdUser = {
      _id: { toString: () => 'uid-1' },
      email: 'alice@example.com',
      username: 'alice',
    };
    userModel.create.mockResolvedValue(createdUser);
    jwtService.signAsync.mockResolvedValueOnce('access.jwt').mockResolvedValueOnce('refresh.jwt');
    refreshTokenModel.create.mockResolvedValue({});

    const issued = await service.register({
      email: 'Alice@Example.com',
      username: 'alice',
      password: 'password1',
    });

    expect(passwordService.hash).toHaveBeenCalledWith('password1');
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'argon2-hash',
    });
    expect(issued).toMatchObject({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: { id: 'uid-1', email: 'alice@example.com', username: 'alice' },
    });
    expect(JSON.stringify(issued)).not.toContain('password1');
  });

  it('rejects duplicate register with ConflictException', async () => {
    userModel.exists.mockResolvedValue({ _id: 'x' });

    await expect(
      service.register({
        email: 'a@example.com',
        username: 'alice',
        password: 'password1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    const user = {
      _id: { toString: () => 'uid-1' },
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'hash',
    };
    userModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(user) });
    passwordService.verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('access.jwt').mockResolvedValueOnce('refresh.jwt');
    refreshTokenModel.create.mockResolvedValue({});

    const issued = await service.login({ username: 'alice', password: 'password1' });

    expect(issued.user.username).toBe('alice');
    expect(issued.accessToken).toBe('access.jwt');
  });

  it('rejects login with bad password', async () => {
    userModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: { toString: () => 'uid-1' },
        passwordHash: 'hash',
      }),
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ username: 'alice', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
