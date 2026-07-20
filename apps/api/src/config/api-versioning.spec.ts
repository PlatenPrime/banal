import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  API_DEFAULT_VERSION,
  API_GLOBAL_PREFIX,
  API_PREFIX_EXCLUDE_PATHS,
  API_URI_VERSION,
  apiPrefixedPath,
  apiV1Path,
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

describe('api path helpers', () => {
  it('exposes prefix/version constants for the public /api/v1 surface', () => {
    expect(API_GLOBAL_PREFIX).toBe('api');
    expect(API_DEFAULT_VERSION).toBe('1');
    expect(API_URI_VERSION).toBe('v1');
    expect(API_PREFIX_EXCLUDE_PATHS).toEqual(['health', 'health/{*path}']);
  });

  it('builds versioned and prefix-only paths from the single source', () => {
    expect(apiV1Path()).toBe('/api/v1');
    expect(apiV1Path('probe')).toBe('/api/v1/probe');
    expect(apiV1Path('examples', 'missing')).toBe('/api/v1/examples/missing');
    expect(apiPrefixedPath('docs')).toBe('/api/docs');
    expect(apiPrefixedPath('docs-json')).toBe('/api/docs-json');
    expect(apiPrefixedPath('health')).toBe('/api/health');
  });
});

describe('applyApiUriVersioning', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  it('serves the probe at the versioned path and rejects unversioned paths', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    const baseUrl = await app.getUrl();

    const versioned = await fetch(`${baseUrl}${apiV1Path('probe')}`);
    expect(versioned.status).toBe(200);
    await expect(versioned.json()).resolves.toEqual({ ok: true });

    const bare = await fetch(`${baseUrl}/probe`);
    expect(bare.status).not.toBe(200);

    const unversioned = await fetch(`${baseUrl}${apiPrefixedPath('probe')}`);
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

    const versionedHealth = await fetch(`${baseUrl}${apiV1Path('health')}`);
    expect(versionedHealth.status).not.toBe(200);
  });
});
