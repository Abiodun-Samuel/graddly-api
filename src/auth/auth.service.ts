import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { setCurrentUserId } from '../common/context/correlation-id-context.js';
import { setLastKnownUserIdForGuc } from '../database/apply-tenant-gucs.js';
import { EmailService } from '../email/email.service.js';
import { EmailVerificationEmail } from '../email/payloads/email-verification.email.js';
import { PasswordResetEmail } from '../email/payloads/password-reset.email.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';
import { RedisService } from '../redis/redis.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { IJwtPayload } from './interfaces/jwt-payload.interface.js';
import { RefreshTokenService } from './refresh-token.service.js';

const PASSWORD_RESET_PREFIX = 'password-reset:';
const EMAIL_VERIFY_PREFIX = 'email-verify:';

/** Lower is higher privilege when choosing the active organisation. */
const ROLE_PRIORITY: Record<OrganisationRole, number> = {
  [OrganisationRole.OWNER]: 0,
  [OrganisationRole.ADMIN]: 1,
  [OrganisationRole.MEMBER]: 2,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly emailService: EmailService,
    @InjectRepository(OrganisationMembership)
    private readonly membershipRepo: Repository<OrganisationMembership>,
  ) {}

  async signup(dto: SignupDto): Promise<void> {
    const user = await this.usersService.create(dto);
    await this.sendVerificationEmail(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email address not verified');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const { userId, newRefreshToken } =
      await this.refreshTokenService.consume(refreshToken);

    const user = await this.usersService.findById(userId);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email address not verified');
    }

    return this.generateTokens(user, newRefreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  /** Always completes; does not reveal whether the email exists. */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.isActive) {
      return;
    }

    const token = uuidV4();
    const ttl = this.config.get<number>(
      'app.passwordReset.tokenTtlSeconds',
      3600,
    );
    await this.redis.set(`${PASSWORD_RESET_PREFIX}${token}`, user.id, ttl);

    try {
      await this.emailService.sendEmail(
        PasswordResetEmail.create(this.config, {
          to: user.email,
          firstName: user.firstName,
          token,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Password reset email failed for ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<AuthResponseDto> {
    const userId = await this.redis.get(`${PASSWORD_RESET_PREFIX}${token}`);
    if (!userId) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    await this.redis.del(`${PASSWORD_RESET_PREFIX}${token}`);
    await this.usersService.updatePassword(userId, password);
    await this.refreshTokenService.revokeAllForUser(userId);

    const user = await this.usersService.findById(userId);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(user);
  }

  async verifyEmail(token: string): Promise<AuthResponseDto> {
    const userId = await this.redis.get(`${EMAIL_VERIFY_PREFIX}${token}`);
    if (!userId) {
      throw new UnauthorizedException(
        'Invalid or expired email verification token',
      );
    }

    await this.redis.del(`${EMAIL_VERIFY_PREFIX}${token}`);
    await this.usersService.markEmailVerified(userId);

    const user = await this.usersService.findById(userId);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(user);
  }

  /** Always completes; does not reveal whether the email exists. */
  async resendVerification(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.isActive || user.isEmailVerified) {
      return;
    }

    await this.sendVerificationEmail(user);
  }

  /** Issue JWT pair for an existing user (e.g. after OIDC callback). */
  async issueTokensForUser(user: User): Promise<AuthResponseDto> {
    return this.generateTokens(user);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    if (user.isEmailVerified) {
      return;
    }

    const token = uuidV4();
    const ttl = this.config.get<number>(
      'app.emailVerification.tokenTtlSeconds',
      86_400,
    );
    await this.redis.set(`${EMAIL_VERIFY_PREFIX}${token}`, user.id, ttl);

    try {
      await this.emailService.sendEmail(
        EmailVerificationEmail.create(this.config, {
          to: user.email,
          firstName: user.firstName,
          token,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Email verification failed for ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async resolveActiveMembershipForUser(
    userId: string,
  ): Promise<OrganisationMembership | null> {
    const memberships = await this.membershipRepo.find({
      where: { user: { id: userId } },
      relations: ['organisation'],
    });

    if (memberships.length === 0) {
      return null;
    }

    const sorted = [...memberships].sort((a, b) => {
      const pa = ROLE_PRIORITY[a.role];
      const pb = ROLE_PRIORITY[b.role];
      if (pa !== pb) {
        return pa - pb;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return sorted[0] ?? null;
  }

  private async generateTokens(
    user: User,
    existingRefreshToken?: string,
  ): Promise<AuthResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);

    const membership = await this.resolveActiveMembershipForUser(user.id);

    const jwtPayload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      ...(membership?.organisation
        ? {
            orgId: membership.organisation.id,
            roles: [membership.role],
          }
        : {}),
    };

    const accessTtl = this.config.get<number>(
      'app.jwt.accessExpiresInSeconds',
      900,
    );
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: accessTtl,
    });

    const refreshToken =
      existingRefreshToken ?? (await this.refreshTokenService.issue(user.id));

    return { accessToken, refreshToken };
  }
}
