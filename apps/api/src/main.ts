import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyApiUriVersioning } from './config/api-versioning';
import type { Env } from './config/env.schema';
import { applySecurityHeaders } from './config/security-headers';
import { getCorsOptions } from './cors.options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applySecurityHeaders(app);

  const config = app.get(ConfigService<Env, true>);

  applyApiUriVersioning(app);
  app.enableCors(getCorsOptions({ WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }) }));
  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
