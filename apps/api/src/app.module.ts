import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import type { Env } from './config/env.schema';
import { validate } from './config/env.validation';
import { createLoggerModuleParams } from './config/logger.config';
import { THROTTLE_GLOBAL_LIMIT, THROTTLE_GLOBAL_TTL_MS } from './config/throttle';
import { createValidationPipe } from './config/validation.pipe';
import { DatabaseModule } from './database/database.module';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { ExamplesModule } from './examples/examples.module';
import { FlagsModule } from './flags/flags.module';
import { HealthModule } from './health/health.module';
import { RequestLoggingInterceptor } from './logging/request-logging.interceptor';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    FlagsModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createLoggerModuleParams(config.get('NODE_ENV', { infer: true })),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: THROTTLE_GLOBAL_TTL_MS,
        limit: THROTTLE_GLOBAL_LIMIT,
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
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
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: createValidationPipe,
    },
  ],
})
export class AppModule {}
