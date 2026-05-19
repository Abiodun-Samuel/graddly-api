# Email verification (local sign-up)

Local email/password sign-up requires users to verify their email before they can log in or use JWT-protected APIs. OIDC (GOV.UK One Login) users are verified by the identity provider and are not affected.

## Flow

1. `POST /api/v1/auth/signup` with name, email, and password — creates the user (`isEmailVerified=false`) and sends a verification email. Response is **201** with a message only (no tokens).
2. The user opens the frontend link: `{FRONTEND_BASE_URL}/verify-email?token={uuid}`
3. `POST /api/v1/auth/verify-email` with `{ "token": "..." }` marks the email verified and returns JWT access + refresh tokens.
4. `POST /api/v1/auth/login` succeeds only after verification.

`resend-verification` always returns **204 No Content** (no email enumeration).

## Environment variables

| Variable | Description |
|----------|-------------|
| `EMAIL_PROVIDER` | `noop` (default) or `resend` |
| `RESEND_API_KEY` | Resend API key (required when `EMAIL_PROVIDER=resend` in production/staging) |
| `RESEND_FROM_EMAIL` | Sender, e.g. `Graddly <noreply@yourdomain.com>` |
| `FRONTEND_BASE_URL` | Frontend app origin (verification link uses `/verify-email?token=`) |
| `EMAIL_VERIFICATION_TOKEN_TTL_SECONDS` | Token lifetime (default `86400` / 24 hours) |

See [`.env.example`](../.env.example) and [secrets-checklist.md](./secrets-checklist.md).

## Email templates

Verification content uses the same Nunjucks + payload pattern as [password reset](./password-reset.md): `EmailVerificationEmail` and files under `templates/emails/email-verification.*.njk`.

## Local development

Leave `EMAIL_PROVIDER=noop` to skip outbound email (debug log only in development). Use Redis CLI or tests to read `email-verify:*` keys when exercising the flow.

## Existing users

Accounts created before this feature with `isEmailVerified=false` cannot log in until they call `POST /api/v1/auth/resend-verification` and complete verification.

## Security notes

- Verification tokens are single-use (deleted after successful verify).
- Rate limit: 5 requests/minute per route (same as login).
- Refresh tokens issued before verification (if any) are rejected on refresh until the email is verified.
