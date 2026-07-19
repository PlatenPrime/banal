import { describe, expect, it } from 'vitest';
import {
  livenessResponseSchema,
  readinessResponseSchema,
  type LivenessResponse,
  type ReadinessResponse,
} from './health';

describe('api-client health types', () => {
  it('imports health schemas from shared-contracts without local duplicates', () => {
    const liveness: LivenessResponse = livenessResponseSchema.parse({
      status: 'ok',
    });
    const readiness: ReadinessResponse = readinessResponseSchema.parse({
      status: 'ok',
      info: { process: { status: 'ok' } },
    });

    expect(liveness).toEqual({ status: 'ok' });
    expect(readiness.status).toBe('ok');
  });
});
