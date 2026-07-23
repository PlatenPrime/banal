import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { applyApiUriVersioning } from './config/api-versioning';
import { applyCookieParser } from './config/cookie-parser';
import { applyCsrfOriginMiddleware } from './config/csrf-origin.middleware';
import type { Env } from './config/env.schema';
import { applyRequestIdMiddleware } from './config/request-id.middleware';
import { applySecurityHeaders } from './config/security-headers';
import { applySwaggerDocs } from './config/swagger';
import { applyTrustProxy } from './config/trust-proxy';
import { getCorsOptions } from './cors.options';
import { initOtelFromEnv } from './observability/otel';

async function bootstrap() {
  const otel = await initOtelFromEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const nestClose = app.close.bind(app);
  app.close = async () => {
    try {
      await nestClose();
    } finally {
      await otel.shutdown();
    }
  };

  const config = app.get(ConfigService<Env, true>);

  applyTrustProxy(app, config.get('TRUST_PROXY', { infer: true }));
  applySecurityHeaders(app);
  // Before nestjs-pino's pino-http middleware so req.requestId is already set.
  applyRequestIdMiddleware(app);
  applyCookieParser(app);
  applyCsrfOriginMiddleware(app, {
    WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }),
    WEB_ORIGIN_PREVIEW_REGEX: config.get('WEB_ORIGIN_PREVIEW_REGEX', { infer: true }),
    WEB_ORIGIN_PREVIEW_LIST: config.get('WEB_ORIGIN_PREVIEW_LIST', { infer: true }),
  });

  applyApiUriVersioning(app);
  applySwaggerDocs(app);
  app.enableCors(
    getCorsOptions({
      WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }),
      WEB_ORIGIN_PREVIEW_REGEX: config.get('WEB_ORIGIN_PREVIEW_REGEX', { infer: true }),
      WEB_ORIGIN_PREVIEW_LIST: config.get('WEB_ORIGIN_PREVIEW_LIST', { infer: true }),
    }),
  );
  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
