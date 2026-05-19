import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NoopEmailSender } from './noop-email.sender.js';

describe('NoopEmailSender', () => {
  it('send resolves without error', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoopEmailSender,
        {
          provide: ConfigService,
          useValue: { get: () => 'test' },
        },
      ],
    }).compile();

    const sender = module.get(NoopEmailSender);
    await expect(
      sender.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
        text: 'Hi',
      }),
    ).resolves.toBeUndefined();
  });
});
