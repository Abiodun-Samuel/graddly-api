import { INestApplication, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ValidationFilter } from './common/filters/validation.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { ValidationPipe } from './common/pipes/validation.pipe.js';

const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/([\w-]+\.)*graddly\.com$/,
];

export function configureApp(app: INestApplication): INestApplication {
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter(), new ValidationFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  return app;
}
