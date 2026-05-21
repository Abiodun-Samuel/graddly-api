import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserOidcIdentity } from '../../users/entities/user-oidc-identity.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';

import { OidcAccountLinkingService } from './oidc-account-linking.service.js';

describe('OidcAccountLinkingService', () => {
  let service: OidcAccountLinkingService;

  const usersService = {
    findByEmail: jest.fn(),
    createFromOidc: jest.fn(),
    markEmailVerified: jest.fn(),
  };

  const identitiesRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const issuer = 'https://oidc.test.example';
  const profile = {
    sub: 'one-login-sub',
    email: 'user@example.com',
    emailVerified: true,
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    isEmailVerified: false,
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    configService.get.mockReturnValue('auto_create');
    identitiesRepository.create.mockImplementation(
      (data: Partial<UserOidcIdentity>) => data,
    );
    identitiesRepository.save.mockImplementation((data: UserOidcIdentity) =>
      Promise.resolve(data),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OidcAccountLinkingService,
        { provide: UsersService, useValue: usersService },
        {
          provide: getRepositoryToken(UserOidcIdentity),
          useValue: identitiesRepository,
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(OidcAccountLinkingService);
  });

  it('returns user found by issuer and subject', async () => {
    identitiesRepository.findOne.mockResolvedValue({
      user: mockUser,
    });

    const user = await service.resolveUserForLogin(profile, issuer);

    expect(user).toBe(mockUser);
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects when sub-linked user email does not match IdP email', async () => {
    identitiesRepository.findOne.mockResolvedValue({
      user: { ...mockUser, email: 'other@example.com' },
    });

    await expect(service.resolveUserForLogin(profile, issuer)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('links identity and marks email verified for existing user by email', async () => {
    identitiesRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    usersService.findByEmail.mockResolvedValue(mockUser);

    const user = await service.resolveUserForLogin(profile, issuer);

    expect(user).toBe(mockUser);
    expect(usersService.markEmailVerified).toHaveBeenCalledWith('user-1');
    expect(identitiesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        issuer,
        subject: 'one-login-sub',
      }),
    );
  });

  it('rejects when user already linked to a different subject', async () => {
    identitiesRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ subject: 'other-sub' });
    usersService.findByEmail.mockResolvedValue(mockUser);

    await expect(service.resolveUserForLogin(profile, issuer)).rejects.toThrow(
      'already linked to a different One Login identity',
    );
  });

  it('auto-provisions user when email is unknown', async () => {
    identitiesRepository.findOne.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createFromOidc.mockResolvedValue({
      id: 'new-user',
      email: profile.email,
    });

    const user = await service.resolveUserForLogin(profile, issuer);

    expect(user.id).toBe('new-user');
    expect(usersService.createFromOidc).toHaveBeenCalledWith({
      email: profile.email,
      firstName: 'User',
      lastName: 'User',
    });
    expect(identitiesRepository.save).toHaveBeenCalled();
  });

  it('rejects unknown email when provisioning mode is link_existing', async () => {
    configService.get.mockReturnValue('link_existing');
    identitiesRepository.findOne.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.resolveUserForLogin(profile, issuer)).rejects.toThrow(
      'No linked account for this One Login identity',
    );
  });

  it('uses given and family names from profile when auto-provisioning', async () => {
    identitiesRepository.findOne.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createFromOidc.mockResolvedValue({ id: 'new-user' });

    await service.resolveUserForLogin(
      {
        ...profile,
        givenName: 'Jane',
        familyName: 'Doe',
      },
      issuer,
    );

    expect(usersService.createFromOidc).toHaveBeenCalledWith({
      email: profile.email,
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });
});
