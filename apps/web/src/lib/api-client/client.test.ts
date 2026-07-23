import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { request } from './client';

const responseSchema = z.object({ ok: z.literal(true) });

describe('api-client request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(request('/api/v1/examples', responseSchema)).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/v1/examples',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
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

    await expect(request('/missing', responseSchema)).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 404,
      problem: {
        type: ERROR_TYPE_URIS.notFound,
        title: 'Not Found',
        status: 404,
      },
    });
  });

  it('throws when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(request('/api/v1/examples', responseSchema)).rejects.toThrow(
      'Network request failed',
    );
  });
});
