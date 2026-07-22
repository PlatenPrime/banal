import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { applyApiUriVersioning } from './config/api-versioning';
import type { Env } from './config/env.schema';
import { applyRequestIdMiddleware } from './config/request-id.middleware';
import { applySecurityHeaders } from './config/security-headers';
import { applySwaggerDocs } from './config/swagger';
import { getCorsOptions } from './cors.options';
import { initOtelNoop } from './observability/otel-noop';

async function bootstrap() {
  initOtelNoop();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  applySecurityHeaders(app);
  // Before nestjs-pino's pino-http middleware so req.requestId is already set.
  applyRequestIdMiddleware(app);

  const config = app.get(ConfigService<Env, true>);

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
