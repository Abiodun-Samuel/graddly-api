import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import * as correlationContext from '../../common/context/correlation-id-context.js';
import { ActiveOrganisationResolver } from '../active-organisation.resolver.js';

import { ActiveOrganisationGuard } from './active-organisation.guard.js';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

describe('ActiveOrganisationGuard', () => {
  const mockApplyHeaderOverride = jest.fn();

  const resolver = {
    applyHeaderOverride: mockApplyHeaderOverride,
  } as unknown as ActiveOrganisationResolver;

  function createContext(
    user: AuthenticatedUser | undefined,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyHeaderOverride.mockResolvedValue(undefined);
    jest
      .spyOn(correlationContext, 'setCurrentOrganisationId')
      .mockImplementation();
  });

  it('allows access when organisationId is set after resolver', async () => {
    const guard = new ActiveOrganisationGuard(resolver);
    const user = {
      id: 'u1',
      organisationId: 'org-1',
      roles: ['owner'],
    } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).resolves.toBe(true);

    expect(mockApplyHeaderOverride).toHaveBeenCalled();
    expect(correlationContext.setCurrentOrganisationId).toHaveBeenCalledWith(
      'org-1',
    );
  });

  it('throws when organisationId is missing', async () => {
    const guard = new ActiveOrganisationGuard(resolver);
    const user = { id: 'u1' } as AuthenticatedUser;

    await expect(guard.canActivate(createContext(user))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
