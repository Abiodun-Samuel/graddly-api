/** Jest stub for ESM-only openid-client (e2e + unit tests). */

export class Configuration {
  serverMetadata() {
    return {
      issuer: 'https://oidc.test.example',
      supportsPKCE: () => true,
    };
  }
}

export const discovery = jest.fn(() => Promise.resolve(new Configuration()));

export const ClientSecretPost = jest.fn(() => jest.fn());

export const randomNonce = jest.fn(() => 'test-nonce');

export const randomState = jest.fn(() => 'test-state');

export const randomPKCECodeVerifier = jest.fn(() => 'test-verifier');

export const calculatePKCECodeChallenge = jest.fn(() =>
  Promise.resolve('test-challenge'),
);

export function buildAuthorizationUrl(
  _config: Configuration,
  params: URLSearchParams,
): URL {
  return new URL(`https://oidc.test.example/authorize?${params.toString()}`);
}

export const authorizationCodeGrant = jest.fn();
