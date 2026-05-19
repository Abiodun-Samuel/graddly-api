import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { setRlsBootstrap } from '../context/correlation-id-context.js';

const BOOTSTRAP_AUTH_SUFFIXES = [
  '/auth/signup',
  '/auth/login',
  '/auth/refresh',
] as const;

export function isRlsBootstrapRequest(request: Request): boolean {
  if (request.method !== 'POST') {
    return false;
  }
  const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
  return BOOTSTRAP_AUTH_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

@Injectable()
export class RlsBootstrapMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (!isRlsBootstrapRequest(req)) {
      next();
      return;
    }

    setRlsBootstrap(true);
    res.on('finish', () => setRlsBootstrap(false));
    res.on('close', () => setRlsBootstrap(false));
    next();
  }
}
