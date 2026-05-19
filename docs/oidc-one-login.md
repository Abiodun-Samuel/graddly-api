# GOV.UK One Login (OIDC)

Graddly uses [GOV.UK One Login](https://www.sign-in.service.gov.uk/) as the target OIDC provider. The Passport strategy and configuration placeholders are implemented in **OIDC-001**; login/callback routes and user linking follow in later tasks.

## Environments

| Environment | Issuer (recommended) | Discovery document |
|-------------|----------------------|--------------------|
| Integration | `https://oidc.integration.account.gov.uk` | `https://oidc.integration.account.gov.uk/.well-known/openid-configuration` |
| Production | `https://oidc.account.gov.uk` | `https://oidc.account.gov.uk/.well-known/openid-configuration` |

Prefer setting `OIDC_ISSUER` to the issuer URL so `openid-client` can validate issuer metadata. `OIDC_DISCOVERY_URL` is optional shorthand if you need to point at the discovery document directly.

## Register your service

1. Follow [Register and manage your service](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/) in the One Login technical documentation.
2. Create an integration-environment configuration and note the **client ID** and **client secret**.
3. Register the callback URL your API will use (placeholder for OIDC-002):

   `http://localhost:3000/api/v1/auth/oidc/callback`

4. Copy credentials into `.env` (see [`.env.example`](../.env.example)).

## Environment variables

| Variable | Required when `OIDC_ENABLED=true` | Description |
|----------|-----------------------------------|-------------|
| `OIDC_ENABLED` | — | `true` to load discovery and register the Passport strategy (default `false`). |
| `OIDC_ISSUER` | One of issuer or discovery URL | Authorization server issuer identifier. |
| `OIDC_DISCOVERY_URL` | One of issuer or discovery URL | Full OpenID configuration URL (optional if issuer is set). |
| `OIDC_CLIENT_ID` | Yes | Client identifier from One Login. |
| `OIDC_CLIENT_SECRET` | Yes | Client secret from One Login. |
| `OIDC_REDIRECT_URI` | Yes | Registered redirect URI (must match One Login config). |
| `OIDC_SCOPES` | — | Space-separated scopes (default `openid email`). |
| `OIDC_UI_LOCALES` | — | `ui_locales` parameter (default `en`). |
| `OIDC_VTR` | — | JSON array for Vector of Trust, e.g. `["Cl.Cm"]` for medium authentication. |

When `NODE_ENV` is `production` or `staging`, a non-empty `OIDC_CLIENT_SECRET` is required if OIDC is enabled.

## Local development

Leave `OIDC_ENABLED=false` unless you have integration credentials. The API continues to use email/password JWT auth only.

To verify discovery at startup:

```bash
OIDC_ENABLED=true \
OIDC_ISSUER=https://oidc.integration.account.gov.uk \
OIDC_CLIENT_ID=your-client-id \
OIDC_CLIENT_SECRET=your-client-secret \
OIDC_REDIRECT_URI=http://localhost:3000/api/v1/auth/oidc/callback \
yarn start:dev
```

Public login and callback HTTP routes are added in **OIDC-002**. User provisioning by email is **OIDC-003**.

## Further reading

- [Authenticate your user (integration)](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/)
- [Configure for production](https://docs.sign-in.service.gov.uk/configure-for-production/)
