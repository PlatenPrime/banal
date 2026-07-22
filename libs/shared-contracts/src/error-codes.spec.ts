import { describe, expect, it } from 'vitest';
import { ERROR_TYPE_URIS, errorTypeUriSchema } from './error-codes';

describe('ERROR_TYPE_URIS', () => {
  it('keeps stable problem type URIs', () => {
    expect(ERROR_TYPE_URIS).toMatchInlineSnapshot(`
      {
        "conflict": "https://banal.app/problems/conflict",
        "forbidden": "https://banal.app/problems/forbidden",
        "internal": "https://banal.app/problems/internal",
        "notFound": "https://banal.app/problems/not-found",
        "rateLimited": "https://banal.app/problems/rate-limited",
        "unauthorized": "https://banal.app/problems/unauthorized",
        "validationFailed": "https://banal.app/problems/validation-failed",
      }
    `);
  });

  it('accepts known URIs and rejects unknown ones', () => {
    expect(errorTypeUriSchema.parse(ERROR_TYPE_URIS.notFound)).toBe(ERROR_TYPE_URIS.notFound);
    expect(() => errorTypeUriSchema.parse('https://banal.app/problems/unknown')).toThrow();
  });
});
