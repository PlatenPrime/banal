import { describe, expect, it } from 'vitest';
import { parseWebEnv, webEnvSchema } from './env.schema';

describe('webEnvSchema', () => {
  it('accepts a valid API URL', () => {
    expect(parseWebEnv({ VITE_API_URL: 'http://localhost:4000' })).toEqual({
      VITE_API_URL: 'http://localhost:4000',
    });
  });

  it('rejects missing API URL', () => {
    expect(() => webEnvSchema.parse({})).toThrow();
  });

  it('rejects invalid API URL', () => {
    expect(() => parseWebEnv({ VITE_API_URL: 'not-a-url' })).toThrow();
  });

  it('accepts https URLs via z.url()', () => {
    expect(parseWebEnv({ VITE_API_URL: 'https://api.example.com' })).toEqual({
      VITE_API_URL: 'https://api.example.com',
    });
  });
});
