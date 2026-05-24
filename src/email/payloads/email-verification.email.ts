import { resolvePortalFrontendUrl } from '../../common/utils/resolve-portal-url.util.js';
import { EmailTemplate } from '../email-template.enum.js';
import { formatTokenTtlLabel } from '../format-token-ttl-label.js';

import { BaseEmailPayload } from './base-email.payload.js';

import type { PortalType } from '../../organisations/portal-type.enum.js';
import type { ConfigService } from '@nestjs/config';

export interface IEmailVerificationEmailParams {
  to: string;
  firstName: string;
  token: string;
  portalType?: PortalType;
}

interface IEmailVerificationTemplateContext {
  firstName: string;
  verifyUrl: string;
  expiresInLabel: string;
}

export class EmailVerificationEmail extends BaseEmailPayload {
  readonly template = EmailTemplate.EMAIL_VERIFICATION;

  private constructor(
    readonly to: string,
    private readonly templateContext: IEmailVerificationTemplateContext,
  ) {
    super();
  }

  static create(
    config: ConfigService,
    params: IEmailVerificationEmailParams,
  ): EmailVerificationEmail {
    const frontendBase = resolvePortalFrontendUrl(config, params.portalType);
    const ttlSeconds = config.get<number>(
      'app.emailVerification.tokenTtlSeconds',
      86_400,
    );
    const verifyUrl = `${frontendBase.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(params.token)}`;

    return new EmailVerificationEmail(params.to, {
      firstName: params.firstName,
      verifyUrl,
      expiresInLabel: formatTokenTtlLabel(ttlSeconds),
    });
  }

  getTemplateContext(): Record<string, unknown> {
    return { ...this.templateContext };
  }
}
