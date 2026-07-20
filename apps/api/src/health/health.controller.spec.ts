import { livenessResponseSchema, readinessResponseSchema } from '@app/shared-contracts';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { applyApiUriVersioning } from '../config/api-versioning';
import { HealthModule } from './health.module';
import { STUB_MONGO_NOT_CONFIGURED } from './stub-mongo.health-indicator';

describe('HealthController', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createHealthApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    return app.getUrl();
  }

  it('GET /health returns 200 and matches livenessResponseSchema', async () => {
    const baseUrl = await createHealthApp();

    const response = await fetch(`${baseUrl}/health`);
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(livenessResponseSchema.parse(body)).toEqual({ status: 'ok' });
  });

  it('GET /health/ready returns 503 stub until Mongo is wired', async () => {
    const baseUrl = await createHealthApp();

    const response = await fetch(`${baseUrl}/health/ready`);
    const body: unknown = await response.json();

    expect(response.status).toBe(503);
    expect(readinessResponseSchema.parse(body)).toEqual({
      status: 'error',
      error: {
        mongodb: { status: 'error', detail: STUB_MONGO_NOT_CONFIGURED },
      },
      details: {
        mongodb: { status: 'error', detail: STUB_MONGO_NOT_CONFIGURED },
      },
    });
  });

  it('serves health routes outside /api/v1 prefix', async () => {
    const baseUrl = await createHealthApp();

    const versioned = await fetch(`${baseUrl}/api/v1/health`);
    expect(versioned.status).not.toBe(200);

    const prefixed = await fetch(`${baseUrl}/api/health`);
    expect(prefixed.status).not.toBe(200);
  });
});
