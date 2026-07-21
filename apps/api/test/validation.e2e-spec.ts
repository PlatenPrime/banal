import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  API_DEFAULT_VERSION,
  apiV1Path,
  applyApiUriVersioning,
} from '../src/config/api-versioning';
import { createValidationPipe } from '../src/config/validation.pipe';
import { ApiExceptionFilter } from '../src/errors/api-exception.filter';
import { CreateExampleDto } from '../src/examples/create-example.dto';

@Controller({ path: 'probe', version: API_DEFAULT_VERSION })
class ProbeController {
  @Post()
  create(@Body() body: CreateExampleDto): CreateExampleDto {
    return body;
  }
}

describe('ValidationPipe (e2e)', () => {
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
          provide: APP_PIPE,
          useFactory: createValidationPipe,
        },
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

  it('returns 422 problem+json with field errors for invalid body', async () => {
    const baseUrl = await createApiLikeApp();
    const path = apiV1Path('probe');

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', extra: true }),
    });
    const body: unknown = await response.json();
    const contentType = response.headers.get('content-type') ?? '';

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(contentType).toContain('application/problem+json');

    const problem = problemDetailsSchema.parse(body);
    expect(problem).toMatchObject({
      type: ERROR_TYPE_URIS.validationFailed,
      title: 'Validation Failed',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      detail: 'Validation failed',
    });
    expect(problem.instance).toBe(path);
    expect(problem.errors).toBeDefined();
    expect(problem.errors?.name).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(problem.errors?.extra).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(problem).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('statusCode');
  });

  it('rejects unknown body fields with 422 field errors', async () => {
    const baseUrl = await createApiLikeApp();
    const path = apiV1Path('probe');

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'alpha', extra: true }),
    });
    const body: unknown = await response.json();

    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

    const problem = problemDetailsSchema.parse(body);
    expect(problem.type).toBe(ERROR_TYPE_URIS.validationFailed);
    expect(problem.errors?.extra).toEqual(expect.arrayContaining([expect.any(String)]));
  });
});
