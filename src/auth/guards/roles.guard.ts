import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

/**
 * Requires {@link Roles} metadata on the handler or class. Use after {@link JwtAuthGuard}
 * so `req.user` is populated. Compares JWT/header-resolved `user.roles` against allowed roles
 * (OR: user needs at least one listed role).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<OrganisationRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (required === undefined || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    const userRoles = user?.roles ?? [];

    const allowed = required.some((role) => userRoles.includes(role));

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
