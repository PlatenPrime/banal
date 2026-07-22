import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** OpenAPI mirror of `healthCheckResultSchema` from `@app/shared-contracts`. */
export class HealthCheckResultDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiPropertyOptional({ example: 'connection refused' })
  detail?: string;
}

/** OpenAPI mirror of `livenessResponseSchema`. */
export class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';
}

/** OpenAPI mirror of `readinessResponseSchema`. */
export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthCheckResultDto' },
  })
  info?: Record<string, HealthCheckResultDto>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthCheckResultDto' },
  })
  error?: Record<string, HealthCheckResultDto>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthCheckResultDto' },
  })
  details?: Record<string, HealthCheckResultDto>;
}
