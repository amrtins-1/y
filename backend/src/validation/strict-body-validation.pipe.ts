import { ValidationPipe } from '@nestjs/common';

export const STRICT_BODY_VALIDATION_PIPE = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
});
