import {
  DynamicModule,
  forwardRef,
  Module,
  type Provider,
} from '@nestjs/common';

import { getEnv } from '../../config/validate-env.js';
import { RedisModule } from '../../redis/redis.module.js';
import { UsersModule } from '../../users/users.module.js';
import { AuthModule } from '../auth.module.js';

import { OidcAuthGuard } from './guards/oidc-auth.guard.js';
import { OidcAuthService } from './oidc-auth.service.js';
import { OidcConfigurationService } from './oidc-configuration.service.js';
import { OidcController } from './oidc.controller.js';
import { OidcStrategy } from './strategies/oidc.strategy.js';

@Module({})
export class OidcModule {
  static register(): DynamicModule {
    const oidcEnabled = getEnv().OIDC_ENABLED;

    const providers: Provider[] = [
      OidcConfigurationService,
      OidcAuthGuard,
      OidcAuthService,
    ];
    const exports: Provider[] = [
      OidcConfigurationService,
      OidcAuthGuard,
      OidcAuthService,
    ];
    const controllers = oidcEnabled ? [OidcController] : [];

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
      imports: [RedisModule, UsersModule, forwardRef(() => AuthModule)],
      controllers,
      providers,
      exports,
    };
  }
}
