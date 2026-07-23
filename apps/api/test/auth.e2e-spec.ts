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
import { E2E_WEB_ORIGIN, jsonOriginHeaders } from './helpers/origin-headers';

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
      headers: jsonOriginHeaders(),
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
      headers: jsonOriginHeaders(),
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
      headers: {
        ...jsonOriginHeaders(),
        cookie: cookieHeader(jar, [REFRESH_TOKEN_COOKIE]),
      },
    });
    const refreshBody: unknown = await refreshResponse.json();

    expect(refreshResponse.status).toBe(200);
    expect(authUserSchema.parse(refreshBody).username).toBe('alice');
    expect(JSON.stringify(refreshBody)).not.toMatch(/password|access_token|refresh_token|eyJ/);
    jar = mergeCookies(jar, refreshResponse.headers);

    const logoutResponse = await fetch(`${baseUrl}${apiV1Path('auth/logout')}`, {
      method: 'POST',
      headers: {
        ...jsonOriginHeaders(),
        cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]),
      },
    });

    expect(logoutResponse.status).toBe(204);

    const meWithoutCookie = await fetch(`${baseUrl}${apiV1Path('auth/me')}`);
    expect(meWithoutCookie.status).toBe(401);

    const refreshAfterLogout = await fetch(`${baseUrl}${apiV1Path('auth/refresh')}`, {
      method: 'POST',
      headers: {
        ...jsonOriginHeaders(),
        cookie: cookieHeader(jar, [REFRESH_TOKEN_COOKIE]),
      },
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
      headers: jsonOriginHeaders(),
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
      headers: jsonOriginHeaders(),
      body: JSON.stringify({ username: 'bob', password: 'password1' }),
    });
    const loginBody: unknown = await loginResponse.json();

    expect(loginResponse.status).toBe(200);
    expect(authUserSchema.parse(loginBody).username).toBe('bob');
    expect(JSON.stringify(loginBody)).not.toMatch(/password|access_token|refresh_token|eyJ/);
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
      headers: jsonOriginHeaders(),
      body: JSON.stringify({ name: 'secret' }),
    });
    expect(unauthPost.status).toBe(401);

    const listPublic = await fetch(`${baseUrl}${apiV1Path('examples')}`);
    expect(listPublic.status).toBe(200);

    const registerResponse = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
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
        ...jsonOriginHeaders(),
        cookie: cookieHeader(jar, [ACCESS_TOKEN_COOKIE]),
      },
      body: JSON.stringify({ name: 'Authed example', description: 'via cookie' }),
    });
    const created: unknown = await authPost.json();

    expect(authPost.status).toBe(201);
    expect(exampleDtoSchema.parse(created).name).toBe('Authed example');
  });

  it('returns the same 401 body for unknown user and bad password', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({
        email: 'dave@example.com',
        username: 'dave',
        password: 'password1',
      }),
    });

    const unknownUser = await fetch(`${baseUrl}${apiV1Path('auth/login')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({ username: 'no-such-user', password: 'password1' }),
    });
    const badPassword = await fetch(`${baseUrl}${apiV1Path('auth/login')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({ username: 'dave', password: 'wrong-password' }),
    });

    const unknownBody = problemDetailsSchema.parse(await unknownUser.json());
    const badBody = problemDetailsSchema.parse(await badPassword.json());

    expect(unknownUser.status).toBe(401);
    expect(badPassword.status).toBe(401);
    expect(unknownBody).toMatchObject({
      type: ERROR_TYPE_URIS.unauthorized,
      status: 401,
      detail: badBody.detail,
    });
    expect(JSON.stringify(unknownBody)).not.toMatch(/not found|does not exist/i);
    expect(JSON.stringify(badBody)).not.toMatch(/not found|does not exist/i);
  });
});

describe('Auth security (e2e)', () => {
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

  it('returns 429 Problem Details after exceeding login throttle', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    let lastStatus = 0;
    let lastBody: unknown;

    for (let i = 0; i < 6; i += 1) {
      const response = await fetch(`${baseUrl}${apiV1Path('auth/login')}`, {
        method: 'POST',
        headers: jsonOriginHeaders(),
        body: JSON.stringify({ username: 'nobody', password: 'password1' }),
      });
      lastStatus = response.status;
      lastBody = await response.json();
    }

    expect(lastStatus).toBe(429);
    expect(problemDetailsSchema.parse(lastBody)).toMatchObject({
      type: ERROR_TYPE_URIS.rateLimited,
      status: 429,
      title: 'Too Many Requests',
    });
  });

  it('locks out after repeated failed logins with a generic 401', async () => {
    if (!mongoAvailable) {
      return;
    }

    const env = createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' });
    const first = await createE2eApp(env);
    closeApp = first.close;

    await fetch(`${first.baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({
        email: 'erin@example.com',
        username: 'erin',
        password: 'password1',
      }),
    });

    for (let i = 0; i < 5; i += 1) {
      const response = await fetch(`${first.baseUrl}${apiV1Path('auth/login')}`, {
        method: 'POST',
        headers: jsonOriginHeaders(),
        body: JSON.stringify({ username: 'erin', password: 'wrong-password' }),
      });
      expect(response.status).toBe(401);
    }

    // Fresh Nest app = fresh in-memory throttle counters; Mongo still has lockout state.
    await first.close();
    closeApp = undefined;
    const second = await createE2eApp(env);
    closeApp = second.close;

    const locked = await fetch(`${second.baseUrl}${apiV1Path('auth/login')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({ username: 'erin', password: 'password1' }),
    });
    const lockedBody = problemDetailsSchema.parse(await locked.json());

    expect(locked.status).toBe(401);
    expect(lockedBody.type).toBe(ERROR_TYPE_URIS.unauthorized);
    expect(JSON.stringify(lockedBody)).not.toMatch(/lock|attempt/i);
  });

  it('rejects mutating requests with a bad Origin using 403', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, { AUTH_REGISTRATION_ENABLED: 'true' }),
    );
    closeApp = close;

    const response = await fetch(`${baseUrl}${apiV1Path('auth/login')}`, {
      method: 'POST',
      headers: jsonOriginHeaders('https://evil.example.com'),
      body: JSON.stringify({ username: 'anyone', password: 'password1' }),
    });
    const body = problemDetailsSchema.parse(await response.json());

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      type: ERROR_TYPE_URIS.forbidden,
      status: 403,
      detail: 'Origin not allowed',
    });
  });

  it('sets HttpOnly cookies with local SameSite=Lax and Secure=false', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, {
        AUTH_REGISTRATION_ENABLED: 'true',
        NODE_ENV: 'test',
        AUTH_COOKIE_SAMESITE: 'lax',
      }),
    );
    closeApp = close;

    const response = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({
        email: 'flags-local@example.com',
        username: 'flagslocal',
        password: 'password1',
      }),
    });

    expect(response.status).toBe(201);
    const cookies = response.headers.getSetCookie?.() ?? [];
    const access = cookies.find((entry) => entry.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
    const refresh = cookies.find((entry) => entry.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
    expect(access!.toLowerCase()).toContain('httponly');
    expect(refresh!.toLowerCase()).toContain('httponly');
    expect(access!.toLowerCase()).toMatch(/samesite=lax/);
    expect(refresh!.toLowerCase()).toMatch(/samesite=lax/);
    expect(access!.toLowerCase()).not.toContain('secure');
    expect(refresh!.toLowerCase()).not.toContain('secure');
    expect(JSON.stringify(await response.json())).not.toMatch(/eyJ/);
  });

  it('sets Secure cookies for prod-like SameSite=None profile', async () => {
    if (!mongoAvailable) {
      return;
    }

    const { baseUrl, close } = await createE2eApp(
      createE2eEnv(isolatedMongoUri, {
        AUTH_REGISTRATION_ENABLED: 'true',
        NODE_ENV: 'production',
        AUTH_COOKIE_SAMESITE: 'none',
        WEB_ORIGIN: E2E_WEB_ORIGIN,
      }),
    );
    closeApp = close;

    const response = await fetch(`${baseUrl}${apiV1Path('auth/register')}`, {
      method: 'POST',
      headers: jsonOriginHeaders(),
      body: JSON.stringify({
        email: 'flags-prod@example.com',
        username: 'flagsprod',
        password: 'password1',
      }),
    });

    expect(response.status).toBe(201);
    const cookies = response.headers.getSetCookie?.() ?? [];
    const access = cookies.find((entry) => entry.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
    const refresh = cookies.find((entry) => entry.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

    expect(access!.toLowerCase()).toContain('httponly');
    expect(access!.toLowerCase()).toContain('secure');
    expect(access!.toLowerCase()).toMatch(/samesite=none/);
    expect(refresh!.toLowerCase()).toContain('httponly');
    expect(refresh!.toLowerCase()).toContain('secure');
    expect(refresh!.toLowerCase()).toMatch(/samesite=none/);
  });
});
