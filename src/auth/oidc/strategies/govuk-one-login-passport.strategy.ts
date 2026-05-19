import {
  Strategy,
  type AuthenticateOptions,
  type StrategyOptions,
  type VerifyFunction,
} from 'openid-client/passport';

import type { IOidcAuthorizationParams } from '../oidc-configuration.service.js';

export type GovUkOneLoginStrategyOptions = StrategyOptions & {
  authorizationParams?: IOidcAuthorizationParams;
};

export class GovUkOneLoginPassportStrategy extends Strategy {
  private readonly authorizationParams?: IOidcAuthorizationParams;

  constructor(options: GovUkOneLoginStrategyOptions, verify: VerifyFunction) {
    const { authorizationParams, ...strategyOptions } = options;
    super(strategyOptions, verify);
    this.authorizationParams = authorizationParams;
  }

  authorizationRequestParams<TOptions extends AuthenticateOptions>(
    req: Parameters<Strategy['authorizationRequestParams']>[0],
    options: TOptions,
  ): URLSearchParams {
    const base = super.authorizationRequestParams(req, options);
    const params =
      base instanceof URLSearchParams ? base : new URLSearchParams(base);

    if (this.authorizationParams?.uiLocales) {
      params.set('ui_locales', this.authorizationParams.uiLocales);
    }

    if (this.authorizationParams?.vtr?.length) {
      params.set('vtr', JSON.stringify(this.authorizationParams.vtr));
    }

    return params;
  }
}
