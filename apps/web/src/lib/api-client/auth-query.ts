import { queryOptions } from '@tanstack/react-query';
import { fetchMe } from './auth';
import { authKeys } from './query-keys';

export const authMeQueryOptions = queryOptions({
  queryKey: authKeys.me(),
  queryFn: fetchMe,
  retry: false,
  staleTime: 60_000,
});
