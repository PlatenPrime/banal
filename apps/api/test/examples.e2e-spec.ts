import {
  exampleDtoSchema,
  exampleListResponseSchema,
  livenessResponseSchema,
  readinessResponseSchema,
} from '@app/shared-contracts';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_COOKIE } from '../src/auth/auth-cookies';
import { apiV1Path } from '../src/config/api-versioning';
import { cookieHeader, mergeCookies } from './helpers/cookie-jar';
import { createE2eApp } from './helpers/create-e2e-app';
import { createE2eEnv, createIsolatedMongoUri, isMongoReachable } from './helpers/mongo-test-uri';
import { jsonOriginHeaders } from './helpers/origin-headers';

describe('Health (e2e)', () => {
  let mongoAvailable = false;
  let closeApp: (() => Promise<void>) | undefined;
  let isolatedMongoUri: string;

  beforeAll(async () => {
    isolatedMongoUri = createIsolatedMongoUri();
    mongoAvailable = await isMongoReachable(isolatedMongoUri);
  });

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  it('GET /health returns 200 with contract liveness body', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(createE2eEnv(isolatedMongoUri));
    closeApp = close;

    const response = await fetch(`${baseUrl}/health`);
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(livenessResponseSchema.parse(body)).toEqual({ status: 'ok' });
  });

  it('GET /health/ready returns 200 when Mongo is connected', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(createE2eEnv(isolatedMongoUri));
    closeApp = close;

    const response = await fetch(`${baseUrl}/health/ready`);
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(readinessResponseSchema.parse(body)).toMatchObject({
      status: 'ok',
      info: { mongodb: { status: 'ok' } },
    });
  });
});

describe('Examples (e2e)', () => {
  let mongoAvailable = false;
  let closeApp: (() => Promise<void>) | undefined;
  let isolatedMongoUri: string;

  beforeAll(async () => {
    isolatedMongoUri = createIsolatedMongoUri();
    mongoAvailable = await isMongoReachable(isolatedMongoUri);
  });

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  it('POST then GET /api/v1/examples roundtrips through Mongo', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    const registerResponse = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({
        email: 'examples-e2e@example.com',
        username: 'examples_e2e',
        password: 'password1',
      }),
    });
    expect(registerResponse.status).toBe(201);

    const jar = mergeCookies(new Map(), registerResponse.headers);

    const createResponse = await fetch(`${baseUrl}${apiV1Path('examples')}`, {
      method: 'POST',
      headers: {
        ...jsonOriginHeaders(),
        cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE]),
      },
      body: JSON.stringify({ name: 'E2E example', description: 'Created in test' }),
    });
    const created: unknown = await createResponse.json();

    expect(createResponse.status).toBe(201);
    const createdDto = exampleDtoSchema.parse(created);
    expect(createdDto.name).toBe('E2E example');

    const listResponse = await fetch(`${baseUrl}${apiV1Path('examples')}`);
    const listBody: unknown = await listResponse.json();

    expect(listResponse.status).toBe(200);
    const list = exampleListResponseSchema.parse(listBody);
    expect(list.total).toBeGreaterThanOrEqual(1);
    expect(list.items.some((item) => item.id === createdDto.id)).toBe(true);
  });
});
