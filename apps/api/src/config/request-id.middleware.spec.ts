import { Controller, Get, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyRequestIdMiddleware,
  REQUEST_ID_HEADER,
  REQUEST_ID_PATTERN,
  resolveRequestId,
  type RequestWithId,
} from './request-id.middleware';

@Controller('probe')
class ProbeController {
  @Get()
  ping(@Req() req: RequestWithId): { requestId: string } {
    return { requestId: req.requestId };
  }
}

describe('resolveRequestId', () => {
  it('returns a valid incoming id', () => {
    expect(resolveRequestId('client-trace-abc_123')).toBe('client-trace-abc_123');
  });

  it('trims whitespace from incoming ids', () => {
    expect(resolveRequestId('  client-id  ')).toBe('client-id');
  });

  it('generates a uuid when header is missing', () => {
    const id = resolveRequestId(undefined);
    expect(REQUEST_ID_PATTERN.test(id)).toBe(true);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects suspicious ids and generates a new uuid', () => {
    const id = resolveRequestId('bad\ninjection');
    expect(id).not.toBe('bad\ninjection');
    expect(REQUEST_ID_PATTERN.test(id)).toBe(true);
  });

  it('rejects ids longer than MAX_REQUEST_ID_LENGTH', () => {
    const tooLong = 'a'.repeat(129);
    const id = resolveRequestId(tooLong);
    expect(id).not.toBe(tooLong);
    expect(REQUEST_ID_PATTERN.test(id)).toBe(true);
  });
});

describe('applyRequestIdMiddleware', () => {
  let closeApp: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (closeApp) {
      await closeApp();
      closeApp = undefined;
    }
  });

  async function createProbeApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyRequestIdMiddleware(app);
    await app.listen(0);
    closeApp = () => app.close();

    return app.getUrl();
  }

  it('sets x-request-id on responses when header is absent', async () => {
    const baseUrl = await createProbeApp();

    const response = await fetch(`${baseUrl}/probe`);
    const body = (await response.json()) as { requestId: string };
    const header = response.headers.get(REQUEST_ID_HEADER);

    expect(response.status).toBe(200);
    expect(header).toBeTruthy();
    expect(body.requestId).toBe(header);
    expect(REQUEST_ID_PATTERN.test(header ?? '')).toBe(true);
  });

  it('echoes a valid client-provided x-request-id', async () => {
    const baseUrl = await createProbeApp();
    const clientId = 'upstream-trace-42';

    const response = await fetch(`${baseUrl}/probe`, {
      headers: { [REQUEST_ID_HEADER]: clientId },
    });
    const body = (await response.json()) as { requestId: string };

    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(clientId);
    expect(body.requestId).toBe(clientId);
  });

  it('replaces invalid x-request-id with a generated value', async () => {
    const baseUrl = await createProbeApp();
    const invalid = 'has spaces and invalid!';

    const response = await fetch(`${baseUrl}/probe`, {
      headers: { [REQUEST_ID_HEADER]: invalid },
    });
    const body = (await response.json()) as { requestId: string };
    const header = response.headers.get(REQUEST_ID_HEADER);

    expect(header).toBeTruthy();
    expect(header).not.toBe(invalid);
    expect(body.requestId).toBe(header);
    expect(REQUEST_ID_PATTERN.test(header ?? '')).toBe(true);
  });
});
