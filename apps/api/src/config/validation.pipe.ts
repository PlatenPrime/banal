import { ValidationPipe } from '@nestjs/common';

/** Global HTTP DTO pipe: strip unknown, coerce types, reject non-whitelisted fields. */
export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });
