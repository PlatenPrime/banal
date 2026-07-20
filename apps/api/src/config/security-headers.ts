import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Baseline HTTP security headers via Helmet defaults.
 * Apply before versioning/CORS so headers cover all routes.
 */
export function applySecurityHeaders(app: INestApplication): void {
  app.use(helmet());
}
