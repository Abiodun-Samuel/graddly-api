import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../redis/redis.service.js';

import type { KsbHeatmapCellResponseDto } from './dto/ksb-heatmap-response.dto.js';

@Injectable()
export class PortfolioHeatmapCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private ttlSeconds(): number {
    return this.config.get<number>('app.portfolio.heatmapCacheTtlSeconds', 0);
  }

  private key(organisationId: string, enrolmentId: string): string {
    return `portfolio:heatmap:${organisationId}:${enrolmentId}`;
  }

  async get(
    organisationId: string,
    enrolmentId: string,
  ): Promise<KsbHeatmapCellResponseDto[] | null> {
    const ttl = this.ttlSeconds();
    if (ttl <= 0) return null;
    const raw = await this.redis
      .getClient()
      .get(this.key(organisationId, enrolmentId));
    if (!raw) return null;
    return JSON.parse(raw) as KsbHeatmapCellResponseDto[];
  }

  async set(
    organisationId: string,
    enrolmentId: string,
    cells: KsbHeatmapCellResponseDto[],
  ): Promise<void> {
    const ttl = this.ttlSeconds();
    if (ttl <= 0) return;
    await this.redis
      .getClient()
      .setex(this.key(organisationId, enrolmentId), ttl, JSON.stringify(cells));
  }

  async invalidate(organisationId: string, enrolmentId: string): Promise<void> {
    if (this.ttlSeconds() <= 0) return;
    await this.redis.getClient().del(this.key(organisationId, enrolmentId));
  }
}
