import { Module } from '@nestjs/common';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { ExamplesController } from '../examples/example.controller';
import { ExamplesService } from '../examples/example.service';
import { HealthController } from '../health/health.controller';

/**
 * Controllers + stub providers only — no Mongo / ConfigModule.
 * Used solely to build the OpenAPI document offline (step 085).
 */
@Module({
  controllers: [AppController, ExamplesController, HealthController],
  providers: [
    AppService,
    { provide: ExamplesService, useValue: {} },
    { provide: HealthCheckService, useValue: {} },
    { provide: MongooseHealthIndicator, useValue: {} },
  ],
})
export class OpenApiExportModule {}
