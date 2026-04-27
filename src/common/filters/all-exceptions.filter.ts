import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

import { getRequestId } from '../context/correlation-id-context.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let body: Record<string, unknown>;

    if (isHttpException) {
      const res = exception.getResponse();
      body =
        typeof res === 'object' && res !== null
          ? { ...(res as Record<string, unknown>) }
          : { statusCode: status, message: String(res) };
    } else {
      body = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      };
    }

    body['timestamp'] = new Date().toISOString();
    body['path'] = request.url;

    const requestId = getRequestId(request);
    if (requestId !== undefined) {
      body['requestId'] = requestId;
    }

    if (status >= 500) {
      Sentry.captureException(exception);
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.warn(
        `${status} ${request.method} ${request.url} – ${exception.message}`,
      );
    }

    response.status(status).json(body);
  }
}
