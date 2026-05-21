/* eslint-disable @typescript-eslint/naming-convention -- openid-client mock exports use library names */
/* eslint-disable @typescript-eslint/unbound-method -- jest mocks on shared fixture object */

import { ServiceUnavailableException } from '@nestjs/common';

jest.mock('openid-client', () => ({
  discovery: jest.fn(),
  ClientSecretPost: jest.fn(),
}));

jest.mock('openid-client/passport', () => ({
  Strategy: class MockStrategy {
    constructor(
      public readonly options: unknown,
      public readonly verify: unknown,
    ) {}
  },
}));

import { OidcConfigurationService } from '../oidc-configuration.service.js';

import { OidcStrategy } from './oidc.strategy.js';

describe('OidcStrategy', () => {
  const oidcConfiguration = {
    getConfiguration: jest.fn(),
    getScopeString: jest.fn().mockReturnValue('openid email'),
    getRedirectUri: jest
      .fn()
      .mockReturnValue('http://localhost:3000/api/v1/auth/oidc/callback'),
    getAuthorizationParams: jest.fn().mockReturnValue({
      uiLocales: 'en',
      vtr: ['Cl.Cm'],
    }),
  } as unknown as OidcConfigurationService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when configuration is missing', () => {
    jest.mocked(oidcConfiguration.getConfiguration).mockReturnValue(undefined);

    expect(() => new OidcStrategy(oidcConfiguration)).toThrow(
      ServiceUnavailableException,
    );
  });

  describe('validate', () => {
    let strategy: OidcStrategy;

    beforeEach(() => {
      jest
        .mocked(oidcConfiguration.getConfiguration)
        .mockReturnValue({} as never);
      strategy = new OidcStrategy(oidcConfiguration);
    });

    it('maps token claims to OidcAuthProfile', () => {
      const profile = strategy.validate({
        id_token: 'id-token',
        access_token: 'access-token',
        claims: () => ({
          sub: 'one-login-sub',
          email: 'user@example.com',
          email_verified: true,
        }),
      } as never);

      expect(profile).toEqual({
        sub: 'one-login-sub',
        email: 'user@example.com',
        emailVerified: true,
        idToken: 'id-token',
        accessToken: 'access-token',
      });
    });
  });
});
