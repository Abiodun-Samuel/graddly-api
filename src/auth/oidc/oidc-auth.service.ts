import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service.js';
import { AuthService } from '../auth.service.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';

import { IOidcAuthProfile } from './interfaces/oidc-auth-profile.interface.js';

@Injectable()
export class OidcAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
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

    const user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      throw new ForbiddenException(
        'No linked account for this One Login identity. Contact your administrator or sign up with email and password.',
      );
    }

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
