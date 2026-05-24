import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

import { IApiResponse } from '../interfaces/api-response.interface';
import { PaginatedResult } from '../pagination/paginated-result.js';

import { RESPONSE_MESSAGE_KEY } from './response-message.decorator';
import { SKIP_RESPONSE_ENVELOPE_KEY } from './skip-response-envelope.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiResponse<T>> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      'Success';

    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_ENVELOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<{ url?: string }>();

    return next.handle().pipe(
      map((data) => {
        const isAuditCsvExport =
          typeof data === 'string' &&
          (request.url?.includes('/audit/export') ?? false);

        if (skipEnvelope || isAuditCsvExport) {
          return data as IApiResponse<T>;
        }
        if (data instanceof PaginatedResult) {
          return {
            message,
            data: data.items as T,
            meta: data.meta,
          };
        }
        return { message, data };
      }),
    );
  }
}
