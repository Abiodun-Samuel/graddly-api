import { Injectable } from '@nestjs/common';

import { IEmailJobPayload } from './email-job.payload.js';
import { SerializedEmailPayload } from './payloads/serialized-email.payload.js';

import type { BaseEmailPayload } from './payloads/base-email.payload.js';

@Injectable()
export class EmailPayloadFactory {
  fromJob(data: IEmailJobPayload): BaseEmailPayload {
    return new SerializedEmailPayload(data.template, data.to, data.context);
  }

  toJob(payload: BaseEmailPayload): IEmailJobPayload {
    return {
      template: payload.template,
      to: payload.to,
      context: payload.getTemplateContext(),
    };
  }
}
