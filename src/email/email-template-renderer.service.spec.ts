import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PortalType } from '../organisations/portal-type.enum.js';
import { EmailLayoutContextService } from './email-layout-context.service.js';
import { EmailTemplateRendererService } from './email-template-renderer.service.js';
import { PasswordResetEmail } from './payloads/password-reset.email.js';

describe('EmailTemplateRendererService', () => {
  let renderer: EmailTemplateRendererService;
  let config: ConfigService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateRendererService,
        EmailLayoutContextService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => {
              const values = new Map<string, unknown>([
                ['app.email.appName', 'Graddly'],
                [
                  'app.frontend.portalUrls',
                  { employer: 'http://localhost:3001' },
                ],
                ['app.passwordReset.tokenTtlSeconds', 3600],
              ]);
              return values.get(key) ?? fallback;
            },
          },
        },
      ],
    }).compile();

    renderer = testingModule.get(EmailTemplateRendererService);
    config = testingModule.get(ConfigService);
    renderer.onModuleInit();
  });

  it('renders password reset email with layout context', () => {
    const payload = PasswordResetEmail.create(config, {
      to: 'user@example.com',
      firstName: 'Jane',
      token: '550e8400-e29b-41d4-a716-446655440000',
      portalType: PortalType.EMPLOYER,
    });

    const { subject, html, text } = payload.build(renderer);

    expect(subject).toContain('Reset your Graddly password');
    expect(html).toContain('Jane');
    expect(html).toContain('550e8400-e29b-41d4-a716-446655440000');
    expect(html).toMatch(/© \d{4} Graddly/u);
    expect(text).toContain('Jane');
    expect(text).toContain('1 hour');
  });
});
