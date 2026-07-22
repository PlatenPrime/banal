import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id wrappers for platform accounts (ADR-003). Never log password or hash.
 */
@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    return hash(plain);
  }

  /**
   * Verifies plaintext against an Argon2id hash.
   * `@node-rs/argon2` verify is constant-time for the crypto compare path.
   */
  async verify(hashValue: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashValue, plain);
    } catch {
      return false;
    }
  }
}
