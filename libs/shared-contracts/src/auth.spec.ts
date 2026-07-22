import { describe, expect, it } from 'vitest';
import { authUserSchema, loginRequestSchema, registerRequestSchema } from './auth';

describe('loginRequestSchema', () => {
  it('parses a valid login request', () => {
    const payload = { username: 'admin', password: 'password1' };
    expect(loginRequestSchema.parse(payload)).toEqual(payload);
  });

  it('rejects short username or password', () => {
    expect(() => loginRequestSchema.parse({ username: 'ab', password: 'password1' })).toThrow();
    expect(() => loginRequestSchema.parse({ username: 'admin', password: 'short' })).toThrow();
  });

  it('rejects invalid username characters', () => {
    expect(() =>
      loginRequestSchema.parse({ username: 'bad user', password: 'password1' }),
    ).toThrow();
  });
});

describe('registerRequestSchema', () => {
  it('parses a valid register request and lowercases email', () => {
    const parsed = registerRequestSchema.parse({
      email: 'Admin@Example.COM',
      username: 'admin',
      password: 'password1',
    });

    expect(parsed).toEqual({
      email: 'admin@example.com',
      username: 'admin',
      password: 'password1',
    });
  });

  it('rejects invalid email', () => {
    expect(() =>
      registerRequestSchema.parse({
        email: 'not-an-email',
        username: 'admin',
        password: 'password1',
      }),
    ).toThrow();
  });
});

describe('authUserSchema', () => {
  it('parses AuthUser without password fields', () => {
    const user = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      username: 'admin',
    };

    expect(authUserSchema.parse(user)).toEqual(user);
  });

  it('rejects empty id', () => {
    expect(() =>
      authUserSchema.parse({
        id: '',
        email: 'admin@example.com',
        username: 'admin',
      }),
    ).toThrow();
  });
});
