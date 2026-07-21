import { livenessResponseSchema, readinessResponseSchema } from '@app/shared-contracts';
import { ServiceUnavailableException } from '@nestjs/common';
import { MongooseHealthIndicator, TerminusModule } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiPrefixedPath, apiV1Path, applyApiUriVersioning } from '../config/api-versioning';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let closeApp: (() => Promise<void>) | undefined;
  let mongoosePingCheck: ReturnType<typeof vi.fn>;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createHealthApp(options?: { mongoUp?: boolean }) {
    mongoosePingCheck = vi.fn();

    if (options?.mongoUp ?? true) {
      mongoosePingCheck.mockResolvedValue({ mongodb: { status: 'up' } });
    } else {
      mongoosePingCheck.mockRejectedValue(
        new ServiceUnavailableException({
          status: 'error',
          info: {},
          error: { mongodb: { status: 'down', message: 'Connection failed' } },
          details: { mongodb: { status: 'down', message: 'Connection failed' } },
        }),
      );
    }

    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: MongooseHealthIndicator,
          useValue: { pingCheck: mongoosePingCheck },
        },
      ],
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

  it('GET /health/ready returns 200 when Mongo ping succeeds', async () => {
    const baseUrl = await createHealthApp({ mongoUp: true });

    const response = await fetch(`${baseUrl}/health/ready`);
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(readinessResponseSchema.parse(body)).toMatchObject({
      status: 'ok',
      info: { mongodb: { status: 'ok' } },
    });
    expect(mongoosePingCheck).toHaveBeenCalledWith('mongodb');
  });

  it('GET /health/ready returns 503 when Mongo ping fails', async () => {
    const baseUrl = await createHealthApp({ mongoUp: false });

    const response = await fetch(`${baseUrl}/health/ready`);
    const body: unknown = await response.json();

    expect(response.status).toBe(503);
    expect(readinessResponseSchema.parse(body)).toMatchObject({
      status: 'error',
      error: { mongodb: { status: 'error' } },
    });
  });

  it('serves health routes outside the versioned API prefix', async () => {
    const baseUrl = await createHealthApp();

    const versioned = await fetch(`${baseUrl}${apiV1Path('health')}`);
    expect(versioned.status).not.toBe(200);

    const prefixed = await fetch(`${baseUrl}${apiPrefixedPath('health')}`);
    expect(prefixed.status).not.toBe(200);
  });
});
