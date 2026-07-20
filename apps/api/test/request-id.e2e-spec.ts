import { Controller, Get, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { applyApiUriVersioning } from '../src/config/api-versioning';
import {
  applyRequestIdMiddleware,
  REQUEST_ID_HEADER,
  REQUEST_ID_PATTERN,
  type RequestWithId,
} from '../src/config/request-id.middleware';
import { applySecurityHeaders } from '../src/config/security-headers';

@Controller({ path: '', version: '1' })
class VersionedProbeController {
  @Get()
  ping(@Req() req: RequestWithId): { requestId: string } {
    return { requestId: req.requestId };
  }
}

@Controller({ path: 'health', version: VERSION_NEUTRAL })
class HealthProbeController {
  @Get()
  liveness(@Req() req: RequestWithId): { status: 'ok'; requestId: string } {
    return { status: 'ok', requestId: req.requestId };
  }
}

describe('Request ID (e2e)', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createApiLikeApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [VersionedProbeController, HealthProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applySecurityHeaders(app);
    applyRequestIdMiddleware(app);
    applyApiUriVersioning(app);
    await app.listen(0);
    closeApp = () => app.close();

    return app.getUrl();
  }

  it('returns x-request-id on versioned API routes', async () => {
    const baseUrl = await createApiLikeApp();
    const clientId = 'e2e-client-trace-001';

    const response = await fetch(`${baseUrl}/api/v1`, {
      headers: { [REQUEST_ID_HEADER]: clientId },
    });
    const body = (await response.json()) as { requestId: string };

    expect(response.status).toBe(200);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(clientId);
    expect(body.requestId).toBe(clientId);
  });

  it('returns x-request-id on excluded health routes', async () => {
    const baseUrl = await createApiLikeApp();

    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as { requestId: string };
    const header = response.headers.get(REQUEST_ID_HEADER);

    expect(response.status).toBe(200);
    expect(header).toBeTruthy();
    expect(body.requestId).toBe(header);
    expect(REQUEST_ID_PATTERN.test(header ?? '')).toBe(true);
  });
});
