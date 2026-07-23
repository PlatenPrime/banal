import { problemDetailsSchema, type ProblemDetails } from '@app/shared-contracts';
import type { ZodType } from 'zod';
import { env } from '../../config/env.schema';

export class ApiClientError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(message: string, status: number, problem: ProblemDetails) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.problem = problem;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function request<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(path, env.VITE_API_URL).toString();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (cause) {
    throw new Error('Network request failed', { cause });
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson =
    contentType.includes('application/json') || contentType.includes('application/problem+json');
  const payload: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const problem = problemDetailsSchema.parse(payload);
    throw new ApiClientError(problem.title, response.status, problem);
  }

  return schema.parse(payload);
}
