import { redirect } from '@tanstack/react-router';
import { authMeQueryOptions } from '../api-client/auth-query';
import type { RouterContext } from '../../router-context';

type RequireAuthArgs = {
  context: RouterContext;
  location: { href: string; pathname: string };
};

/**
 * Client-only guard: during SSR, cookies for the API host are unavailable,
 * so auth is deferred until hydration.
 */
export async function requireAuth({ context, location }: RequireAuthArgs): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    await context.queryClient.ensureQueryData(authMeQueryOptions);
  } catch {
    throw redirect({
      to: '/login',
      search: {
        redirect: location.pathname,
      },
    });
  }
}
