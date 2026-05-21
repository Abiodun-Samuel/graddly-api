import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import {
  setCurrentOrganisationId,
  setCurrentUserId,
} from '../context/correlation-id-context.js';

import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';

/** Mirrors authenticated user / active org from the request into ALS for Postgres RLS GUCs. */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (user?.id) {
      setCurrentUserId(user.id);
      if (user.organisationId) {
        setCurrentOrganisationId(user.organisationId);
      }
    }

    return next.handle();
  }
}
