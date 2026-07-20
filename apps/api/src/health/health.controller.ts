import {
  Controller,
  Get,
  HttpStatus,
  Res,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import type { Response } from 'express';
import { toLivenessResponse, toReadinessResponse } from './health-response';
import { StubMongoHealthIndicator } from './stub-mongo.health-indicator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly stubMongo: StubMongoHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async liveness() {
    const result = await this.health.check([]);
    return toLivenessResponse(result);
  }

  @Get('ready')
  @HealthCheck()
  async readiness(@Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.health.check([() => this.stubMongo.isHealthy('mongodb')]);
      return toReadinessResponse(result);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        res.status(HttpStatus.SERVICE_UNAVAILABLE);
        return toReadinessResponse(error.getResponse() as HealthCheckResult);
      }

      throw error;
    }
  }
}
