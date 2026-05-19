import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from '../redis/redis.service.js';

import { RefreshTokenService } from './refresh-token.service.js';

const USER_ID = 'user-uuid-1';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  const store = new Map<string, { value: string; ttl?: number }>();
  const versionCounters = new Map<string, number>();

  const mockRedis = {
    get: jest.fn((key: string) => store.get(key)?.value ?? null),
    set: jest.fn((key: string, value: string, ttl?: number) => {
      store.set(key, { value, ttl });
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
    }),
    incr: jest.fn((key: string) => {
      const next = (versionCounters.get(key) ?? 0) + 1;
      versionCounters.set(key, next);
      store.set(key, { value: String(next) });
      return next;
    }),
  };

  const mockConfig = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values = new Map<string, unknown>([
        ['app.jwt.refreshExpiresInSeconds', 604_800],
        ['app.refresh.reuseGraceSeconds', 30],
      ]);
      return values.get(key) ?? fallback;
    }),
  };

  beforeEach(async () => {
    store.clear();
    versionCounters.clear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(RefreshTokenService);
  });

  it('issues a versioned refresh token', async () => {
    const token = await service.issue(USER_ID);

    expect(token).toEqual(expect.any(String));
    expect(store.get(`refresh:${token}`)?.value).toBe(`${USER_ID}:0`);
  });

  it('rotates a valid refresh token and stores a tombstone', async () => {
    const oldToken = await service.issue(USER_ID);

    const result = await service.consume(oldToken);

    expect(result.userId).toBe(USER_ID);
    expect(result.newRefreshToken).not.toBe(oldToken);
    expect(store.has(`refresh:${oldToken}`)).toBe(false);
    expect(store.get(`refresh-revoked:${oldToken}`)?.value).toBe(USER_ID);
  });

  it('detects reuse via tombstone and invalidates other device tokens', async () => {
    const tokenA = await service.issue(USER_ID);
    const tokenB = await service.issue(USER_ID);
    await service.consume(tokenA);

    await expect(service.consume(tokenA)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(versionCounters.get(`user:${USER_ID}:refreshVer`)).toBe(1);

    await expect(service.consume(tokenB)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revokeAllForUser invalidates outstanding tokens by version', async () => {
    const token = await service.issue(USER_ID);
    await service.revokeAllForUser(USER_ID);

    await expect(service.consume(token)).rejects.toThrow(UnauthorizedException);
  });

  it('revoke removes active token and sets tombstone', async () => {
    const token = await service.issue(USER_ID);
    await service.revoke(token);

    expect(store.has(`refresh:${token}`)).toBe(false);
    expect(store.get(`refresh-revoked:${token}`)?.value).toBe(USER_ID);
  });
});
