import { afterEach, describe, expect, it, vi } from 'vitest';
import { maybeRedirectOnUnauthorized } from './unauthorized-redirect';

describe('maybeRedirectOnUnauthorized', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubWindow(pathname: string, assign: ReturnType<typeof vi.fn>) {
    vi.stubGlobal('window', {
      location: {
        pathname,
        search: '',
        origin: 'http://localhost:3000',
        assign,
      },
    });
  }

  function unauthorizedResponse(url: string): Response {
    return { status: 401, url } as Response;
  }

  it('redirects to /login for protected API 401s', () => {
    const assign = vi.fn();
    stubWindow('/examples/new', assign);

    maybeRedirectOnUnauthorized(unauthorizedResponse('http://localhost:4000/api/v1/examples'));

    expect(assign).toHaveBeenCalledWith('http://localhost:3000/login?redirect=%2Fexamples%2Fnew');
  });

  it('does not redirect on /login', () => {
    const assign = vi.fn();
    stubWindow('/login', assign);

    maybeRedirectOnUnauthorized(unauthorizedResponse('http://localhost:4000/api/v1/examples'));

    expect(assign).not.toHaveBeenCalled();
  });

  it('does not redirect for /auth/me 401', () => {
    const assign = vi.fn();
    stubWindow('/', assign);

    maybeRedirectOnUnauthorized(unauthorizedResponse('http://localhost:4000/api/v1/auth/me'));

    expect(assign).not.toHaveBeenCalled();
  });
});
