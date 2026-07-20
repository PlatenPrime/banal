import 'reflect-metadata';
import { BadRequestException, Body, Controller, Post, ValidationPipe } from '@nestjs/common';
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

describe('createValidationPipe', () => {
  it('accepts a valid body', async () => {
    const pipe = createValidationPipe();

    await expect(pipe.transform({ name: 'alpha' }, bodyMetadata)).resolves.toEqual({
      name: 'alpha',
    });
  });

  it('rejects non-whitelisted fields with BadRequestException (HTTP 400)', async () => {
    const pipe = createValidationPipe();

    await expect(
      pipe.transform({ name: 'alpha', extra: true }, bodyMetadata),
    ).rejects.toBeInstanceOf(BadRequestException);
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
