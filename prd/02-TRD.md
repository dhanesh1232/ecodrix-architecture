# 02 — Technical Requirements Document

> Stack matrix, service topology, queues, observability, security, and deployment.
> Pair with `00-ARCHITECTURE-BRIEF.md` (overview), `IMPLEMENTATION_DETAILS.md` (code patterns),
> and `05-SCHEMA.md` (tables).

## 1. Stack Matrix (current)

### Frontend

| Layer            | Choice                     | Notes                                     |
| ---------------- | -------------------------- | ----------------------------------------- |
| Framework        | Next.js 15 (App Router)    | `ECOD/saas`, `ECOD/admin`                 |
| Styling          | TailwindCSS 4 + shadcn/ui  | Dark navy tokens (see `03-UIUX-BRIEF.md`) |
| Server state     | TanStack Query v5          | All data through `@ecodrix/erix-api`      |
| Client state     | Zustand                    | Lightweight per-product state             |
| Forms            | React Hook Form + Zod      | Strict, no uncontrolled inputs            |
| Tables           | TanStack Table v8          | Virtual scroll, sortable, column-resize   |
| DnD              | @dnd-kit/core              | Pipeline kanban                           |
| Visual workflows | @xyflow/react v12          | React Flow successor                      |
| PDFs             | @react-pdf/renderer        | Invoice generation client-side            |
| Real-time        | Socket.io client (via SDK) | Surface as `ecod.on(event, fn)`           |
| Charts           | Recharts                   | Score radials, pipeline metrics           |
| Icons            | Lucide                     | Tree-shakeable                            |
| Notifications    | Sonner                     | Toasts                                    |
| Auth             | NextAuth.js v5             | Credentials + Google                      |

### Backend

| Layer                          | Choice                                              | Notes                                                  |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------ |
| Runtime                        | Node 20 + TypeScript strict                         | Biome lint, tsx for dev                                |
| Framework                      | Express 5 + Hono                                    | Express for compat, Hono for new perf-sensitive routes |
| ORM                            | Drizzle ORM                                         | Three schema families, single config                   |
| Validation                     | Zod                                                 | Shared types between server + SDK                      |
| Cache / queue / pubsub / locks | ErixStore (port 6399)                               | `@ecodrix/erix-client`, `@ecodrix/erix-worker`         |
| Real-time                      | Socket.io + ErixStore Pub/Sub                       | Inbox, automation progress, entitlement updates        |
| AI (inbox / workflows)         | `@google/genai` (Vertex AI mode) — Gemini 2.0 Flash | Auth via Google ADC                                    |
| AI (LAIE outreach kits)        | `@anthropic-ai/vertex-sdk` — Claude Sonnet 4.5      | Auth via Google ADC                                    |
| Embeddings (semantic cache)    | Google text-embedding-004 (Vertex)                  | Used inside ErixStore                                  |
| Email                          | `@aws-sdk/client-sesv2`                             | India SES region                                       |
| Storage                        | `@aws-sdk/client-s3` against R2                     | Cloudflare bucket                                      |
| Payments                       | `razorpay`                                          | Subscriptions + payment links + webhooks               |
| Scraping                       | Playwright + Crawlee + Cheerio                      | LAIE actors                                            |
| Testing                        | Vitest                                              | Server + erix-store + SDKs                             |
| Lint / format                  | Biome                                               | One tool                                               |

### Data

- **PostgreSQL** (Supabase) — single instance, three table families (`ecodrix_*` / `erix_*` / `laie_*`), single Drizzle config.
- **MongoDB** (legacy + freelance tenant DBs) — only behind `MongoAdapter`. Provisioned per-tenant for `data_mode="own"`.
- **ErixStore** — port 6399. Persists WAL + snapshots + usage to Postgres (`store_*` tables).
- **Cloudflare R2** — cloud storage service backing `ecodrix_cloud_storage`.

## 2. Service Topology

```
                 Render                Render                 Render
            ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
            │  ECOD/server   │    │  workers       │    │  ErixStore      │
            │  (API + WS)    │    │  (job pool)    │    │  port 6399      │
            └────────┬───────┘    └────────┬───────┘    └────────┬───────┘
                     │                     │                     │
                     ▼                     ▼                     ▼
                          ┌──────────────────────────────┐
                          │   Supabase PostgreSQL         │
                          │   ecodrix_* erix_* laie_*     │
                          │   store_* (WAL + snapshots)   │
                          └──────────────────────────────┘
```

Frontends (`ECOD/saas`, `ECOD/admin`) deploy to **Vercel**. Workers and the API process can split as
load grows; today they share `ECOD/server` with workers spawned from `src/workers/*`.

External vendors: Meta Cloud API · Vertex AI · AWS SES · Cloudflare R2 · Razorpay · Google Places ·
optionally Mongo Atlas Admin API for freelance provisioning.

## 3. Queues & Workers

All via ErixStore Job Queue v2 (no BullMQ).

| Queue                    | Worker                                             | Default attempts | Notes                                                             |
| ------------------------ | -------------------------------------------------- | ---------------: | ----------------------------------------------------------------- |
| `whatsapp-send`          | `workers/whatsapp.worker.ts`                       |                3 | Per-tenant fairness via tenant id partition                       |
| `whatsapp-broadcast`     | `workers/broadcast.worker.ts`                      |                5 | Bulk sends, distributed lock per `broadcast:{id}`                 |
| `webhook-delivery`       | `workers/webhook.worker.ts`                        |                5 | HMAC-signed                                                       |
| `laie-actor-run`         | `workers/actor-runtime.worker.ts`                  |                3 | Long-running; uses heartbeat                                      |
| `laie-outreach-kit`      | `workers/outreach-kit.worker.ts`                   |                3 | Calls Claude on Vertex                                            |
| `ai-respond`             | `workers/ai.worker.ts`                             |                2 | Calls Gemini, writes to inbox                                     |
| `invoice-generate`       | `workers/invoice.worker.ts`                        |                3 | PDF + Razorpay link                                               |
| `workflow-execute`       | `workers/workflow.worker.ts`                       |                3 | Walks `erix_workflows` graph                                      |
| `erix-sync`              | `workers/sync.worker.ts` (planned)                 |                5 | Mirrors platform → tenant DB for `data_mode="both"`               |
| `email-send`             | `workers/email.worker.ts`                          |                3 | SES                                                               |
| `subscription-lifecycle` | cron in `workers/subscription-lifecycle.worker.ts` |              n/a | Daily; applies queued downgrades, processes `cancel_effective_at` |

## 4. Auth

| Surface                  | Mechanism             | Headers                                                                      |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------- |
| `ECOD/saas` user session | NextAuth v5 (JWT)     | Cookie-based                                                                 |
| SDK → server             | API key + client code | `x-api-key` (or `x-erix-api-key`), `x-client-code` (or `x-erix-client-code`) |
| `ECOD/admin` operator    | Core API key          | `x-core-api-key`                                                             |
| Workers → ErixStore      | Static API key        | `Authorization: Bearer ${ERIX_STORE_API_KEY}`                                |

`tenantResolver` middleware (rolling out per `platform-completion-end-to-end/`) is the single
canonical resolver for both NextAuth sessions and SDK headers, attaching `req.org`.

## 5. Entitlement Enforcement

See `IMPLEMENTATION_DETAILS.md` § 3 for code.

- `createQuotaMiddleware({ service, feature })` — atomic upsert on `ecodrix_usage`. Returns 429 when remaining < requested.
- `requireFeature(path)` — checks the merged `plan.features + addOns` tree. Returns 402 with `upgradeUrl`.
- `entitlementService.getEntitlements(orgId)` — cached 30s in memory. Emits `entitlements:updated` over Socket.io when invalidated.

Routes that **must** be gated:

| Route                           | Gate                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| `POST /api/whatsapp/send`       | quota `erix.whatsappMessages`                                    |
| `POST /api/whatsapp/broadcasts` | feature `erix.broadcasts`                                        |
| `POST /api/ai/respond`          | quota `editor.aiCalls` (or `ai.callsPerMonth`)                   |
| `POST /api/invoices/:id/pdf`    | quota `editor.pdfExport`                                         |
| `POST /api/workflows/run`       | quota `workflows.runsPerMonth`                                   |
| `POST /api/laie/audit`          | quota `laie.auditsPerMonth`                                      |
| `POST /api/cloud/upload`        | storage quota in `bandwidthTracking` + `storageQuota` middleware |
| `PATCH /api/org/branding`       | feature `platform.customBranding`                                |
| `PATCH /api/org/white-label`    | feature `platform.whiteLabel`                                    |

## 6. Observability

| Concern            | Mechanism                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Structured logging | Pino + custom `lib/logger.ts`; per-org request id                                                      |
| Metrics            | ErixStore exposes counters; aggregated via `infraMetricsService`                                       |
| Tracing            | OpenTelemetry-compatible spans (in flight)                                                             |
| Audit              | `ecodrix_audit_logs` for org-level events (plan change, mode change, key regenerate, member invite, …) |
| Alerts             | ErixStore anomaly detector publishes to `erix-alerts` Pub/Sub channel                                  |
| Health             | `GET /api/health` (server), `GET /healthz` (ErixStore)                                                 |
| Adapter telemetry  | Each ErixAdapter call logs `{ orgId, adapter, method, durationMs }` (planned)                          |

## 7. Security

- **Encryption at rest** — AES-256-CBC for stored secrets (external DB URIs, third-party tokens). Helper at `lib/crypto.ts`.
- **TLS** — 1.3 everywhere; reject downgraded.
- **API keys** — stored as `bcrypt(rawKey)` plus a prefix (e.g., `ecod_live_sk_…`) for UI display.
- **CORS** — per-org allowed origins list, enforced after `tenantResolver`.
- **Idempotency** — `Idempotency-Key` header on POST/PATCH; SDK supports.
- **Rate limit** — sliding window via ErixStore; defaults 100 req/min per org for public routes.
- **Webhook verification** — HMAC-SHA256 with per-org `webhook.secret`.
- **Secret handling** — no secret values ever in API responses; show only `keyPrefix` and a sanitized form (host + db name).
- **2FA** — TOTP planned for `/settings/security` (`platform-completion-end-to-end/`).

## 8. Multi-Source Data

Refer to `01-PRD.md` § 7.2 and `IMPLEMENTATION_DETAILS.md` § 2.

| Mode                 | Adapter                             | Where                                                  |
| -------------------- | ----------------------------------- | ------------------------------------------------------ |
| `platform`           | `PostgresAdapter` (default pool)    | Shared Supabase, `org_id` filter                       |
| `own` + `mongodb`    | `MongoAdapter`                      | Tenant's isolated Mongo (provisioned by us or BYO URI) |
| `own` + `postgresql` | `PostgresAdapter` (per-tenant pool) | Tenant's PG, our schema                                |
| `both`               | `DualAdapter`                       | Postgres primary + queued sync to tenant store         |

Connection pools: `PostgresTenantConnectionManager` lazily opens per-tenant Drizzle pools and closes
them after 15 minutes idle.

## 9. AI Cost Controls

| Lever                   | How                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Model tiering           | Gemini 2.0 Flash default; Claude Sonnet 4.5 only for outreach kits and complex generation                |
| Semantic cache          | ErixStore semantic service caches similar prompts at 0.92 cosine similarity (`SEMANTIC_CACHE_THRESHOLD`) |
| Per-org budget          | `editor.aiCalls` quota enforced at request layer; over → 429 with upgrade prompt                         |
| Confidence thresholding | Auto-reply only if > org's `aiConfidenceThreshold` (default 0.85); else queued for human review          |
| Token capping           | `GEMINI_MAX_OUTPUT_TOKENS = 300` for inbox; tuned per-use elsewhere                                      |

## 10. Deployment

| Component         | Host                                    | Build                                       |
| ----------------- | --------------------------------------- | ------------------------------------------- |
| `ECOD/saas`       | Vercel                                  | `pnpm build` (Next.js)                      |
| `ECOD/admin`      | Vercel                                  | `pnpm build`                                |
| `ECOD/server`     | Render                                  | Docker; `pnpm build && node dist/server.js` |
| Workers           | Render (separate service or same image) | Same as server, entry `dist/workers/*`      |
| `ECOD/erix-store` | Render                                  | Docker; `pnpm build && node dist/index.js`  |
| Postgres          | Supabase                                | Pro plan; PgBouncer on                      |
| R2 bucket         | Cloudflare                              | One bucket per env                          |

CI: `.github/workflows/laie-ci.yml` runs lint + tests + typecheck on PRs. Deploys are gated on `main`
green.

## 11. Cost Model (illustrative)

At 500 paying direct orgs (avg `growth` plan), monthly spend lands roughly at:

| Item                                  | Rough ₹/mo |
| ------------------------------------- | ---------: |
| Supabase Pro                          |      2,000 |
| Render (server + workers + ErixStore) |      5,000 |
| Vercel (frontends)                    |      1,500 |
| Vertex AI (Gemini + Claude)           |      8,000 |
| AWS SES + R2                          |      2,000 |
| Razorpay fees (passthrough)           |        n/a |
| Total infra                           |   ≈ 18,500 |

Compared with revenue at 500 × ~₹6,000/mo (average) = ₹30L/mo, infra is ~6% of revenue. Healthy.
Numbers are estimates; revisit quarterly.

## 12. Risks & Mitigations

| Risk                                  | Mitigation                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Adapter API drift across services     | Keep `ErixAdapter` narrow; add methods only when a route needs them                      |
| Mongo Atlas provisioning rate-limited | Queue provisioning; fall back to manual URI input                                        |
| `data_mode="both"` divergence         | Postgres is canonical; emit divergence alerts; "rebuild from platform" button            |
| Vertex AI quota exhaustion            | Tier on quotas, fall back to Haiku-equivalent; semantic cache                            |
| ErixStore single instance failure     | WAL + snapshots → replay on boot; workers idempotent                                     |
| Service migration blast radius        | Per-service feature flags (`adapter_flags` jsonb on org); roll out one service at a time |

## 13. Assumptions

- Single-region (ap-south-1) is acceptable through Year 1.
- Supabase Pro handles 500 concurrent connections (PgBouncer transaction pooling).
- Drizzle perf is comparable to raw SQL for our query shapes.
- Vertex AI ADC works across Render workers (same project).
- A single ErixStore instance handles ≥10k ops/sec; we revisit when sustained > 70% utilization.

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/platform-pricing-entitlements/`, `saas/.kiro/specs/visual-automation-builder/`.
