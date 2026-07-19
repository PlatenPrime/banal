import 'reflect-metadata';
import { BadRequestException, Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { createValidationPipe } from './validation.pipe';

/** Fixture DTO -- only for this spec until CreateExampleDto (042). */
class ProbeDto {
  @IsString()
  name!: string;
}

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: ProbeDto): ProbeDto {
    return body;
  }
}

const bodyMetadata = {
  type: 'body' as const,
  metatype: ProbeDto,
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
