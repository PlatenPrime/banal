import { describe, expect, it } from 'vitest';
import type { HealthCheckResult } from '@nestjs/terminus';
import { toLivenessResponse, toReadinessResponse } from './health-response';
import { STUB_MONGO_NOT_CONFIGURED } from './stub-mongo.health-indicator';

describe('health-response mappers', () => {
  it('maps ok Terminus liveness to { status: ok }', () => {
    const terminus: HealthCheckResult = {
      status: 'ok',
      info: {},
      error: {},
      details: {},
    };

    expect(toLivenessResponse(terminus)).toEqual({ status: 'ok' });
  });

  it('throws when liveness Terminus status is not ok', () => {
    const terminus: HealthCheckResult = {
      status: 'error',
      error: { mongodb: { status: 'down' } },
      details: { mongodb: { status: 'down' } },
    };

    expect(() => toLivenessResponse(terminus)).toThrow();
  });

  it('maps readiness error with mongodb down to contract shape', () => {
    const terminus: HealthCheckResult = {
      status: 'error',
      info: {},
      error: {
        mongodb: { status: 'down', message: STUB_MONGO_NOT_CONFIGURED },
      },
      details: {
        mongodb: { status: 'down', message: STUB_MONGO_NOT_CONFIGURED },
      },
    };

    expect(toReadinessResponse(terminus)).toEqual({
      status: 'error',
      info: undefined,
      error: {
        mongodb: { status: 'error', detail: STUB_MONGO_NOT_CONFIGURED },
      },
      details: {
        mongodb: { status: 'error', detail: STUB_MONGO_NOT_CONFIGURED },
      },
    });
  });

  it('maps readiness ok with indicator info', () => {
    const terminus: HealthCheckResult = {
      status: 'ok',
      info: { mongodb: { status: 'up', message: 'ping ok' } },
      error: {},
      details: { mongodb: { status: 'up', message: 'ping ok' } },
    };

    expect(toReadinessResponse(terminus)).toEqual({
      status: 'ok',
      info: { mongodb: { status: 'ok', detail: 'ping ok' } },
      error: undefined,
      details: { mongodb: { status: 'ok', detail: 'ping ok' } },
    });
  });
});
