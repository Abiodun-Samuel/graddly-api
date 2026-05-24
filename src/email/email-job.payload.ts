import { EmailTemplate } from './email-template.enum.js';

/** Serializable email job stored in BullMQ (pre-rendered template context). */
export interface IEmailJobPayload {
  template: EmailTemplate;
  to: string;
  context: Record<string, unknown>;
}
