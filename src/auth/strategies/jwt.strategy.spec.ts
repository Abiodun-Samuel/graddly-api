import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { OrganisationMembership } from '../../organisations/entities/organisation-membership.entity.js';
import { OrganisationRole } from '../../organisations/organisation-role.enum.js';
import { UsersService } from '../../users/users.service.js';

import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockMembershipRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'test-secret'),
          },
        },
        { provide: UsersService, useValue: mockUsersService },
        {
          provide: getRepositoryToken(OrganisationMembership),
          useValue: mockMembershipRepo,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  const baseUser = {
    id: 'user-1',
    firstName: 'A',
    lastName: 'B',
    email: 'a@example.com',
    password: 'x',
    isEmailVerified: false,
    isActive: true,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
  };

  it('returns user without org fields when JWT has no orgId', async () => {
    mockUsersService.findById.mockResolvedValue(baseUser);

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'a@example.com',
    });

    expect(result).toMatchObject({ id: 'user-1', email: 'a@example.com' });
    expect(result.organisationId).toBeUndefined();
    expect(result.roles).toBeUndefined();
    expect(mockMembershipRepo.findOne).not.toHaveBeenCalled();
  });

  it('returns augmented user when orgId is valid', async () => {
    mockUsersService.findById.mockResolvedValue(baseUser);
    mockMembershipRepo.findOne.mockResolvedValue({
      organisation: { id: 'org-1' },
      role: OrganisationRole.ADMIN,
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'a@example.com',
      orgId: 'org-1',
      roles: ['admin'],
    });

    expect(mockMembershipRepo.findOne).toHaveBeenCalled();
    expect(result.organisationId).toBe('org-1');
    expect(result.roles).toEqual([OrganisationRole.ADMIN]);
  });

  it('throws when orgId is present but membership is gone', async () => {
    mockUsersService.findById.mockResolvedValue(baseUser);
    mockMembershipRepo.findOne.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'a@example.com',
        orgId: 'org-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws when account is deactivated', async () => {
    mockUsersService.findById.mockResolvedValue({
      ...baseUser,
      isActive: false,
    });

    await expect(
      strategy.validate({ sub: 'user-1', email: 'a@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
