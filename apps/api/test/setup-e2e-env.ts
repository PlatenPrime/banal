/**
 * Runs before e2e specs import AppModule (ConfigModule.forRoot validates at decorate-time).
 * Per-test createE2eEnv still overrides MONGODB_URI and flags.
 */
Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  PORT: process.env.PORT ?? '4000',
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/app_foundation_e2e',
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'ci-dummy-access-secret-min-32-chars!!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'ci-dummy-refresh-secret-min-32-chars!',
  AUTH_COOKIE_SAMESITE: process.env.AUTH_COOKIE_SAMESITE ?? 'lax',
  AUTH_REGISTRATION_ENABLED: process.env.AUTH_REGISTRATION_ENABLED ?? 'false',
});
