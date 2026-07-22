import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { Env } from './config/env.schema';
import { validate } from './config/env.validation';
import { createLoggerModuleParams } from './config/logger.config';
import { createValidationPipe } from './config/validation.pipe';
import { DatabaseModule } from './database/database.module';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { ExamplesModule } from './examples/examples.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createLoggerModuleParams(config.get('NODE_ENV', { infer: true })),
    }),
    DatabaseModule,
    HealthModule,
    ExamplesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: createValidationPipe,
    },
  ],
})
export class AppModule {}
