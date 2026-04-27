import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';

import { getRequestId } from '../context/correlation-id-context.js';
import { ValidationException } from '../exceptions/validation.exception.js';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const payload: Record<string, unknown> = {
      statusCode: status,
      message: 'Validation Error',
      errors: exception.errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    const requestId = getRequestId(request);
    if (requestId !== undefined) {
      payload['requestId'] = requestId;
    }
    response.status(status).json(payload);
  }
}
