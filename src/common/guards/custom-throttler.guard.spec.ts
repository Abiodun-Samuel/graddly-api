import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CustomThrottlerGuard } from './custom-throttler.guard.js';

import type { Request } from 'express';

describe('CustomThrottlerGuard', () => {
  const throttlerOptions = {
    throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
  };

  function createGuard(config?: Partial<ConfigService>) {
    const guard = new CustomThrottlerGuard(
      throttlerOptions,
      {} as never,
      new Reflector(),
    );
    (guard as unknown as { config: ConfigService }).config = {
      get: jest.fn().mockReturnValue(true),
      ...config,
    } as unknown as ConfigService;
    return guard;
  }

  async function getTracker(
    guard: CustomThrottlerGuard,
    req: Request,
  ): Promise<string> {
    const withProtected = guard as unknown as {
      getTracker(req: Request): Promise<string>;
    };
    return withProtected.getTracker(req);
  }

  it('uses a per-user tracker when req.user.id is set', async () => {
    const guard = createGuard();
    const tracker = await getTracker(guard, {
      user: { id: 'user-uuid-1' },
      ip: '203.0.113.1',
    } as unknown as Request);
    expect(tracker).toBe('user:user-uuid-1');
  });

  it('falls back to IP when there is no authenticated user', async () => {
    const guard = createGuard();
    const tracker = await getTracker(guard, {
      ip: '198.51.100.2',
    } as unknown as Request);
    expect(tracker).toBe('198.51.100.2');
  });

  it('falls back to IP when user has no id', async () => {
    const guard = createGuard();
    const tracker = await getTracker(guard, {
      user: {},
      ip: '198.51.100.3',
    } as unknown as Request);
    expect(tracker).toBe('198.51.100.3');
  });

  it('skips throttling when app.throttle.enabled is false', async () => {
    const guard = createGuard();
    const get = jest.fn().mockReturnValue(false);
    (guard as unknown as { config: { get: typeof get } }).config = {
      get,
    };

    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const parentSpy = jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockResolvedValue(true);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith('app.throttle.enabled', true);
    expect(parentSpy).not.toHaveBeenCalled();

    parentSpy.mockRestore();
  });

  it('delegates to ThrottlerGuard when throttling is enabled', async () => {
    const guard = createGuard();
    const parentSpy = jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockResolvedValue(true);

    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({
          header: jest.fn(),
        }),
      }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    expect(parentSpy).toHaveBeenCalled();

    parentSpy.mockRestore();
  });
});
