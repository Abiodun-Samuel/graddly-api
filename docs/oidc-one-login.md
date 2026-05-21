# GOV.UK One Login (OIDC)

Graddly uses [GOV.UK One Login](https://www.sign-in.service.gov.uk/) as the target OIDC provider.

## Environments

| Environment | Issuer (recommended) | Discovery document |
|-------------|----------------------|--------------------|
| Integration | `https://oidc.integration.account.gov.uk` | `https://oidc.integration.account.gov.uk/.well-known/openid-configuration` |
| Production | `https://oidc.account.gov.uk` | `https://oidc.account.gov.uk/.well-known/openid-configuration` |

Prefer setting `OIDC_ISSUER` to the issuer URL so `openid-client` can validate issuer metadata. `OIDC_DISCOVERY_URL` is optional shorthand if you need to point at the discovery document directly.

## Register your service

1. Follow [Register and manage your service](https://docs.sign-in.service.gov.uk/before-integrating/register-and-manage-your-service/) in the One Login technical documentation.
2. Create an integration-environment configuration and note the **client ID** and **client secret**.
3. Register the callback URL:

   `http://localhost:3000/api/v1/auth/oidc/callback`

4. Copy credentials into `.env` (see [`.env.example`](../.env.example)).

## HTTP routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/auth/oidc/login` | Starts One Login (302 to authorize endpoint). Rate limited like password login. |
| `GET` | `/api/v1/auth/oidc/callback` | OAuth callback: exchanges code, validates state/nonce/PKCE via Redis session, issues app JWTs. |

### Callback response

- If `OIDC_SUCCESS_REDIRECT_URI` is **unset**: JSON `{ message, data: { accessToken, refreshToken } }` (same shape as `POST /auth/login`).
- If `OIDC_SUCCESS_REDIRECT_URI` is **set**: `302` redirect to that URL with tokens in the **URL fragment** (e.g. `https://app.example.com/auth/callback#accessToken=...&refreshToken=...`).

### Account linking and provisioning

The callback requires a **verified** email from One Login (`email_verified: true`).

Resolution order:

1. **By `sub`** — if `(issuer, sub)` is already stored in `user_oidc_identities`, log in that user (email in the token must still match the Graddly user).
2. **By email** — if a user exists with the same email, link this One Login `sub` to that user and mark the email verified.
3. **Auto-provision** (default) — if no user exists and `OIDC_PROVISIONING_MODE=auto_create`, create a user with a random password, `isEmailVerified=true`, and store the identity link.

Set `OIDC_PROVISIONING_MODE=link_existing` to reject unknown emails with `403` (invite-only / admin-provisioned accounts).

Identity links are stored in `user_oidc_identities` (`issuer`, `subject`, `userId`). One Login account per issuer per user.

## Session cookie (PKCE / state / nonce)

The Passport OIDC strategy stores PKCE verifiers, `state`, and `nonce` in a Redis-backed `express-session` scoped to `/api/v1/auth/oidc` (`oidc.sid` cookie). Ensure Redis is running when OIDC is enabled.

## Environment variables

| Variable | Required when `OIDC_ENABLED=true` | Description |
|----------|-----------------------------------|-------------|
| `OIDC_ENABLED` | — | `true` to enable discovery, routes, and session middleware (default `false`). |
| `OIDC_ISSUER` | One of issuer or discovery URL | Authorization server issuer identifier. |
| `OIDC_DISCOVERY_URL` | One of issuer or discovery URL | Full OpenID configuration URL (optional if issuer is set). |
| `OIDC_CLIENT_ID` | Yes | Client identifier from One Login. |
| `OIDC_CLIENT_SECRET` | Yes | Client secret from One Login. |
| `OIDC_REDIRECT_URI` | Yes | Registered redirect URI (must match One Login config). |
| `OIDC_SCOPES` | — | Space-separated scopes (default `openid email`). |
| `OIDC_UI_LOCALES` | — | `ui_locales` parameter (default `en`). |
| `OIDC_VTR` | — | JSON array for Vector of Trust, e.g. `["Cl.Cm"]` for medium authentication. |
| `OIDC_SESSION_SECRET` | Yes in prod/staging | Signs the `oidc.sid` session cookie (min 32 chars in deployed envs). Falls back to `JWT_SECRET` in development. |
| `OIDC_SESSION_TTL_SECONDS` | — | OAuth session lifetime (default `600`). |
| `OIDC_SUCCESS_REDIRECT_URI` | — | Optional frontend URL for `302` after successful login. |
| `OIDC_PROVISIONING_MODE` | — | `auto_create` (default) or `link_existing` for first-time unknown emails. |

When `NODE_ENV` is `production` or `staging`, non-empty `OIDC_CLIENT_SECRET` and `OIDC_SESSION_SECRET` (min 32 characters) are required if OIDC is enabled.

## Local development

Leave `OIDC_ENABLED=false` unless you have integration credentials. The API continues to use email/password JWT auth only.

To exercise the full browser flow:

```bash
OIDC_ENABLED=true \
OIDC_ISSUER=https://oidc.integration.account.gov.uk \
OIDC_CLIENT_ID=your-client-id \
OIDC_CLIENT_SECRET=your-client-secret \
OIDC_REDIRECT_URI=http://localhost:3000/api/v1/auth/oidc/callback \
OIDC_SESSION_SECRET=your-local-session-secret-at-least-32-chars \
yarn start:dev
```

Open `http://localhost:3000/api/v1/auth/oidc/login` in a browser. With default `auto_create`, a new Graddly user is created on first successful One Login sign-in.

## Further reading

- [Authenticate your user (integration)](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/)
- [Configure for production](https://docs.sign-in.service.gov.uk/configure-for-production/)
