import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Parse Cookie header into `req.cookies` for JWT auth guards. */
export function applyCookieParser(app: INestApplication): void {
  app.use(cookieParser());
}
