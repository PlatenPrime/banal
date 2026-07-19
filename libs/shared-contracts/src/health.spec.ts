import { describe, expect, it } from 'vitest';
import { healthCheckResultSchema, livenessResponseSchema, readinessResponseSchema } from './health';

describe('health schemas', () => {
  it('roundtrips liveness response', () => {
    const payload = { status: 'ok' as const };
    expect(livenessResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects non-ok liveness status', () => {
    expect(() => livenessResponseSchema.parse({ status: 'error' })).toThrow();
  });

  it('roundtrips readiness with check maps', () => {
    const payload = {
      status: 'ok' as const,
      info: { mongodb: { status: 'ok' as const } },
      details: {
        mongodb: { status: 'ok' as const, detail: 'ping ok' },
      },
    };

    expect(readinessResponseSchema.parse(payload)).toEqual(payload);
  });

  it('roundtrips readiness error shape', () => {
    const payload = {
      status: 'error' as const,
      error: {
        mongodb: { status: 'error' as const, detail: 'connection refused' },
      },
      details: {
        mongodb: { status: 'error' as const, detail: 'connection refused' },
      },
    };

    expect(readinessResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects invalid check result status', () => {
    expect(() => healthCheckResultSchema.parse({ status: 'degraded' })).toThrow();
  });
});
