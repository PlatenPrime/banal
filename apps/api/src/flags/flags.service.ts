import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { parseAllowLegacyWriteFlags } from './allow-legacy-write';
import type { FeatureFlags } from './flags.types';

@Injectable()
export class FlagsService {
  private readonly legacyWriteFlags: ReadonlyMap<string, boolean>;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.legacyWriteFlags = parseAllowLegacyWriteFlags(process.env);
  }

  /** Snapshot of known typed flags (excludes wildcard legacy-write map). */
  getKnownFlags(): FeatureFlags {
    return {
      registrationEnabled: this.isRegistrationEnabled(),
    };
  }

  isRegistrationEnabled(): boolean {
    return this.config.get('AUTH_REGISTRATION_ENABLED', { infer: true });
  }

  /**
   * Whether writes to a legacy collection are allowed.
   * Stub only — no writers call this yet (ADR-001 / Track 18).
   */
  isLegacyWriteAllowed(collection: string): boolean {
    return this.legacyWriteFlags.get(collection.toLowerCase()) ?? false;
  }
}
