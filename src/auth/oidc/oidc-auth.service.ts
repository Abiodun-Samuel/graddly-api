import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';

import { IOidcAuthProfile } from './interfaces/oidc-auth-profile.interface.js';
import { OidcAccountLinkingService } from './oidc-account-linking.service.js';
import { OidcConfigurationService } from './oidc-configuration.service.js';

@Injectable()
export class OidcAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly oidcAccountLinking: OidcAccountLinkingService,
    private readonly oidcConfiguration: OidcConfigurationService,
    private readonly config: ConfigService,
  ) {}

  async completeLogin(profile: IOidcAuthProfile): Promise<AuthResponseDto> {
    if (!profile.email) {
      throw new ForbiddenException(
        'One Login did not return an email address for this account',
      );
    }

    if (profile.emailVerified !== true) {
      throw new ForbiddenException(
        'One Login email address is not verified for this account',
      );
    }

    const issuer = this.oidcConfiguration.getIssuer();
    const user = await this.oidcAccountLinking.resolveUserForLogin(
      profile,
      issuer,
    );

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.authService.issueTokensForUser(user);
  }

  getSuccessRedirectUri(): string | undefined {
    return this.config.get<string | undefined>('app.oidc.successRedirectUri');
  }

  buildSuccessRedirectUrl(tokens: AuthResponseDto): string {
    const base = this.getSuccessRedirectUri();
    if (!base) {
      throw new Error('OIDC success redirect URI is not configured');
    }

    const url = new URL(base);
    url.hash = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }).toString();

    return url.toString();
  }
}
