/* eslint-disable @typescript-eslint/naming-convention -- ConfigService keys mirror Nest config paths */

import { ConfigService } from '@nestjs/config';

import { createBullMqConnectionOptions } from './bullmq-connection.factory.js';

describe('createBullMqConnectionOptions', () => {
  it('returns BullMQ-compatible connection options from app redis config', () => {
    const config = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          'app.redis.host': 'redis.internal',
          'app.redis.port': 6380,
          'app.redis.password': 'secret',
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    expect(createBullMqConnectionOptions(config)).toEqual({
      host: 'redis.internal',
      port: 6380,
      password: 'secret',
      family: 0,
      maxRetriesPerRequest: null,
    });
  });

  it('omits password when unset', () => {
    const config = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'app.redis.host') {
          return 'localhost';
        }
        if (key === 'app.redis.port') {
          return 6379;
        }
        if (key === 'app.redis.password') {
          return undefined;
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;

    expect(createBullMqConnectionOptions(config)).toEqual({
      host: 'localhost',
      port: 6379,
      password: undefined,
      family: 0,
      maxRetriesPerRequest: null,
    });
  });
});
