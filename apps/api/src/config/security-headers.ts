import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Baseline HTTP security headers via Helmet.
 * CSP is relaxed enough for Swagger UI (inline scripts/styles) while still set.
 * Apply before versioning/CORS so headers cover all routes.
 */
export function applySecurityHeaders(app: INestApplication): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
        },
      },
    }),
  );
}
