import {
  parseEnvFromProcess,
  resetEnvCache,
} from '../../src/config/validate-env.js';

/** Minimal OIDC env for e2e with mocked openid-client (see test/mocks). */
export function applyOidcE2eEnv(): void {
  process.env.OIDC_ENABLED = 'true';
  process.env.OIDC_ISSUER = 'https://oidc.test.example';
  process.env.OIDC_CLIENT_ID = 'e2e-oidc-client';
  process.env.OIDC_CLIENT_SECRET = 'e2e-oidc-secret';
  process.env.OIDC_REDIRECT_URI = 'http://127.0.0.1/api/v1/auth/oidc/callback';
  process.env.OIDC_SCOPES = 'openid email';
  process.env.OIDC_UI_LOCALES = 'en';
  process.env.OIDC_VTR = '';
  process.env.OIDC_SESSION_SECRET = 'e2e-oidc-session-secret-min-32-chars';
  process.env.OIDC_SESSION_TTL_SECONDS = '600';
  process.env.OIDC_PROVISIONING_MODE = 'auto_create';
  delete process.env.OIDC_SUCCESS_REDIRECT_URI;

  resetEnvCache();
  parseEnvFromProcess();
}

export function restoreDefaultOidcE2eEnv(): void {
  process.env.OIDC_ENABLED = 'false';
  delete process.env.OIDC_ISSUER;
  delete process.env.OIDC_CLIENT_ID;
  delete process.env.OIDC_CLIENT_SECRET;
  delete process.env.OIDC_REDIRECT_URI;
  delete process.env.OIDC_SESSION_SECRET;
  delete process.env.OIDC_SUCCESS_REDIRECT_URI;

  resetEnvCache();
  parseEnvFromProcess();
}
