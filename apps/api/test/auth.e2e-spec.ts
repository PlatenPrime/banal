import {
  authUserSchema,
  ERROR_TYPE_URIS,
  exampleDtoSchema,
  problemDetailsSchema,
} from '@app/shared-contracts';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../src/auth/auth-cookies';
import { apiV1Path } from '../src/config/api-versioning';
import { cookieHeader, mergeCookies } from './helpers/cookie-jar';
import { createE2eApp } from './helpers/create-e2e-app';
import { createE2eEnv, createIsolatedMongoUri, isMongoReachable } from './helpers/mongo-test-uri';

describe('Auth (e2e)', () => {
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

  it('register is forbidden when AUTH_REGISTRATION_ENABLED is false', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(createE2eEnv(isolatedMongoUri));
    closeApp = close;

    const response = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'blocked@example.com',
        username: 'blocked',
        password: 'password1',
      }),
    });
    const body: unknown = await response.json();

    expect(response.status).toBe(403);
    expect(problemDetailsSchema.parse(body).type).toBe(ERROR_TYPE_URIS.forbidden);
  });

  it('register → me → refresh → logout full cookie flow', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    const registerResponse = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'Alice@Example.com',
        username: 'alice',
        password: 'password1',
      }),
    });
    const registered: unknown = await registerResponse.json();

    expect(registerResponse.status).toBe(201);
    expect(authUserSchema.parse(registered)).toMatchObject({
      email: 'alice@example.com',
      username: 'alice',
    });
    expect(JSON.stringify(registered)).not.toMatch(/password|access_token|refresh_token|eyJ/);

    let jar = mergeCookies(new Map(), registerResponse.headers);
    expect(jar.has(ACCESS_TOKEN_COOKIE)).toBe(true);
    expect(jar.has(REFRESH_TOKEN_COOKIE)).toBe(true);

    const meResponse = await fetch(`${baseUrl}${apiV1Path('auth/me')}`, {
      headers: { cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE]) },
    });
    const meBody: unknown = await meResponse.json();

    expect(meResponse.status).toBe(200);
    expect(authUserSchema.parse(meBody).username).toBe('alice');

    const refreshResponse = await fetch(`${baseUrl}${apiV1Path('auth/refresh')}`, {
      method: 'POST',
      headers: { cookie: cookieHeader(jar, [REFRESH_TOKEN_COOKIE]) },
    });
    const refreshBody: unknown = await refreshResponse.json();

    expect(refreshResponse.status).toBe(200);
    expect(authUserSchema.parse(refreshBody).username).toBe('alice');
    jar = mergeCookies(jar, refreshResponse.headers);

    const logoutResponse = await fetch(`${baseUrl}${apiV1Path('auth/logout')}`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]),
      },
    });

    expect(logoutResponse.status).toBe(204);

    const meWithoutCookie = await fetch(`${baseUrl}${apiV1Path('auth/me')}`);
    expect(meWithoutCookie.status).toBe(401);

    const refreshAfterLogout = await fetch(`${baseUrl}${apiV1Path('auth/refresh')}`, {
      method: 'POST',
      headers: { cookie: cookieHeader(jar, [REFRESH_TOKEN_COOKIE]) },
    });
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('login sets cookies and GET /auth/me without cookie returns 401', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@example.com',
        username: 'bob',
        password: 'password1',
      }),
    });

    const unauthMe = await fetch(`${baseUrl}${apiV1Path('auth/me')}`);
    expect(unauthMe.status).toBe(401);
    expect(problemDetailsSchema.parse(await unauthMe.json()).type).toBe(
      ERROR_TYPE_URIS.unauthorized,
    );

    const loginResponse = await fetch(`${baseUrl}${apiV1Path('auth/login')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'bob', password: 'password1' }),
    });
    const loginBody: unknown = await loginResponse.json();

    expect(loginResponse.status).toBe(200);
    expect(authUserSchema.parse(loginBody).username).toBe('bob');
    expect(JSON.stringify(loginBody)).not.toMatch(/eyJ/);
  });

  it('POST /examples requires auth; GET remains public', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    const unauthPost = await fetch(`${baseUrl}${apiV1Path('examples')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'secret' }),
    });
    expect(unauthPost.status).toBe(401);

    const listPublic = await fetch(`${baseUrl}${apiV1Path('examples')}`);
    expect(listPublic.status).toBe(200);

    const registerResponse = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'carol@example.com',
        username: 'carol',
        password: 'password1',
      }),
    });
    const jar = mergeCookies(new Map(), registerResponse.headers);

    const authPost = await fetch(`${baseUrl}${apiV1Path('examples')}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE]),
      },
      body: JSON.stringify({ name: 'Authed example', description: 'via cookie' }),
    });
    const created: unknown = await authPost.json();

    expect(authPost.status).toBe(201);
    expect(exampleDtoSchema.parse(created).name).toBe('Authed example');
  });
});
