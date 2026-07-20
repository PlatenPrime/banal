import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  API_DEFAULT_VERSION,
  apiV1Path,
  applyApiUriVersioning,
} from '../src/config/api-versioning';
import { ApiExceptionFilter } from '../src/errors/api-exception.filter';

@Controller({ path: 'probe', version: API_DEFAULT_VERSION })
class ProbeController {
  @Get()
  ping(): { ok: true } {
    return { ok: true };
  }
}

describe('ApiExceptionFilter (e2e)', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createApiLikeApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        {
          provide: APP_FILTER,
          useClass: ApiExceptionFilter,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    return app.getUrl();
  }

  it('returns application/problem+json for an unknown route', async () => {
    const baseUrl = await createApiLikeApp();
    const unknownPath = apiV1Path('no-such-route');

    const response = await fetch(`${baseUrl}${unknownPath}`);
    const body: unknown = await response.json();
    const contentType = response.headers.get('content-type') ?? '';

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(contentType).toContain('application/problem+json');

    const problem = problemDetailsSchema.parse(body);
    expect(problem).toMatchObject({
      type: ERROR_TYPE_URIS.notFound,
      status: HttpStatus.NOT_FOUND,
    });
    expect(problem.instance).toBe(unknownPath);
    expect(problem).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('statusCode');
  });
});
