import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { applyApiUriVersioning } from '../../src/config/api-versioning';
import { applyCookieParser } from '../../src/config/cookie-parser';
import { validate } from '../../src/config/env.validation';

export async function createE2eApp(env: Record<string, string>): Promise<{
  app: INestApplication;
  baseUrl: string;
  close: () => Promise<void>;
}> {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  // ConfigModule.forRoot validates once at AppModule import; re-bind ConfigService
  // so per-test overrides (e.g. AUTH_REGISTRATION_ENABLED) are visible.
  const validated = validate(process.env as Record<string, unknown>);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ConfigService)
    .useValue(new ConfigService(validated))
    .compile();

  const app = moduleRef.createNestApplication();
  applyCookieParser(app);
  applyApiUriVersioning(app);
  await app.init();
  await app.listen(0);

  return {
    app,
    baseUrl: await app.getUrl(),
    close: () => app.close(),
  };
}
