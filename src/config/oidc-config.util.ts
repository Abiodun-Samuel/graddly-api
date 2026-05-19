import type { Env } from './env.schema.js';

export function resolveOidcDiscoveryUrl(env: Env): string | undefined {
  const explicit = env.OIDC_DISCOVERY_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const issuer = env.OIDC_ISSUER?.trim();
  if (issuer) {
    return `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
  }

  return undefined;
}

export function parseOidcVtr(value: string | undefined): string[] | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(trimmed);
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    throw new Error('OIDC_VTR must be a JSON array of strings');
  }

  return parsed;
}
