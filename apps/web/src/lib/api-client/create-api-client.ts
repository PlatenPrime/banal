import { problemDetailsSchema } from '@app/shared-contracts';
import createClient, { type Client } from 'openapi-fetch';
import { env } from '../../config/env.schema';
import type { paths } from '../api/generated/schema';
import { ApiClientError } from './client';
import { maybeRedirectOnUnauthorized } from './unauthorized-redirect';

export type ApiClient = Client<paths>;

/**
 * Always resolve `fetch` from `globalThis` so Vitest stubs / happy-dom patches apply
 * (openapi-fetch would otherwise capture the import-time fetch).
 */
export function createApiClient(baseUrl: string = env.VITE_API_URL): ApiClient {
  return createClient<paths>({
    baseUrl,
    credentials: 'include',
    fetch: (input: Request) => globalThis.fetch(input),
  });
}

let defaultClient: ApiClient | undefined;

export function getApiClient(): ApiClient {
  defaultClient ??= createApiClient();
  return defaultClient;
}

/** Test helper — clears the lazy singleton so credentials / baseUrl changes apply. */
export function resetApiClientForTests(): void {
  defaultClient = undefined;
}

type OpenApiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

function throwApiClientError(result: OpenApiResult<unknown>): never {
  const { error, response } = result;
  maybeRedirectOnUnauthorized(response);
  const problem = problemDetailsSchema.parse(error);
  throw new ApiClientError(problem.title, response.status, problem);
}

/**
 * Maps openapi-fetch results to typed data or `ApiClientError` (RFC 9457).
 */
export async function unwrapApiResult<T>(result: OpenApiResult<T>): Promise<T> {
  const { data, response } = result;

  if (!response.ok) {
    throwApiClientError(result);
  }

  if (data === undefined) {
    throw new Error('API response missing body');
  }

  return data;
}

/** Maps openapi-fetch results with no body (e.g. 204 logout) to void. */
export async function unwrapEmptyApiResult(result: OpenApiResult<unknown>): Promise<void> {
  const { response } = result;

  if (!response.ok) {
    throwApiClientError(result);
  }
}
