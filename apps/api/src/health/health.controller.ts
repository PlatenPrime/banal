import {
  Controller,
  Get,
  HttpStatus,
  Res,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';
import type { Response } from 'express';
import { toLivenessResponse, toReadinessResponse } from './health-response';
import { LivenessResponseDto, ReadinessResponseDto } from './health-response.dto';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ type: LivenessResponseDto })
  async liveness() {
    const result = await this.health.check([]);
    return toLivenessResponse(result);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (Mongo ping)' })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ReadinessResponseDto })
  async readiness(@Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.health.check([() => this.mongoose.pingCheck('mongodb')]);
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
