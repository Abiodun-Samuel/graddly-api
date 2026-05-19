import { DynamicModule, Module, type Provider } from '@nestjs/common';

import { getEnv } from '../../config/validate-env.js';

import { OidcAuthGuard } from './guards/oidc-auth.guard.js';
import { OidcConfigurationService } from './oidc-configuration.service.js';
import { OidcStrategy } from './strategies/oidc.strategy.js';

@Module({})
export class OidcModule {
  static register(): DynamicModule {
    const oidcEnabled = getEnv().OIDC_ENABLED;

    const providers: Provider[] = [OidcConfigurationService, OidcAuthGuard];
    const exports: Provider[] = [OidcConfigurationService, OidcAuthGuard];

    if (oidcEnabled) {
      providers.push({
        provide: OidcStrategy,
        useFactory: async (oidcConfiguration: OidcConfigurationService) => {
          await oidcConfiguration.initialize();
          return new OidcStrategy(oidcConfiguration);
        },
        inject: [OidcConfigurationService],
      });
      exports.push(OidcStrategy);
    }

    return {
      module: OidcModule,
      providers,
      exports,
    };
  }
}
