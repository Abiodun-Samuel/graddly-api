import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { DasHttpClient } from './das-http.client.js';
import { DasOAuthService } from './das-oauth.service.js';

describe('DasHttpClient', () => {
  let client: DasHttpClient;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DasHttpClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              switch (key) {
                case 'app.das.baseUrl':
                  return 'https://das.example.com';
                case 'app.das.levyBalancePath':
                  return '/api/levy/balance';
                case 'app.das.timeoutMs':
                  return 5000;
                default:
                  return fallback;
              }
            }),
          },
        },
        {
          provide: DasOAuthService,
          useValue: {
            getAccessToken: jest.fn().mockResolvedValue('token-1'),
          },
        },
      ],
    }).compile();

    client = moduleRef.get(DasHttpClient);
    jest.restoreAllMocks();
  });

  it('maps levy payload fields', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accountId: 'das-1',
          levyBalance: 123.45,
          currency: 'GBP',
        }),
        { status: 200 },
      ),
    );

    const result = await client.fetchLevyBalance('12345678');
    expect(result.accountId).toBe('das-1');
    expect(result.balance).toBe('123.45');
    expect(result.currency).toBe('GBP');
  });
});
