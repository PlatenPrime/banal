import { z } from 'zod';

const booleanFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0', 'TRUE', 'FALSE'])])
  .transform((value) => value === true || value === 'true' || value === '1' || value === 'TRUE');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z.string().min(1),
    WEB_ORIGIN: z.url(),
    WEB_ORIGIN_PREVIEW_REGEX: z.string().optional(),
    WEB_ORIGIN_PREVIEW_LIST: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    COOKIE_DOMAIN: z.string().optional(),
    AUTH_COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
    AUTH_REGISTRATION_ENABLED: booleanFromEnv.default(false),
    TRUST_PROXY: booleanFromEnv.default(false),
    OTEL_ENABLED: booleanFromEnv.default(false),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
      });
    }

    if (env.OTEL_ENABLED && !env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      ctx.addIssue({
        code: 'custom',
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
        message: 'OTEL_EXPORTER_OTLP_ENDPOINT is required when OTEL_ENABLED is true',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
