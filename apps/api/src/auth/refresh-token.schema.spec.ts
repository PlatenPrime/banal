import { describe, expect, it } from 'vitest';
import { APP_REFRESH_TOKENS_COLLECTION, RefreshTokenSchema } from './refresh-token.schema';

describe('RefreshTokenSchema', () => {
  it('targets the a_refresh_tokens collection', () => {
    expect(RefreshTokenSchema.get('collection')).toBe(APP_REFRESH_TOKENS_COLLECTION);
  });

  it('requires jti hash, userId, expiresAt, and createdAt', () => {
    const paths = RefreshTokenSchema.paths;

    expect(paths.jti?.isRequired).toBe(true);
    expect(paths.userId?.isRequired).toBe(true);
    expect(paths.expiresAt?.isRequired).toBe(true);
    expect(paths.createdAt?.isRequired).toBe(true);
    expect(paths.revokedAt?.isRequired ?? false).toBe(false);
  });

  it('declares unique jti and TTL on expiresAt', () => {
    const indexes = RefreshTokenSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([{ jti: 1 }, expect.objectContaining({ unique: true })]),
        expect.arrayContaining([
          { expiresAt: 1 },
          expect.objectContaining({ expireAfterSeconds: 0 }),
        ]),
      ]),
    );
  });
});
