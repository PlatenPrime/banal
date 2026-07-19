import { describe, expect, it } from 'vitest';
import { problemDetailsSchema } from './problem-details';

describe('problemDetailsSchema', () => {
  it('parses a minimal RFC 9457 problem', () => {
    const result = problemDetailsSchema.parse({
      type: 'https://banal.app/problems/not-found',
      title: 'Not Found',
      status: 404,
    });

    expect(result).toEqual({
      type: 'https://banal.app/problems/not-found',
      title: 'Not Found',
      status: 404,
    });
  });

  it('parses optional detail, instance, and field errors', () => {
    const payload = {
      type: 'https://banal.app/problems/validation-failed',
      title: 'Validation Failed',
      status: 422,
      detail: 'One or more fields are invalid',
      instance: '/api/v1/examples',
      errors: { name: ['Required'] },
    };

    expect(problemDetailsSchema.parse(payload)).toEqual(payload);
  });

  it('rejects missing required fields', () => {
    expect(() =>
      problemDetailsSchema.parse({
        title: 'Broken',
        status: 500,
      }),
    ).toThrow();
  });

  it('rejects non-URI type values', () => {
    expect(() =>
      problemDetailsSchema.parse({
        type: 'not-a-uri',
        title: 'Broken',
        status: 400,
      }),
    ).toThrow();
  });

  it('rejects out-of-range status codes', () => {
    expect(() =>
      problemDetailsSchema.parse({
        type: 'https://banal.app/problems/internal',
        title: 'Internal',
        status: 99,
      }),
    ).toThrow();
  });
});
