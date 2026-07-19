import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { envSchema } from './env.schema';
import { validate } from './env.validation';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/app_foundation_dev',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('envSchema', () => {
  it('parses a valid env fixture', () => {
    const env = envSchema.parse(validEnv);

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/app_foundation_dev',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('defaults PORT when omitted', () => {
    const { PORT: _omit, ...withoutPort } = validEnv;
    const env = envSchema.parse(withoutPort);

    expect(env.PORT).toBe(4000);
  });

  it('rejects missing MONGODB_URI', () => {
    const { MONGODB_URI: _omit, ...withoutMongo } = validEnv;

    expect(() => envSchema.parse(withoutMongo)).toThrow(ZodError);
  });

  it('rejects invalid PORT', () => {
    expect(() => envSchema.parse({ ...validEnv, PORT: '0' })).toThrow(ZodError);
    expect(() => envSchema.parse({ ...validEnv, PORT: '70000' })).toThrow(ZodError);
  });

  it('rejects invalid NODE_ENV', () => {
    expect(() => envSchema.parse({ ...validEnv, NODE_ENV: 'staging' })).toThrow(ZodError);
  });

  it('rejects invalid WEB_ORIGIN', () => {
    expect(() => envSchema.parse({ ...validEnv, WEB_ORIGIN: 'not-a-url' })).toThrow(ZodError);
  });
});

describe('validate', () => {
  it('returns parsed Env for ConfigModule', () => {
    expect(validate(validEnv)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
    });
  });

  it('throws on bad config (fail-fast)', () => {
    expect(() => validate({})).toThrow(ZodError);
  });
});
