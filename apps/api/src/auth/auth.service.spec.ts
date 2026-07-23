import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.schema';
import { FlagsService } from '../flags/flags.service';
import { AuthService } from './auth.service';
import { AUTH_INVALID_CREDENTIALS_MESSAGE, LOGIN_MAX_FAILED_ATTEMPTS } from './login-lockout';
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
        JWT_ACCESS_SECRET: 'access-secret-min-32-characters!!!!',
        JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters!!!',
      };
      return values[key];
    }),
  };
  const flags = {
    isRegistrationEnabled: vi.fn(() => true),
    isLegacyWriteAllowed: vi.fn(() => false),
    getKnownFlags: vi.fn(() => ({ registrationEnabled: true })),
  };

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      const values: Record<string, unknown> = {
        JWT_ACCESS_SECRET: 'access-secret-min-32-characters!!!!',
        JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters!!!',
      };
      return values[key];
    });
    flags.isRegistrationEnabled.mockReturnValue(true);
    service = new AuthService(
      userModel as never,
      refreshTokenModel as never,
      passwordService as unknown as PasswordService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService<Env, true>,
      flags as unknown as FlagsService,
    );
  });

  it('rejects register when AUTH_REGISTRATION_ENABLED is false', async () => {
    flags.isRegistrationEnabled.mockReturnValue(false);

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
      failedAttempts: 0,
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

  it('logs in with valid credentials and clears lockout counters', async () => {
    const user = {
      _id: { toString: () => 'uid-1' },
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'hash',
      failedAttempts: 2,
      lockedUntil: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(user) });
    passwordService.verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('access.jwt').mockResolvedValueOnce('refresh.jwt');
    refreshTokenModel.create.mockResolvedValue({});

    const issued = await service.login({ username: 'alice', password: 'password1' });

    expect(issued.user.username).toBe('alice');
    expect(issued.accessToken).toBe('access.jwt');
    expect(user.failedAttempts).toBe(0);
    expect(user.save).toHaveBeenCalled();
  });

  it('rejects login with bad password using a generic message and increments attempts', async () => {
    const user = {
      _id: { toString: () => 'uid-1' },
      passwordHash: 'hash',
      failedAttempts: 0,
      lockedUntil: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(user),
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ username: 'alice', password: 'wrong-pass' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ message: AUTH_INVALID_CREDENTIALS_MESSAGE }),
    });
    expect(user.failedAttempts).toBe(1);
    expect(user.save).toHaveBeenCalled();
  });

  it('uses the same generic message for unknown user and bad password', async () => {
    userModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });

    const unknown = service.login({ username: 'missing', password: 'password1' });
    await expect(unknown).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(unknown).rejects.toMatchObject({
      response: expect.objectContaining({ message: AUTH_INVALID_CREDENTIALS_MESSAGE }),
    });

    const user = {
      _id: { toString: () => 'uid-1' },
      passwordHash: 'hash',
      failedAttempts: 0,
      save: vi.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(user) });
    passwordService.verify.mockResolvedValue(false);

    const badPassword = service.login({ username: 'alice', password: 'wrong' });
    await expect(badPassword).rejects.toMatchObject({
      response: expect.objectContaining({ message: AUTH_INVALID_CREDENTIALS_MESSAGE }),
    });
  });

  it('locks the account after max failed attempts and rejects while locked', async () => {
    const user = {
      _id: { toString: () => 'uid-1' },
      passwordHash: 'hash',
      failedAttempts: LOGIN_MAX_FAILED_ATTEMPTS - 1,
      lockedUntil: undefined as Date | undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    userModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(user) });
    passwordService.verify.mockResolvedValue(false);

    await expect(service.login({ username: 'alice', password: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(user.failedAttempts).toBe(LOGIN_MAX_FAILED_ATTEMPTS);
    expect(user.lockedUntil).toBeInstanceOf(Date);

    passwordService.verify.mockClear();
    await expect(service.login({ username: 'alice', password: 'password1' })).rejects.toMatchObject(
      {
        response: expect.objectContaining({ message: AUTH_INVALID_CREDENTIALS_MESSAGE }),
      },
    );
    expect(passwordService.verify).not.toHaveBeenCalled();
  });
});
