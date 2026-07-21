import type { IncomingMessage } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';
import { REQUEST_ID_HEADER, resolveRequestId, type RequestWithId } from './request-id.middleware';

/**
 * Resolves the correlation id for pino-http from the request-id middleware field,
 * falling back to the same header resolution rules as step 039.
 */
export function resolveLogRequestId(req: IncomingMessage): string {
  const request = req as RequestWithId;

  if (typeof request.requestId === 'string' && request.requestId.length > 0) {
    return request.requestId;
  }

  return resolveRequestId(request.headers[REQUEST_ID_HEADER]);
}

/**
 * Minimal pino-http options for correlation only.
 * Full structured ops logging / redact / auto request lines land in Track 9.
 */
export function createPinoHttpOptions(): PinoHttpOptions {
  return {
    autoLogging: false,
    genReqId: (req) => resolveLogRequestId(req),
    customProps: (req) => ({
      requestId: resolveLogRequestId(req),
    }),
  };
}

export function createLoggerModuleParams(): Params {
  return {
    pinoHttp: createPinoHttpOptions(),
  };
}
