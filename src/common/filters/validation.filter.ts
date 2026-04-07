import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';

import { ValidationException } from '../exceptions/validation.exception.js';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: 'Validation Error',
      errors: exception.errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
