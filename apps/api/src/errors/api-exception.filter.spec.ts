import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter, toProblemDetails } from './api-exception.filter';

function createHostMock(url = '/api/v1/probe'): {
  host: ArgumentsHost;
  response: {
    status: ReturnType<typeof vi.fn>;
    type: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
} {
  const response = {
    status: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => ({ url }),
    }),
  } as ArgumentsHost;

  return { host, response };
}

describe('toProblemDetails', () => {
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

describe('ApiExceptionFilter', () => {
  it('writes application/problem+json for HttpException', () => {
    const filter = new ApiExceptionFilter();
    const { host, response } = createHostMock('/api/v1/examples/missing');

    filter.catch(new NotFoundException('Example not found'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');

    const body = response.json.mock.calls[0]?.[0];
    expect(problemDetailsSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      type: ERROR_TYPE_URIS.notFound,
      status: HttpStatus.NOT_FOUND,
      instance: '/api/v1/examples/missing',
    });
    expect(body).not.toHaveProperty('stack');
  });

  it('maps unknown Error to 500 without leaking stack or message', () => {
    const filter = new ApiExceptionFilter();
    const { host, response } = createHostMock('/api/v1/boom');
    const secret = new Error('secret-db-password-xyz');

    filter.catch(secret, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');

    const body = response.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(problemDetailsSchema.parse(body)).toEqual(body);
    expect(body).toEqual({
      type: ERROR_TYPE_URIS.internal,
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      instance: '/api/v1/boom',
    });
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('secret-db-password-xyz');
    expect(JSON.stringify(body)).not.toContain(secret.stack ?? 'no-stack');
  });
});
