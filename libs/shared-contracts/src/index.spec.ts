import { describe, expect, it } from 'vitest';
import {
  ERROR_TYPE_URIS,
  SHARED_CONTRACTS_READY,
  livenessResponseSchema,
  problemDetailsSchema,
} from './index';

describe('shared-contracts barrel', () => {
  it('exports SHARED_CONTRACTS_READY', () => {
    expect(SHARED_CONTRACTS_READY).toBe(true);
  });

  it('re-exports core schemas and error codes', () => {
    expect(
      problemDetailsSchema.parse({
        type: ERROR_TYPE_URIS.internal,
        title: 'Internal Server Error',
        status: 500,
      }).status,
    ).toBe(500);
    expect(livenessResponseSchema.parse({ status: 'ok' })).toEqual({
      status: 'ok',
    });
  });
});
