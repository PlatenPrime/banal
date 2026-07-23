import { ERROR_TYPE_URIS, type AuthUser } from '@app/shared-contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMe, login, logout, refreshSession } from './auth';
import { resetApiClientForTests } from './create-api-client';

const user: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  username: 'admin',
};

describe('auth api-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetApiClientForTests();
  });

  it('login posts credentials with cookies included', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(user), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(login({ username: 'admin', password: 'password123' })).resolves.toEqual(user);

    const [request] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe('http://localhost:4000/api/v1/auth/login');
    expect((request as Request).method).toBe('POST');
    expect((request as Request).credentials).toBe('include');
    await expect((request as Request).clone().text()).resolves.toBe(
      JSON.stringify({ username: 'admin', password: 'password123' }),
    );
  });

  it('logout accepts 204 empty body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(logout()).resolves.toBeUndefined();

    const [request] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect((request as Request).url).toBe('http://localhost:4000/api/v1/auth/logout');
    expect((request as Request).credentials).toBe('include');
  });

  it('refreshSession and fetchMe parse AuthUser', async () => {
    const jsonResponse = () =>
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse())),
    );

    await expect(refreshSession()).resolves.toEqual(user);
    await expect(fetchMe()).resolves.toEqual(user);
  });

  it('login surfaces Problem Details errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: ERROR_TYPE_URIS.unauthorized,
            title: 'Unauthorized',
            status: 401,
            detail: 'Invalid credentials',
          }),
          {
            status: 401,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    );

    await expect(login({ username: 'admin', password: 'password123' })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 401,
      problem: { type: ERROR_TYPE_URIS.unauthorized },
    });
  });
});
