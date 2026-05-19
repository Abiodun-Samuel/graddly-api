# Password reset

Graddly supports email/password account recovery via time-limited tokens stored in Redis and transactional email sent through [Resend](https://resend.com).

## Flow

1. `POST /api/v1/auth/forgot-password` with `{ "email": "user@example.com" }`
2. If an **active** user exists, the API stores `password-reset:{token}` → `userId` in Redis (default TTL 1 hour) and sends a reset email.
3. The user opens the frontend link: `{FRONTEND_BASE_URL}/reset?token={uuid}`
4. `POST /api/v1/auth/reset-password` with `{ "token": "...", "password": "..." }` sets a new password and returns JWT access + refresh tokens.

`forgot-password` always returns **204 No Content** (no email enumeration).

## Environment variables

| Variable | Description |
|----------|-------------|
| `EMAIL_PROVIDER` | `noop` (default) or `resend` |
| `RESEND_API_KEY` | Resend API key (required when `EMAIL_PROVIDER=resend` in production/staging) |
| `RESEND_FROM_EMAIL` | Sender, e.g. `Graddly <noreply@yourdomain.com>` |
| `FRONTEND_BASE_URL` | Frontend app origin (reset link uses `/reset?token=`) |
| `PASSWORD_RESET_TOKEN_TTL_SECONDS` | Token lifetime (default `3600`) |

See [`.env.example`](../.env.example) and [secrets-checklist.md](./secrets-checklist.md).

## Email templates

Transactional content lives in [`templates/`](../templates/) as Nunjucks (`.njk`) files with shared layouts under `templates/layouts/`. Each outbound message is a **payload class** (e.g. `PasswordResetEmail`) extending `BaseEmailPayload`; `EmailService.sendEmail(payload)` renders and sends.

Shared template variables (copyright year, app name, optional support/privacy URLs) come from `EmailLayoutContextService`.

## Resend setup

1. Create an account at [resend.com](https://resend.com).
2. Verify your sending domain under **Domains**.
3. Create an API key and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `EMAIL_PROVIDER=resend`.

## Local development

Leave `EMAIL_PROVIDER=noop` to skip outbound email (debug log only in development). Use Redis CLI or tests to read `password-reset:*` keys when exercising the flow.

## Related

- [Email verification](./email-verification.md) for local sign-up.

## Security notes

- Reset tokens are single-use (deleted after successful reset).
- Existing refresh tokens are **not** invalidated on password reset (documented follow-up).
- Rate limit: 5 requests/minute per route (same as login).
