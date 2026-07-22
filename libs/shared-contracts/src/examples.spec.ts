import { describe, expect, it } from 'vitest';
import {
  createExampleRequestSchema,
  exampleDtoSchema,
  exampleListResponseSchema,
} from './examples';

describe('example schemas', () => {
  it('parses a valid create request', () => {
    const payload = { name: 'Demo', description: 'Foundation example' };
    expect(createExampleRequestSchema.parse(payload)).toEqual(payload);
  });

  it('rejects empty create name', () => {
    expect(() => createExampleRequestSchema.parse({ name: '' })).toThrow();
  });

  it('rejects create name longer than 200 chars', () => {
    expect(() => createExampleRequestSchema.parse({ name: 'x'.repeat(201) })).toThrow();
  });

  it('parses example DTO and list response', () => {
    const item = {
      id: 'ex_1',
      name: 'Demo',
      description: null,
      createdAt: '2026-07-19T09:00:00.000Z',
    };

    expect(exampleDtoSchema.parse(item)).toEqual(item);
    expect(exampleListResponseSchema.parse({ items: [item], total: 1 })).toEqual({
      items: [item],
      total: 1,
    });
  });

  it('rejects invalid createdAt and negative total', () => {
    expect(() =>
      exampleDtoSchema.parse({
        id: 'ex_1',
        name: 'Demo',
        createdAt: 'yesterday',
      }),
    ).toThrow();

    expect(() => exampleListResponseSchema.parse({ items: [], total: -1 })).toThrow();
  });

  it('accepts ISO-8601 createdAt via z.iso.datetime()', () => {
    const item = {
      id: 'ex_2',
      name: 'ISO',
      createdAt: '2026-07-22T09:30:00.000Z',
    };

    expect(exampleDtoSchema.parse(item).createdAt).toBe('2026-07-22T09:30:00.000Z');
  });
});
