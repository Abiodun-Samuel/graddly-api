import { Inject, Injectable, Logger } from '@nestjs/common';

import { EmailTemplateRendererService } from './email-template-renderer.service.js';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from './interfaces/email-sender.interface.js';

import type { BaseEmailPayload } from './payloads/base-email.payload.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly sender: IEmailSender,
    private readonly templateRenderer: EmailTemplateRendererService,
  ) { }

  async sendEmail(payload: BaseEmailPayload): Promise<void> {
    const { subject, html, text } = payload.build(this.templateRenderer);

    try {
      await this.sender.send({
        to: payload.to,
        subject,
        html,
        text,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email (${payload.template}) to ${payload.to}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
