import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

import { IApiResponse } from '../interfaces/api-response.interface';

import { RESPONSE_MESSAGE_KEY } from './response-message.decorator';

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

    return next.handle().pipe(map((data) => ({ message, data })));
  }
}
