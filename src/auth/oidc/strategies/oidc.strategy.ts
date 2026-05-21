import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { IOidcAuthProfile } from '../interfaces/oidc-auth-profile.interface.js';
import { OidcConfigurationService } from '../oidc-configuration.service.js';

import { GovUkOneLoginPassportStrategy } from './govuk-one-login-passport.strategy.js';

import type {
  TokenEndpointResponse,
  TokenEndpointResponseHelpers,
} from 'openid-client';

@Injectable()
export class OidcStrategy extends PassportStrategy(
  GovUkOneLoginPassportStrategy,
  'oidc',
) {
  constructor(private readonly oidcConfiguration: OidcConfigurationService) {
    const configuration = oidcConfiguration.getConfiguration();
    if (!configuration) {
      throw new ServiceUnavailableException(
        'OIDC is enabled but the provider configuration is not loaded',
      );
    }

    super({
      config: configuration,
      scope: oidcConfiguration.getScopeString(),
      callbackURL: oidcConfiguration.getRedirectUri(),
      authorizationParams: oidcConfiguration.getAuthorizationParams(),
    });
  }

  validate(
    tokens: TokenEndpointResponse & TokenEndpointResponseHelpers,
  ): IOidcAuthProfile {
    const claims = tokens.claims();

    return {
      sub: claims?.sub ?? '',
      email: typeof claims?.email === 'string' ? claims.email : undefined,
      emailVerified:
        typeof claims?.email_verified === 'boolean'
          ? claims.email_verified
          : undefined,
      givenName:
        typeof claims?.given_name === 'string' ? claims.given_name : undefined,
      familyName:
        typeof claims?.family_name === 'string'
          ? claims.family_name
          : undefined,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
    };
  }
}
