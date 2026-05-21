import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { IEmailLayoutContext } from './types/email-layout-context.interface.js';

@Injectable()
export class EmailLayoutContextService {
  constructor(private readonly config: ConfigService) {}

  getLayoutContext(): IEmailLayoutContext {
    return {
      appName: this.config.get<string>('app.email.appName', 'Graddly'),
      copyrightYear: new Date().getFullYear(),
      supportUrl: this.config.get<string | undefined>('app.email.supportUrl'),
      privacyUrl: this.config.get<string | undefined>('app.email.privacyUrl'),
    };
  }
}
