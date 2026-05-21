import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OidcAuthService } from './oidc-auth.service.js';
import { OidcController } from './oidc.controller.js';

describe('OidcController', () => {
  let controller: OidcController;

  const oidcAuthService = {
    completeLogin: jest.fn(),
    getSuccessRedirectUri: jest.fn(),
    buildSuccessRedirectUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OidcController],
      providers: [{ provide: OidcAuthService, useValue: oidcAuthService }],
    }).compile();

    controller = module.get(OidcController);
  });

  it('returns JSON tokens when no success redirect URI is configured', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'r' };
    oidcAuthService.completeLogin.mockResolvedValue(tokens);
    oidcAuthService.getSuccessRedirectUri.mockReturnValue(undefined);

    const res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.callback(
      {
        user: {
          sub: 'sub',
          email: 'user@example.com',
          emailVerified: true,
        },
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged in successfully',
      data: tokens,
    });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('redirects when success redirect URI is configured', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'r' };
    oidcAuthService.completeLogin.mockResolvedValue(tokens);
    oidcAuthService.getSuccessRedirectUri.mockReturnValue(
      'https://app.example.com/callback',
    );
    oidcAuthService.buildSuccessRedirectUrl.mockReturnValue(
      'https://app.example.com/callback#accessToken=a&refreshToken=r',
    );

    const res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.callback(
      {
        user: {
          sub: 'sub',
          email: 'user@example.com',
          emailVerified: true,
        },
      } as never,
      res as never,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/callback#accessToken=a&refreshToken=r',
    );
    expect(res.json).not.toHaveBeenCalled();
  });

  it('throws when passport user is missing', async () => {
    const res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await expect(
      controller.callback({} as never, res as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
