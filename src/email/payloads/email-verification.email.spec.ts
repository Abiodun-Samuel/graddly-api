import { ConfigService } from '@nestjs/config';

import { EmailTemplate } from '../email-template.enum.js';

import { EmailVerificationEmail } from './email-verification.email.js';

describe('EmailVerificationEmail', () => {
  const config = {
    get: (key: string, fallback?: unknown) => {
      const values = new Map<string, unknown>([
        ['app.frontend.baseUrl', 'https://app.example.com'],
        ['app.emailVerification.tokenTtlSeconds', 86_400],
      ]);
      return values.get(key) ?? fallback;
    },
  } as ConfigService;

  it('builds verify URL and template context', () => {
    const payload = EmailVerificationEmail.create(config, {
      to: 'user@example.com',
      firstName: 'Jane',
      token: 'abc-123',
    });

    expect(payload.template).toBe(EmailTemplate.EMAIL_VERIFICATION);
    expect(payload.to).toBe('user@example.com');
    expect(payload.getTemplateContext()).toEqual({
      firstName: 'Jane',
      verifyUrl: 'https://app.example.com/verify-email?token=abc-123',
      expiresInLabel: '24 hours',
    });
  });
});
