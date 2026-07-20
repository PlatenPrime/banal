import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyApiUriVersioning } from './config/api-versioning';
import type { Env } from './config/env.schema';
import { applyRequestIdMiddleware } from './config/request-id.middleware';
import { applySecurityHeaders } from './config/security-headers';
import { applySwaggerDocs } from './config/swagger';
import { getCorsOptions } from './cors.options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  applySecurityHeaders(app);
  applyRequestIdMiddleware(app);

  const config = app.get(ConfigService<Env, true>);

  applyApiUriVersioning(app);
  applySwaggerDocs(app);
  app.enableCors(getCorsOptions({ WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }) }));
  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
