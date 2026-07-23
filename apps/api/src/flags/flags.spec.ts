import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlagsService } from './flags.service';

describe('FlagsService', () => {
  const legacyWriteEnvKeys = ['ALLOW_LEGACY_WRITE_users', 'ALLOW_LEGACY_WRITE_orders'] as const;
  const savedLegacyEnv = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of legacyWriteEnvKeys) {
      const previous = savedLegacyEnv.get(key);
      if (previous === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
    savedLegacyEnv.clear();
    vi.restoreAllMocks();
  });

  function stashLegacyEnv(): void {
    for (const key of legacyWriteEnvKeys) {
      savedLegacyEnv.set(key, process.env[key]);
      delete process.env[key];
    }
  }

  async function createFlagsService(registrationEnabled: boolean): Promise<FlagsService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FlagsService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'AUTH_REGISTRATION_ENABLED') {
                return registrationEnabled;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    return moduleRef.get(FlagsService);
  }

  it('injects and defaults registration to false', async () => {
    const flags = await createFlagsService(false);

    expect(flags.isRegistrationEnabled()).toBe(false);
    expect(flags.getKnownFlags()).toEqual({ registrationEnabled: false });
  });

  it('reports registration enabled when config says so', async () => {
    const flags = await createFlagsService(true);

    expect(flags.isRegistrationEnabled()).toBe(true);
    expect(flags.getKnownFlags()).toEqual({ registrationEnabled: true });
  });

  it('defaults legacy writes to false when env flag is absent', async () => {
    stashLegacyEnv();
    const flags = await createFlagsService(false);

    expect(flags.isLegacyWriteAllowed('users')).toBe(false);
  });

  it('reads ALLOW_LEGACY_WRITE_* from process.env at construction', async () => {
    stashLegacyEnv();
    process.env.ALLOW_LEGACY_WRITE_users = 'true';
    const flags = await createFlagsService(false);

    expect(flags.isLegacyWriteAllowed('users')).toBe(true);
    expect(flags.isLegacyWriteAllowed('Users')).toBe(true);
    expect(flags.isLegacyWriteAllowed('orders')).toBe(false);
  });
});
