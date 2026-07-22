import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExample, fetchExamples } from './examples';

describe('examples api-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchExamples validates list responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                id: '1',
                name: 'Alpha',
                description: null,
                createdAt: '2026-07-21T10:00:00.000Z',
              },
            ],
            total: 1,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    await expect(fetchExamples()).resolves.toEqual({
      items: [
        {
          id: '1',
          name: 'Alpha',
          description: null,
          createdAt: '2026-07-21T10:00:00.000Z',
        },
      ],
      total: 1,
    });
  });

  it('createExample posts validated payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: '2',
            name: 'Beta',
            createdAt: '2026-07-21T10:00:00.000Z',
          }),
          {
            status: 201,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    await expect(createExample({ name: 'Beta' })).resolves.toMatchObject({
      id: '2',
      name: 'Beta',
    });

    const [request] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe('http://localhost:4000/api/v1/examples');
    expect((request as Request).method).toBe('POST');
    await expect((request as Request).clone().text()).resolves.toBe(
      JSON.stringify({ name: 'Beta' }),
    );
  });
});
