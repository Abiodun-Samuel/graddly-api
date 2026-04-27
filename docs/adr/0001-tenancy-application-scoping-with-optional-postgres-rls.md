# ADR 0001: Tenancy — application org scoping with optional Postgres RLS

## Status

Accepted

## Date

2026-04-27

## Context

Graddly API is a NestJS service using TypeORM against PostgreSQL. Multi-tenant behaviour requires a clear boundary: **who owns a row** and **how we prevent cross-organisation access**.

Two viable patterns are in play:

1. **Application-level scoping** — Every org-scoped table carries an `organisation_id` (or `org_id`). All reads and writes go through queries that filter on the **active organisation** resolved from auth (e.g. JWT claims, header, or user preference) and enforced in services, repositories, or shared query helpers.
2. **Postgres Row Level Security (RLS)** — Policies on the database restrict rows based on a **session variable** (e.g. `SET app.current_org = '…'`) set per connection or transaction, so the database rejects cross-tenant access even if application code omits a `WHERE` clause.

The product roadmap in [PROJECT-TASKS.md](../../PROJECT-TASKS.md) assumes an `org_id`-style model and treats a **Postgres RLS** phase as **[optional RLS]**: Phase B covers organisations, membership, JWT `orgId`, and guards; Phase C is **skippable** if we standardise on application scoping only.

Today, tenant columns and RLS policies are not yet implemented; this ADR sets the decision for upcoming work.

## Decision

| Layer | Role |
|--------|------|
| **Application** | **Primary** tenant boundary. Org-scoped entities include `organisation_id`; all org-scoped access is filtered by the **active organisation** from authenticated context (see Phase B in [PROJECT-TASKS.md](../../PROJECT-TASKS.md)). Correctness is owned by API design, services, repositories, and tests. |
| **Postgres RLS** | **Optional** defense-in-depth. We may introduce RLS later (Phase C in [PROJECT-TASKS.md](../../PROJECT-TASKS.md)) — e.g. for compliance, reporting with least privilege, or extra safety — but it is **not required** for the initial multi-tenant delivery if application scoping and tests are rigorous. |

If we do **not** implement RLS, Phase C is explicitly out of scope until this ADR is superseded or amended.

## Consequences

### Application-level scoping only (no RLS)

- **Positive**: Simpler database role and migration story; faster iteration; straightforward local and CI tests; no need for connection/query-runner hooks to set session variables on every use.
- **Negative**: A single forgotten `WHERE organisation_id = …` or bug in a generic repository could expose another tenant’s data — mitigated by conventions, code review, linting where feasible, and integration tests for isolation.

### Adding Postgres RLS (optional, later)

- **Positive**: Database-enforced isolation; reduces blast radius of application bugs; can support stricter operational models (e.g. separate DB roles for reporting).
- **Negative**: Policies and migrations must stay aligned with entities; TypeORM usage must reliably set tenant context per connection or transaction; more operational and test complexity.

### Follow-up

Implementation order should follow [PROJECT-TASKS.md](../../PROJECT-TASKS.md): Phase B (organisations, membership, JWT `orgId`, active-org resolution, RBAC) before any optional Phase C RLS work.

## References

- [PROJECT-TASKS.md](../../PROJECT-TASKS.md) — Phase B (identity / org scoping), Phase C (optional RLS)
