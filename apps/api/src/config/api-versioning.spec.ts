import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  API_DEFAULT_VERSION,
  API_GLOBAL_PREFIX,
  API_PREFIX_EXCLUDE_PATHS,
  applyApiUriVersioning,
} from './api-versioning';

@Controller('probe')
class ProbeController {
  @Get()
  ping(): { ok: true } {
    return { ok: true };
  }
}

@Controller({ path: 'health', version: VERSION_NEUTRAL })
class HealthProbeController {
  @Get()
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  readiness(): { status: 'ready' } {
    return { status: 'ready' };
  }
}

describe('applyApiUriVersioning', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  it('exposes API_GLOBAL_PREFIX and API_DEFAULT_VERSION for /api/v1', () => {
    expect(API_GLOBAL_PREFIX).toBe('api');
    expect(API_DEFAULT_VERSION).toBe('1');
    expect(API_PREFIX_EXCLUDE_PATHS).toEqual(['health', 'health/{*path}']);
  });

  it('serves the probe at /api/v1/probe and rejects unversioned paths', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    const baseUrl = await app.getUrl();

    const versioned = await fetch(`${baseUrl}/api/v1/probe`);
    expect(versioned.status).toBe(200);
    await expect(versioned.json()).resolves.toEqual({ ok: true });

    const bare = await fetch(`${baseUrl}/probe`);
    expect(bare.status).not.toBe(200);

    const unversioned = await fetch(`${baseUrl}/api/probe`);
    expect(unversioned.status).not.toBe(200);
  });

  it('excludes /health from the global prefix', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    const baseUrl = await app.getUrl();

    const health = await fetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: 'ok' });

    const ready = await fetch(`${baseUrl}/health/ready`);
    expect(ready.status).toBe(200);
    await expect(ready.json()).resolves.toEqual({ status: 'ready' });

    const versionedHealth = await fetch(`${baseUrl}/api/v1/health`);
    expect(versionedHealth.status).not.toBe(200);
  });
});
