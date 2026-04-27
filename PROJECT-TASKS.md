# Graddly API — Backend implementation tasks

Scope: **REST API only** (NestJS). Frontends and monorepo setup are out of scope here. Tasks are ordered by **dependency** (earlier rows unblock later ones). Each row is sized for **one focused PR** where possible.

**Conventions**

- **Story points**: Fibonacci (1–8). Roughly: 1 = trivial, 3 = small feature, 5 = standard, 8 = large but still one PR.
- **Timeline**: Relative **phases** (calendar dates are for the team to map).
- **Assignee**: `TBD` until allocated.
- **Multi-tenancy**: The planning doc assumes `org_id` + RLS. Your team may instead use **organisation scoping in application code only** (single DB, no RLS). Tasks that are **conditional** on choosing full multi-tenant RLS are marked **[optional RLS]**.

---

## Phase A — Decisions, conventions, observability

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Record ADR: tenancy model — app-level org scoping vs Postgres RLS **[optional RLS]** | Not started | Phase A | 2 | TBD |
| Observability: Sentry + request correlation IDs on API | Not started | Phase A | 3 | TBD |
| Config: validated env schema (e.g. Zod or class-validator config) + secrets checklist for staging/prod | Not started | Phase A | 3 | TBD |
| CI: optional `migration:run` drift check / `yarn build` strict on PR (align with existing pipeline) | Not started | Phase A | 2 | TBD |

---

## Phase B — Identity: organisations, roles, RBAC (no OIDC yet)

Assumes **every user belongs to at least one organisation** with membership roles (even if you skip RLS).

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `Organisation` entity + CRUD (admin-level) + migration | Not started | Phase B | 5 | TBD |
| `OrganisationMembership` (user ↔ org) + role enum per portal / global matrix + migration | Not started | Phase B | 5 | TBD |
| JWT access payload: `sub`, `email`, `orgId` (active org), `roles[]` + migration for clients | Not started | Phase B | 5 | TBD |
| Active-org resolution: header or user preference + guard | Not started | Phase B | 3 | TBD |
| `@Roles()` decorator + `RolesGuard` + unit tests for matrix | Not started | Phase B | 5 | TBD |
| Replace/extend generic throttles with **per-user** key where applicable (doc: ~100 req/min/user) | Not started | Phase B | 3 | TBD |

---

## Phase C — **[optional RLS]** Postgres row-level security

Skip entire phase if ADR chooses **application-level scoping only**.

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| DB role + `SET app.current_org` (or session var) pattern; TypeORM connection/query runner hooks | Not started | Phase C | 8 | TBD |
| RLS policies for PII tables introduced so far (`users`, org tables) + migration | Not started | Phase C | 8 | TBD |
| Integration tests: cannot read other org’s rows **[optional RLS]** | Not started | Phase C | 5 | TBD |

---

## Phase D — Authentication: GOV.UK One Login + password flows

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Passport **OIDC** strategy (provider-agnostic) + config placeholders for One Login | Not started | Phase D | 5 | TBD |
| OAuth callback routes, state/nonce, token exchange | Not started | Phase D | 5 | TBD |
| Link One Login identity to existing user by verified email + first-time provisioning rules | Not started | Phase D | 5 | TBD |
| Local email/password: keep; add **password reset** tokens + email template hook (SendGrid stub) | Not started | Phase D | 5 | TBD |
| **Email verification** token flow for local sign-up | Not started | Phase D | 3 | TBD |
| Refresh token rotation hardening: reuse detection, logout-all, align TTLs with doc (15m access / refresh policy) | Not started | Phase D | 3 | TBD |

---

## Phase E — Invitations

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `Invitation` entity (email, role, org, expiry) + migration | Not started | Phase E | 3 | TBD |
| POST `/invitations` + resend + revoke + accept flow (token) | Not started | Phase E | 5 | TBD |

---

## Phase F — Async platform: Redis jobs, BullMQ

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `BullMQ` module: queues, default job options, Redis config, graceful shutdown | Not started | Phase F | 5 | TBD |
| `Nest Schedule` wrapper + example cron health job | Not started | Phase F | 2 | TBD |
| Dead-letter / failed-job inspection pattern (shared util) | Not started | Phase F | 3 | TBD |

---

## Phase G — Notifications (email + in-app)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `Notification` + `NotificationPreference` entities + migrations | Not started | Phase G | 5 | TBD |
| In-app notification create/list/mark-read API | Not started | Phase G | 3 | TBD |
| SendGrid provider: single **transactional** send path + template ID config | Not started | Phase G | 5 | TBD |
| Event-style dispatch: enqueue **BullMQ** job → SendGrid worker | Not started | Phase G | 5 | TBD |
| Digest queue skeleton (weekly OTJ digest — wire later to domain) | Not started | Phase G | 3 | TBD |

---

## Phase H — File storage (S3)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `StorageModule`: AWS SDK v3 config, bucket per env | Not started | Phase H | 3 | TBD |
| Presigned upload + presigned download URLs; **org/learner** path namespace | Not started | Phase H | 5 | TBD |
| Validation: mime allowlist + **25MB** cap (per doc) | Not started | Phase H | 3 | TBD |

---

## Phase I — Audit trail

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `AuditLogEntry` entity (actor, entity, action, changed fields JSON) + migration | Not started | Phase I | 5 | TBD |
| TypeORM subscriber: on insert/update/delete for selected entities → audit row | Not started | Phase I | 8 | TBD |
| GET audit export (paginated CSV/JSON); **no update/delete** on audit table | Not started | Phase I | 5 | TBD |

---

## Phase J — PDF & e-signature (backend)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `PdfModule`: Puppeteer or pdfkit choice; single **sync** hello PDF in API (prove deps in Docker) | Not started | Phase J | 5 | TBD |
| Async PDF generation job (**BullMQ**) + status polling endpoint pattern | Not started | Phase J | 5 | TBD |
| `ESignatureModule`: capture signature metadata (image hash/ref), timestamp, IP; link to document record | Not started | Phase J | 5 | TBD |
| Embed signature in PDF + store signed artefact via `StorageModule` | Not started | Phase J | 8 | TBD |

---

## Phase K — Core learning domain entities

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `Programme` + `Standard` (or standard reference) entities + migrations | Not started | Phase K | 5 | TBD |
| `Apprentice` profile entity + status enum + link org/provider/employer | Not started | Phase K | 8 | TBD |
| Enrolment **state machine** (draft → … → active) + transition validation | Not started | Phase K | 8 | TBD |
| APIs: employer enrolment POST; GET/PATCH apprentice (scoped) | Not started | Phase K | 8 | TBD |

---

## Phase L — DAS (ESFA)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Config + HTTP client: OAuth2 client credentials for **DAS API** | Not started | Phase L | 8 | TBD |
| Fetch **levy balance** + persist + `lastSyncedAt` | Not started | Phase L | 5 | TBD |
| BullMQ **15-minute** sync job per linked organisation + manual sync endpoint | Not started | Phase L | 5 | TBD |
| Retry/backoff + **dead-letter** queue for DAS failures | Not started | Phase L | 5 | TBD |
| Push: enrolment / withdrawal / completion (+ idempotency keys) | Not started | Phase L | 8 | TBD |
| Forecast endpoint: projected spend from active programmes (for levy dashboard API) | Not started | Phase L | 5 | TBD |

---

## Phase M — OTJ

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `OtjLogEntry` entity + categories + approval status + migration | Not started | Phase M | 5 | TBD |
| CRUD APIs + pagination + filters | Not started | Phase M | 5 | TBD |
| Pace calculation service (hours vs expected) + **nightly** cron job flags | Not started | Phase M | 8 | TBD |
| PATCH approve/reject + bulk approve (cap 20) + notifications hook | Not started | Phase M | 5 | TBD |

---

## Phase N — Reviews

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `Review` entity + schedule fields + overdue logic | Not started | Phase N | 5 | TBD |
| Calendar/list APIs + bulk schedule + reminder jobs (7d/1d) | Not started | Phase N | 8 | TBD |
| Review record payload (SMART, wellbeing, etc.) + co-sign workflow + PDF snapshot | Not started | Phase N | 8 | TBD |

---

## Phase O — Commitments

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `CommitmentStatement` versioning + status machine | Not started | Phase O | 5 | TBD |
| Tripartite sign routing + reuse `ESignatureModule` + signed PDF storage | Not started | Phase O | 8 | TBD |
| Audit events for commitment lifecycle | Not started | Phase O | 3 | TBD |

---

## Phase P — Portfolio (KSB)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| `KsEvidenceItem` + KSB mapping + statuses | Not started | Phase P | 5 | TBD |
| Upload/link/text evidence APIs + Storage integration | Not started | Phase P | 5 | TBD |
| Heatmap aggregation endpoint (cached optional) | Not started | Phase P | 5 | TBD |

---

## Phase Q — ILR

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| ILR **mapping config** layer (versioned YAML/JSON), not hardcoded fields | Not started | Phase Q | 8 | TBD |
| Build ILR row from learner + validation against ruleset | Not started | Phase Q | 8 | TBD |
| Submit to ESFA ILR API + store receipt + amendment path | Not started | Phase Q | 8 | TBD |

---

## Phase R — Ofsted / EIF / QIP

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| EIF score service (7 criteria) + **Redis cache** 1h TTL + invalidate rules | Not started | Phase R | 8 | TBD |
| QIP entities + CRUD + status | Not started | Phase R | 5 | TBD |
| Evidence pack ZIP **async job** + progress endpoint | Not started | Phase R | 8 | TBD |

---

## Phase S — Levy Exchange (FlowPortal backend)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Donor DAS link entities + OAuth consent flow handlers | Not started | Phase S | 8 | TBD |
| Surplus + expiry calculations + scheduled alerts | Not started | Phase S | 5 | TBD |
| Rule-based matching API (sector/region/rules) **v1** | Not started | Phase S | 8 | TBD |
| Transfer compliance doc generation + e-sign + DAS transfer create | Not started | Phase S | 8 | TBD |

---

## Phase T — Messaging & reporting

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Direct message threads (apprentice–tutor / apprentice–manager) + attachments (size limit) | Not started | Phase T | 8 | TBD |
| Reporting: levy ROI PDF data endpoints (reuse `PdfModule`) | Not started | Phase T | 5 | TBD |
| Provider metrics endpoints for employer directory (aggregations, pagination) | Not started | Phase T | 5 | TBD |

---

## Phase U — Compliance & hardening (backend)

| Task | Status | Timeline | SP | Assignee |
|------|--------|----------|-----|----------|
| Security headers review with `helmet` + CSP baseline for API | Not started | Phase U | 3 | TBD |
| Data retention **jobs**: soft-delete/archive policy hooks | Not started | Phase U | 5 | TBD |
| Right-to-erasure workflow: anonymise PII, retain audit metadata | Not started | Phase U | 8 | TBD |
| Load-test checklist endpoints + DB index review pass (OTJ, audit, notifications) | Not started | Phase U | 5 | TBD |

---

## Dependency summary (read order)

```
Phase A (ADR, observability, CI)
  → Phase B (org + roles + JWT + RBAC)
    → Phase C [optional RLS]
    → Phase D (OIDC + password flows)
      → Phase E (invitations)
        → Phase F (BullMQ spine)
          → Phase G (notifications)     ─┐
          → Phase H (storage)           ├→ Phase I (audit) → Phase J (PDF/e-sign)
                                         └→ Phase K (programme/apprentice/enrolment)
                                              → Phase L (DAS)
                                              → Phase M (OTJ)
                                              → Phase N (reviews)
                                              → Phase O (commitments)
                                              → Phase P (portfolio)
                                              → Phase Q (ILR)
                                              → Phase R (EIF/QIP/packs)
                                              → Phase S (levy exchange)
                                              → Phase T (messaging/reporting)
                                                → Phase U (hardening)
```

---

## Notes

- **Swagger**: Decorate new controllers as you go; optional task “Swagger pass per module” can be folded into each phase’s last PR.
- **MVP vs Phase 2**: SMS (Twilio), some FlowPortal automation, SAR auto-gen, etc. can be omitted from first delivery — keep tasks but mark priority in your tracker if you fork this list.
- **CSV**: Import `PROJECT-TASKS.csv` into Sheets / Jira / Linear.
