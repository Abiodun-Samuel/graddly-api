import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailLayoutContextService } from './email-layout-context.service.js';
import { EmailTemplateRendererService } from './email-template-renderer.service.js';
import { EmailService } from './email.service.js';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from './interfaces/email-sender.interface.js';
import { NoopEmailSender } from './providers/noop-email.sender.js';
import { ResendEmailSender } from './providers/resend-email.sender.js';

@Module({
  providers: [
    NoopEmailSender,
    ResendEmailSender,
    {
      provide: EMAIL_SENDER,
      useFactory: (
        config: ConfigService,
        noop: NoopEmailSender,
        resend: ResendEmailSender,
      ): IEmailSender => {
        const provider = config.get<'resend' | 'noop'>(
          'app.email.provider',
          'noop',
        );
        return provider === 'resend' ? resend : noop;
      },
      inject: [ConfigService, NoopEmailSender, ResendEmailSender],
    },
    EmailLayoutContextService,
    EmailTemplateRendererService,
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
