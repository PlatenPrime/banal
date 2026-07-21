import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { apiV1Path } from '../config/api-versioning';
import { ApiExceptionFilter, toProblemDetails } from './api-exception.filter';

function createHostMock(url = apiV1Path('probe')): {
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
    const instance = apiV1Path('examples', 'missing');
    const problem = toProblemDetails(new NotFoundException('Example not found'), instance);

    expect(problemDetailsSchema.parse(problem)).toEqual(problem);
    expect(problem).toMatchObject({
      type: ERROR_TYPE_URIS.notFound,
      status: HttpStatus.NOT_FOUND,
      instance,
    });
    expect(problem).not.toHaveProperty('stack');
  });

  it('maps unknown HTTP statuses to the internal error type', () => {
    const problem = toProblemDetails(new HttpException('Teapot', HttpStatus.I_AM_A_TEAPOT));

    expect(problem.type).toBe(ERROR_TYPE_URIS.internal);
    expect(problem.status).toBe(HttpStatus.I_AM_A_TEAPOT);
    expect(problemDetailsSchema.safeParse(problem).success).toBe(true);
  });

  it('maps UnprocessableEntityException field errors into Problem Details', () => {
    const instance = apiV1Path('examples');
    const problem = toProblemDetails(
      new UnprocessableEntityException({
        error: 'Validation Failed',
        message: 'Validation failed',
        errors: { name: ['name should not be empty'] },
      }),
      instance,
    );

    expect(problemDetailsSchema.parse(problem)).toEqual(problem);
    expect(problem).toMatchObject({
      type: ERROR_TYPE_URIS.validationFailed,
      title: 'Validation Failed',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      detail: 'Validation failed',
      instance,
      errors: { name: ['name should not be empty'] },
    });
  });
});

describe('ApiExceptionFilter', () => {
  it('writes application/problem+json for HttpException', () => {
    const filter = new ApiExceptionFilter();
    const instance = apiV1Path('examples', 'missing');
    const { host, response } = createHostMock(instance);

    filter.catch(new NotFoundException('Example not found'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');

    const body = response.json.mock.calls[0]?.[0];
    expect(problemDetailsSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      type: ERROR_TYPE_URIS.notFound,
      status: HttpStatus.NOT_FOUND,
      instance,
    });
    expect(body).not.toHaveProperty('stack');
  });

  it('maps unknown Error to 500 without leaking stack or message', () => {
    const filter = new ApiExceptionFilter();
    const instance = apiV1Path('boom');
    const { host, response } = createHostMock(instance);
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
      instance,
    });
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('secret-db-password-xyz');
    expect(JSON.stringify(body)).not.toContain(secret.stack ?? 'no-stack');
  });

  it('writes field errors for validation UnprocessableEntityException', () => {
    const filter = new ApiExceptionFilter();
    const instance = apiV1Path('examples');
    const { host, response } = createHostMock(instance);

    filter.catch(
      new UnprocessableEntityException({
        error: 'Validation Failed',
        message: 'Validation failed',
        errors: { name: ['name should not be empty'], extra: ['property extra should not exist'] },
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');

    const body = response.json.mock.calls[0]?.[0];
    expect(problemDetailsSchema.parse(body)).toEqual(body);
    expect(body).toMatchObject({
      type: ERROR_TYPE_URIS.validationFailed,
      title: 'Validation Failed',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      instance,
      errors: {
        name: ['name should not be empty'],
        extra: ['property extra should not exist'],
      },
    });
    expect(body).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('statusCode');
  });
});
