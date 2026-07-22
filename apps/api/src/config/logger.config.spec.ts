import { Writable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import {
  createLoggerModuleParams,
  createPinoHttpOptions,
  resolveLogRequestId,
  resolvePinoLevel,
} from './logger.config';
import type { RequestWithId } from './request-id.middleware';

function mockReq(
  partial: Partial<RequestWithId> & { headers?: IncomingMessage['headers'] },
): IncomingMessage {
  return {
    headers: {},
    ...partial,
  } as IncomingMessage;
}

describe('resolveLogRequestId', () => {
  it('prefers req.requestId set by the request-id middleware', () => {
    const req = mockReq({ requestId: 'middleware-trace-1' });
    expect(resolveLogRequestId(req)).toBe('middleware-trace-1');
  });

  it('falls back to a valid x-request-id header', () => {
    const req = mockReq({
      headers: { 'x-request-id': 'header-trace-2' },
    });
    expect(resolveLogRequestId(req)).toBe('header-trace-2');
  });
});

describe('resolvePinoLevel', () => {
  it('uses debug in development', () => {
    expect(resolvePinoLevel('development')).toBe('debug');
  });

  it('uses info in production and test', () => {
    expect(resolvePinoLevel('production')).toBe('info');
    expect(resolvePinoLevel('test')).toBe('info');
  });
});

describe('createPinoHttpOptions', () => {
  it('disables autoLogging so step 091 can own request lines', () => {
    expect(createPinoHttpOptions('production').autoLogging).toBe(false);
  });

  it('sets level from NODE_ENV and omits pretty transport (JSON sink)', () => {
    const production = createPinoHttpOptions('production');
    const development = createPinoHttpOptions('development');

    expect(production.level).toBe('info');
    expect(development.level).toBe('debug');
    expect(production).not.toHaveProperty('transport');
    expect(development).not.toHaveProperty('transport');
  });

  it('puts the same requestId into genReqId and customProps', () => {
    const options = createPinoHttpOptions('test');
    const req = mockReq({ requestId: 'corr-abc_123' });

    const reqId = options.genReqId?.(req, {} as never);
    const props = options.customProps?.(req, {} as never);

    expect(reqId).toBe('corr-abc_123');
    expect(props).toEqual({ requestId: 'corr-abc_123' });
  });

  it('keeps genReqId and customProps aligned when only the header is present', () => {
    const options = createPinoHttpOptions('test');
    const req = mockReq({
      headers: { 'x-request-id': 'upstream-42' },
    });

    expect(options.genReqId?.(req, {} as never)).toBe('upstream-42');
    expect(options.customProps?.(req, {} as never)).toEqual({ requestId: 'upstream-42' });
  });

  it('emits a newline-delimited JSON line that JSON.parse accepts', async () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    const options = createPinoHttpOptions('production');
    const logger = pino({ level: options.level as string }, destination);
    logger.info({ requestId: 'parse-me-1' }, 'structured-smoke');

    await new Promise<void>((resolve, reject) => {
      logger.flush((err) => (err ? reject(err) : resolve()));
    });

    const line = Buffer.concat(chunks).toString('utf8').trim().split('\n')[0];
    expect(line).toBeTruthy();

    const parsed = JSON.parse(line!) as {
      level: number;
      msg: string;
      requestId: string;
    };

    expect(parsed.msg).toBe('structured-smoke');
    expect(parsed.requestId).toBe('parse-me-1');
    expect(typeof parsed.level).toBe('number');
  });
});

describe('createLoggerModuleParams', () => {
  it('wires pinoHttp options for LoggerModule from NODE_ENV', () => {
    const params = createLoggerModuleParams('development');
    expect(params.pinoHttp).toMatchObject({
      autoLogging: false,
      level: 'debug',
    });
  });
});
