import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { toProblemDetails } from './api-exception.filter';

describe('ApiExceptionFilter contracts', () => {
  it('maps HttpException to a valid Problem Details body', () => {
    const problem = toProblemDetails(
      new NotFoundException('Example not found'),
      '/api/v1/examples/missing',
    );

    expect(problemDetailsSchema.parse(problem)).toEqual(problem);
    expect(problem).toMatchObject({
      type: ERROR_TYPE_URIS.notFound,
      status: HttpStatus.NOT_FOUND,
      instance: '/api/v1/examples/missing',
    });
    expect(problem).not.toHaveProperty('stack');
  });

  it('maps unknown HTTP statuses to the internal error type', () => {
    const problem = toProblemDetails(new HttpException('Teapot', HttpStatus.I_AM_A_TEAPOT));

    expect(problem.type).toBe(ERROR_TYPE_URIS.internal);
    expect(problem.status).toBe(HttpStatus.I_AM_A_TEAPOT);
    expect(problemDetailsSchema.safeParse(problem).success).toBe(true);
  });
});
