import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';
import { AuthService } from '../auth.service.js';

import { OidcAuthService } from './oidc-auth.service.js';

describe('OidcAuthService', () => {
  let service: OidcAuthService;

  const authService = {
    issueTokensForUser: jest.fn(),
  };

  const usersService = {
    findByEmail: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    isActive: true,
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.issueTokensForUser.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OidcAuthService,
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(OidcAuthService);
  });

  it('issues tokens for verified email with existing user', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser);

    const tokens = await service.completeLogin({
      sub: 'one-login-sub',
      email: 'user@example.com',
      emailVerified: true,
    });

    expect(tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(authService.issueTokensForUser).toHaveBeenCalledWith(mockUser);
  });

  it('rejects when email is missing', async () => {
    await expect(
      service.completeLogin({ sub: 'one-login-sub', emailVerified: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when email is not verified', async () => {
    await expect(
      service.completeLogin({
        sub: 'one-login-sub',
        email: 'user@example.com',
        emailVerified: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when no linked user exists', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.completeLogin({
        sub: 'one-login-sub',
        email: 'unknown@example.com',
        emailVerified: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects deactivated accounts', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(
      service.completeLogin({
        sub: 'one-login-sub',
        email: 'user@example.com',
        emailVerified: true,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('builds success redirect URL with fragment tokens', () => {
    configService.get.mockReturnValue('https://app.example.com/auth/callback');

    const url = service.buildSuccessRedirectUrl({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(url).toBe(
      'https://app.example.com/auth/callback#accessToken=access-token&refreshToken=refresh-token',
    );
  });
});
