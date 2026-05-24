import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { QueueOpsApiKeyGuard } from './queue-ops-api-key.guard.js';
import { QUEUE_OPS_API_KEY_HEADER } from './queue-ops.constants.js';

function createContext(apiKey?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: apiKey ? { [QUEUE_OPS_API_KEY_HEADER]: apiKey } : {},
      }),
    }),
  } as ExecutionContext;
}

describe('QueueOpsApiKeyGuard', () => {
  const validKey = 'a'.repeat(32);

  async function createGuard(config: Record<string, unknown>) {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QueueOpsApiKeyGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'app.queueOps.enabled') {
                return config.enabled ?? false;
              }
              if (key === 'app.queueOps.apiKey') {
                return config.apiKey ?? '';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    return moduleRef.get(QueueOpsApiKeyGuard);
  }

  it('allows requests with a valid key when enabled', async () => {
    const guard = await createGuard({ enabled: true, apiKey: validKey });

    expect(guard.canActivate(createContext(validKey))).toBe(true);
  });

  it('rejects when ops API is disabled', async () => {
    const guard = await createGuard({ enabled: false, apiKey: validKey });

    expect(() => guard.canActivate(createContext(validKey))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects invalid keys', async () => {
    const guard = await createGuard({ enabled: true, apiKey: validKey });

    expect(() => guard.canActivate(createContext('wrong-key'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects missing keys', async () => {
    const guard = await createGuard({ enabled: true, apiKey: validKey });

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });
});
