# ECODrIx Server — Pre-Market-Validation Architecture Review

**Review date:** 2026-09-02  
**Scope:** `/home/dhanesh/ecodrix/ECOD/server`  
**Decision horizon:** private pilot to first repeatable paid use  
**Review type:** static repository and architecture review; no production systems or tenant data inspected

## Executive decision

**Do not redesign this as microservices before validation.** Keep one codebase and one PostgreSQL database, but operate it as two explicit runtimes: a stateless API and a worker. The current modular-monolith boundaries are sufficient; the immediate problem is unsafe exposure and operational ambiguity, not lack of services.

**Do not open the current full platform to pilot customers yet.** A narrow, allowlisted pilot is reasonable after the P0 launch blockers in this document are closed. The strongest validation wedge already present in the code is:

> WhatsApp-first lead capture → shared CRM inbox/pipeline → one follow-up automation → measurable conversion outcome.

LAIE scraping, broad multi-channel delivery, multiple AI providers, relay provisioning, and advanced billing should be disabled unless a named pilot hypothesis requires them. They increase failure and compliance surface without proving the core value proposition.

### Verdict by dimension

| Dimension                 | Status                  | Decision                                                                                |
| ------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| Product boundaries        | Amber                   | Useful modules exist, but the pilot surface is too broad.                               |
| API architecture          | Amber                   | Canonical `/v1/api` exists; legacy and async mounts weaken guarantees.                  |
| Tenant security           | Red                     | Two concrete unauthenticated/trust gaps and no proven route-wide isolation matrix.      |
| Data architecture         | Amber                   | PostgreSQL families are sensible; migration ownership is ambiguous.                     |
| Async processing          | Red                     | API and workers overlap; scale-out can duplicate schedulers and consumers.              |
| Reliability               | Amber/Red               | Good middleware exists, but startup/readiness/error behavior can serve partial failure. |
| Observability             | Amber                   | Logs/metrics exist; end-to-end traces and business validation events are incomplete.    |
| Deployability             | Amber                   | Deploy artifacts exist, but there are competing API/worker/container paths.             |
| Market-validation fitness | Red now; Amber after P0 | Pilot only after security, process-role, migration, and readiness gates pass.           |

## Review method and confidence

The review mapped startup, route composition, source boundaries, persistence configuration, scripts, tests, dependencies, and deployment artifacts. Primary evidence includes `src/server.ts`, `src/routes/index.ts`, `src/versions/v1.ts`, `src/{platform,product,infra,shared}`, `drizzle.config.ts`, `package.json`, migration roots, Docker/GCP artifacts, and the existing `ARCHITECTURE.md`.

This is not a line-by-line security audit, penetration test, database inspection, or cloud configuration audit. Findings labelled **observed** are directly visible in code; items labelled **must verify** require executable tests or runtime evidence. The local `.env` is ignored by `.gitignore`; its values were not read.

## 1. Current system architecture

### 1.1 Architectural style

The server is a **multi-tenant modular monolith** built with TypeScript, Express 5, Socket.IO, PostgreSQL/Drizzle, and ErixStore. It combines synchronous HTTP/WebSocket traffic, scheduled work, queue consumers, scraping/browser work, and provider integrations in one repository—and, by default, one process.

```text
SaaS/Admin/Mobile/Portal/External clients
                 │ HTTPS / Socket.IO
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Express API process (`src/server.ts`)                    │
│ security middleware → routes → services → adapters       │
│                                                          │
│ Platform       Product                 Infrastructure    │
│ auth/org/bill  ERIX CRM · FLOW · LAIE  Connect/Storage   │
│                                                          │
│ Also starts cron, queue consumers, outbox and browsers   │
└───────────┬──────────────────┬──────────────────┬────────┘
            │                  │                  │
       PostgreSQL          ErixStore         External APIs
       shared DB           queue/cache       Meta/Google/
                                              Razorpay/AI/etc.
```

This is a valid pre-validation style. Its flaw is runtime coupling: API scale and worker scale are controlled by the same deployment unless `ENABLE_WORKERS=false` is consistently enforced.

### 1.2 Existing bounded contexts

| Context                | Current location                         | Responsibility                                                                     | Validation disposition                                          |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Platform/control plane | `src/platform`                           | Identity, organizations, membership, plans, credits, billing, onboarding, deletion | Keep minimal subset required for pilot.                         |
| ERIX CRM               | `src/product/erix`                       | Leads, pipeline, inbox, projects, invoices, CRM jobs                               | **Core pilot product.**                                         |
| FLOW                   | `src/product/flow`                       | Event-driven automation graph and workers                                          | Keep one narrow follow-up recipe.                               |
| LAIE                   | `src/product/laie`                       | Actors, scraping, browser/session isolation, enrichment                            | Feature-flag off unless lead sourcing is the tested hypothesis. |
| Connect                | `src/infra/connect`                      | Provider credentials, channels, conversations, webhooks                            | Keep WhatsApp plus one fallback channel at most.                |
| Storage                | `src/infra/storage`                      | R2/object storage and quotas                                                       | Keep only where core journey requires files.                    |
| Store                  | `src/infra/store`, `src/shared/lib/erix` | Queue, cache, locks, pub/sub                                                       | Keep as existing infrastructure dependency.                     |
| Shared                 | `src/shared`                             | Config, DB, middleware, auth gates, utilities                                      | Keep; enforce one canonical primitive per concern.              |
| Public SDK             | `src/sdk`, context SDK folders           | Isomorphic API access                                                              | Keep canonical SDK; avoid direct frontend fetch variants.       |

### 1.3 API and startup flow

1. `src/server.ts` validates environment, creates Express/HTTP/Socket.IO, then installs security and observability middleware.
2. `mountSyncRoutes()` installs externally constrained exceptions, health, and `/v1/api`.
3. The port binds before async modules finish so Cloud Run startup succeeds.
4. `mountAsyncRoutes()` adds async v1 routes, LAIE/gateway exceptions, ErixStore bootstrap, and LAIE initialization.
5. Workers, cron jobs, lifecycle processing, and later the outbox poller start in-process when `ENABLE_WORKERS !== "false"`.
6. `/ready` reports async route state, while `/health-check` remains healthy independently.

The early bind is operationally understandable, but routes returning 404 during startup and partial module failure are not acceptable API semantics. A process may be alive without being safe to receive customer traffic.

## 2. Findings and risks

### 2.1 P0 — close before any external pilot

| ID   | Observed issue                                                                                                                                                                    | Impact                                                                                        | Required decision/remediation                                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | Socket room authorization in `src/server.ts` compares the requested room with a `clientCode` supplied by the same handshake; no signed identity is demonstrated.                  | Cross-tenant realtime data exposure if a code is known or guessed.                            | Authenticate the socket with the same signed principal as HTTP, resolve `orgId` server-side, authorize membership, and join only `org:{orgId}`. Remove client-selected tenant identity and localhost bypass outside development. |
| P0-2 | `POST /api/laie/session/jobs` in `src/routes/index.ts` accepts `{actor,input}` and enqueues it without visible auth, tenant resolution, schema validation, entitlement, or quota. | Unauthenticated resource consumption, SSRF/scraping abuse, data leakage, and cost exhaustion. | Remove the legacy endpoint or wrap the canonical handler with `externalAuth(scope)`, tenant resolution, Zod validation, allowlisted actors, quota, idempotency, and audit logging. Prefer deletion for pilot.                    |
| P0-3 | The API process starts cron, consumers, subscription lifecycle, LAIE workers, and outbox polling by default while standalone worker deployment also exists.                       | Duplicate jobs, duplicate messages/charges, races, and API instability when Cloud Run scales. | Make process role explicit and fail closed: API never starts workers; worker never serves customer routes. Give each recurring schedule one owner or a distributed lease.                                                        |
| P0-4 | Tenant isolation is represented by many middleware variants, but a route-wide negative authorization test is not proven.                                                          | A single unguarded route can expose another organization's data.                              | Inventory every v1/legacy route and prove anonymous, wrong-org, suspended-org, and insufficient-role rejection. Verify DB calls always receive `orgId` through `resolveDataAccess`/ErixAdapter.                                  |

### 2.2 P1 — close before paid pilot or sensitive data

| ID   | Observed issue                                                                                                                | Impact                                                                                    | Minimum correction                                                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-1 | Async mount failure can leave liveness healthy and the global error handler absent or late.                                   | Traffic reaches a partially initialized process; errors may bypass the standard envelope. | Install terminal 404/error handlers deterministically, keep readiness false on any required dependency failure, and let the platform route only to `/ready == 200`. |
| P1-2 | `bootstrapErix()` is fire-and-forget.                                                                                         | Queue/cache failure may be invisible at startup.                                          | Await required infrastructure in the worker; API may degrade only for explicitly optional capabilities. Include dependency state in readiness.                      |
| P1-3 | Migrations exist under `src/shared/db/migrations` and top-level `migrations`; `db:migrate` aliases unsafe `drizzle-kit push`. | Schema drift, non-repeatable deploys, or destructive changes.                             | Choose one append-only SQL ledger and one runner. Remove/rename production-facing push scripts. Apply migration before code and document a down path.               |
| P1-4 | `LAIE_DATABASE_URL ?? DATABASE_URL` controls all schema tooling.                                                              | Operators can target the wrong database unexpectedly.                                     | Use one unambiguous `DATABASE_URL` for the unified DB or require an explicit migration target. Never infer a production target.                                     |
| P1-5 | Plan rate limiting runs before route-level `req.orgId` is resolved and no-ops without it.                                     | Plan-specific limits are not reliably enforced.                                           | Move tenant/identity resolution before tenant-aware rate limiting, while retaining an IP-based anonymous limit at the edge.                                         |
| P1-6 | The repository exposes many provider credentials and webhook surfaces.                                                        | Credential leakage, forgery, replay, and compliance blast radius.                         | Enable only pilot providers; require HMAC/signature verification, replay window, idempotency, scoped encrypted credentials, and secret redaction per provider.      |
| P1-7 | Existing `ARCHITECTURE.md` references old paths and Mongo while runtime states PostgreSQL-only.                               | Incorrect engineering and incident decisions.                                             | Treat this review and generated route/schema inventories as current evidence; update or retire stale architecture claims.                                           |

### 2.3 P2 — reduce after launch blockers

- Remove stale scripts such as targets for absent `src/workers/actor-runner.ts`, old `src/lib/laie`, old `src/erix`, and missing `tunnel.sh` after confirming no operator depends on them.
- Keep build output (`dist`) out of architectural reasoning and prevent committed/generated drift.
- Consolidate Docker, Cloud Build, GitHub Actions, and shell deploy paths into one supported API path and one worker path.
- Remove unused overlapping AI SDKs and browser stacks only after import/usage verification. The dependency list currently carries three Google AI clients and Playwright/Puppeteer/Patchright/Crawlee families.
- Delete legacy route exceptions when external consoles and clients have moved to canonical `/v1/api` URLs.
- Consolidate auth/tenant middleware names around a small, composable route policy rather than adding another guard.

## 3. Target architecture for market validation

### 3.1 Design principles

1. **One deployable codebase, two process roles.** No microservices until scaling, ownership, or isolation evidence demands them.
2. **One canonical public API.** `/v1/api`; legacy paths are time-boxed exceptions with owners and removal dates.
3. **Tenant identity is server-derived.** Never trust `orgId`, `clientCode`, room name, queue tenant, or storage prefix from a caller.
4. **PostgreSQL is the system of record.** ErixStore accelerates and transports work; it does not own durable business truth.
5. **All side effects are idempotent.** Webhooks and business writes commit an outbox record; workers retry safely.
6. **Feature flags reduce surface.** A disabled capability is not mounted, scheduled, or credentialed.
7. **Measure the customer outcome, not endpoint traffic.** Validation events belong in the domain flow.

### 3.2 Target runtime topology

```text
                         ┌──────────────────────┐
                         │ CDN/WAF/Load balancer│
                         │ TLS, coarse IP limit │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ API runtime                    │
                    │ ROLE=api, ENABLE_WORKERS=false │
                    │ Express + Socket.IO            │
                    │ auth → tenant → policy → route │
                    └──────┬───────────────┬─────────┘
                           │               │
                    ┌──────▼──────┐  ┌─────▼─────────┐
                    │ PostgreSQL  │  │ Object storage│
                    │ business DB │  │ tenant prefix │
                    │ + outbox    │  └───────────────┘
                    └──────┬──────┘
                           │ outbox / queue reference
                    ┌──────▼─────────────────────────┐
                    │ ErixStore                      │
                    │ queue · lock · cache · pub/sub │
                    └──────┬─────────────────────────┘
                           │
                    ┌──────▼─────────────────────────┐
                    │ Worker runtime                 │
                    │ ROLE=worker, no public API     │
                    │ consumers · scheduler · outbox │
                    │ provider calls · browser jobs  │
                    └──────┬─────────────────────────┘
                           │
                 Meta / email / payment / AI / scraping
```

For the first pilot, one API instance minimum and one worker instance are enough. Horizontal scale is allowed only after idempotency and scheduler ownership are proven. Do not split each bounded context into a service.

### 3.3 Runtime responsibility matrix

| Responsibility                          |                         API |                             Worker |
| --------------------------------------- | --------------------------: | ---------------------------------: |
| HTTP and OAuth/webhook endpoints        |                         Yes |                                 No |
| Socket.IO authentication and fan-out    |                         Yes |                                 No |
| Request validation/authz/tenant scoping |                         Yes |                                 No |
| Transactional business writes + outbox  |                         Yes |    Optional internal commands only |
| Queue consumption                       |                          No |                                Yes |
| Cron/scheduled jobs                     |                          No |       Yes, with lease/single owner |
| Browser/scraping sessions               |                          No |          Yes, isolated concurrency |
| Provider delivery/retries               |                          No |                                Yes |
| Readiness                               |   DB + required auth/config |    DB + store + required providers |
| Scaling signal                          | request latency/concurrency | queue depth/job age/provider limit |

### 3.4 Canonical bounded-context contracts

- **Platform** owns users, sessions, organizations, memberships, roles, subscriptions, entitlements, credits, and audit records. Other contexts query it through services—not direct table assumptions.
- **ERIX CRM** owns leads, contacts, pipeline state, activities, conversations, projects, and CRM-facing invoices. It accesses tenant data through `ErixAdapter`/`resolveDataAccess` only.
- **FLOW** owns definitions, versions, executions, node state, retries, and idempotency keys. It consumes domain events; it does not mutate another context except through a declared command/service.
- **LAIE** owns actors, runs, collected raw artifacts, enrichment, and export state. Export into CRM is an explicit idempotent command, not shared-table mutation.
- **Connect** owns provider connections, encrypted credentials, channel capabilities, inbound normalization, outbound delivery attempts, and provider webhook receipts. Products call `/infra/connect/send/{channel}` or its internal service equivalent.
- **Storage** owns object metadata, signed URLs, tenant prefixes, quota, retention, and deletion. Product tables store object IDs, not credentials or arbitrary external URLs.

Cross-context communication should use an explicit domain event envelope:

```text
id, type, version, occurredAt, orgId, actorId, correlationId,
idempotencyKey, source, payload
```

The envelope is validated at publish and consume boundaries. Payload versions are immutable; add a new version instead of changing historical meaning.

## 4. Critical flows

### 4.1 Authenticated HTTP request

```text
TLS edge
  → request ID / IP rate limit
  → session or scoped API-key verification
  → server-side organization resolution
  → membership/role + entitlement policy
  → schema validation
  → tenant-aware rate/quota limit
  → service
  → ErixAdapter / parameterized DB transaction
  → audit + outbox
  → stable response envelope
```

Required invariant: no service or adapter receives a tenant identifier copied directly from request body, query, path, or header. A resource loaded by ID must also be constrained by resolved `orgId`; post-load ownership checks alone are insufficient.

### 4.2 Realtime connection

```text
Socket handshake with signed session/token
  → resolve user/service principal
  → resolve active organization membership
  → socket.data = { principalId, orgId, roles }
  → server joins `org:{orgId}`
  → event-specific authorization
  → redact payload by role
```

The client may request a topic inside its organization, but never choose an organization room. Re-authenticate or disconnect on session revocation, organization switch, or membership removal.

### 4.3 Inbound provider webhook

```text
raw request bytes
  → provider signature + timestamp/replay validation
  → persist webhook receipt with provider event ID
  → return provider-required 2xx quickly
  → enqueue normalized processing
  → resolve provider connection to orgId server-side
  → apply idempotent domain command
  → outbox/realtime notification
```

Unknown connections, stale signatures, duplicate event IDs, and oversized payloads are rejected or quarantined—not silently assigned to a default tenant.

### 4.4 Outbound message/automation

```text
domain event
  → transactional outbox
  → dispatcher publishes command
  → worker checks org entitlement/quota and idempotency
  → Connect selects scoped credential/provider
  → provider call with timeout/circuit breaker
  → delivery attempt persisted
  → retry with bounded exponential backoff
  → terminal failure/dead letter + operator alert
```

Exactly-once delivery is not assumed. The system implements at-least-once processing with idempotent effects and provider message/event keys.

### 4.5 Tenant deletion/export

Deletion and export are workflows, not ad hoc scripts. Freeze writes, inventory all context-owned records and objects, export if requested, delete/revoke credentials and storage, tombstone/audit completion, and make retries idempotent. Legal/financial retention exceptions must be explicit.

## 5. Security and tenancy design

### 5.1 Principal types

| Principal          | Authentication                                  | Authorization basis                                              |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| SaaS user          | Secure session/JWT with rotation                | Active membership, role, entitlement                             |
| External developer | Hashed/scoped API key via `externalAuth(scope)` | Organization, scopes, quota                                      |
| Provider webhook   | Provider signature over raw body                | Connection resolved server-side to organization                  |
| Internal worker    | Workload identity or scoped internal credential | Queue/command scope; tenant carried in signed/validated envelope |
| Platform admin     | Separate strong authentication                  | Explicit admin role, reason, immutable audit                     |

### 5.2 Mandatory controls

- Centralize route policy as `authenticate → resolve tenant → authorize role/scope → validate`; do not create another auth mechanism.
- Reject tenant mismatch at every data boundary, including queue payloads, object keys, caches, Socket.IO rooms, and exports.
- Cache keys and distributed locks include `orgId`; global keys are reserved and documented.
- Credentials are encrypted at rest with key versioning, masked in all reads, never logged, and scoped to the provider connection.
- Admin impersonation, secret reveal/rotation, billing mutation, export, and deletion create immutable audit events.
- Apply strict SSRF policy to webhooks, imports, scraping targets, and user-supplied URLs: protocol allowlist, DNS/IP checks, redirect re-validation, egress limits, size/time caps.
- Keep CSRF protection for cookie-authenticated state changes; CORS is not authorization.
- Define retention for raw webhook bodies, scrape artifacts, messages, recordings, and generated AI content.
- Run dependency and image vulnerability scanning in CI, but do not substitute it for tenant isolation tests.

### 5.3 Data isolation level

For validation, shared-schema multi-tenancy is acceptable if every tenant-owned table has a non-null `org_id`, relevant unique/index constraints begin with `org_id`, adapters require tenant context, and automated wrong-tenant tests exist. PostgreSQL RLS is a useful defense-in-depth option, not a replacement for app authorization; adopt it only with a consistent connection/session strategy.

## 6. Data and migration architecture

### 6.1 System-of-record rules

- PostgreSQL owns durable identity, billing, CRM, automation, integration metadata, job state, audit, and outbox state.
- ErixStore owns transient queue/cache/lock/pub-sub state. Rebuilding it must not lose committed business truth.
- Object storage owns blobs; PostgreSQL owns metadata, tenant ownership, checksum, lifecycle, and retention.
- Provider APIs own external delivery truth; local attempt records reconcile that truth by provider IDs.

### 6.2 Migration policy

1. Use only `src/shared/db/migrations` (or choose the top-level directory, but not both); record the decision in an ADR.
2. Generate reviewable SQL, assign a monotonic immutable ID, and store checksum/applied timestamp.
3. Test forward migration on a production-like snapshot with secrets/data protected.
4. Prefer expand → backfill → switch reads/writes → contract. Never deploy code that requires a column before the migration is applied.
5. Make safe additions idempotent where operational reruns are expected; document rollback or roll-forward for every release.
6. Back up and verify restoration before destructive changes.
7. Prohibit `drizzle-kit push` against shared/staging/production databases.

### 6.3 Minimum constraints to verify

- Tenant-owned rows have non-null organization foreign keys and tenant-prefixed uniqueness.
- Provider event IDs, outbox idempotency keys, API idempotency keys, and payment references are uniquely constrained in the correct tenant/provider scope.
- Deletes use explicit cascade/restrict behavior; sensitive records use retention-aware deletion rather than accidental orphaning.
- Money uses integer minor units plus currency, never floating point.
- Timestamps are UTC and state transitions preserve an audit trail.

## 7. Reliability, observability, and operations

### 7.1 Health model

- **Liveness:** process event loop responds; no dependency calls.
- **Readiness (API):** configuration valid, DB reachable, required routes mounted, auth keys available. Optional modules are reflected as disabled, not half-mounted.
- **Readiness (worker):** DB and ErixStore reachable, consumers registered, scheduler lease state known, required provider configuration valid.
- **Deep/operator health:** provider/store/storage diagnostics behind admin authentication; never expose secrets or tenant data publicly.

A required initialization failure keeps readiness at 503 and should terminate the process when recovery requires a clean restart. Health success must not mask missing business routes.

### 7.2 Initial SLOs for a small paid pilot

| Signal                  | Pilot target                                                                     |
| ----------------------- | -------------------------------------------------------------------------------- |
| API availability        | 99.5% monthly, excluding announced maintenance                                   |
| API latency             | p95 < 750 ms for non-AI/non-scraping requests                                    |
| Webhook acknowledgement | p95 < 2 s                                                                        |
| Queue start delay       | p95 < 60 s for normal priority                                                   |
| Message processing      | ≥99% reaches provider accepted/terminal status within 5 min                      |
| Cross-tenant incidents  | 0; any confirmed event stops the pilot                                           |
| Backup recovery         | Daily backup; restore drill before paid pilot; define measured RPO/RTO afterward |

These are launch targets, not promises to publish before measurement.

### 7.3 Required telemetry

Every log/trace/metric should carry safe `requestId` or `correlationId`, route template, process role, release version, and—where permitted—a non-secret organization identifier. Never put tokens, message bodies, provider secrets, raw personal data, or full webhook payloads in logs.

Measure:

- API RED metrics: request rate, errors, duration by route template.
- Worker metrics: queue depth, oldest-job age, attempts, terminal failures, dead letters.
- Dependency metrics: DB pool saturation, ErixStore failures, provider latency/rate limits, browser concurrency.
- Business metrics: activation funnel and successful customer outcomes defined below.
- Security metrics: auth failures, signature failures, replay blocks, cross-tenant denial tests, admin actions.

Initialize the installed OpenTelemetry stack before instrumented imports or remove it until used; installed-but-inactive telemetry gives false confidence.

## 8. Product design for market validation

### 8.1 Hypothesis to test

**Target customer hypothesis:** an Indian SMB team that sells through WhatsApp but loses leads and follow-ups because conversations and ownership are fragmented.

**Value hypothesis:** if the team can capture WhatsApp leads into one lightweight pipeline and automate one approved follow-up, it will respond faster and convert or recover more opportunities with less manual coordination.

This hypothesis must be confirmed by customer discovery; it is not proven by the repository.

### 8.2 Pilot product boundary

**Include:**

- Organization creation and 1–5 invited members.
- Secure WhatsApp provider connection.
- Inbound conversation → contact/lead creation.
- Shared inbox with assignment and status.
- One configurable pipeline.
- One approved follow-up automation with pause/stop controls.
- Basic search, activity history, opt-out/consent handling, and CSV export.
- Operator-visible delivery failures and audit trail.
- Manual billing or one payment provider only if payment itself is under test.

**Disable by default:**

- LAIE web scraping and automated enrichment.
- Instagram, Facebook, Telegram, multiple email providers, calendar/meeting automation.
- Arbitrary flow graphs, arbitrary outbound webhooks, relay auto-provisioning.
- Multiple AI model providers and autonomous customer-facing responses.
- Advanced projects, invoice automation, add-on marketplace, usage credit complexity.

A feature is enabled only when it maps to a written hypothesis, named pilot, owner, success metric, and rollback switch.

### 8.3 Validation funnel and events

| Funnel step       | Domain event                                    | Success measure                                    |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| Workspace created | `workspace.created.v1`                          | Qualified pilot enters onboarding.                 |
| Team ready        | `membership.activated.v1`                       | At least two active users where team use matters.  |
| Channel connected | `connection.verified.v1`                        | WhatsApp can receive/send a controlled test.       |
| First value       | `conversation.received.v1` + lead linked        | Real lead is visible and actionable.               |
| Workflow adopted  | `lead.assigned.v1`, `pipeline.stage_changed.v1` | Team uses ownership/pipeline repeatedly.           |
| Automation value  | `automation.effect_completed.v1`                | Follow-up sent safely and associated with outcome. |
| Outcome           | `lead.won.v1` or customer-defined conversion    | Product influences a measurable business result.   |
| Retention         | weekly active workspace                         | Team returns without operator prompting.           |

Use first-party product events in PostgreSQL or the existing event infrastructure. Do not add an analytics vendor before the minimum funnel can be queried reliably.

### 8.4 Pilot success and stop criteria

Suggested validation cohort: 5–10 design partners for 4–6 weeks. Final thresholds are a product decision, but define them before onboarding. A reasonable starting scorecard is:

- At least 70% connect the channel and process a real lead without engineering intervention.
- Median time to first real conversation/lead under one business day after credentials are available.
- At least 60% of activated workspaces use inbox/pipeline in three separate weeks.
- At least 3 customers attribute a recovered follow-up, faster response, or conversion to the workflow.
- At least 3 customers are willing to pay or sign a paid continuation at the tested price.
- No cross-tenant exposure, unauthorized send, unrecoverable data loss, or consent breach.

Stop or narrow the pilot if severe security/privacy failure occurs, provider policy blocks the workflow, onboarding remains services-heavy after two iterations, or usage centers on a different job than the stated hypothesis.

## 9. Delivery plan

### Phase 0 — freeze and prove the boundary (1–3 days)

- Declare the pilot journey and disable unrelated feature flags/integrations.
- Produce a generated route inventory: method, path, handler, auth, tenant resolver, role/scope, validation schema, rate/quota, and owner.
- Remove or block `/api/laie/session/jobs`.
- Disable unauthenticated Socket.IO room joining.
- Confirm `.env` remains untracked; rotate any secret with a history of being committed or shared.

**Exit:** no unexplained public route and no caller-controlled tenant identity.

### Phase 1 — separate runtime roles (2–5 days)

- Add one explicit `PROCESS_ROLE=api|worker` switch; reject invalid combinations at startup.
- API mounts routes and Socket.IO only. Worker registers queues, cron, outbox, LAIE/browser, and provider processors only.
- Give schedules a distributed lease or single-instance deployment guarantee.
- Await mandatory initialization and make readiness authoritative.
- Install global not-found/error handling regardless of async module outcome.

**Exit:** scaling API replicas cannot duplicate background effects.

### Phase 2 — tenant/security proof (3–7 days)

- Replace socket client-code trust with signed principal/membership authorization.
- Build the cross-tenant negative test matrix across v1, retained legacy routes, queues, caches, storage, and realtime events.
- Validate webhook signatures/replay/idempotency and resolve tenant only from connection records.
- Verify ErixAdapter/`resolveDataAccess` usage and eliminate raw route-level data access.
- Add an operator audit trail for sensitive actions.

**Exit:** automated evidence proves wrong-tenant requests cannot read, mutate, enqueue, subscribe, or export.

### Phase 3 — deterministic data and deploy (2–5 days)

- Select one migration ledger/runner and remove `db:migrate → drizzle push` ambiguity.
- Run schema constraint and drift checks against a disposable production-like database.
- Select one API image/deploy path and one worker image/deploy path.
- Verify backup and restore; document rollback/roll-forward.
- Remove stale scripts only after operator confirmation.

**Exit:** a clean environment can be built, migrated, deployed, rolled back, and restored from documented commands.

### Phase 4 — instrumented private pilot (ongoing)

- Emit the minimum funnel events and create one operator dashboard.
- Onboard design partners by allowlist; keep risky features off.
- Review failures and customer outcomes weekly.
- Expand only when the core workflow is reliable and repeatedly valuable.

**Exit:** evidence supports invest, pivot, or stop—not merely “the software ran.”

## 10. Required verification before launch

### Automated gates

- Typecheck and production build pass from a clean checkout.
- Relevant unit/integration suites pass; no watch mode.
- Route inventory has zero unclassified routes.
- Anonymous/wrong-tenant/wrong-role tests pass for every protected route.
- Socket tests prove a token cannot join another organization.
- Duplicate webhook and queue-delivery tests prove one business effect.
- Migration applies to an empty DB and a representative prior version; schema drift check passes.
- API process starts no workers; worker process exposes no customer API.
- Readiness remains 503 when a mandatory DB/store dependency is unavailable.
- Secret scan, dependency scan, and container scan pass at the agreed severity threshold.

### Manual/operational gates

- Controlled WhatsApp inbound/outbound journey succeeds end to end.
- Opt-out suppresses future automation.
- Provider outage produces bounded retries, visible failure, and no duplicate send.
- Backup restoration is timed and verified.
- Tenant export and deletion complete across DB, store, credentials, and object storage.
- Incident owner, support channel, kill switches, and provider escalation contacts are documented.
- Privacy notice, terms, consent model, retention policy, and data-processing responsibilities are reviewed by the appropriate human/legal owner.

### Go/no-go rule

Go only when every P0 is closed, the automated tenant matrix passes, restore is demonstrated, and the pilot can be disabled per organization without deployment. Any known cross-tenant, unsigned webhook, unauthorized send, or duplicate-charge path is an automatic no-go.

## 11. Architecture decisions to record

Create short ADRs only for decisions that outlive the pilot:

1. **ADR-001:** modular monolith with separate API and worker runtimes.
2. **ADR-002:** PostgreSQL as durable system of record; ErixStore as transient infrastructure.
3. **ADR-003:** canonical `/v1/api` and legacy exception retirement dates.
4. **ADR-004:** organization-scoped authorization and socket room derivation.
5. **ADR-005:** single SQL migration ledger and deployment ordering.
6. **ADR-006:** outbox plus at-least-once/idempotent side-effect model.
7. **ADR-007:** pilot feature/provider allowlist.

Do not create ADRs for reversible implementation details.

## 12. Ponytail delete/consolidate list

Before adding architecture, remove ambiguity:

- Delete or secure the legacy LAIE enqueue route; deletion is preferred for pilot.
- Delete client-selected Socket.IO tenant rooms.
- Delete worker startup from API role and HTTP startup from worker role.
- Delete `db:migrate` as an alias for `drizzle-kit push` in shared environments.
- Choose one migration directory and one supported deployment path per runtime.
- Retire stale path references in `ARCHITECTURE.md` rather than maintaining two contradictory current-state documents.
- Delete unused provider/browser/AI dependencies only after import and runtime verification.
- Do not add a service mesh, Kubernetes, event-stream platform, second database, new queue, or new auth framework for validation.

## 13. Open human decisions

The repository cannot decide these:

- Which exact customer segment and workflow is the first paid hypothesis?
- Is lead sourcing (LAIE) part of the hypothesis, or only CRM follow-up?
- Which WhatsApp onboarding model/provider and consent obligations apply?
- What data classes, regions, retention periods, and deletion exceptions are permitted?
- What pilot price and willingness-to-pay threshold constitute validation?
- Which optional module failures may degrade safely versus block readiness?
- Who owns production migrations, incident response, credential rotation, and pilot kill switches?

## Final recommendation

Ship a **smaller surface on the existing architecture**. The codebase already has enough product and infrastructure; adding more architecture would reduce validation speed. Close the two exposed trust gaps, prove tenant isolation, split API from worker behavior, make startup/migrations deterministic, and pilot only the WhatsApp-to-CRM-to-follow-up journey. Expand modules only in response to measured customer pull.
