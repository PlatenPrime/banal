import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, applyApiUriVersioning } from './api-versioning';

@Controller('probe')
class ProbeController {
  @Get()
  ping(): { ok: true } {
    return { ok: true };
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
});
