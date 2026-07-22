import { problemDetailsSchema } from '@app/shared-contracts';
import createClient, { type Client } from 'openapi-fetch';
import { env } from '../../config/env.schema';
import type { paths } from '../api/generated/schema';
import { ApiClientError } from './client';

export type ApiClient = Client<paths>;

/**
 * Always resolve `fetch` from `globalThis` so Vitest stubs / happy-dom patches apply
 * (openapi-fetch would otherwise capture the import-time fetch).
 */
export function createApiClient(baseUrl: string = env.VITE_API_URL): ApiClient {
  return createClient<paths>({
    baseUrl,
    fetch: (input: Request) => globalThis.fetch(input),
  });
}

let defaultClient: ApiClient | undefined;

export function getApiClient(): ApiClient {
  defaultClient ??= createApiClient();
  return defaultClient;
}

type OpenApiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

/**
 * Maps openapi-fetch results to typed data or `ApiClientError` (RFC 9457).
 */
export async function unwrapApiResult<T>(result: OpenApiResult<T>): Promise<T> {
  const { data, error, response } = result;

  if (!response.ok) {
    const problem = problemDetailsSchema.parse(error);
    throw new ApiClientError(problem.title, response.status, problem);
  }

  if (data === undefined) {
    throw new Error('API response missing body');
  }

  return data;
}
