import { Writable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import {
  createLoggerModuleParams,
  createPinoHttpOptions,
  PINO_REDACT_CENSOR,
  PINO_REDACT_PATHS,
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
  it('disables autoLogging so RequestLoggingInterceptor owns request lines', () => {
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

  it('configures redact paths for Mongo URI and auth secrets', () => {
    const options = createPinoHttpOptions('production');

    expect(options.redact).toEqual({
      paths: [...PINO_REDACT_PATHS],
      censor: PINO_REDACT_CENSOR,
    });
    expect(PINO_REDACT_PATHS).toEqual(
      expect.arrayContaining([
        'MONGODB_URI',
        '*.MONGODB_URI',
        'password',
        '*.password',
        'req.body.password',
        'req.headers.authorization',
        'req.headers.cookie',
        'accessToken',
        'refreshToken',
      ]),
    );
  });

  it('redacts MONGODB_URI credentials from JSON log lines', async () => {
    const secretUri = 'mongodb://user:super-secret-pass@db.example:27017/app';
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    const options = createPinoHttpOptions('production');
    const logger = pino(
      {
        level: options.level as string,
        redact: options.redact,
      },
      destination,
    );

    logger.info(
      {
        MONGODB_URI: secretUri,
        config: { MONGODB_URI: secretUri },
      },
      'env-dump-smoke',
    );

    await new Promise<void>((resolve, reject) => {
      logger.flush((err) => (err ? reject(err) : resolve()));
    });

    const line = Buffer.concat(chunks).toString('utf8').trim().split('\n')[0];
    expect(line).toBeTruthy();
    expect(line).not.toContain('super-secret-pass');
    expect(line).not.toContain(secretUri);

    const parsed = JSON.parse(line!) as {
      MONGODB_URI: string;
      config: { MONGODB_URI: string };
      msg: string;
    };

    expect(parsed.msg).toBe('env-dump-smoke');
    expect(parsed.MONGODB_URI).toBe(PINO_REDACT_CENSOR);
    expect(parsed.config.MONGODB_URI).toBe(PINO_REDACT_CENSOR);
  });

  it('redacts password, tokens, Authorization, and Cookie from JSON log lines (T20 redact audit)', async () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    const options = createPinoHttpOptions('production');
    const logger = pino(
      {
        level: options.level as string,
        redact: options.redact,
      },
      destination,
    );

    const jwtAccess = 'eyJhbGciOiJIUzI1NiJ9.payload.sig';
    const jwtRefresh = 'eyJhbGciOiJIUzI1NiJ9.refresh.sig';

    logger.info(
      {
        password: 'super-secret-password',
        access_token: jwtAccess,
        refresh_token: jwtRefresh,
        accessToken: jwtAccess,
        refreshToken: jwtRefresh,
        req: {
          body: { password: 'body-password' },
          headers: {
            authorization: `Bearer ${jwtAccess}`,
            cookie: `access_token=${jwtAccess}; refresh_token=${jwtRefresh}`,
            'set-cookie': [`access_token=${jwtAccess}; HttpOnly`],
          },
        },
      },
      'auth-dump-smoke',
    );

    await new Promise<void>((resolve, reject) => {
      logger.flush((err) => (err ? reject(err) : resolve()));
    });

    const line = Buffer.concat(chunks).toString('utf8').trim().split('\n')[0];
    expect(line).toBeTruthy();
    expect(line).not.toContain('super-secret-password');
    expect(line).not.toContain('body-password');
    expect(line).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(line).not.toContain('Bearer ');
    expect(line).not.toContain('HttpOnly');

    const parsed = JSON.parse(line!) as {
      password: string;
      access_token: string;
      refresh_token: string;
      accessToken: string;
      refreshToken: string;
      req: {
        body: { password: string };
        headers: { authorization: string; cookie: string; 'set-cookie': string };
      };
    };

    expect(parsed.password).toBe(PINO_REDACT_CENSOR);
    expect(parsed.access_token).toBe(PINO_REDACT_CENSOR);
    expect(parsed.refresh_token).toBe(PINO_REDACT_CENSOR);
    expect(parsed.accessToken).toBe(PINO_REDACT_CENSOR);
    expect(parsed.refreshToken).toBe(PINO_REDACT_CENSOR);
    expect(parsed.req.body.password).toBe(PINO_REDACT_CENSOR);
    expect(parsed.req.headers.authorization).toBe(PINO_REDACT_CENSOR);
    expect(parsed.req.headers.cookie).toBe(PINO_REDACT_CENSOR);
    expect(parsed.req.headers['set-cookie']).toBe(PINO_REDACT_CENSOR);
  });
});

describe('createLoggerModuleParams', () => {
  it('wires pinoHttp options for LoggerModule from NODE_ENV', () => {
    const params = createLoggerModuleParams('development');
    expect(params.pinoHttp).toMatchObject({
      autoLogging: false,
      level: 'debug',
      redact: {
        paths: [...PINO_REDACT_PATHS],
        censor: PINO_REDACT_CENSOR,
      },
    });
  });
});
