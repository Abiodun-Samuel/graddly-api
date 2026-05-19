import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type {
  IEmailMessage,
  IEmailSender,
} from '../interfaces/email-sender.interface.js';

@Injectable()
export class ResendEmailSender implements IEmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('app.email.from', '');
  }

  private getClient(): Resend {
    const apiKey = this.config.get<string>('app.email.resendApiKey', '').trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    return new Resend(apiKey);
  }

  async send(message: IEmailMessage): Promise<void> {
    const { data, error } = await this.getClient().emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      this.logger.error(`Resend send failed: ${error.message}`);
      throw new Error(error.message);
    }

    if (data?.id) {
      this.logger.log(`Resend email queued: ${data.id}`);
    }
  }
}
