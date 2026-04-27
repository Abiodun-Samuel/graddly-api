import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from 'express';

import { ORGANISATION_ID_HEADER } from '../common/constants/organisation-headers.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';

import { ActiveOrganisationResolver } from './active-organisation.resolver.js';

import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

describe('ActiveOrganisationResolver', () => {
  let resolver: ActiveOrganisationResolver;
  const mockFindOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActiveOrganisationResolver,
        {
          provide: getRepositoryToken(OrganisationMembership),
          useValue: { findOne: mockFindOne },
        },
      ],
    }).compile();

    resolver = module.get<ActiveOrganisationResolver>(
      ActiveOrganisationResolver,
    );
    jest.clearAllMocks();
  });

  it('does nothing when request has no user', async () => {
    const req = { headers: {} } as Request;
    await resolver.applyHeaderOverride(req);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('does nothing when X-Organisation-Id is absent', async () => {
    const user: AuthenticatedUser = {
      id: 'user-1',
    } as AuthenticatedUser;
    const req = { user, headers: {} } as unknown as Request;

    await resolver.applyHeaderOverride(req);

    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('overrides organisationId and roles when membership exists', async () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    } as AuthenticatedUser;
    const req = {
      user,
      headers: {
        [ORGANISATION_ID_HEADER]: '660e8400-e29b-41d4-a716-446655440001',
      },
    } as unknown as Request;

    mockFindOne.mockResolvedValue({
      organisation: { id: '660e8400-e29b-41d4-a716-446655440001' },
      role: OrganisationRole.ADMIN,
    });

    await resolver.applyHeaderOverride(req);

    expect(user.organisationId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(user.roles).toEqual([OrganisationRole.ADMIN]);
  });

  it('throws BadRequestException when header is not a valid UUID', async () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    } as AuthenticatedUser;
    const req = {
      user,
      headers: { [ORGANISATION_ID_HEADER]: 'not-a-uuid' },
    } as unknown as Request;

    await expect(resolver.applyHeaderOverride(req)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when user is not a member', async () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    } as AuthenticatedUser;
    const req = {
      user,
      headers: {
        [ORGANISATION_ID_HEADER]: '660e8400-e29b-41d4-a716-446655440001',
      },
    } as unknown as Request;

    mockFindOne.mockResolvedValue(null);

    await expect(resolver.applyHeaderOverride(req)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
