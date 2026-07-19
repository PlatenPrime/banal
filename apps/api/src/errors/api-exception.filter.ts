import {
  ERROR_TYPE_URIS,
  problemDetailsSchema,
  type ErrorTypeUri,
  type ProblemDetails,
} from '@app/shared-contracts';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

const PROBLEM_JSON = 'application/problem+json';

const STATUS_TO_ERROR_TYPE: Record<number, ErrorTypeUri> = {
  [HttpStatus.BAD_REQUEST]: ERROR_TYPE_URIS.validationFailed,
  [HttpStatus.UNAUTHORIZED]: ERROR_TYPE_URIS.unauthorized,
  [HttpStatus.FORBIDDEN]: ERROR_TYPE_URIS.forbidden,
  [HttpStatus.NOT_FOUND]: ERROR_TYPE_URIS.notFound,
  [HttpStatus.CONFLICT]: ERROR_TYPE_URIS.conflict,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ERROR_TYPE_URIS.validationFailed,
};

function resolveErrorType(status: number): ErrorTypeUri {
  return STATUS_TO_ERROR_TYPE[status] ?? ERROR_TYPE_URIS.internal;
}

function extractTitle(exception: HttpException, status: number): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null && 'error' in response) {
    const error = (response as { error?: unknown }).error;
    if (typeof error === 'string' && error.length > 0) {
      return error;
    }
  }
  return HttpStatus[status] ?? 'Error';
}

function extractDetail(exception: HttpException): string | undefined {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return undefined;
  }
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === 'string').join('; ');
    }
  }
  return undefined;
}

/**
 * Maps Nest HTTP exceptions to RFC 9457 Problem Details from shared-contracts.
 * Unknown errors become a generic 500 — never leak stack or exception message.
 */
export function toProblemDetails(exception: HttpException, instance?: string): ProblemDetails {
  const status = exception.getStatus();
  const problem = {
    type: resolveErrorType(status),
    title: extractTitle(exception, status),
    status,
    detail: extractDetail(exception),
    instance,
  };

  return problemDetailsSchema.parse(problem);
}

function toInternalProblem(instance?: string): ProblemDetails {
  return problemDetailsSchema.parse({
    type: ERROR_TYPE_URIS.internal,
    title: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    instance,
  });
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();
    const instance = request.url;

    const problem =
      exception instanceof HttpException
        ? toProblemDetails(exception, instance)
        : toInternalProblem(instance);

    response.status(problem.status).type(PROBLEM_JSON).json(problem);
  }
}
