import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { createLoggerModuleParams } from './config/logger.config';
import { createValidationPipe } from './config/validation.pipe';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { ExamplesModule } from './examples/examples.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRoot(createLoggerModuleParams()),
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
