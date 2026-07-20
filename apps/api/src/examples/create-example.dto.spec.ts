import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createValidationPipe } from '../config/validation.pipe';
import { CreateExampleDto } from './create-example.dto';

const bodyMetadata = {
  type: 'body' as const,
  metatype: CreateExampleDto,
  data: '',
};

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

  it('rejects missing name with BadRequestException (HTTP 400)', async () => {
    await expect(pipe.transform({}, bodyMetadata)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty name with BadRequestException (HTTP 400)', async () => {
    await expect(pipe.transform({ name: '' }, bodyMetadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects name longer than 200 chars with BadRequestException (HTTP 400)', async () => {
    await expect(pipe.transform({ name: 'x'.repeat(201) }, bodyMetadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects description longer than 2000 chars with BadRequestException (HTTP 400)', async () => {
    await expect(
      pipe.transform({ name: 'Demo', description: 'y'.repeat(2001) }, bodyMetadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-whitelisted fields with BadRequestException (HTTP 400)', async () => {
    await expect(
      pipe.transform({ name: 'Demo', extra: true }, bodyMetadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
