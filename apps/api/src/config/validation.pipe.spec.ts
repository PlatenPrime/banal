import 'reflect-metadata';
import {
  Body,
  Controller,
  Post,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { CreateExampleDto } from '../examples/create-example.dto';
import { createValidationPipe } from './validation.pipe';

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: CreateExampleDto): CreateExampleDto {
    return body;
  }
}

const bodyMetadata = {
  type: 'body' as const,
  metatype: CreateExampleDto,
  data: '',
};

function getExceptionResponse(error: unknown): Record<string, unknown> {
  expect(error).toBeInstanceOf(UnprocessableEntityException);
  const exception = error as UnprocessableEntityException;
  const response = exception.getResponse();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  return response as Record<string, unknown>;
}

describe('createValidationPipe', () => {
  it('accepts a valid body', async () => {
    const pipe = createValidationPipe();

    await expect(pipe.transform({ name: 'alpha' }, bodyMetadata)).resolves.toEqual({
      name: 'alpha',
    });
  });

  it('rejects non-whitelisted fields with UnprocessableEntityException (HTTP 422)', async () => {
    const pipe = createValidationPipe();

    try {
      await pipe.transform({ name: 'alpha', extra: true }, bodyMetadata);
      expect.fail('expected UnprocessableEntityException');
    } catch (error) {
      const response = getExceptionResponse(error);
      expect(response).toMatchObject({
        error: 'Validation Failed',
        message: 'Validation failed',
      });
      expect(response.errors).toMatchObject({
        extra: expect.arrayContaining([expect.stringContaining('extra')]),
      });
    }
  });

  it('compiles a fixture controller with APP_PIPE provider', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        {
          provide: APP_PIPE,
          useFactory: createValidationPipe,
        },
      ],
    }).compile();

    expect(moduleRef.get(ProbeController)).toBeInstanceOf(ProbeController);
    expect(createValidationPipe()).toBeInstanceOf(ValidationPipe);
  });
});
