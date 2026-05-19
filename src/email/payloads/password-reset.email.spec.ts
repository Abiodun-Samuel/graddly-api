import { ConfigService } from '@nestjs/config';

import { EmailTemplate } from '../email-template.enum.js';

import { PasswordResetEmail } from './password-reset.email.js';

describe('PasswordResetEmail', () => {
  const config = {
    get: (key: string, fallback?: unknown) => {
      const values = new Map<string, unknown>([
        ['app.frontend.baseUrl', 'https://app.example.com'],
        ['app.passwordReset.tokenTtlSeconds', 7200],
      ]);
      return values.get(key) ?? fallback;
    },
  } as ConfigService;

  it('builds reset URL and template context', () => {
    const payload = PasswordResetEmail.create(config, {
      to: 'user@example.com',
      firstName: 'Jane',
      token: 'abc-123',
    });

    expect(payload.template).toBe(EmailTemplate.PASSWORD_RESET);
    expect(payload.to).toBe('user@example.com');
    expect(payload.getTemplateContext()).toEqual({
      firstName: 'Jane',
      resetUrl: 'https://app.example.com/reset?token=abc-123',
      expiresInLabel: '2 hours',
    });
  });
});
