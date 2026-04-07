import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

    if (status >= 500) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.warn(
        `${status} ${request.method} ${request.url} – ${exception.message}`,
      );
    }

    response.status(status).json(body);
  }
}
