import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient, unwrapApiResult } from './create-api-client';

describe('createApiClient / unwrapApiResult', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns data for successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [], total: 0 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const client = createApiClient('http://localhost:4000');
    const data = await unwrapApiResult(await client.GET('/api/v1/examples'));

    expect(data).toEqual({ items: [], total: 0 });
  });

  it('throws ApiClientError for problem+json responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: ERROR_TYPE_URIS.notFound,
            title: 'Not Found',
            status: 404,
            detail: 'Missing resource',
          }),
          {
            status: 404,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    );

    const client = createApiClient('http://localhost:4000');

    await expect(unwrapApiResult(await client.GET('/api/v1/examples'))).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 404,
      problem: {
        type: ERROR_TYPE_URIS.notFound,
        title: 'Not Found',
        status: 404,
      },
    });
  });
});
