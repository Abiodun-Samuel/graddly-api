import { EmailPayloadFactory } from './email-payload.factory.js';
import { EmailTemplate } from './email-template.enum.js';
import { SerializedEmailPayload } from './payloads/serialized-email.payload.js';

describe('EmailPayloadFactory', () => {
  const factory = new EmailPayloadFactory();

  it('round-trips payload through job data', () => {
    const original = new SerializedEmailPayload(
      EmailTemplate.PASSWORD_RESET,
      'user@example.com',
      { resetUrl: 'https://example.com/reset' },
    );

    const job = factory.toJob(original);
    const restored = factory.fromJob(job);

    expect(restored.template).toBe(EmailTemplate.PASSWORD_RESET);
    expect(restored.to).toBe('user@example.com');
    expect(restored.getTemplateContext()).toEqual({
      resetUrl: 'https://example.com/reset',
    });
  });
});
