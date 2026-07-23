import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * When TRUST_PROXY is enabled (Railway), Express trusts one hop so `req.secure`
 * and client IP reflect the reverse proxy — required for Secure cookies behind TLS termination.
 */
export function applyTrustProxy(app: INestApplication, trustProxy: boolean): void {
  if (!trustProxy) {
    return;
  }

  (app as NestExpressApplication).set('trust proxy', 1);
}
