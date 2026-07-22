import { CallHandler, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

function createHttpContext(partial: {
  method?: string;
  url?: string;
  originalUrl?: string;
  statusCode?: number;
}): ExecutionContext {
  const req = {
    method: partial.method ?? 'GET',
    url: partial.url ?? '/health',
    originalUrl: partial.originalUrl ?? partial.url ?? '/health',
  } as Request;

  const res = {
    statusCode: partial.statusCode ?? 200,
  } as Response;

  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as ExecutionContext;
}

function createLoggerMock(): PinoLogger {
  return {
    setContext: vi.fn(),
    info: vi.fn(),
  } as unknown as PinoLogger;
}

describe('RequestLoggingInterceptor', () => {
  it('logs one info line with method, url, statusCode, and durationMs on success', async () => {
    const logger = createLoggerMock();
    const interceptor = new RequestLoggingInterceptor(logger);
    const context = createHttpContext({
      method: 'GET',
      originalUrl: '/api/v1/examples',
      statusCode: 200,
    });
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        next: () => undefined,
        error: reject,
        complete: resolve,
      });
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
    const [fields, message] = vi.mocked(logger.info).mock.calls[0] ?? [];
    expect(message).toBe('request completed');
    expect(fields).toMatchObject({
      method: 'GET',
      url: '/api/v1/examples',
      statusCode: 200,
    });
    expect(fields).toEqual(
      expect.objectContaining({
        durationMs: expect.any(Number),
      }),
    );
    expect((fields as { durationMs: number }).durationMs).toBeGreaterThanOrEqual(0);
  });

  it('logs HttpException status on error without swallowing the error', async () => {
    const logger = createLoggerMock();
    const interceptor = new RequestLoggingInterceptor(logger);
    const context = createHttpContext({
      method: 'POST',
      originalUrl: '/api/v1/examples',
      statusCode: 200,
    });
    const next: CallHandler = {
      handle: () => throwError(() => new HttpException('boom', HttpStatus.BAD_REQUEST)),
    };

    await expect(
      new Promise<void>((resolve, reject) => {
        interceptor.intercept(context, next).subscribe({
          next: () => undefined,
          error: reject,
          complete: resolve,
        });
      }),
    ).rejects.toBeInstanceOf(HttpException);

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.info).mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      url: '/api/v1/examples',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('passes through non-HTTP contexts without logging', async () => {
    const logger = createLoggerMock();
    const interceptor = new RequestLoggingInterceptor(logger);
    const context = {
      getType: () => 'rpc',
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        next: () => undefined,
        error: reject,
        complete: resolve,
      });
    });

    expect(logger.info).not.toHaveBeenCalled();
  });
});
