import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { MembershipStatus } from '../organisations/membership-status.enum.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';
import { PortalType } from '../organisations/portal-type.enum.js';
import { RedisService } from '../redis/redis.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

import { ActiveOrganisationMeDto } from './dto/active-organisation-context.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { IJwtPayload } from './interfaces/jwt-payload.interface.js';

const REFRESH_PREFIX = 'refresh:';

/** Lower value = higher privilege — used for JWT generation (role-priority sort). */
const ROLE_PRIORITY: Record<OrganisationRole, number> = {
  [OrganisationRole.OWNER]: 0,
  [OrganisationRole.ADMIN]: 1,
  [OrganisationRole.MEMBER]: 2,
};

type MembershipRow = {
  mRole: string;
  mStatus: string;
  oId: string;
  oName: string;
  oSlug: string;
  oType: string | null;
  oPortalType: string | null;
  oUkprn: string | null;
  oAddress: string | null;
  oCity: string | null;
  oPostcode: string | null;
  oCountry: string | null;
  oOrgEmail: string | null;
  oOrgPhone: string | null;
  oWebsite: string | null;
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
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive)
      throw new UnauthorizedException('Account is deactivated');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    void this.usersService.updateLastLoginAt(user.id).catch(() => undefined);

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const userId = await this.redis.get(`${REFRESH_PREFIX}${refreshToken}`);
    if (!userId)
      throw new UnauthorizedException('Invalid or expired refresh token');

    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);

    const user = await this.usersService.findById(userId);
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);
  }

  /**
   * Resolves the active organisation for a user scoped strictly to the given portalType.
   * Returns null when no active membership exists for that portal. Single round-trip, no N+1.
   * getRawOne() is intentional — innerJoinAndSelect + select() leaves the relation unhydrated in TypeORM.
   */
  async resolveActiveOrganisationForUser(
    userId: string,
    portalType: PortalType,
  ): Promise<ActiveOrganisationMeDto | null> {
    const roleOrder =
      `CASE m.role` +
      ` WHEN '${OrganisationRole.OWNER}' THEN 0` +
      ` WHEN '${OrganisationRole.ADMIN}' THEN 1` +
      ` WHEN '${OrganisationRole.MEMBER}' THEN 2 ELSE 3 END`;

    const row = await this.membershipRepo
      .createQueryBuilder('m')
      .innerJoin('m.organisation', 'o')
      .select('m.role', 'mRole')
      .addSelect('m.status', 'mStatus')
      .addSelect('o.id', 'oId')
      .addSelect('o.name', 'oName')
      .addSelect('o.slug', 'oSlug')
      .addSelect('o.type', 'oType')
      .addSelect('o.portalType', 'oPortalType')
      .addSelect('o.ukprn', 'oUkprn')
      .addSelect('o.address', 'oAddress')
      .addSelect('o.city', 'oCity')
      .addSelect('o.postcode', 'oPostcode')
      .addSelect('o.country', 'oCountry')
      .addSelect('o.orgEmail', 'oOrgEmail')
      .addSelect('o.orgPhone', 'oOrgPhone')
      .addSelect('o.website', 'oWebsite')
      .where('m."userId" = :userId', { userId })
      .andWhere('m.status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('o.portalType = :portalType', { portalType })
      .orderBy(roleOrder, 'ASC')
      .addOrderBy('m.joinedAt', 'ASC')
      .limit(1)
      .getRawOne<MembershipRow>();

    if (!row) return null;

    return {
      roles: [row.mRole],
      membershipStatus: row.mStatus as MembershipStatus,
      organisation: {
        id: row.oId,
        name: row.oName,
        slug: row.oSlug,
        type: row.oType ?? null,
        portalType: (row.oPortalType as PortalType) ?? null,
        ukprn: row.oUkprn ?? null,
        address: row.oAddress ?? null,
        city: row.oCity ?? null,
        postcode: row.oPostcode ?? null,
        country: row.oCountry ?? null,
        orgEmail: row.oOrgEmail ?? null,
        orgPhone: row.oOrgPhone ?? null,
        website: row.oWebsite ?? null,
      },
    };
  }

  /**
   * Active organisation: lowest role priority wins (OWNER > ADMIN > MEMBER),
   * then earliest membership `createdAt` as tiebreaker.
   * Used only for JWT generation — loads minimal data, no portal scoping.
   */
  private async resolveActiveMembershipForUser(
    userId: string,
  ): Promise<OrganisationMembership | null> {
    const memberships = await this.membershipRepo.find({
      where: { user: { id: userId } },
      relations: ['organisation'],
    });

    if (memberships.length === 0) return null;

    return (
      [...memberships].sort((a, b) => {
        const diff = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
        return diff !== 0
          ? diff
          : a.createdAt.getTime() - b.createdAt.getTime();
      })[0] ?? null
    );
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const membership = await this.resolveActiveMembershipForUser(user.id);

    const jwtPayload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      ...(membership
        ? { orgId: membership.organisation.id, roles: [membership.role] }
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
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 604800;
    return parseInt(match[1], 10) * (units[match[2]] ?? 1);
  }
}
