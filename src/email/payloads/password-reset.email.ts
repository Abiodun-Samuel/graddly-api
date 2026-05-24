import { resolvePortalFrontendUrl } from '../../common/utils/resolve-portal-url.util.js';
import { EmailTemplate } from '../email-template.enum.js';
import { formatTokenTtlLabel } from '../format-token-ttl-label.js';

import { BaseEmailPayload } from './base-email.payload.js';

import type { PortalType } from '../../organisations/portal-type.enum.js';
import type { ConfigService } from '@nestjs/config';

export interface IPasswordResetEmailParams {
  to: string;
  firstName: string;
  token: string;
  portalType?: PortalType;
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
    const frontendBase = resolvePortalFrontendUrl(config, params.portalType);
    const ttlSeconds = config.get<number>(
      'app.passwordReset.tokenTtlSeconds',
      3600,
    );

    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(params.token)}`;

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
