/* eslint-disable @typescript-eslint/naming-convention -- openid-client mock export names */

jest.mock('openid-client', () => ({
  randomNonce: jest.fn(() => 'test-nonce'),
}));

jest.mock('openid-client/passport', () => ({
  Strategy: class MockStrategy {
    authorizationRequestParams(
      _req: unknown,
      options: { scope?: string },
    ): URLSearchParams {
      const params = new URLSearchParams();
      if (options?.scope) {
        params.set('scope', options.scope);
      }
      return params;
    }
  },
}));

import { GovUkOneLoginPassportStrategy } from './govuk-one-login-passport.strategy.js';

describe('GovUkOneLoginPassportStrategy', () => {
  it('adds nonce to authorization request params when missing', () => {
    const strategy = new GovUkOneLoginPassportStrategy(
      {
        config: {} as never,
        authorizationParams: { uiLocales: 'en', vtr: ['Cl.Cm'] },
      },
      jest.fn(),
    );

    const params = strategy.authorizationRequestParams({} as never, {
      scope: 'openid email',
    });

    expect(params.get('nonce')).toBe('test-nonce');
    expect(params.get('ui_locales')).toBe('en');
    expect(params.get('vtr')).toBe('["Cl.Cm"]');
  });
});
