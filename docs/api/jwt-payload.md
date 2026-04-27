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

## Migration for clients

1. **Additive change:** New tokens may include `orgId` and `roles`. Older tokens may only contain `sub` and `email` until they expire.
2. **Defensive decoding:** Treat `orgId` and `roles` as optional. Do not assume every user has an organisation yet during rollout.
3. **Stale memberships:** If the JWT includes `orgId` but the user was removed from that organisation, the API returns **401** until the client obtains a new token (e.g. refresh or login).

## Bearer auth in OpenAPI

See Swagger UI (**/docs**) bearer auth description for the short summary.
