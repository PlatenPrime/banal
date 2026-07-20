import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { applyApiUriVersioning } from './api-versioning';
import { applySwaggerDocs, SWAGGER_TITLE, SWAGGER_VERSION } from './swagger';

@Controller({ path: 'probe', version: '1' })
class ProbeController {
  @Get()
  ping(): { ok: true } {
    return { ok: true };
  }
}

describe('applySwaggerDocs', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createSwaggerApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    applySwaggerDocs(app);
    await app.listen(0);
    closeApp = () => app.close();

    return app.getUrl();
  }

  it('serves Swagger UI at /api/docs', async () => {
    const baseUrl = await createSwaggerApp();

    const response = await fetch(`${baseUrl}/api/docs`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type') ?? '').toMatch(/text\/html/i);
    expect(html.toLowerCase()).toContain('swagger');
  });

  it('serves OpenAPI JSON at /api/docs-json', async () => {
    const baseUrl = await createSwaggerApp();

    const response = await fetch(`${baseUrl}/api/docs-json`);
    const body = (await response.json()) as {
      openapi: string;
      info: { title: string; version: string };
      paths: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe(SWAGGER_TITLE);
    expect(body.info.version).toBe(SWAGGER_VERSION);
    expect(body.paths).toBeTypeOf('object');
  });
});
