import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AuthUser } from '@app/shared-contracts';
import { authMeQueryOptions } from '../api-client/auth-query';

/** Current user from `/auth/me`. Client-only — SSR stays anonymous (cross-origin cookies). */
export function useAuth(): UseQueryResult<AuthUser, Error> {
  return useQuery({
    ...authMeQueryOptions,
    enabled: typeof document !== 'undefined',
  });
}
