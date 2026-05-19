/* eslint-disable @typescript-eslint/naming-convention -- mirrors openid-client OAuth token/session fields */

/** Jest stub for openid-client/passport — simulates login redirect + callback token exchange. */

import { Strategy as PassportStrategy } from 'passport-strategy';

import {
  getOidcE2eClaimsForTokenEndpoint,
  shouldOidcE2eAuthFail,
} from '../helpers/oidc-e2e-claims.js';

import type { Request } from 'express';

type OidcMockSessionState = { code_verifier: string };

type OidcMockSession = Record<string, OidcMockSessionState | undefined>;

function mockSession(req: Request): OidcMockSession {
  const holder = req as unknown as { session?: OidcMockSession };
  holder.session ??= {};
  return holder.session;
}

/** passport-strategy typings are narrow; runtime accepts a challenge object like openid-client. */
function failWithChallenge(strategy: PassportStrategy, message: string): void {
  (strategy.fail as unknown as (challenge?: { message: string }) => void)({
    message,
  });
}

export type VerifyFunction = (
  tokens: {
    claims: () => {
      sub?: string;
      email?: string;
      email_verified?: boolean;
    };
    id_token: string;
    access_token: string;
  },
  verified: (
    err: Error | null,
    user?: unknown,
    info?: { message: string },
  ) => void,
) => void;

export type StrategyOptions = {
  config: { serverMetadata: () => { issuer: string } };
  callbackURL?: string;
  scope?: string;
  name?: string;
  sessionKey?: string;
};

export class Strategy extends PassportStrategy {
  private readonly verifyFn: VerifyFunction;
  private readonly callbackHref: string;
  private readonly sessionKey: string;

  constructor(options: StrategyOptions, verify: VerifyFunction) {
    super();
    this.verifyFn = verify;
    const issuerHost = new URL(options.config.serverMetadata().issuer).host;
    this.sessionKey = options.sessionKey ?? issuerHost;
    this.callbackHref = options.callbackURL
      ? new URL(options.callbackURL).pathname +
        new URL(options.callbackURL).search
      : '/api/v1/auth/oidc/callback';
  }

  authenticate(req: Request): void {
    const session = mockSession(req);

    const url = new URL(
      `${req.protocol}://${req.get('host') ?? '127.0.0.1'}${req.originalUrl ?? req.url}`,
    );
    const hasCode = url.searchParams.has('code');

    if (req.method === 'GET' && !hasCode) {
      session[this.sessionKey] = { code_verifier: 'e2e-verifier' };
      const redirectTo = `${this.callbackHref}?code=e2e-auth-code&state=e2e-state`;
      this.redirect(redirectTo);
      return;
    }

    session[this.sessionKey] = undefined;

    if (shouldOidcE2eAuthFail()) {
      failWithChallenge(this, 'Mock IdP rejected credentials');
      return;
    }

    const tokens = {
      claims: () => getOidcE2eClaimsForTokenEndpoint(),
      id_token: 'e2e-id-token',
      access_token: 'e2e-access-token',
    };

    this.verifyFn(tokens, (err, user, info) => {
      if (err) {
        this.error(err);
        return;
      }
      if (!user) {
        const message =
          typeof info === 'object' &&
          info !== null &&
          'message' in info &&
          typeof info.message === 'string'
            ? info.message
            : 'One Login authentication failed';
        failWithChallenge(this, message);
        return;
      }
      this.success(user);
    });
  }
}
