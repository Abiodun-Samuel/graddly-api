import { existsSync } from 'node:fs';
import path from 'node:path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import nunjucks from 'nunjucks';

import { EmailLayoutContextService } from './email-layout-context.service.js';

import type { IEmailTemplateRenderer } from './interfaces/email-template-renderer.interface.js';
import type { BaseEmailPayload } from './payloads/base-email.payload.js';
import type { IRenderedEmail } from './types/rendered-email.interface.js';

function resolveTemplatesRoot(): string {
  const candidates = [
    path.join(process.cwd(), 'templates'),
    path.join(__dirname, '../../../templates'),
  ];
  const found = candidates.find((dir) => existsSync(dir));
  if (!found) {
    throw new Error(
      `Email templates directory not found. Tried: ${candidates.join(', ')}`,
    );
  }
  return found;
}

@Injectable()
export class EmailTemplateRendererService
  implements OnModuleInit, IEmailTemplateRenderer
{
  private env!: nunjucks.Environment;

  constructor(private readonly layoutContext: EmailLayoutContextService) {}

  onModuleInit(): void {
    this.env = nunjucks.configure(resolveTemplatesRoot(), {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
      noCache: process.env.NODE_ENV !== 'production',
    });
  }

  render(payload: BaseEmailPayload): IRenderedEmail {
    const context = {
      ...this.layoutContext.getLayoutContext(),
      ...payload.getTemplateContext(),
    };
    const base = `emails/${payload.template}`;

    return {
      subject: this.env.render(`${base}.subject.njk`, context).trim(),
      html: this.env.render(`${base}.html.njk`, context).trim(),
      text: this.env.render(`${base}.txt.njk`, context).trim(),
    };
  }
}
