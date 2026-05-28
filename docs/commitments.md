# Commitment statements (Phase O)

Versioned tripartite commitment statements per enrolment, with a status machine, snapshot PDF generation, and sequential e-signing (apprentice → tutor → employer manager).

## Data model

- **`commitment_statement_groups`** — one active group per enrolment (`organisationId` + `enrolmentId` unique while not deleted).
- **`commitment_statements`** — versioned rows (`version` 1, 2, …) with JSON `content` and signer user IDs.
- **`commitment_signatures`** — three slots per statement when the snapshot PDF completes.

## Status machine

| From | To |
|------|-----|
| `draft` | `submitted`, `cancelled` |
| `submitted` | `awaiting_signatures`, `cancelled` |
| `awaiting_signatures` | `signed`, `cancelled` (admin only) |
| `signed` | `superseded` (when v+1 is created) |
| `cancelled` | (terminal) |
| `superseded` | (terminal) |

Publishing (`draft` → `submitted`) enqueues a `commitment_snapshot` PDF job. When the worker completes the job, status moves to `awaiting_signatures` and signature slots are created (no user GUC — no audit rows for slot creation).

## Versioning

A new version may be created only when the **current** version is `signed` or `cancelled`. Creating v(N+1) while the current version is `signed` marks it `superseded`. Parallel drafts are not allowed (`draft`, `submitted`, or `awaiting_signatures` block a new version).

## API (`/api/v1/commitment-statements`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create group + v1 `draft` |
| `GET` | `/` | List versions (filters: `enrolmentId`, `status`, pagination) |
| `GET` | `/:id` | Get version by id |
| `POST` | `/:groupId/versions` | New version when current is `signed` or `cancelled` |
| `PATCH` | `/:id` | Update content / signers while `draft` |
| `POST` | `/:id/publish` | Publish draft → `submitted` + enqueue snapshot PDF |
| `POST` | `/:id/cancel` | Cancel from allowed states |
| `POST` | `/:id/sign` | Tripartite sign (`party`, `signatureImageKey`) |

All write routes set audit GUC context (`setCurrentUserId`, `setLastKnownUserIdForGuc`).

## Content payload (`content` JSON)

| Field | Type | Required |
|-------|------|----------|
| `trainingPlanSummary` | string | yes |
| `employerCommitments` | string | yes |
| `apprenticeCommitments` | string | yes |
| `providerCommitments` | string | yes |
| `weeklyHours` | number | no |
| `additionalTerms` | string | no |

## Signing

Uses shared `SigningModule` (`SequentialCoSignOrchestrator`) — same order and `sourcePdfKey` chain as reviews. See [esignature.md](./esignature.md).

## Audit

Lifecycle changes on `commitment_statement_groups`, `commitment_statements`, and `commitment_signatures` are written to `audit_log_entries` via the TypeORM subscriber. Export with `GET /api/v1/audit/export?entityType=commitment_statements` (or `commitment_signatures`).

## Notifications

In-app notifications use `NotificationType.COMMITMENT` when a party may sign and when all parties have signed.
