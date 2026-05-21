# Authentication tokens

Graddly uses a short-lived **JWT access token** and a long-lived opaque **refresh token** stored in Redis.

## Policy (defaults)

| Token | Default lifetime | Env var |
|-------|------------------|---------|
| Access (JWT) | **15 minutes** | `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`) |
| Refresh (opaque) | **7 days** | `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`) |

Durations use `s`, `m`, `h`, or `d` suffixes. Redis TTL for refresh tokens is derived from the same refresh duration so storage and policy stay aligned.

## Refresh rotation

`POST /api/v1/auth/refresh` exchanges a valid refresh token for a new access + refresh pair. The previous refresh token is deleted immediately (rotation).

## Reuse detection

After rotation, the old token is recorded in Redis as a short-lived tombstone (`REFRESH_REUSE_GRACE_SECONDS`, default **30**). If that token is presented again after rotation, the API treats it as a possible theft and **invalidates all refresh sessions** for that user (version bump). The client must log in again.

## Logout

| Endpoint | Effect |
|----------|--------|
| `POST /api/v1/auth/logout` | Invalidates the refresh token in the request body |
| `POST /api/v1/auth/logout-all` | Invalidates **all** refresh tokens for the authenticated user |

Access tokens are not blocklisted; they expire naturally (default 15m).

## Password reset

`POST /api/v1/auth/reset-password` bumps the refresh session version so existing refresh tokens no longer work.

## Related docs

- [JWT payload claims](./api/jwt-payload.md)
- [Password reset](./password-reset.md)
- [Email verification](./email-verification.md)
