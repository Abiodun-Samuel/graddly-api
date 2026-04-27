# JWT access token payload

The **access token** is a JWT signed by the API. Clients may decode it (without verifying locally; verification happens on the server) to read tenant context.

## Claims

| Claim   | Type       | Required | Description |
|---------|------------|----------|-------------|
| `sub`   | string     | Yes      | User id (UUID). |
| `email` | string     | Yes      | User email at time of issuance. |
| `orgId` | string     | No       | Active organisation id when the user has at least one membership. Omitted if the user has no organisation memberships. |
| `roles` | string[]   | No       | Roles in **that** organisation (same values as `OrganisationRole`: `owner`, `admin`, `member`). Typically one element today. Omitted together with `orgId`. |
| `iat` / `exp` | number | Yes (JWT std) | Issued-at and expiry (handled by the JWT library). |

## Active organisation selection

When the user belongs to several organisations, the API picks **one** active organisation for the access token:

1. Highest role first: **owner** > **admin** > **member**.
2. If tied, earliest membership `createdAt` wins.

Token **refresh** re-runs this resolution against the database, so membership changes are reflected on the next issued access token.

## Optional header: `X-Organisation-Id`

Send **`X-Organisation-Id: <organisation uuid>`** on a request to override the JWT’s default active organisation for **that request only**. The API checks that you have an active membership in that organisation; otherwise it responds with **403**.

Resolution order:

1. If **`X-Organisation-Id`** is present and valid → use that organisation when you are a member.
2. Otherwise → use **`orgId` / `roles` from the JWT** as produced at login / refresh.

This lets clients switch tenant context **without** issuing a new access token (until you refresh for a new default).

## Migration for clients

1. **Additive change:** New tokens may include `orgId` and `roles`. Older tokens may only contain `sub` and `email` until they expire.
2. **Defensive decoding:** Treat `orgId` and `roles` as optional. Do not assume every user has an organisation yet during rollout.
3. **Stale memberships:** If the JWT includes `orgId` but the user was removed from that organisation, the API returns **401** until the client obtains a new token (e.g. refresh or login).

## Bearer auth in OpenAPI

See Swagger UI (**/docs**) bearer auth description for the short summary.
