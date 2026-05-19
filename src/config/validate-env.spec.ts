/* eslint-disable @typescript-eslint/naming-convention -- fixtures mirror process.env */

import { parseEnv } from './validate-env.js';

describe('parseEnv', () => {
  it('accepts a minimal development-shaped env', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change-me-in-production',
    });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.THROTTLE_ENABLED).toBe(true);
    expect(env.TENANT_DB_CONTEXT_ENABLED).toBe(true);
    expect(env.OIDC_ENABLED).toBe(false);
  });

  it('accepts OIDC disabled without client credentials', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change-me-in-production',
      OIDC_ENABLED: 'false',
    });

    expect(env.OIDC_ENABLED).toBe(false);
  });

  it('requires OIDC fields when OIDC is enabled', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'development',
        JWT_SECRET: 'change-me-in-production',
        OIDC_ENABLED: 'true',
      }),
    ).toThrow(/OIDC_CLIENT_ID/);
  });

  it('accepts OIDC enabled with integration-shaped config', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change-me-in-production',
      OIDC_ENABLED: 'true',
      OIDC_ISSUER: 'https://oidc.integration.account.gov.uk',
      OIDC_CLIENT_ID: 'test-client',
      OIDC_CLIENT_SECRET: 'test-secret',
      OIDC_REDIRECT_URI: 'http://localhost:3000/api/v1/auth/oidc/callback',
      OIDC_VTR: '["Cl.Cm"]',
    });

    expect(env.OIDC_ENABLED).toBe(true);
    expect(env.OIDC_CLIENT_ID).toBe('test-client');
  });

  it('rejects production with OIDC enabled but no client secret', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'x'.repeat(32),
        SWAGGER_PASSWORD: 'strong-pass-12',
        OIDC_ENABLED: 'true',
        OIDC_ISSUER: 'https://oidc.integration.account.gov.uk',
        OIDC_CLIENT_ID: 'test-client',
        OIDC_CLIENT_SECRET: '',
        OIDC_REDIRECT_URI: 'http://localhost:3000/api/v1/auth/oidc/callback',
      }),
    ).toThrow(/OIDC_CLIENT_SECRET/);
  });

  it('rejects production with a short JWT secret', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short',
        SWAGGER_PASSWORD: 'twelvechars12',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects production without Swagger password', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'x'.repeat(32),
        SWAGGER_PASSWORD: '',
      }),
    ).toThrow(/SWAGGER_PASSWORD/);
  });

  it('accepts production with strong secrets', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
      SWAGGER_PASSWORD: 'strong-pass-12',
    });

    expect(env.NODE_ENV).toBe('production');
  });
});
