import { describe, expect, it } from 'vitest';
import { APP_USERS_COLLECTION, UserSchema } from './user.schema';

describe('UserSchema', () => {
  it('targets the a_users collection', () => {
    expect(UserSchema.get('collection')).toBe(APP_USERS_COLLECTION);
  });

  it('requires email, username, and passwordHash', () => {
    const paths = UserSchema.paths;

    expect(paths.email?.isRequired).toBe(true);
    expect(paths.username?.isRequired).toBe(true);
    expect(paths.passwordHash?.isRequired).toBe(true);
  });

  it('declares unique indexes on email and username', () => {
    const indexes = UserSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([{ email: 1 }, expect.objectContaining({ unique: true })]),
        expect.arrayContaining([{ username: 1 }, expect.objectContaining({ unique: true })]),
      ]),
    );
  });
});
