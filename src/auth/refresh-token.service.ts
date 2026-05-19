import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';

import { RedisService } from '../redis/redis.service.js';

const REFRESH_PREFIX = 'refresh:';
const REFRESH_REVOKED_PREFIX = 'refresh-revoked:';
const USER_REFRESH_VERSION_PREFIX = 'user:';

export interface IRefreshConsumeResult {
  userId: string;
  newRefreshToken: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string): Promise<string> {
    const version = await this.getCurrentVersion(userId);
    const token = uuidV4();
    const ttl = this.config.get<number>(
      'app.jwt.refreshExpiresInSeconds',
      604_800,
    );
    await this.redis.set(
      this.refreshKey(token),
      this.encodeValue(userId, version),
      ttl,
    );
    return token;
  }

  async consume(refreshToken: string): Promise<IRefreshConsumeResult> {
    const key = this.refreshKey(refreshToken);
    const raw = await this.redis.get(key);

    if (!raw) {
      const revokedUserId = await this.redis.get(this.revokedKey(refreshToken));
      if (revokedUserId) {
        await this.revokeAllForUser(revokedUserId);
        this.logger.warn(
          `Refresh token reuse detected for user ${revokedUserId}`,
        );
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const decoded = this.decodeValue(raw);
    if (!decoded) {
      await this.redis.del(key);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const currentVersion = await this.getCurrentVersion(decoded.userId);
    if (decoded.version !== currentVersion) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.redis.del(key);
    await this.setRevokedTombstone(refreshToken, decoded.userId);

    const newRefreshToken = await this.issue(decoded.userId);
    return { userId: decoded.userId, newRefreshToken };
  }

  async revoke(refreshToken: string): Promise<void> {
    const key = this.refreshKey(refreshToken);
    const raw = await this.redis.get(key);
    if (!raw) {
      return;
    }

    const decoded = this.decodeValue(raw);
    await this.redis.del(key);
    if (decoded) {
      await this.setRevokedTombstone(refreshToken, decoded.userId);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.redis.incr(this.versionKey(userId));
  }

  private async getCurrentVersion(userId: string): Promise<number> {
    const raw = await this.redis.get(this.versionKey(userId));
    if (!raw) {
      return 0;
    }
    const version = parseInt(raw, 10);
    return Number.isNaN(version) ? 0 : version;
  }

  private async setRevokedTombstone(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const grace = this.config.get<number>('app.refresh.reuseGraceSeconds', 30);
    if (grace > 0) {
      await this.redis.set(this.revokedKey(refreshToken), userId, grace);
    }
  }

  private refreshKey(token: string): string {
    return `${REFRESH_PREFIX}${token}`;
  }

  private revokedKey(token: string): string {
    return `${REFRESH_REVOKED_PREFIX}${token}`;
  }

  private versionKey(userId: string): string {
    return `${USER_REFRESH_VERSION_PREFIX}${userId}:refreshVer`;
  }

  private encodeValue(userId: string, version: number): string {
    return `${userId}:${version}`;
  }

  private decodeValue(raw: string): { userId: string; version: number } | null {
    const separator = raw.lastIndexOf(':');
    if (separator <= 0) {
      return null;
    }
    const userId = raw.slice(0, separator);
    const version = parseInt(raw.slice(separator + 1), 10);
    if (!userId || Number.isNaN(version)) {
      return null;
    }
    return { userId, version };
  }
}
