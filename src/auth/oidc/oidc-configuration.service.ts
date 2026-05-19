import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSecretPost, Configuration, discovery } from 'openid-client';

export interface IOidcAuthorizationParams {
  uiLocales?: string;
  vtr?: string[];
}

@Injectable()
export class OidcConfigurationService implements OnModuleInit {
  private readonly logger = new Logger(OidcConfigurationService.name);
  private configuration?: Configuration;
  private initPromise?: Promise<void>;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('app.oidc.enabled', false);
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (this.configuration) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.discover();
    }

    await this.initPromise;
  }

  getConfiguration(): Configuration | undefined {
    return this.configuration;
  }

  getScopeString(): string {
    return this.config.get<string[]>('app.oidc.scopes', ['openid']).join(' ');
  }

  getRedirectUri(): string {
    const redirectUri = this.config.get<string>('app.oidc.redirectUri');
    if (!redirectUri) {
      throw new ServiceUnavailableException(
        'OIDC redirect URI is not configured',
      );
    }
    return redirectUri;
  }

  getAuthorizationParams(): IOidcAuthorizationParams {
    return {
      uiLocales: this.config.get<string>('app.oidc.uiLocales'),
      vtr: this.config.get<string[]>('app.oidc.vtr'),
    };
  }

  private async discover(): Promise<void> {
    const discoveryUrl = this.config.get<string | undefined>(
      'app.oidc.discoveryUrl',
    );
    const issuer = this.config.get<string | undefined>('app.oidc.issuer');
    const clientId = this.config.get<string>('app.oidc.clientId', '');
    const clientSecret = this.config.get<string>('app.oidc.clientSecret', '');
    const redirectUri = this.getRedirectUri();

    const serverUrl = issuer
      ? new URL(issuer)
      : discoveryUrl
        ? new URL(discoveryUrl)
        : undefined;

    if (!serverUrl) {
      throw new Error(
        'OIDC is enabled but app.oidc.issuer and app.oidc.discoveryUrl are missing',
      );
    }

    this.logger.log(
      `Discovering OIDC configuration from ${issuer ?? discoveryUrl}`,
    );

    this.configuration = await discovery(
      serverUrl,
      clientId,
      // openid-client ClientMetadata uses OAuth snake_case keys.
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      { redirect_uris: [redirectUri] },
      ClientSecretPost(clientSecret),
    );
  }
}
