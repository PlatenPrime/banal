import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';
import { getCorsOptions } from './cors.options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.enableCors(getCorsOptions({ WEB_ORIGIN: config.get('WEB_ORIGIN', { infer: true }) }));
  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
