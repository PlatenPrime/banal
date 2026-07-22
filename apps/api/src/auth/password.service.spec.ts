import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', async () => {
    const hashed = await service.hash('correct-horse-battery');

    expect(hashed).not.toContain('correct-horse-battery');
    await expect(service.verify(hashed, 'correct-horse-battery')).resolves.toBe(true);
    await expect(service.verify(hashed, 'wrong-password')).resolves.toBe(false);
  });

  it('returns false for malformed hash input', async () => {
    await expect(service.verify('not-a-valid-argon2-hash', 'anything')).resolves.toBe(false);
  });
});
