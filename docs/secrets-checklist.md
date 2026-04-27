# Secrets and environment checklist (staging / production)

Use this when provisioning or rotating credentials for **staging** and **production**. Local development may use defaults from [`.env.example`](../.env.example); deployed environments must satisfy the Zod rules in [`src/config/env.schema.ts`](../src/config/env.schema.ts) (`NODE_ENV` `production` or `staging`).

## Required before go-live

| Item | Variable | Notes |
|------|-----------|--------|
| JWT signing key | `JWT_SECRET` | Min **32** characters. Never use `change-me-in-production`. Rotate if leaked. |
| Swagger UI basic auth | `SWAGGER_PASSWORD` | Min **12** characters when `NODE_ENV` is `production` or `staging`. |
| Database | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Use managed Postgres where possible; restrict network access; unique password per environment. |
| Redis | `REDIS_HOST`, `REDIS_PORT` | TLS and auth if exposed beyond the private network. |

## Strongly recommended

| Item | Variable | Notes |
|------|-----------|--------|
| Error monitoring | `SENTRY_DSN` | Enables server-side reporting; keep DSN out of client bundles and public repos. |
| Sentry environment | `SENTRY_ENVIRONMENT` | Set to `staging` or `production` for clean issue separation. |
| Log shipping | `LOGGLY_TOKEN`, `LOGGLY_SUBDOMAIN` | Optional; omit in dev if unused. |

## Operational hygiene

- Store secrets in your platform’s secret manager (e.g. AWS Secrets Manager, GCP Secret Manager, Vault), not only in flat `.env` files on disk.
- Rotate `JWT_SECRET` only with a coordinated token invalidation / client rollout plan.
- Never commit real `.env` files; rely on [`.env.example`](../.env.example) as a template only.
- After rotation, redeploy so all instances pick up new values.

## Validation at startup

The API validates environment variables at boot via **Zod** (`validateEnv` in [`src/config/validate-env.ts`](../src/config/validate-env.ts)). Misconfiguration fails fast with a clear error instead of failing mid-request.
