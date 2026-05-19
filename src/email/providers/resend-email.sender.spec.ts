import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ResendEmailSender } from './resend-email.sender.js';

const mockSend = jest.fn();

jest.mock('resend', () => {
  const ResendCtor = jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  }));
  /* eslint-disable-next-line @typescript-eslint/naming-convention -- Resend SDK export */
  return { Resend: ResendCtor };
});

describe('ResendEmailSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  it('sends via Resend API', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'app.email.resendApiKey') return 're_test';
              if (key === 'app.email.from') return 'Graddly <noreply@test.com>';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    const sender = module.get(ResendEmailSender);
    await sender.send({
      to: 'user@example.com',
      subject: 'Reset',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: 'Graddly <noreply@test.com>',
      to: 'user@example.com',
      subject: 'Reset',
      html: '<p>Hi</p>',
      text: 'Hi',
    });
  });

  it('throws when Resend returns error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailSender,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'app.email.resendApiKey') return 'bad';
              if (key === 'app.email.from') return 'noreply@test.com';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    const sender = module.get(ResendEmailSender);
    await expect(
      sender.send({
        to: 'user@example.com',
        subject: 'Reset',
        html: '<p>Hi</p>',
        text: 'Hi',
      }),
    ).rejects.toThrow('Invalid API key');
  });
});
