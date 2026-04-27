import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';
import { RedisService } from '../redis/redis.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { IJwtPayload } from './interfaces/jwt-payload.interface.js';

const REFRESH_PREFIX = 'refresh:';

/** Lower is higher privilege when choosing the active organisation. */
const ROLE_PRIORITY: Record<OrganisationRole, number> = {
  [OrganisationRole.OWNER]: 0,
  [OrganisationRole.ADMIN]: 1,
  [OrganisationRole.MEMBER]: 2,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    @InjectRepository(OrganisationMembership)
    private readonly membershipRepo: Repository<OrganisationMembership>,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(dto);
    return this.generateTokens(user);
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

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const userId = await this.redis.get(`${REFRESH_PREFIX}${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);

    const user = await this.usersService.findById(userId);
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);
  }

  /**
   * Active organisation: lowest role priority wins (OWNER > ADMIN > MEMBER),
   * then earliest membership `createdAt` as tiebreaker.
   */
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

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const membership = await this.resolveActiveMembershipForUser(user.id);

    const jwtPayload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      ...(membership
        ? {
            orgId: membership.organisation.id,
            roles: [membership.role],
          }
        : {}),
    };

    const accessTtl = this.parseToSeconds(
      this.config.get<string>('app.jwt.accessExpiresIn', '15m'),
    );
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: accessTtl,
    });

    const refreshToken = uuidV4();
    const refreshTtl = this.parseToSeconds(
      this.config.get<string>('app.jwt.refreshExpiresIn', '7d'),
    );
    await this.redis.set(
      `${REFRESH_PREFIX}${refreshToken}`,
      user.id,
      refreshTtl,
    );

    return { accessToken, refreshToken };
  }

  private parseToSeconds(duration: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 604800; // default 7 days
    return parseInt(match[1], 10) * (units[match[2]] ?? 1);
  }
}
