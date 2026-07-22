import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { ExamplesController } from '../examples/example.controller';
import { ExamplesService } from '../examples/example.service';
import { HealthController } from '../health/health.controller';

/**
 * Controllers + stub providers only — no Mongo / ConfigModule.
 * Used solely to build the OpenAPI document offline.
 */
@Module({
  controllers: [AppController, ExamplesController, HealthController, AuthController],
  providers: [
    AppService,
    { provide: ExamplesService, useValue: {} },
    { provide: HealthCheckService, useValue: {} },
    { provide: MongooseHealthIndicator, useValue: {} },
    { provide: AuthService, useValue: {} },
    { provide: ConfigService, useValue: { get: () => undefined } },
    { provide: JwtService, useValue: {} },
  ],
})
export class OpenApiExportModule {}
