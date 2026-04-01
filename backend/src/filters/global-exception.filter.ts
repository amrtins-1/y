import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidCredentialsException, ResourceNotFoundException } from '../utils/errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor.';

    if (exception instanceof ResourceNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof InvalidCredentialsException) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const maybeMessage = (responseBody as { message?: string | string[] }).message;
        if (Array.isArray(maybeMessage)) {
          message = maybeMessage[0] ?? message;
        } else if (typeof maybeMessage === 'string') {
          message = maybeMessage;
        }
      }
    } else if (exception instanceof Error) {
      if (exception.message) {
        message = exception.message;
      }
    }

    response.status(status).json({
      timestamp: new Date().toISOString(),
      status,
      error: HttpStatus[status],
      message,
    });
  }
}
