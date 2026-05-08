import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';

import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';
import type { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  @Inject(ConfigService)
  private readonly config!: ConfigService;

  /**
   * Authenticated requests share a per-user counter; anonymous requests stay IP-based
   * (e.g. login/signup throttled by `auth` bucket per NAT).
   */
  protected override async getTracker(req: Request): Promise<string> {
    const user = req.user as AuthenticatedUser | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    return super.getTracker(req);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.config.get<boolean>('app.throttle.enabled', true)) {
      return true;
    }
    return super.canActivate(context);
  }
}
