# ECODrIx — Platform Architecture (Investor-Grade)

**Version**: 3.0  
**Author**: Dhanesh, ECODrIx  
**Date**: 2026-06-12  
**Status**: Active

---

## Executive Summary

ECODrIx is an **AI-native business operating system** built as a composable platform
with pluggable data residency. Three products (CRM, Intelligence, Automation) share
a unified integration layer (Connect) that provides channel access, credential
management, and multi-tenant data isolation — all behind a single API.

**What makes it unique:**

- **Data sovereignty** — users own their database (MongoDB, PostgreSQL, or platform-managed)
- **Connect-first** — one integration layer powers all products; channels are shared, not duplicated
- **Adapter pattern** — same business logic runs on any backend (Postgres, Mongo, or both)
- **Per-tenant isolation** — never co-mingle data; even on shared infra, org_id scoping is enforced
- **Zero-config internal integrations** — products use Connect transparently via hidden keys

---

## Platform Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                               │
│  SaaS Console (Next.js) · Mobile SDK · External API · Client Portals        │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                         API GATEWAY                                         │
│  Express 5 · Rate Limiting · Auth (x-api-key + x-client-code) · CORS        │
│  Tenant Resolution · Feature Gates · Quota Guards · OpenAPI Validation      │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │              │
┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐ ┌────▼─────┐
│  ERIX CRM   │ │  LAIE   │ │    Flow     │ │ Connect  │
│  src/erix/  │ │src/laie/│ │  src/flow/  │ │src/infra/│
│             │ │         │ │             │ │ connect/ │
│ Leads       │ │ Scrape  │ │ Visual      │ │ WhatsApp │
│ Pipeline    │ │ Enrich  │ │ Workflows   │ │ Email    │
│ Projects    │ │ AI Out- │ │ Triggers    │ │ Social   │
│ Commerce    │ │ reach   │ │ Runtime     │ │ Payments │
│ Engage      │ │         │ │             │ │ Database │
│ Meet        │ │         │ │             │ │ Storage  │
└──────┬──────┘ └────┬────┘ └──────┬──────┘ └────┬─────┘
       │              │              │              │
       │    uses      │              │    uses      │
       ├──────────────┼──────────────┼──────────────┤
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼─────────────────────────┐
│                     SHARED LAYER (src/shared/)                              │
│                                                                             │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────────┐               │
│  │ db/schema/      │  │ config/       │  │ utils/           │               │
│  │ (Drizzle ORM)   │  │ (env, cors,   │  │ (logger, crypto, │               │
│  │                 │  │  features)    │  │  errors, cache)  │               │
│  │ erix_* tables   │  │               │  │                  │               │
│  │ laie_* tables   │  │ middleware/   │  │ types/           │               │
│  │ flow_* tables   │  │ (auth, rate-  │  │ (express.d.ts,   │               │
│  │ connect_* tables│  │  limit, etc)  │  │  global.d.ts)    │               │
│  └─────────────────┘  └───────────────┘  └──────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Source Code Organization

```
ECOD/server/src/
├── erix/           @erix/*     CRM product module
├── laie/           @laie/*     Lead Intelligence product module
├── flow/           @flow/*     Automation/Workflow product module
├── infra/          @infra/*    Infrastructure services (connect, storage, store)
├── shared/         @shared/*   Cross-product shared layer (db, config, utils, middleware)
├── platform/       @platform/* Platform control-plane (auth, admin, settings)
└── routes/index.ts             Central route composition
```

**Module boundary rules:**

- Products (erix, laie, flow) can import from `@infra/*` and `@shared/*` only
- No direct cross-product imports — erix cannot import from laie or flow
- Infrastructure can import from `@shared/*` but not from products
- All inter-module imports use path aliases, not relative paths

---

## Products

### ERIX CRM — Sales & Delivery Platform

**What it does**: Full lifecycle from lead capture → pipeline → won deal → project delivery → invoice → payment

**Source:** `server/src/erix/` (`@erix/*`)

**Key differentiator**: Pipeline-to-project auto-conversion. When a deal is "Won", it becomes a project with tasks auto-cloned from templates. No separate tool needed.

```
ERIX CRM Domain Map (src/erix/):
├── routes/           API route handlers (/api/crm/*, /api/saas/*)
├── services/         Business logic (crm, invoice, mail, meet, media)
├── lib/              Adapters, jobs, tenant utilities
└── model/            Mongoose CRM models (multi-tenant)
```

**Data source**: User's choice via Connect → Database provider

- Platform (default): PostgreSQL with Drizzle ORM, `erix_*` tables
- Own (MongoDB): Tenant's external MongoDB, Mongoose schemas
- Own (PostgreSQL): Tenant's own Postgres, same Drizzle schema

### LAIE Intelligence — Lead AI Engine

**What it does**: Automated lead discovery, web scraping, data enrichment, AI-powered outreach generation

**Source:** `server/src/laie/` (`@laie/*`)

**Key differentiator**: Stealth scraping with residential proxy rotation, browser fingerprint coherence, and multi-model AI qualification (Gemini + Claude)

```
LAIE Domain Map (src/laie/):
├── routes/           API route handlers (/api/laie/v1/*)
├── services/         AI, intelligence, scraper orchestration
├── lib/              Core LAIE library (actors, proxy, scraping, browser)
├── jobs/             Background workers (enrichment, scoring, monitoring)
└── workers/          Actor runtime workers
```

**Data source**: Always platform PostgreSQL (LAIE-specific tables)
**Connect dependency**: NONE — LAIE is standalone

### Flow — Visual Automation Builder

**What it does**: No-code canvas for building event-driven workflows that orchestrate actions across CRM and Connect channels

**Source:** `server/src/flow/` (`@flow/*`)

**Key differentiator**: React Flow visual builder that compiles to executable step graphs, with live debugging and per-step logs

```
Flow Domain Map (src/flow/):
├── routes/           API route handlers (/api/flow/v1/*)
├── services/         Workflow engine, sequence engine, condition eval
├── engine/           Flow engine, node registry, CRM/LAIE nodes
└── workers/          Workflow, webhook, and lifecycle workers
```

**Data source**: Platform PostgreSQL (flow definitions + run logs)
**Connect dependency**: YES — workflow steps trigger Connect actions (send WA, email, etc.)

---

## Connect — The Integration Backbone

### What Connect Owns

Connect is the **single source of truth** for all external integrations. It owns:

1. **Credential management** — encrypted storage, lifecycle (connect/configure/disconnect)
2. **Channel operations** — sending messages, receiving webhooks, payment processing
3. **Module access control** — which product can use which provider
4. **Data residency** — platform/own/hybrid database configuration

### Provider Registry

| Provider    | Capability         | Methods                | Consumer Modules |
| ----------- | ------------------ | ---------------------- | ---------------- |
| `database`  | Data residency     | platform, own, hybrid  | CRM              |
| `whatsapp`  | Messaging          | cloud-api, on-premise  | CRM, Flow        |
| `email`     | Email delivery     | ses, smtp, gmail-oauth | CRM, Flow        |
| `instagram` | Social DMs         | graph-api              | CRM, Flow        |
| `facebook`  | Page messaging     | graph-api              | CRM, Flow        |
| `payments`  | Payment processing | razorpay, stripe       | CRM, Flow        |
| `google`    | Calendar/Meet      | oauth2                 | CRM              |
| `storage`   | File storage       | r2, s3                 | CRM, Flow        |

### Access Model

```
┌───────────────────────────────────────────────────────────────┐
│                    INTERNAL (Hidden Keys)                     │
│                                                               │
│  Auto-provisioned when module is enabled. Users never see.    │
│                                                               │
│  CRM enables → gets WhatsApp + Email + Payments + Google      │
│  Flow enables → inherits same credentials as CRM              │
│  LAIE enables → gets NOTHING (standalone)                     │
│                                                               │
│  Internal calls: no API key needed, uses org's stored creds   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    EXTERNAL (User-Managed)                    │
│                                                               │
│  User explicitly enables in Connect settings.                 │
│                                                               │
│  → Gets API key + project URL                                 │
│  → Chooses which providers to expose                          │
│  → Rate-limited, audited, scoped                              │
│  → For: custom apps, third-party integrations, webhooks       │
└───────────────────────────────────────────────────────────────┘
```

### How CRM Uses Connect (Example: Inbox)

```
1. User opens ERIX CRM → Inbox
2. Frontend calls: GET /api/connect/whatsapp/conversations
3. Connect middleware:
   a. Resolves tenant (x-api-key + x-client-code)
   b. Checks: is "whatsapp" provider connected? ✓
   c. Checks: is module "crm" granted access? ✓
   d. Loads WhatsApp credentials from encrypted store
4. WhatsApp service fetches conversations from Meta API
5. Returns scoped data to frontend
```

---

## Data Architecture

### ErixAdapter Pattern (CRM Only)

The adapter pattern is what enables **data sovereignty** — the same business logic
works regardless of where the tenant's data lives.

```typescript
// The factory decides which adapter to use based on Connect's database provider
const adapter = await getErixAdapter(orgId);

// Same interface, different backends:
adapter.leads.create(orgId, { firstName: "Raj", phone: "+91..." });
adapter.projects.create(orgId, { name: "Website Redesign", dealId: "..." });
adapter.pipelines.listStages(orgId, pipelineId);
```

**Resolution flow:**

```
getErixAdapter(orgId)
  → getResidency(clientCode)        // reads Connect database provider state
    → mode = "platform"             // PostgresAdapter(sharedDb)
    → mode = "own", type = "mongo"  // MongoAdapter(clientCode)
    → mode = "own", type = "pg"     // PostgresAdapter(tenantPool)
```

### Schema Locations

| Context            | Location                         | ORM      | Isolation             |
| ------------------ | -------------------------------- | -------- | --------------------- |
| ERIX (platform PG) | `shared/db/schema/erix/*.ts`     | Drizzle  | org_id column         |
| ERIX (own MongoDB) | `model/saas/crm/*.model.ts`      | Mongoose | per-tenant connection |
| ERIX (own PG)      | Same Drizzle schema              | Drizzle  | per-tenant pool       |
| LAIE               | `shared/db/schema/laie/*.ts`     | Drizzle  | org_id column         |
| Connect            | `shared/db/schema/connect/*.ts`  | Drizzle  | org_id + client_code  |
| Platform           | `shared/db/schema/platform/*.ts` | Drizzle  | —                     |
| Flow               | `shared/db/schema/flow/*.ts`     | Drizzle  | org_id column         |

### erix-store (Queue/Cache Sidecar)

Always-on in-memory data engine running on the GCE VM:

- **Job queues**: Priority, delay, retry, DLQ, per-tenant fairness, WAL-backed
- **Distributed cache**: LRU with tag-based invalidation
- **Distributed locks**: For concurrent mutation safety

---

## Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUD RUN (scale-to-zero)                                          │
│  ├── ecodrix-api        Express server, max 3 instances             │
│  └── scraper-proxy      LAIE proxy relay (GCP region)               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  GCE VM — ecodrix-infra (always-on, e2-medium)                      │
│  Docker Compose:                                                    │
│  ├── caddy             Reverse proxy + auto HTTPS                   │
│  ├── erix-store        Queue + cache sidecar (:6399)                │
│  ├── ecodrix-jobs      Background workers (9 queues)                │
│  └── cloudsql-proxy    PostgreSQL tunnel to Cloud SQL               │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  MANAGED SERVICES                                                  │
│  ├── Cloud SQL (PostgreSQL)    Platform + LAIE + Connect data      │
│  ├── MongoDB Atlas             Tenant data (own-mode orgs)         │
│  ├── Cloudflare R2             File storage                        │
│  ├── AWS SES                   Email delivery                      │
│  └── Cloudflare Workers        LAIE proxy relays (5 regions)       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  PROXY RELAY NETWORK (22 relays)                                   │
│  ├── Cloudflare Workers    5 relays (global edge)                  │
│  ├── AWS Lambda            10 relays (8 regions)                   │
│  └── GCP Cloud Functions   5 relays (5 regions)                    │
│  Purpose: Residential IP rotation for stealth web scraping         │
└────────────────────────────────────────────────────────────────────┘
```

---

## API Surface

### Route Ownership

```
/api/connect/v1/*          Connect        Connection management
/api/connect/whatsapp/*    Connect        WhatsApp channel operations
/api/connect/email/*       Connect        Email channel operations
/api/connect/social/*      Connect        Social channel operations
/api/connect/payments/*    Connect        Payment operations

/api/crm/*                 ERIX CRM       Leads, pipeline, projects, analytics
/api/crm/projects/*        ERIX CRM       Project management (tasks, templates)
/api/crm/automation/*      ERIX CRM       Automation rules & sequences

/api/laie/*                LAIE           Scraping, enrichment, research
/api/flow/*                Flow           Workflow definitions & execution

/api/portal/*              Public         Client-facing portals (no auth)
/api/saas/*                Platform       Org management, billing, health
```

### Authentication

| Path                                          | Auth Method                   | Scope                     |
| --------------------------------------------- | ----------------------------- | ------------------------- |
| `/api/connect/*`, `/api/crm/*`, `/api/flow/*` | `x-api-key` + `x-client-code` | Tenant-scoped             |
| `/api/laie/*`                                 | `x-laie-key`                  | Org-scoped (separate key) |
| `/api/portal/*`                               | Token in URL                  | Public (read-only)        |
| `/api/saas/*`                                 | NextAuth session              | Admin console             |

---

## Worker Architecture

```
9 specialized queue processors running on ecodrix-jobs:

├── crm                     50 concurrency   Lead operations, stage changes
├── crm.email_marketing     12 concurrency   Email campaign sends
├── automation-events        2 concurrency   Rule evaluation + action dispatch
├── workflow-executions      1 concurrency   Flow step execution (sequential)
├── ai-respond               5 concurrency   AI auto-reply generation
├── laie-scrapers            5 concurrency   Web scraping jobs
├── laie-research            5 concurrency   Research tasks
├── laie-enrich              5 concurrency   Data enrichment
└── laie-scrapers (low-pri) 2 concurrency   Background scraping (rate-limited)
```

---

## Adaptive Onboarding + AI Persona Engine

### Overview

Config-driven, niche-aware onboarding system that bootstraps a **per-user AI persona**
on first product activation. The persona shapes all AI-generated outputs across every
ECODrIx product — outreach copy, follow-ups, pipeline suggestions, research summaries,
and automation templates. It learns continuously from user behavior, forming a flywheel
that deepens personalization over time.

### Architecture Flow

```
User enables product
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Onboarding Engine (config-driven, JsonLogic branching)              │
│  • Loads versioned step config from ecodrix_onboarding_configs       │
│  • Evaluates conditional branches per user answers                   │
│  • Resolves niche pack → pre-fills industry context                  │
└──────────────┬───────────────────────────────────────────────────────┘
               │ answers
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PersonaWriter                                                       │
│  • Bootstraps AIPersona from session answers + niche pack defaults   │
│  • Recomputes on edits (lock → txn → history → cache invalidate)     │
│  • Applies reinforcement events (deal_won, outreach_edited, etc.)    │
└──────────────┬───────────────────────────────────────────────────────┘
               │ writes
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ecodrix_ai_personas (Postgres)                                      │
│  identity · behaviorRules · vocabulary · icp · learningMemory        │
└──────────────┬───────────────────────────────────────────────────────┘
               │ reads (cache-first)
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PersonaContextBuilder                                               │
│  • Token-budgeted prompt assembly (tiktoken counting)                │
│  • Section prioritization + tail-first pruning                       │
│  • Injects persona context into EVERY AI prompt across all products  │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  AI Outputs   │  Outreach · Follow-ups · Research · Automations
        └──────────────┘
               │ reinforcement events
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Persona Self-Review (nightly cron)                                   │
│  • Confidence-gap detection → follow-up questions                    │
│  • Contradiction pruning → removes conflicting rules                 │
│  • Pattern generalisation → promotes recurring patterns              │
│  • Style drift recalibration → realigns voice consistency            │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component                  | Path                                                     | Responsibility                                                                                                         |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `configEngine`             | `server/src/erix/services/onboarding/configEngine`       | Loads versioned onboarding configs, evaluates JsonLogic branches, resolves next step                                   |
| `sessionStore`             | `server/src/erix/services/onboarding/sessionStore`       | Postgres CRUD for onboarding sessions (create, append answer, mark complete/abandoned)                                 |
| `workspaceShaper`          | `server/src/erix/services/onboarding/workspaceShaper`    | Produces workspace profiles from persona + niche pack; materializes pipelines, fields, automations                     |
| `personaWriter`            | `server/src/erix/services/persona/personaWriter`         | Bootstrap from session, recompute on edits, apply reinforcement events (lock → txn → history → cache invalidate)       |
| `personaReader`            | `server/src/erix/services/persona/personaReader`         | Cache-first reads (erix-store 5-min TTL → Postgres on miss)                                                            |
| `PersonaContextBuilder`    | `server/src/erix/services/persona/PersonaContextBuilder` | Token-budgeted prompt assembly with tiktoken counting, section prioritization, tail-first pruning                      |
| `personaSelfReview.worker` | `server/src/erix/jobs/saas/personaSelfReview.worker`     | 4 autonomous loops: confidence-gap detection, contradiction pruning, pattern generalisation, style drift recalibration |

### Data Model

```
┌────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
│ Table                                  │ Purpose                                                          │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_ai_personas                    │ The persona row — identity, behaviorRules, vocabulary, icp,      │
│                                        │ learningMemory, confidenceScore                                  │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_onboarding_sessions            │ Active/completed sessions with answers + draft persona snapshot  │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_niche_packs                    │ Industry/niche templates (onboarding config + research config +  │
│                                        │ workspace profile)                                               │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_onboarding_configs             │ Versioned step definitions with JsonLogic branching rules        │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_persona_memory_history         │ RFC 6902 JSON Patch diffs, capped at 50 versions per persona     │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_onboarding_events              │ Analytics event log (step_viewed, answer_submitted, etc.)        │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_persona_followup_questions     │ Confidence-gap loop — AI-generated follow-up questions           │
├────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ ecodrix_onboarding_experiments         │ A/B test definitions for onboarding flow variants                │
└────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

All tables are scoped by `org_id` and live in `server/src/shared/db/schema/platform/`.

### Workers

Registered via `registerSaasWorkers()` in the worker bootstrap chain:

| Worker                  | Trigger                                               | Responsibility                                                          |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `persona-reinforcement` | `lead_approved`, `deal_won`, `outreach_edited` events | Updates persona learningMemory from real-world outcomes                 |
| `persona-recompute`     | Niche pack change                                     | Re-derives persona when underlying niche pack is modified               |
| `persona-confidence`    | Debounced (1 min after last event)                    | Recalculates persona confidenceScore                                    |
| `onboarding-events`     | Any onboarding interaction                            | Inserts into the events analytics table                                 |
| `persona-self-review`   | Nightly cron + on-demand                              | Runs the 4 autonomous loops (gap, contradiction, generalisation, drift) |

### Multi-Tenant Isolation

- **org_id scoping** on every table — enforced at Drizzle schema level
- **Runtime assertion guards** — all service methods assert `org_id` matches before mutation
- **Property-based fuzz tests** — verify no cross-tenant data leak under random input
- **Cache key prefixing** — `{orgId}:persona:{personaId}` enables safe prefix invalidation per tenant

### Performance

| Operation                       | Target             | Measurement                   |
| ------------------------------- | ------------------ | ----------------------------- |
| `PersonaContextBuilder.build()` | ≤50ms p99 (cached) | prom-client histogram         |
| `PersonaContextBuilder.build()` | ≤250ms (cold)      | prom-client histogram         |
| Onboarding state load           | ≤200ms TTFB        | prom-client histogram         |
| Cache hit ratio                 | ≥95% steady-state  | Rolling gauge via prom-client |

Metrics are exported via prom-client histograms and a rolling cache hit ratio gauge,
scraped by the platform monitoring stack.

---

## What Makes This Investor-Ready

1. **Multi-tenant from day 1** — not bolted on. Every query is org-scoped.
2. **Data sovereignty** — Indian SMBs keep data in India; agencies keep data separate.
3. **Adapter pattern** — can add new backends (MySQL, DynamoDB) without touching business logic.
4. **Connect as moat** — once channels are configured, switching cost is high.
5. **Pipeline→Project** — unique CRM-to-PM bridge that no competitor offers in one tool.
6. **LAIE stealth scraping** — 22-relay proxy network with browser fingerprint coherence.
7. **erix-store sidecar** — no Redis dependency, custom queue with WAL + per-tenant fairness.
8. **Scale path clear** — Cloud Run auto-scales API; workers are horizontal on VMs.
9. **Single codebase** — one TypeScript server powers API + workers + cron + webhooks.
10. **Open to integration** — external API keys let customers build on top of ECODrIx.

---

## File Structure (Server) — Post-Reorganization

```
server/src/
├── erix/                   CRM product module (@erix/*)
│   ├── routes/             /api/crm/*, /api/saas/chat/*, /api/saas/mail/*
│   ├── services/           CRM business logic (crm, invoice, mail, meet, media)
│   ├── lib/                erix-adapter, erixJobs, tenant utilities
│   └── model/              Mongoose CRM models (multi-tenant)
├── laie/                   Lead Intelligence product module (@laie/*)
│   ├── routes/             /api/laie/v1/*
│   ├── services/           AI, intelligence, scraper orchestration
│   ├── lib/                Core LAIE library (actors, proxy, scraping, browser)
│   └── jobs/               Background workers (enrichment, scoring, monitoring)
├── flow/                   Automation/Workflow product module (@flow/*)
│   ├── routes/             /api/flow/v1/*
│   ├── services/           Workflow engine, sequence engine
│   ├── engine/             Flow engine, node registry, CRM/LAIE nodes
│   └── workers/            Workflow, webhook, lifecycle workers
├── infra/                  Infrastructure services (@infra/*)
│   ├── connect/            Integrations hub (email, WhatsApp, payments, social, Google)
│   ├── storage/            Media & file storage (R2/S3, upload, image processing)
│   └── store/              KV cache service reference (→ ECOD/erix-store/)
├── shared/                 Cross-product shared layer (@shared/*)
│   ├── db/                 Drizzle schemas, migrations, seed
│   ├── config/             Environment, CORS, feature flags, plans
│   ├── utils/              Logger, crypto, errors, cache, circuit-breaker
│   ├── middleware/         Auth, rate-limit, tenant resolver, error handler
│   └── types/              Global TypeScript declarations
├── platform/               Platform control-plane (@platform/*)
│   ├── routes/             /api/me, /api/members, /api/platform/*
│   └── services/           Auth, admin, onboarding, waitlist
└── routes/
    └── index.ts            Central route composition (mounts all modules)
```

### Path Aliases

| Alias         | Maps to          | Description                        |
| ------------- | ---------------- | ---------------------------------- |
| `@erix/*`     | `src/erix/*`     | CRM product module                 |
| `@laie/*`     | `src/laie/*`     | Lead Intelligence product module   |
| `@flow/*`     | `src/flow/*`     | Automation/Workflow product module |
| `@infra/*`    | `src/infra/*`    | Infrastructure services            |
| `@shared/*`   | `src/shared/*`   | Cross-product shared layer         |
| `@platform/*` | `src/platform/*` | Platform control-plane             |

### Module Boundary Rules

- Products (erix, laie, flow) import from `@infra/*` and `@shared/*` only
- No direct cross-product imports (erix ✗→ laie, flow)
- Infrastructure imports from `@shared/*` only, never from products
- Shared layer has no upward dependencies
