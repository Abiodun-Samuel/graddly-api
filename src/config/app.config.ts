import { registerAs } from '@nestjs/config';

import { parseDurationToSeconds } from './jwt-duration.util.js';
import { parseOidcVtr, resolveOidcDiscoveryUrl } from './oidc-config.util.js';
import { getEnv } from './validate-env.js';

export default registerAs('app', () => {
  const e = getEnv();

  return {
    port: e.PORT,
    nodeEnv: e.NODE_ENV,
    swagger: {
      username: 'graddly',
      password: e.SWAGGER_PASSWORD || 'Gr4ddly!Sw4g@2026#Sec',
    },
    jwt: {
      secret: e.JWT_SECRET,
      accessExpiresIn: e.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: e.JWT_REFRESH_EXPIRES_IN,
      accessExpiresInSeconds: parseDurationToSeconds(
        e.JWT_ACCESS_EXPIRES_IN,
        900,
      ),
      refreshExpiresInSeconds: parseDurationToSeconds(
        e.JWT_REFRESH_EXPIRES_IN,
        604_800,
      ),
    },
    refresh: {
      reuseGraceSeconds: e.REFRESH_REUSE_GRACE_SECONDS,
    },
    throttle: {
      enabled: e.THROTTLE_ENABLED,
    },
    tenantDbContext: {
      enabled: e.TENANT_DB_CONTEXT_ENABLED,
    },
    redis: {
      host: e.REDIS_HOST,
      port: e.REDIS_PORT,
      password: e.REDIS_PASSWORD,
    },
    loggly: {
      token: e.LOGGLY_TOKEN,
      subdomain: e.LOGGLY_SUBDOMAIN,
    },
    sentry: {
      dsn: e.SENTRY_DSN.trim(),
      environment: e.SENTRY_ENVIRONMENT || e.NODE_ENV,
      tracesSampleRate: e.SENTRY_TRACES_SAMPLE_RATE,
      profilesSampleRate: e.SENTRY_PROFILES_SAMPLE_RATE,
    },
    oidc: {
      enabled: e.OIDC_ENABLED,
      discoveryUrl: resolveOidcDiscoveryUrl(e),
      issuer: e.OIDC_ISSUER?.trim() || undefined,
      clientId: e.OIDC_CLIENT_ID.trim(),
      clientSecret: e.OIDC_CLIENT_SECRET,
      redirectUri: e.OIDC_REDIRECT_URI,
      scopes: e.OIDC_SCOPES.split(/\s+/).filter(Boolean),
      uiLocales: e.OIDC_UI_LOCALES,
      vtr: parseOidcVtr(e.OIDC_VTR),
      sessionSecret:
        e.OIDC_SESSION_SECRET?.trim() ||
        e.JWT_SECRET ||
        'change-me-in-production',
      sessionTtlSeconds: e.OIDC_SESSION_TTL_SECONDS,
      successRedirectUri: e.OIDC_SUCCESS_REDIRECT_URI,
      provisioningMode: e.OIDC_PROVISIONING_MODE,
    },
    email: {
      provider: e.EMAIL_PROVIDER,
      resendApiKey: e.RESEND_API_KEY,
      from: e.RESEND_FROM_EMAIL,
      appName: 'Graddly',
      supportUrl: process.env.EMAIL_SUPPORT_URL?.trim() || undefined,
      privacyUrl: process.env.EMAIL_PRIVACY_URL?.trim() || undefined,
    },
    frontend: {
      baseUrl: e.FRONTEND_BASE_URL,
    },
    passwordReset: {
      tokenTtlSeconds: e.PASSWORD_RESET_TOKEN_TTL_SECONDS,
    },
    emailVerification: {
      tokenTtlSeconds: e.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
    },
  };
});
