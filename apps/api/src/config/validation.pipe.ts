import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { mapValidationErrors } from './validation-errors';

/** Global HTTP DTO pipe: strip unknown, coerce types, reject non-whitelisted fields. */
export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        error: 'Validation Failed',
        message: 'Validation failed',
        errors: mapValidationErrors(errors),
      }),
  });
