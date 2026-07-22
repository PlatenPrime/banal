import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { envSchema } from './env.schema';
import { validate } from './env.validation';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/app_foundation_dev',
  WEB_ORIGIN: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'local-dev-access-secret-min-32-chars!!',
  JWT_REFRESH_SECRET: 'local-dev-refresh-secret-min-32-chars!',
};

describe('envSchema', () => {
  it('parses a valid env fixture', () => {
    const env = envSchema.parse(validEnv);

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/app_foundation_dev',
      WEB_ORIGIN: 'http://localhost:3000',
      JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
      AUTH_COOKIE_SAMESITE: 'lax',
      AUTH_REGISTRATION_ENABLED: false,
      TRUST_PROXY: false,
      OTEL_ENABLED: false,
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

  it('accepts WEB_ORIGIN via z.url()', () => {
    expect(envSchema.parse({ ...validEnv, WEB_ORIGIN: 'https://app.example.com' }).WEB_ORIGIN).toBe(
      'https://app.example.com',
    );
  });

  it('rejects JWT secrets shorter than 32 characters', () => {
    expect(() => envSchema.parse({ ...validEnv, JWT_ACCESS_SECRET: 'too-short' })).toThrow(
      ZodError,
    );
    expect(() => envSchema.parse({ ...validEnv, JWT_REFRESH_SECRET: 'also-too-short' })).toThrow(
      ZodError,
    );
  });

  it('rejects identical JWT access and refresh secrets', () => {
    const same = 'same-secret-value-at-least-32-chars!!';

    expect(() =>
      envSchema.parse({
        ...validEnv,
        JWT_ACCESS_SECRET: same,
        JWT_REFRESH_SECRET: same,
      }),
    ).toThrow(ZodError);
  });

  it('coerces boolean flags from string env values', () => {
    const env = envSchema.parse({
      ...validEnv,
      AUTH_REGISTRATION_ENABLED: 'true',
      TRUST_PROXY: '1',
      OTEL_ENABLED: 'false',
    });

    expect(env.AUTH_REGISTRATION_ENABLED).toBe(true);
    expect(env.TRUST_PROXY).toBe(true);
    expect(env.OTEL_ENABLED).toBe(false);
  });

  it('requires OTLP endpoint when OTEL_ENABLED is true', () => {
    expect(() =>
      envSchema.parse({
        ...validEnv,
        OTEL_ENABLED: 'true',
      }),
    ).toThrow(ZodError);

    const env = envSchema.parse({
      ...validEnv,
      OTEL_ENABLED: 'true',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otel.example.com',
    });

    expect(env.OTEL_EXPORTER_OTLP_ENDPOINT).toBe('https://otel.example.com');
  });

  it('accepts optional preview origin fields', () => {
    const env = envSchema.parse({
      ...validEnv,
      WEB_ORIGIN_PREVIEW_REGEX: String.raw`^https://.*\.vercel\.app$`,
      WEB_ORIGIN_PREVIEW_LIST: 'https://foo.vercel.app,https://bar.vercel.app',
      COOKIE_DOMAIN: '.example.com',
      AUTH_COOKIE_SAMESITE: 'none',
    });

    expect(env.WEB_ORIGIN_PREVIEW_REGEX).toBe(String.raw`^https://.*\.vercel\.app$`);
    expect(env.WEB_ORIGIN_PREVIEW_LIST).toBe('https://foo.vercel.app,https://bar.vercel.app');
    expect(env.COOKIE_DOMAIN).toBe('.example.com');
    expect(env.AUTH_COOKIE_SAMESITE).toBe('none');
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
