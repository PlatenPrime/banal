import 'reflect-metadata';
import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createValidationPipe } from '../config/validation.pipe';
import { CreateExampleDto } from './create-example.dto';

const bodyMetadata = {
  type: 'body' as const,
  metatype: CreateExampleDto,
  data: '',
};

async function expectValidationErrors(
  body: Record<string, unknown>,
  field: string,
): Promise<Record<string, string[]>> {
  const pipe = createValidationPipe();

  try {
    await pipe.transform(body, bodyMetadata);
    expect.fail('expected UnprocessableEntityException');
  } catch (error) {
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    const response = (error as UnprocessableEntityException).getResponse() as {
      errors?: Record<string, string[]>;
    };
    expect(response.errors).toBeDefined();
    expect(response.errors?.[field]).toEqual(expect.arrayContaining([expect.any(String)]));
    return response.errors ?? {};
  }
}

describe('CreateExampleDto', () => {
  const pipe = createValidationPipe();

  it('accepts a valid body with name only', async () => {
    await expect(pipe.transform({ name: 'Demo' }, bodyMetadata)).resolves.toEqual({
      name: 'Demo',
    });
  });

  it('accepts a valid body with optional description', async () => {
    await expect(
      pipe.transform({ name: 'Demo', description: 'Foundation example' }, bodyMetadata),
    ).resolves.toEqual({
      name: 'Demo',
      description: 'Foundation example',
    });
  });

  it('rejects missing name with UnprocessableEntityException (HTTP 422)', async () => {
    await expectValidationErrors({}, 'name');
  });

  it('rejects empty name with UnprocessableEntityException (HTTP 422)', async () => {
    await expectValidationErrors({ name: '' }, 'name');
  });

  it('rejects name longer than 200 chars with UnprocessableEntityException (HTTP 422)', async () => {
    await expectValidationErrors({ name: 'x'.repeat(201) }, 'name');
  });

  it('rejects description longer than 2000 chars with UnprocessableEntityException (HTTP 422)', async () => {
    await expectValidationErrors({ name: 'Demo', description: 'y'.repeat(2001) }, 'description');
  });

  it('rejects non-whitelisted fields with UnprocessableEntityException (HTTP 422)', async () => {
    await expectValidationErrors({ name: 'Demo', extra: true }, 'extra');
  });
});
