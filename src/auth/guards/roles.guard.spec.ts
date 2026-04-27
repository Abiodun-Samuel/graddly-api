import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

import { RolesGuard } from './roles.guard.js';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function createContext(
    user: AuthenticatedUser | undefined,
  ): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const ctx = createContext(undefined);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when roles metadata is empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const ctx = createContext(undefined);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OrganisationRole.ADMIN, OrganisationRole.MEMBER]);

    const user = {
      id: 'u1',
      roles: [OrganisationRole.MEMBER],
    } as AuthenticatedUser;

    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('throws when user lacks every required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OrganisationRole.OWNER, OrganisationRole.ADMIN]);

    const user = {
      id: 'u1',
      roles: [OrganisationRole.MEMBER],
    } as AuthenticatedUser;

    expect(() => guard.canActivate(createContext(user))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when user has no roles array', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OrganisationRole.OWNER]);

    const user = { id: 'u1' } as AuthenticatedUser;

    expect(() => guard.canActivate(createContext(user))).toThrow(
      ForbiddenException,
    );
  });

  it('reads metadata from reflector with ROLES_KEY', () => {
    const getSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OrganisationRole.OWNER]);

    const user = {
      id: 'u1',
      roles: [OrganisationRole.OWNER],
    } as AuthenticatedUser;

    const ctx = {
      getHandler: () => function handler() {},
      getClass: () => class TestClass {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    guard.canActivate(ctx);

    expect(getSpy).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
