import type { ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { mapValidationErrors } from './validation-errors';

describe('mapValidationErrors', () => {
  it('maps top-level constraints to field error lists', () => {
    const errors: ValidationError[] = [
      {
        property: 'name',
        constraints: {
          isString: 'name must be a string',
          minLength: 'name must be longer than or equal to 1 characters',
        },
        children: [],
      },
    ];

    expect(mapValidationErrors(errors)).toEqual({
      name: ['name must be a string', 'name must be longer than or equal to 1 characters'],
    });
  });

  it('flattens nested children with dotted property paths', () => {
    const errors: ValidationError[] = [
      {
        property: 'meta',
        children: [
          {
            property: 'label',
            constraints: { isString: 'label must be a string' },
            children: [],
          },
        ],
      },
    ];

    expect(mapValidationErrors(errors)).toEqual({
      'meta.label': ['label must be a string'],
    });
  });

  it('maps forbidNonWhitelisted-style whitelist constraints', () => {
    const errors: ValidationError[] = [
      {
        property: 'extra',
        constraints: {
          whitelistValidation: 'property extra should not exist',
        },
        children: [],
      },
    ];

    expect(mapValidationErrors(errors)).toEqual({
      extra: ['property extra should not exist'],
    });
  });
});
