import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DasOAuthService } from './das-oauth.service.js';

import type { IDasLevyBalancePayload } from './das.types.js';

@Injectable()
export class DasHttpClient {
  constructor(
    private readonly config: ConfigService,
    private readonly oauth: DasOAuthService,
  ) {}

  async fetchLevyBalance(ukprn: string): Promise<IDasLevyBalancePayload> {
    const baseUrl = this.config.get<string>('app.das.baseUrl');
    const levyBalancePath = this.config.get<string>('app.das.levyBalancePath');
    const timeoutMs = this.config.get<number>('app.das.timeoutMs', 10_000);

    if (!baseUrl || !levyBalancePath) {
      throw new InternalServerErrorException(
        'DAS base URL configuration missing',
      );
    }

    const token = await this.oauth.getAccessToken();
    const url = new URL(levyBalancePath, baseUrl);
    url.searchParams.set('ukprn', ukprn);
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `DAS levy request failed: ${this.toMessage(error)}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const payload = await this.safeReadBody(res);
      throw new InternalServerErrorException(
        `DAS levy request failed (${res.status}): ${payload}`,
      );
    }

    const raw = (await res.json()) as Record<string, unknown>;
    return {
      accountId: this.pickString(raw, [
        'accountId',
        'accountID',
        'dasAccountId',
      ]),
      balance: this.pickNumericString(raw, ['balance', 'levyBalance']),
      currency: this.pickString(raw, ['currency']) ?? 'GBP',
      raw,
    };
  }

  private pickString(
    raw: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private pickNumericString(
    raw: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toFixed(2);
      }
      if (typeof value === 'string' && value.trim()) {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) {
          return asNumber.toFixed(2);
        }
      }
    }
    return null;
  }

  private async safeReadBody(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '<unavailable>';
    }
  }

  private toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
