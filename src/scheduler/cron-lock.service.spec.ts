import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from '../redis/redis.service.js';

import { CronLockService } from './cron-lock.service.js';

describe('CronLockService', () => {
  let service: CronLockService;
  let redis: {
    setNx: jest.Mock;
    releaseLockIfOwner: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      setNx: jest.fn(),
      releaseLockIfOwner: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CronLockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'app.cron.lockEnabled') {
                return true;
              }
              if (key === 'app.cron.lockTtlSeconds') {
                return 240;
              }
              if (key === 'app.bullmq.prefix') {
                return 'graddly';
              }
              return defaultValue;
            }),
          },
        },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(CronLockService);
  });

  it('runs the handler when the lock is acquired', async () => {
    redis.setNx.mockResolvedValue(true);
    const fn = jest.fn().mockResolvedValue('done');

    const outcome = await service.runExclusive('health-check', fn);

    expect(outcome).toEqual({ ran: true, result: 'done' });
    expect(redis.setNx).toHaveBeenCalledWith(
      'graddly:cron:lock:health-check',
      expect.any(String),
      240,
    );
    expect(fn).toHaveBeenCalledTimes(1);
    expect(redis.releaseLockIfOwner).toHaveBeenCalledWith(
      'graddly:cron:lock:health-check',
      expect.any(String),
    );
  });

  it('skips the handler when the lock is not acquired', async () => {
    redis.setNx.mockResolvedValue(false);
    const fn = jest.fn();

    const outcome = await service.runExclusive('health-check', fn);

    expect(outcome).toEqual({ ran: false });
    expect(fn).not.toHaveBeenCalled();
    expect(redis.releaseLockIfOwner).not.toHaveBeenCalled();
  });

  it('releases the lock when the handler throws', async () => {
    redis.setNx.mockResolvedValue(true);
    const fn = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(service.runExclusive('health-check', fn)).rejects.toThrow(
      'boom',
    );
    expect(redis.releaseLockIfOwner).toHaveBeenCalled();
  });

  it('runs without locking when lock is disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CronLockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.cron.lockEnabled') {
                return false;
              }
              return undefined;
            }),
          },
        },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    const unlocked = moduleRef.get(CronLockService);
    const fn = jest.fn().mockResolvedValue(42);

    const outcome = await unlocked.runExclusive('health-check', fn);

    expect(outcome).toEqual({ ran: true, result: 42 });
    expect(redis.setNx).not.toHaveBeenCalled();
  });
});
