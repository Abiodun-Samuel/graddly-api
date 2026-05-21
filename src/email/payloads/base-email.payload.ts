import type { EmailTemplate } from '../email-template.enum.js';
import type { IEmailTemplateRenderer } from '../interfaces/email-template-renderer.interface.js';
import type { IRenderedEmail } from '../types/rendered-email.interface.js';

/**
 * Typed outbound email: subclasses declare template + context;
 * {@link build} renders via Nunjucks (layout context is merged automatically).
 */
export abstract class BaseEmailPayload {
  abstract readonly template: EmailTemplate;
  abstract readonly to: string;

  /** Variables passed to this email's `.njk` templates (plus shared layout context). */
  abstract getTemplateContext(): Record<string, unknown>;

  build(renderer: IEmailTemplateRenderer): IRenderedEmail {
    return renderer.render(this);
  }
}
