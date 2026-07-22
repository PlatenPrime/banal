import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export type RequestLogFields = {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
};

/**
 * One structured info line per HTTP request (method, url, status, duration).
 * Complements nestjs-pino with `autoLogging: false`.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(RequestLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap(() => {
        this.logRequest(req, res.statusCode, startedAt);
      }),
      catchError((err: unknown) => {
        this.logRequest(req, resolveErrorStatusCode(err, res), startedAt);
        return throwError(() => err);
      }),
    );
  }

  private logRequest(req: Request, statusCode: number, startedAt: number): void {
    const fields: RequestLogFields = {
      method: req.method,
      url: req.originalUrl ?? req.url,
      statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    };

    this.logger.info(fields, 'request completed');
  }
}

function resolveErrorStatusCode(err: unknown, res: Response): number {
  if (err instanceof HttpException) {
    return err.getStatus();
  }

  if (typeof res.statusCode === 'number' && res.statusCode >= 400) {
    return res.statusCode;
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}
