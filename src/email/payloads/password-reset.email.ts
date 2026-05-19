import { EmailTemplate } from '../email-template.enum.js';

import { BaseEmailPayload } from './base-email.payload.js';

import type { ConfigService } from '@nestjs/config';

export interface IPasswordResetEmailParams {
  to: string;
  firstName: string;
  token: string;
}

interface IPasswordResetTemplateContext {
  firstName: string;
  resetUrl: string;
  expiresInLabel: string;
}

export class PasswordResetEmail extends BaseEmailPayload {
  readonly template = EmailTemplate.PASSWORD_RESET;

  private constructor(
    readonly to: string,
    private readonly templateContext: IPasswordResetTemplateContext,
  ) {
    super();
  }

  static create(
    config: ConfigService,
    params: IPasswordResetEmailParams,
  ): PasswordResetEmail {
    const frontendBase = config.get<string>('app.frontend.baseUrl', '');
    const ttlSeconds = config.get<number>(
      'app.passwordReset.tokenTtlSeconds',
      3600,
    );
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset?token=${encodeURIComponent(params.token)}`;

    return new PasswordResetEmail(params.to, {
      firstName: params.firstName,
      resetUrl,
      expiresInLabel: formatTokenTtlLabel(ttlSeconds),
    });
  }

  getTemplateContext(): Record<string, unknown> {
    return { ...this.templateContext };
  }
}

function formatTokenTtlLabel(ttlSeconds: number): string {
  if (ttlSeconds >= 3600 && ttlSeconds % 3600 === 0) {
    const hours = ttlSeconds / 3600;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  if (ttlSeconds >= 60 && ttlSeconds % 60 === 0) {
    const minutes = ttlSeconds / 60;
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return `${ttlSeconds} seconds`;
}
