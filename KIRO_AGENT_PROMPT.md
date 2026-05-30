# ECODrIx Platform — Master Architecture Brief for AI Agents

> Paste this file (or its key sections) as system context whenever you ask Kiro / Claude / Cursor
> to build, refactor, or plan a feature on ECODrIx. It's the canonical mental model.
>
> Implementation details (Drizzle schemas, env vars, code patterns) live in
> `ECOD/.Architecture/IMPLEMENTATION_DETAILS.md`. Module-level status lives in `modules.md`.

---

## 1. What ECODrIx Is

ECODrIx is an **AI-native business operating system for Indian SMBs**. The platform combines:

- WhatsApp-first CRM (`erix_*` tables)
- Lead intelligence engine (`laie_*` actors + tables)
- Invoice + Razorpay flow inside the deal pipeline
- Visual workflow automation (React Flow + Postgres execution engine)
- Per-org AI agent (Gemini 2.0 Flash on Vertex AI)
- Embeddable React + TS SDKs (`@ecodrix/erix-react`, `@ecodrix/erix-api`)

Two go-to-market channels live on top of one backend:

| Channel     | Path         | UI                      | Default `data_mode`                   | Who operates |
| ----------- | ------------ | ----------------------- | ------------------------------------- | ------------ |
| `freelance` | `ECOD/admin` | Managed by Ecodrix team | `own` (isolated Mongo per client)     | Internal ops |
| `direct`    | `ECOD/saas`  | Self-serve console      | `platform` (shared Supabase Postgres) | Customer     |

Both produce identical `ecodrix_organizations` rows except for `acquisition_channel` and `data_mode`.

---

## 2. Vision Trajectory

```
Year 1 (now)   WhatsApp CRM + AI auto-respond + invoicing — beat Wati / Interakt on price + AI.
Year 2         AI sales agent that operates 80% of conversations end-to-end.
Year 3         Full customer-ops platform — replace Zoho/Freshworks for the SMB segment.
Year 5         Operating system for Indian SMBs — partners build on us (plugin API, marketplace).
```

The five AI tiers we ladder through:

| Tier         | What the AI does                                                   | Status                                                  |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Operates** | Auto-respond, qualify, move pipeline, generate invoices            | 🟡 Partial — Gemini auto-respond live, invoicing manual |
| **Learns**   | Adapts timing, retires bad templates, refines scoring per industry | ⬜ Planned                                              |
| **Creates**  | Writes templates, email sequences, workflows, reports              | 🟡 Outreach kit generation lives (Claude)               |
| **Predicts** | Revenue forecasts, at-risk deals, optimal timing                   | ⬜ Planned                                              |
| **Coaches**  | Post-conversation feedback, weekly performance reports             | ⬜ Planned                                              |

---

## 3. System Topology

```
┌────────────────┐  ┌────────────────┐  ┌──────────────────────────────┐
│  ECOD/saas     │  │  ECOD/admin    │  │  Client website              │
│  Direct        │  │  Freelance     │  │  (embeds @ecodrix/erix-react)│
└──────┬─────────┘  └───────┬────────┘  └───────────┬──────────────────┘
       │                    │                       │
       └─────────┬──────────┴────────────┬──────────┘
                 │                       │
                 ▼                       ▼
       ┌──────────────────────────────────────────┐
       │  @ecodrix/erix-api (TS SDK, browser+node)│
       └────────────────────┬─────────────────────┘
                            │ HTTP + Socket.io
                            ▼
       ┌──────────────────────────────────────────┐
       │  ECOD/server (Express 5 + Hono)          │
       │                                          │
       │  tenantResolver  →  entitlements gate    │
       │       │                  │               │
       │       ▼                  ▼               │
       │  getErixAdapter(orgId)  service layer    │
       └─────────┬─────────────────────┬──────────┘
                 │                     │
       ┌─────────▼──────┐   ┌──────────▼──────────┐   ┌────────────────┐
       │ Supabase PG    │   │ Tenant Mongo / PG   │   │ ErixStore 6399 │
       │ ecodrix_*      │   │ (data_mode=own/both)│   │ Cache Queue    │
       │ erix_*  laie_* │   │                     │   │ Locks Pub/Sub  │
       └────────────────┘   └─────────────────────┘   └────────────────┘
```

External vendors: Meta Cloud API (WhatsApp), AWS SES (email), Cloudflare R2 (storage),
Razorpay (payments), Google Vertex AI (Gemini + Claude), Google Places (LAIE).

---

## 4. The Six Moats

1. **ErixStore** — owned cache/queue/locks/pub-sub, persists to Postgres. No Redis or BullMQ bills.
2. **Embeddable SDK** — `@ecodrix/erix-react` lets agencies embed our CRM in their clients' sites.
3. **LAIE intelligence** — research actors + Gemini synthesis create proprietary lead data over time.
4. **WhatsApp + CRM + Invoice in one flow** — competitors are point tools; we're the chain.
5. **Visual automation builder** — high switching cost once a tenant builds workflows on us.
6. **Freelance channel as training data** — managed clients across verticals make our AI smarter than horizontal SaaS.

---

## 5. Codebase Status (May 30, 2026)

| Package               |  Status | Notes                                                                                                                                  |
| --------------------- | ------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ECOD/server`         | ✅ ~85% | Express 5 + Hono dual routing, multi-tenant auth, WhatsApp, AWS SES, R2, Razorpay, Drizzle, ErixStore client                           |
| `ECOD/erix-store`     | ✅ ~95% | Cache, Queue v2, Locks, Pub/Sub, Rate Limit, Anomaly, Semantic Cache, WAL persistence                                                  |
| `ECOD/saas`           | 🟡 ~55% | Console, billing, ERIX module (inbox/contacts/pipeline/invoices/automation), LAIE module — settings + infra dashboards still in flight |
| `ECOD/admin`          | ✅ ~70% | Client management, CRM, WhatsApp, monetization, templates                                                                              |
| `@ecodrix/erix-api`   | ✅ ~90% | All major namespaces; some pro-tier features pending                                                                                   |
| `@ecodrix/erix-react` | 🟡 ~75% | CRM views, inbox, editor, analytics, AI; pro features (collab, comments, version history) shipping per `editor-pro-features` spec      |
| `ECOD/laie/*`         | 🟡 ~50% | Actors + 28 schemas live, audit UI in flight                                                                                           |

Recently shipped (and the canonical specs they trace to):

- **Pricing & entitlements** — 5 plans + 8 add-ons + atomic usage meters + lifecycle worker. `platform-pricing-entitlements/`.
- **Visual automation builder** — React Flow + Postgres engine + EventBus. `visual-automation-builder/`.
- **Schema split** — `ecodrix_*` / `erix_*` / `laie_*` modules under `server/src/shared/db/schema/`.
- **AI auto-respond on Gemini 2.0 Flash** — `services/saas/ai/auto-responder.ts`. `ai-auto-respond/`.
- **Editor pro features** — SDK-only, plan-gated. `editor-pro-features/`.

In flight:

- **Platform Completion (End-to-End)** — `platform-completion-end-to-end/`. Multi-source DB layer, Mongoose → adapter migration, public registration, admin → Postgres bridge, full settings + infra dashboards, smoke tests.

---

## 6. Tech Stack (current versions)

### Frontend

```
Next.js 15 (App Router)        + Next.js (admin)
TailwindCSS 4 + shadcn/ui (dark navy theme)
TanStack Query v5 + Zustand
React Hook Form + Zod
TanStack Table v8
@dnd-kit (kanban + workflow)
@xyflow/react v12 (visual automation)
@react-pdf/renderer (invoices)
@ecodrix/erix-api (NO direct fetch / axios)
```

### Backend

```
Node 20 + TypeScript strict
Express 5 + Hono (dual routing)
Drizzle ORM (PostgreSQL primary)
Mongoose (legacy + tenant-isolated freelance DBs, behind ErixAdapter)
@ecodrix/erix-client + @ecodrix/erix-worker (NO Redis, NO BullMQ)
Socket.io (real-time)
@google/genai (Gemini 2.0 Flash, Vertex AI mode)
@anthropic-ai/vertex-sdk (Claude Sonnet 4.5 for outreach)
Playwright + Crawlee + Cheerio (LAIE actors)
@aws-sdk/client-sesv2 (email), @aws-sdk/client-s3 (R2)
razorpay (payments)
Biome (lint/format), Vitest (tests)
```

### Data

- **PostgreSQL** (Supabase) — single instance, three table families
- **MongoDB** — only behind `MongoAdapter` for freelance clients on `data_mode="own"`
- **ErixStore** — port 6399, Postgres WAL persistence
- **Cloudflare R2** — files, media, invoice PDFs

---

## 7. Database Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Supabase) — primary control plane                         │
│                                                                        │
│  Platform   ecodrix_organizations  ecodrix_users  ecodrix_members      │
│             ecodrix_plans          ecodrix_addons                       │
│             ecodrix_subscriptions  ecodrix_usage                        │
│             ecodrix_cloud_storage  ecodrix_api_tokens                   │
│             ecodrix_audit_logs     ecodrix_waitlist                     │
│                                                                        │
│  CRM        erix_leads             erix_lead_activities                 │
│             erix_lead_notes        erix_pipelines                        │
│             erix_pipeline_stages   erix_conversations                    │
│             erix_messages          erix_meetings                         │
│             erix_whatsapp_templates erix_email_templates                 │
│             erix_broadcasts        erix_segments                         │
│             erix_scoring_configs   erix_automation_rules                 │
│             erix_sequence_enrollments                                    │
│             erix_workflows         erix_workflow_runs                    │
│             erix_invoices          erix_invoice_settings                 │
│             erix_notifications                                           │
│                                                                        │
│  LAIE       28 schemas under server/src/shared/db/schema/laie/*.ts     │
│             (tenants, users, actors, runs, datasets, audits, leads,    │
│              workflows, schedules, webhooks, intelligence modules)     │
│                                                                        │
│  Tenant boundary: every erix_* / laie_* row carries org_id.            │
│  No query escapes without it — enforced by tenantResolver + adapters.  │
└────────────────────────────────────────────────────────────────────────┘
```

`data_mode` per organization:

| Mode                                      | Where CRM data lives                    | Adapter                                         |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| `platform` (default for direct)           | Supabase Postgres, `org_id` filter      | `PostgresAdapter`                               |
| `own` + `mongodb` (default for freelance) | Tenant's isolated Mongo DB              | `MongoAdapter` (wraps `getCrmModels`)           |
| `own` + `postgresql`                      | Tenant's PostgreSQL with our schema     | `PostgresAdapter` (per-tenant pool)             |
| `both`                                    | Postgres primary + sync to tenant store | `DualAdapter` (queues to ErixStore `erix-sync`) |

---

## 8. Pricing & Entitlements

5 plans, 8 add-ons. See `platform-pricing-entitlements/requirements.md` for the full matrix.

| Slug         | Monthly USD | What it unlocks                                                               |
| ------------ | ----------: | ----------------------------------------------------------------------------- |
| `free`       |           0 | 100 contacts, 1k WA msgs, 5 audits, 1 workflow, 1 GB storage                  |
| `starter`    |          29 | 2k contacts, 10k WA msgs, 50 audits, 100 AI calls, webhooks                   |
| `growth`     |          79 | 25k contacts, 100k WA msgs, 500 audits, 1k AI calls, custom domain + branding |
| `scale`      |         199 | 100k contacts, 500k WA msgs, 2k audits, 10k AI calls, priority support        |
| `enterprise` |      custom | Unlimited everything, white-label, 99.99% SLA                                 |

Add-ons (cloud storage, bandwidth, AI calls, LAIE audits, WA msgs, branding, white-label, priority support)
override the plan's feature path via `ecodrix_organizations.add_ons`.

Enforcement:

- **Quota**: `createQuotaMiddleware({ service, feature })` wraps metered routes — atomic UPSERT on `ecodrix_usage`.
- **Boolean gate**: `requireFeature("erix.broadcasts")` rejects with 402 + `upgradeUrl`.
- **Entitlement service**: `GET /api/platform/entitlements` returns merged plan + add-ons + remaining quotas, cached 30s per org.

---

## 9. Quality Bar (non-negotiable)

- TypeScript strict — zero `any`, zero `ts-ignore`.
- Frontend uses **only** `@ecodrix/erix-api` for data — no `fetch` / `axios` to backend.
- Every CRM query goes through `getErixAdapter(orgId)`. No direct Drizzle calls outside the adapter.
- Every metered route is wrapped by `createQuotaMiddleware` or `requireFeature`.
- Every form: Zod validation + inline errors.
- Every list: skeleton → empty → error states.
- Dark navy design tokens (see `prd/03-UIUX-BRIEF.md`); no light mode.
- Console layout has no sidebar — products (ERIX, LAIE) own theirs. Settings + Infra are tree-grouped.

---

## 10. How to Use This Doc

| Goal                         | Combine with                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Build a backend feature      | `IMPLEMENTATION_DETAILS.md` (patterns) + `prd/05-SCHEMA.md` (tables) + the relevant spec under `saas/.kiro/specs/` |
| Build a frontend feature     | `prd/03-UIUX-BRIEF.md` (design) + `prd/04-APP-FLOW.md` (routing) + the relevant spec                               |
| Plan a sprint                | `prd/06-ROADMAP.md` (phases mapped to specs)                                                                       |
| Onboard an engineer          | `prd/08-DEVELOPMENT-GUIDE.md` (env, commands, conventions)                                                         |
| Debug auth or data isolation | `prd/07-VISUAL-ARCHITECTURE.md` (request lifecycle) + `IMPLEMENTATION_DETAILS.md` (tenantResolver, adapter)        |

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-pricing-entitlements/`, `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/visual-automation-builder/`, `saas/.kiro/specs/ai-auto-respond/`.
