const AUTH_API_PATH = /\/api\/v1\/auth\/(login|logout|refresh|register|me)(?:\?|$)/;

/**
 * Redirect anonymous / expired sessions to login for non-auth API calls.
 * Skips `/login` (no loop) and auth probe endpoints (`/me`, login, …).
 */
export function maybeRedirectOnUnauthorized(response: Response): void {
  if (response.status !== 401) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === '/login') {
    return;
  }

  try {
    const pathname = new URL(response.url).pathname;
    if (AUTH_API_PATH.test(pathname)) {
      return;
    }
  } catch {
    return;
  }

  const redirectTo = `${window.location.pathname}${window.location.search}`;
  const loginUrl = new URL('/login', window.location.origin);
  if (redirectTo && redirectTo !== '/login') {
    loginUrl.searchParams.set('redirect', redirectTo);
  }
  window.location.assign(loginUrl.toString());
}
