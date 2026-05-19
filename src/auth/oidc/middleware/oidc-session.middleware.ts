import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisStore from 'connect-redis';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';

import { RedisService } from '../../../redis/redis.service.js';

@Injectable()
export class OidcSessionMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof session>;

  constructor(config: ConfigService, redis: RedisService) {
    const ttlSeconds = config.get<number>('app.oidc.sessionTtlSeconds', 600);

    this.handler = session({
      name: 'oidc.sid',
      secret: config.get<string>('app.oidc.sessionSecret', 'change-me'),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.get<string>('app.nodeEnv') === 'production',
        maxAge: ttlSeconds * 1000,
        path: '/api/v1/auth/oidc',
      },
      store: new RedisStore({
        client: redis.getClient(),
        prefix: 'oidc:sess:',
        ttl: ttlSeconds,
      }),
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
