import { EmailTemplate } from '../email-template.enum.js';

import { BaseEmailPayload } from './base-email.payload.js';

/**
 * Rehydrates a queued email from pre-built template context (no ConfigService).
 */
export class SerializedEmailPayload extends BaseEmailPayload {
  constructor(
    readonly template: EmailTemplate,
    readonly to: string,
    private readonly templateContext: Record<string, unknown>,
  ) {
    super();
  }

  getTemplateContext(): Record<string, unknown> {
    return { ...this.templateContext };
  }
}
