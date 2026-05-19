import type { BaseEmailPayload } from '../payloads/base-email.payload.js';
import type { IRenderedEmail } from '../types/rendered-email.interface.js';

export interface IEmailTemplateRenderer {
  render(payload: BaseEmailPayload): IRenderedEmail;
}
