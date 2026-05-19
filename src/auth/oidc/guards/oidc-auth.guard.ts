import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { IOidcAuthProfile } from '../interfaces/oidc-auth-profile.interface.js';

@Injectable()
export class OidcAuthGuard extends AuthGuard('oidc') {
  handleRequest<TUser = IOidcAuthProfile>(
    err: Error | null,
    user: TUser,
    info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err) {
      throw err;
    }

    if (!user) {
      const message =
        typeof info === 'object' &&
        info !== null &&
        'message' in info &&
        typeof info.message === 'string'
          ? (info as { message: string }).message
          : 'One Login authentication failed';

      throw new UnauthorizedException(message);
    }

    return user;
  }
}
