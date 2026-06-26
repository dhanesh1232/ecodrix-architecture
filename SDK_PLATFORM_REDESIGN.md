# ECODrIx Platform — SDK & Architecture Design

> Build, connect, and automate your entire business from one platform.

---

## 1. Platform Overview

ECODrIx is a unified SaaS platform delivering CRM, lead intelligence, automation orchestration, channel connectivity, real-time data infrastructure, and media services — purpose-built for Indian SMBs and agencies scaling from 0 to 10,000 clients.

**Who it's for:** Digital agencies, SaaS resellers, freelancers, coaches, e-commerce operators — anyone managing client relationships across WhatsApp, Instagram, Email, and Telegram at scale.

**Key principle:** Six services, one platform. Each service has a clear boundary. They compose through well-defined contracts — never through shared mutable state. Every feature is plan-gated — nothing is free by default beyond hard-capped Free tier limits.

### Architecture (Service Map)

```
┌─────────────────────── PRODUCT LAYER ────────────────────────┐
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐      │
│  │  erix-crm   │    │  erix-laie  │    │  erix-flow   │      │
│  │  (Core CRM) │    │ (Lead Intel)│    │(Orchestrator)│      │
│  └──────┬──────┘    └──────┬──────┘    └───────┬──────┘      │
│         │                  │                   │             │
│         │    calls ERIX SDK for all actions    │             │
│         └──────────────────┼───────────────────┘             │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌─────────────────── INFRASTRUCTURE LAYER ─────────────────────┐
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │erix-connect │    │ erix-store  │    │erix-storage │       │
│  │ (Channels)  │    │  (Data/Q)   │    │  (Media)    │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Dependency direction (strict):**

- `erix-flow` → calls `erix-crm` SDK → which calls `erix-connect` transport
- `erix-connect` → receives webhooks → calls `erix-crm` SDK to track messages
- `erix-crm` → calls `erix-connect` for raw channel sends
- All services → use `erix-store` for cache/queue/pubsub
- All services → use `erix-storage` for media

---

## 2. Product Layer

### 2.1 erix-crm — Multi-Tenant CRM

**Purpose:** The core business operating system. Every customer interaction, every deal, every conversation flows through here.

**Core features:**

- Lead management + pipeline stages + scoring + tagging
- Configurable Kanban pipeline boards per business type
- Project management — per-deal boards with tasks, milestones, documents, e-sign
- eSign (internal CRM module — not a standalone product). Send documents for signature inside projects only. Client signs via portal link (no account required). Signed PDF sealed + stored in erix-storage per-tenant bucket. Status lifecycle: draft → sent → signed → expired. Plan-gated: Free 3/mo hard cap, Solo 25/mo, Small 75/mo, Growth 200/mo, Scale+ unlimited.
- Client portal — branded portal for invoice access, document signing, project tracking
- Payment collection — invoice generation, Razorpay payment links, auto-reconciliation
- Unified conversation inbox — WhatsApp, Instagram DM, Telegram, Email in one thread per lead
- Message templates — WhatsApp (Meta-approved), email (HTML), SMS with variable resolution
- Automation rules — short visual per-tenant workflows (trigger → condition → action)
- Custom events — tenant-defined triggers that fire automations via API/webhook
- Visual automation builder — drag-and-drop node editor
- Team seats + role-based permissions (owner, admin, agent)

**Key entities:** Lead, Pipeline, Stage, Conversation, Message, Template, AutomationRule, Invoice, Project, Task, Meeting, Segment

**Boundaries:**

- ERIX owns ALL conversation data, message history, templates, and broadcasts
- ERIX automations are SHORT flows: trigger → condition → 1-5 actions (same tenant)
- Does NOT do cross-system orchestration (→ erix-flow)
- Does NOT own channel credentials (→ erix-connect)
- Does NOT generate leads (→ erix-laie)
- Does NOT own notifications — platform-level notification system is managed separately from `platform/` (in-app alerts, email digests, push)

**Server path:** `server/src/erix/`
**SDK:** `erix/sdk/{whatsapp,lead,pipeline,mail,automation,project,notification,...}.sdk.ts`
**Routes:** `/api/saas/*`, `/api/crm/*`

---

### 2.2 erix-laie — Lead Intelligence Engine

**Purpose:** AI-powered lead generation, enrichment, and research. Apify + Clay + Apollo, built for India.

**Core features:**

- Lead generation — automated scraping from Google Maps, JustDial, IndiaMART, Sulekha, LinkedIn
- Contact enrichment — phone finder, email finder, company details, social profiles
- Company intelligence — competitor analysis, market sizing, gap detection
- SEO weak-lead finder — custom actor finding businesses with poor SEO (high-intent prospects)
- Actor-based pipeline — 5 stages: discover → scrape → validate → enrich → qualify
- LAIE Vault — India-local lead database (pre-scraped, deduplicated, scored). JustDial, IndiaMART, Sulekha, Google Maps ONLY.
- AI qualification — Claude-powered lead scoring based on ICP match
- Bulk export into erix-crm via "erix bridge"

**Key entities:** Campaign, Lead (LAIE-side), Actor, Dataset, Schedule, ApiKey

**Boundaries:**

- LAIE generates and scores leads — does NOT manage ongoing relationships (→ CRM)
- LAIE Vault is India-only — do not overstate coverage
- LAIE actors are headless browser scripts — they do NOT send messages
- Qualified leads flow INTO erix-crm via the "erix bridge"

**Server path:** `server/src/laie/`
**Routes:** `/api/laie/v1/*`
**Auth:** `x-laie-key` header. **Two accepted modes** (validated by
`shared/middleware/laieAuth.ts`, checked in order):

1. **Static operator key** — `process.env.LAIE_API_KEY`. Single-operator
   back-compat path; the acting tenant resolves from `x-org-id` downstream.
2. **DB-backed per-tenant key** — a `laie_api_keys` row (SHA-256 hash match,
   not expired, owning org not suspended/deleted). On success the middleware
   pins `req.orgId` to the key's owning tenant and attaches the key's scopes to
   `req.laieScopes`, so per-tenant plan guards run on the key owner without an
   `x-org-id` header. Keys are stored hashed at rest (raw key shown once);
   `lastUsedAt` is bumped per call.

---

### 2.3 erix-flow — Automation Orchestrator

**Purpose:** Complex, cross-system, long-running automations. The platform's n8n/Make.com equivalent.

**NOT available on:** Free tier, Early Access tier.

**Core features:**

- Multi-step flows — trigger → branch → wait → action → branch (unlimited depth)
- Cross-system pipelines — connects erix-crm + erix-laie + erix-connect
- State machine — runs persist state across days/weeks
- Visual Flow builder — React Flow graph editor with custom nodes
- Node types: trigger, condition, delay, wait-for-event, channel send, CRM action, LAIE action, webhook, AI
- Run engine — executes nodes in order, handles failures, retries, pauses, resumes
- Error handling — dead-letter queue, retry policies per node

**Key entities:** FlowWorkflow, FlowRun, FlowNode, FlowEdge, NodeState

**CRITICAL DISTINCTION — erix-crm vs erix-flow:**

|           | erix-crm Automations                    | erix-flow Flows                                                  |
| --------- | --------------------------------------- | ---------------------------------------------------------------- |
| Scope     | Single tenant, simple rules             | Cross-system, complex pipelines                                  |
| Duration  | Instant to hours                        | Hours to weeks                                                   |
| Nodes     | 1-5 actions max                         | Unlimited                                                        |
| State     | Stateless or basic sequence             | Full state machine with persistence                              |
| Builder   | Automation Builder (simple)             | Flow Builder (advanced)                                          |
| Use case  | "When lead created → send WA + add tag" | "LAIE finds 500 leads → enrich → qualify → CRM → 14-day nurture" |
| Execution | ruleExecutor.service.ts + crmQueue      | flowEngine + dedicated workers                                   |
| Table     | `erix_automation_rules`                 | `flow_workflows` + `flow_runs`                                   |
| Plan gate | Free (limited)                          | Solo+ only                                                       |

**Server path:** `server/src/flow/`
**Routes:** `/api/flow/v1/*`

---

## 3. Infrastructure Layer

### 3.1 erix-connect — Universal Connector

**Purpose:** Transport and credential layer. Manages channel connections, receives webhooks, provisions external API keys. Connect delivers the pipe — ERIX decides what flows through it.

**Connectors (current):**

| Channel   | Provider                   | Method                                                               |
| --------- | -------------------------- | -------------------------------------------------------------------- |
| WhatsApp  | Meta Cloud API             | Embedded Signup OR manual (access token + phone number ID + WABA ID) |
| Instagram | Meta Graph API             | OAuth via Meta Business Suite                                        |
| Email     | AWS SES                    | SMTP credentials or SES identity                                     |
| Telegram  | Bot API                    | Bot token                                                            |
| SMS       | Truecaller/MSG91 (planned) | API key                                                              |
| Razorpay  | Razorpay                   | OAuth partner OR manual key pair                                     |
| Voice     | SIP/DID (FUTURE)           | Telecom provider                                                     |

**What Connect owns:**

- Channel credential storage (encrypted per-org, AES-256)
- Webhook receivers (`/webhooks/meta/*`, `/webhooks/telegram/*`, `/webhooks/razorpay/org/:orgId`, `/webhooks/ses/*`)
- External API key system (`connect_api_keys`, key format: `connect_sk_*`)
- External send endpoints (`/api/connect/v1/send/*`)
- Provider registry + connection testing
- Meta Embedded Signup flow
- OAuth2 provider (tenants issue tokens to their customers)

**What Connect does NOT own:**

- Conversations, message history, templates, broadcasts (→ ERIX)
- Lead data, pipeline stages, scoring (→ ERIX)
- Automation logic, triggers, conditions (→ ERIX/Flow)

> **Provider-id note:** Razorpay credentials are stored under the canonical
> provider id **`payments`** (provider registry method = `razorpay`), accessed
> via `getPaymentsCredentials(orgId)`. Code reading credentials must use
> `payments`, not `razorpay`. Telegram credentials are stored under `telegram`
> (no dedicated typed getter — read via `getCredentials(orgId, "telegram")`).

> **Database connector default:** every org's default data residency is the
> shared **platform** DB (no credentials, always available). A freshly-created
> org has no `connect_connections` row, so `buildView` (connectionService)
> **defaults the `database` connector to `state: "connected"`,
> `activeMethod: "platform"`** when no row exists and residency is platform.
> This means the dashboard shows the database as connected out of the box — no
> user action needed. An explicit row (own/hybrid, or a deliberate disconnect)
> always takes precedence. `own`/`hybrid` show connected only when a DB URI is
> configured.

**Webhook flow:**

```
Provider → POST /webhooks/{provider}/*
  → Connect verifies signature/token
  → Connect identifies tenant by phoneNumberId/orgId
  → Connect calls ERIX SDK (handleIncoming / EventBus.emit)
  → ERIX stores message, updates conversation, fires automations
```

**Server path:** `server/src/infra/connect/`
**Routes:** `/api/connect/v1/*`, `/webhooks/*`

---

### 3.2 erix-store — In-Memory Data Engine

**Purpose:** Redis-equivalent built as HTTP + WebSocket sidecar. Replaces ALL Redis and BullMQ usage.

**Why built (instead of Redis):**

- Single binary, zero-config deployment
- HTTP API (works from any language)
- SQLite-backed persistence (survives restarts)
- Built-in queue with priority, delay, retry, dead-letter
- Pub/Sub over WebSocket
- One fewer infra dependency

**Port:** `6399` (canonical default). **Runtime resolves the store via
`env.ERIX_STORE_URL`** (+ `ERIX_STORE_API_KEY`, `ERIX_TENANT_ID`) in
`shared/lib/erix.ts` — `6399` is the default/local fallback, not a hardcoded
constant. Override `ERIX_STORE_URL` to point elsewhere.
**Billing:** Infrastructure only — NEVER billed to tenants
**Server sidecar path:** `server/src/infra/store/`

**SDK methods:**

```typescript
import { erix } from "@erix/lib/erix";

// Key-Value
await erix.set(key, value, ttlSeconds?);
await erix.get<T>(key);
await erix.del(key);
await erix.setNx(key, value);

// Queue (replaces BullMQ)
await erix.queueV2.push(queueName, data, { clientCode, priority, delayMs, maxAttempts });
await erix.queueV2.claim(queueName);
await erix.queueV2.complete(jobId);
await erix.queueV2.fail(jobId, error);
await erix.queueV2.get(jobId);

// Hash
await erix.hash.hset(key, field, value);
await erix.hash.hget<T>(key, field);
await erix.hash.hgetall(key);

// List
await erix.list.rpush(key, value);
await erix.list.lpop<T>(key);

// Cache (with tags)
await erix.cache.set(key, value, { ttl, tags });
await erix.cache.get<T>(key);
await erix.cache.invalidateByTag(tag);

// Pub/Sub
await erix.pubsub.publish(channel, data);
await erix.pubsub.subscribe(channel, handler);
```

**npm package:** `@ecodrix/erix-client`
**Worker package:** `@ecodrix/erix-worker`

---

### 3.3 erix-storage — Media Library Service

**Purpose:** Upload, transform, and serve media. Per-tenant isolated. Like ImageKit + Cloudinary.

**Backed by:** Cloudflare R2
**CDN:** `cdn.ecodrix.com`

**Capabilities:** Image upload + resize/crop, document storage (PDF/DOCX), video/audio (pass-through), signed URLs, direct browser upload (pre-signed PUT)

**Server path:** `server/src/infra/storage/`
**Routes:** `/api/saas/storage/*`, `/api/saas/images/*`

---

## 4. SDK Surface Area

### 4.1 @ecodrix/erix-api — Frontend SDK (BSL Licensed)

**Rule:** ALL frontend→server communication goes through this SDK. No direct `fetch` calls anywhere.

**Auth:** SDK attaches `x-api-key` + `x-client-code` headers automatically.

```typescript
import { useEcod } from "@/providers/EcodProvider";
const ecod = useEcod();
const leads = await ecod.request("GET", "/api/crm/leads");
await ecod.request("POST", "/api/crm/leads", {
  firstName: "Ravi",
  phone: "+91...",
});
```

### 4.2 @ecodrix/erix-buddy — Open Source CLI (MIT)

Developer toolkit for local dev, scaffolding, deployment. Published: npm + GitHub.

---

## 5. Service Boundary Map

| From          | To           | How                                                   | Protocol              |
| ------------- | ------------ | ----------------------------------------------------- | --------------------- |
| erix-crm      | erix-connect | Import WhatsappService/EmailService for raw transport | Internal TS import    |
| erix-crm      | erix-store   | `erix.set()`, `erix.queueV2.push()`                   | HTTP (port 6399)      |
| erix-crm      | erix-storage | StorageService for media                              | Internal → R2 API     |
| erix-flow     | erix-crm     | `createSDK(clientCode)` — full CRM SDK                | Internal TS import    |
| erix-flow     | erix-connect | Via erix-crm SDK (never direct)                       | Indirect              |
| erix-flow     | erix-store   | Queue jobs for async nodes                            | HTTP (port 6399)      |
| erix-laie     | erix-crm     | "Erix bridge" — leads pushed to CRM                   | Internal service call |
| erix-laie     | erix-store   | Actor jobs, scraping queue, cache                     | HTTP (port 6399)      |
| erix-connect  | erix-crm     | `createSDK(clientCode)` — inbox tracking              | Internal TS import    |
| erix-connect  | erix-store   | Rate limiting, logs, batch state                      | HTTP (port 6399)      |
| External API  | erix-connect | `/api/connect/v1/send/*` with `x-connect-key`         | HTTPS                 |
| Meta/Telegram | erix-connect | `/webhooks/*` with signature                          | HTTPS inbound         |
| Frontend      | erix-crm     | `@ecodrix/erix-api` → `/api/saas/*`                   | HTTPS                 |

---

## 6. Data Architecture

### 6.1 Supabase PostgreSQL

> **Folder ↔ prefix mapping** (`server/src/shared/db/schema/`): `platform/` →
> `ecodrix_*`, `erix/` → `erix_*`, `flow/` → `flow_*`, `laie/` → `laie_*`,
> `connect/` → `connect_*`. (The `ecodrix_*` prefix is backed by the
> `platform/` folder — there is no `ecodrix/` folder.)

| Schema      | What Lives Here                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ecodrix_*` | Organizations, users, members, plans, subscriptions, billing events, audit logs, credit wallets                                                                                       |
| `erix_*`    | Leads, pipelines, stages, projects, tasks, invoices, invoice settings, automation rules, sequence enrollments, custom event defs, event logs, broadcasts, email events, callback logs |
| `flow_*`    | Flow workflows, flow runs, flow node states                                                                                                                                           |
| `laie_*`    | Tenants, API keys, webhooks, datasets                                                                                                                                                 |
| `connect_*` | API keys, credentials, webhook logs, delivery events, batches, usage events, OAuth clients/tokens                                                                                     |

### 6.2 MongoDB (Per-Tenant CRM — Legacy + own+mongo mode)

| Collection                | Purpose                             |
| ------------------------- | ----------------------------------- |
| Lead                      | Contact records with dynamic fields |
| Conversation              | Unified inbox threads               |
| Message                   | Individual messages (all channels)  |
| AutomationRule            | Tenant automation configs           |
| Template                  | WA/email templates                  |
| Meeting, Invoice, Project | Business operations                 |
| SequenceEnrollment        | Multi-step state                    |
| WorkflowRun               | Flow execution state                |
| Notification, Segment     | UX features                         |

### 6.3 Isolation

- **Platform PG:** `org_id` column + row-level predicates (adapter-enforced)
- **Tenant Mongo:** One DB per tenant (connection pooled by clientCode)
- **erix-adapter:** Routes to PG or Mongo based on tenant `dataMode`
- **Credentials:** AES-256 encrypted at rest, never logged

---

## 7. Key Architectural Decisions

### 7.1 erix-store vs Redis

| Decision           | Rationale                                               |
| ------------------ | ------------------------------------------------------- |
| Built custom       | Redis cluster management is a burden for small teams    |
| HTTP protocol      | Works from anywhere, no binary dependency               |
| SQLite persistence | Survives restart without AOF/RDB                        |
| Single binary      | Zero external deps at deploy                            |
| Port 6399          | Canonical **default**, overridable via `ERIX_STORE_URL` |
| Built-in queue     | Replaces BullMQ — priority, delay, retry, DLQ           |

### 7.2 Meta Tech Provider Status

- Embedded Signup (one-click WA connection)
- System User tokens (manage tenant WABAs)
- Webhook routing by `phone_number_id`
- Template submission on behalf of tenants

### 7.3 Voice Agent (FUTURE — Not Current)

Architecture designed, not implemented. Plan: SIP + DID via Indian telecom, virtual numbers per tenant, AI voice agent via real-time streaming.

---

## 8. Pricing Architecture

### 8.1 Tier Overview

| Tier         | Price/mo | Annual (2 months free) | Notes                                     |
| ------------ | -------- | ---------------------- | ----------------------------------------- |
| Free         | ₹0       | —                      | Hard caps, no credit bypass               |
| Early Access | ₹999     | ₹9,990                 | Hidden, .env gated, price locked for life |
| Solo         | ₹2,499   | ₹24,990                | First full tier                           |
| Small        | ₹4,999   | ₹49,990                |                                           |
| Growth       | ₹9,999   | ₹99,990                |                                           |
| Scale        | ₹14,999  | ₹149,990               | Top self-serve                            |
| Enterprise   | Custom   | Custom                 | Contact sales                             |

### 8.2 Early Access Program

- **Price:** ₹999/month (locked for life while subscribed)
- **Products:** erix-crm + erix-laie ONLY
- **erix-flow:** NOT included — must upgrade to Solo minimum
- **Gate:** `.env EARLY_ACCESS_ENABLED=true`
- **Badge:** "Early Backer" on tenant console
- **Listing:** NEVER publicly listed
- **Lock condition:** If tenant downgrades or cancels, lock is lost permanently

### 8.3 Plan × Feature Gate Matrix

> ⚠️ Free tier: credits CANNOT bypass any hard cap.
> Upgrade required. No exceptions.
> All Free tier overages → hard block + upgrade prompt.

#### erix-crm

| Feature                    | Free | Early Access | Solo  | Small  | Growth    | Scale     | Enterprise                              |
| -------------------------- | ---- | ------------ | ----- | ------ | --------- | --------- | --------------------------------------- |
| Leads (total stored)       | 100  | 1,000        | 5,000 | 15,000 | 50,000    | 200,000   | Unlimited                               |
| Active pipeline stages     | 3    | 5            | 10    | 20     | 50        | Unlimited | Unlimited                               |
| Team seats                 | 1    | 2            | 3     | 5      | 10        | 25        | Unlimited                               |
| Active automation rules    | 3    | 10           | 25    | 50     | 100       | 500       | Unlimited                               |
| Custom events              | 1    | 5            | 10    | 25     | 50        | Unlimited | Unlimited                               |
| Visual workflow nodes/rule | 3    | 5            | 5     | 10     | 15        | 25        | Unlimited                               |
| Projects per lead          | 1    | 2            | 5     | 10     | Unlimited | Unlimited | Unlimited                               |
| Portal client accounts     | 5    | 20           | 50    | 200    | 1,000     | 5,000     | Unlimited                               |
| Invoices generated/month   | 10   | 50           | 200   | 500    | 2,000     | 10,000    | Unlimited                               |
| Payment collections/month  | 5    | 25           | 100   | 250    | 1,000     | 5,000     | Unlimited                               |
| Inbox channels connected   | 1    | 2            | 3     | 5      | 8         | 15        | Unlimited                               |
| Message templates          | 5    | 20           | 50    | 100    | 300       | Unlimited | Unlimited                               |
| Bulk broadcasts/month      | 0    | 5            | 20    | 50     | 200       | 1,000     | Unlimited                               |
| eSigns/month               | 3    | 10           | 25    | 75     | 200       | Unlimited | Unlimited + audit log + custom branding |
| API access                 | No   | Read only    | Full  | Full   | Full      | Full      | Full                                    |
| Webhook sink               | No   | 1            | 5     | 10     | 25        | Unlimited | Unlimited                               |
| White-label portal         | No   | No           | No    | No     | No        | Yes       | Yes                                     |

**Quota types:** All above are `hard_cap`. Overage action: `upgrade_prompt` (no credit bypass for Free tier features).

#### erix-laie

| Feature                  | Free | Early Access | Solo  | Small | Growth | Scale   | Enterprise |
| ------------------------ | ---- | ------------ | ----- | ----- | ------ | ------- | ---------- |
| Actor runs/month         | 0    | 50           | 200   | 500   | 2,000  | 10,000  | Unlimited  |
| Enrichment lookups/month | 0    | 100          | 500   | 2,000 | 10,000 | 50,000  | Unlimited  |
| LAIE Vault queries/month | 0    | 50           | 200   | 1,000 | 5,000  | 25,000  | Unlimited  |
| Bulk export rows/month   | 0    | 200          | 1,000 | 5,000 | 25,000 | 100,000 | Unlimited  |
| Concurrent actor jobs    | 0    | 1            | 2     | 3     | 5      | 10      | 20         |
| SEO finder runs/month    | 0    | 5            | 20    | 50    | 200    | 1,000   | Unlimited  |
| Custom actor support     | No   | No           | No    | No    | Yes    | Yes     | Yes        |
| Auto-sync to erix-crm    | No   | Yes          | Yes   | Yes   | Yes    | Yes     | Yes        |

**Quota type:** `credit_consumed` for overages (actor runs, enrichments, vault queries burn credits beyond cap).

#### erix-flow

| Feature                  | Free | Early Access | Solo     | Small    | Growth | Scale     | Enterprise |
| ------------------------ | ---- | ------------ | -------- | -------- | ------ | --------- | ---------- |
| Access                   | ❌   | ❌           | ✅       | ✅       | ✅     | ✅        | ✅         |
| Active flows             | —    | —            | 5        | 15       | 50     | 200       | Unlimited  |
| Flow runs/month          | —    | —            | 100      | 500      | 2,000  | 10,000    | Unlimited  |
| Steps per flow           | —    | —            | 10       | 25       | 50     | Unlimited | Unlimited  |
| Trigger types            | —    | —            | 3        | 5        | All    | All       | All        |
| Conditional branches     | —    | —            | Yes      | Yes      | Yes    | Yes       | Yes        |
| Cross-product connectors | —    | —            | CRM only | CRM+LAIE | All    | All       | All        |
| Error retry + DLQ        | —    | —            | No       | Yes      | Yes    | Yes       | Yes        |

**Gate:** `blocked` for Free and Early Access. No credit bypass.

> Free + Early Access: Hard blocked. No credit bypass.
> Early Access must upgrade to Solo minimum to access
> erix-flow. ₹999 price lock is permanently lost on upgrade.

#### erix-connect

| Feature              | Free | Early Access | Solo | Small | Growth | Scale | Enterprise |
| -------------------- | ---- | ------------ | ---- | ----- | ------ | ----- | ---------- |
| WhatsApp WABAs       | 0    | 1            | 1    | 2     | 3      | 5     | Unlimited  |
| Email accounts (SES) | 1    | 1            | 2    | 3     | 5      | 10    | Unlimited  |
| SMS connections      | 0    | 0            | 0    | 1     | 2      | 5     | Unlimited  |
| Razorpay accounts    | 0    | 1            | 1    | 2     | 3      | 5     | Unlimited  |
| Telegram bots        | 0    | 1            | 1    | 2     | 3      | 5     | Unlimited  |
| Connect API keys     | 0    | 0            | 2    | 5     | 10     | 25    | Unlimited  |

#### erix-storage

| Feature                | Free | Early Access | Solo  | Small  | Growth | Scale     | Enterprise |
| ---------------------- | ---- | ------------ | ----- | ------ | ------ | --------- | ---------- |
| Storage GB             | 0.5  | 2            | 5     | 15     | 50     | 200       | Custom     |
| CDN bandwidth GB/month | 1    | 5            | 20    | 50     | 200    | 1,000     | Custom     |
| Max file size/upload   | 5MB  | 25MB         | 50MB  | 100MB  | 250MB  | 500MB     | 1GB        |
| Image transforms/month | 50   | 500          | 2,000 | 10,000 | 50,000 | Unlimited | Unlimited  |

### 8.4 Credit System + Rate Card

Credits are a prepaid wallet, consumed for usage BEYOND plan quota or for per-unit billable actions.

**Free tier:** Credits CANNOT bypass hard caps. Upgrade required.

| Action                            | Credits consumed |
| --------------------------------- | ---------------- |
| WhatsApp message sent             | 1 credit         |
| Email sent (per message)          | 0.2 credits      |
| SMS sent                          | 2 credits        |
| AI response (LAIE, per 1K tokens) | 5 credits        |
| LAIE actor run (overage)          | 10 credits       |
| LAIE enrichment lookup (overage)  | 2 credits        |
| LAIE Vault export (per 100 rows)  | 5 credits        |
| erix-flow run (overage)           | 5 credits        |
| erix-storage overage per GB       | 50 credits       |

### 8.5 Credit Packs

| Pack    | Price (INR) | Credits | Bonus |
| ------- | ----------- | ------- | ----- |
| Starter | ₹499        | 500     | —     |
| Growth  | ₹999        | 1,100   | +10%  |
| Pro     | ₹2,499      | 3,000   | +20%  |

- **Auto top-up:** Tenant sets threshold (e.g. "top up when below 50 credits") + selects pack
- **Expiry:** 12 months rolling from purchase date
- **Payment:** Razorpay (INR only)

### 8.6 Add-On Catalogue

| Add-On                    | Price           | Eligible Plans |
| ------------------------- | --------------- | -------------- |
| Extra team seat           | ₹499/seat/month | Solo+          |
| Extra WhatsApp WABA       | ₹999/WABA/month | Solo+          |
| Extra storage 10GB        | ₹299/month      | All plans      |
| White-label console       | ₹2,999/month    | Scale+ only    |
| Custom portal domain      | ₹499/month      | Small+         |
| Dedicated LAIE actor      | ₹1,999/month    | Growth+        |
| Priority support SLA      | ₹999/month      | Small+         |
| API rate limit boost (2x) | ₹999/month      | Small+         |

### 8.7 Billing Scenarios

| Scenario                                  | Outcome                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Free tenant hits 100 lead cap             | Hard block + upgrade prompt. No credit bypass.                   |
| Solo tenant hits 25 automation rule limit | Upgrade prompt or wait for next cycle. No auto-unlock.           |
| Growth tenant burns all WA credits        | Auto top-up fires if enabled, else hard stop on WA sends.        |
| Early Access tenant wants erix-flow       | Must upgrade to Solo minimum. Loses ₹999 price lock permanently. |
| Scale tenant needs custom LAIE actor      | Purchase "Dedicated LAIE actor" add-on (₹1,999/mo).              |
| Enterprise tenant wants white-label + SSO | Custom contract, Razorpay or bank transfer.                      |

### 8.8 DB Schema (SQL)

```sql
-- Plans
CREATE TABLE ecodrix_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tier INT NOT NULL DEFAULT 0,  -- 0=free, 1=early, 2=solo, 3=small, 4=growth, 5=scale, 6=enterprise
  price_monthly_inr INT NOT NULL DEFAULT 0,
  price_yearly_inr INT NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  features JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan Limits (the gate matrix)
CREATE TABLE ecodrix_plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ecodrix_plans(id),
  product TEXT NOT NULL,         -- 'erix-crm', 'erix-laie', 'erix-flow', 'erix-connect', 'erix-storage'
  feature_key TEXT NOT NULL,     -- 'leads_total', 'actor_runs_month', etc.
  quota_value INT NOT NULL,      -- -1 = unlimited
  quota_type TEXT NOT NULL,      -- 'hard_cap', 'soft_cap', 'credit_consumed'
  overage_action TEXT NOT NULL,  -- 'blocked', 'top_up', 'upgrade_prompt'
  UNIQUE(plan_id, product, feature_key)
);

-- Subscriptions
CREATE TABLE ecodrix_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES ecodrix_organizations(id),
  plan_id UUID NOT NULL REFERENCES ecodrix_plans(id),
  billing_cycle TEXT NOT NULL,   -- 'monthly', 'yearly'
  status TEXT NOT NULL DEFAULT 'active',  -- active, past_due, cancelled, trialing
  is_early_access BOOLEAN DEFAULT false,
  payment_provider TEXT DEFAULT 'razorpay',
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Wallets
CREATE TABLE ecodrix_credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES ecodrix_organizations(id) UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  auto_topup_enabled BOOLEAN DEFAULT false,
  auto_topup_threshold INT DEFAULT 50,
  auto_topup_pack_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Transactions (append-only ledger)
CREATE TABLE ecodrix_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  type TEXT NOT NULL,            -- 'purchase', 'consume', 'expire', 'refund', 'bonus'
  amount INT NOT NULL,           -- positive = add, negative = deduct
  feature_key TEXT,              -- what consumed it ('whatsapp_send', 'laie_actor_run')
  balance_after INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Packs
CREATE TABLE ecodrix_credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_inr INT NOT NULL,
  credits INT NOT NULL,
  bonus_pct INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add-Ons
CREATE TABLE ecodrix_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly_inr INT NOT NULL,
  eligible_plans JSONB DEFAULT '[]',  -- ["solo","small","growth","scale","enterprise"]
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant Add-Ons (active subscriptions)
CREATE TABLE ecodrix_tenant_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES ecodrix_organizations(id),
  addon_id UUID NOT NULL REFERENCES ecodrix_addons(id),
  quantity INT DEFAULT 1,
  status TEXT DEFAULT 'active',  -- active, cancelled
  started_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(org_id, addon_id)
);

-- Usage Events (append-only, rolled up hourly)
CREATE TABLE ecodrix_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  product TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  units_used INT NOT NULL DEFAULT 1,
  credits_consumed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usage_org_product ON ecodrix_usage_events(org_id, product, feature_key, created_at);
```

### 8.9 Razorpay Integration Notes

- **Subscription creation:** `POST /subscriptions` with plan_id mapped from `ecodrix_plans.features._razorpay.{monthly|yearly}`
- **Payment verification:** HMAC-SHA256 on `payment_id|subscription_id`
- **Webhook (platform billing):** `/api/webhooks/razorpay/subscriptions` — handles charged, halted, cancelled, paused, resumed
- **Webhook (org payments):** `/webhooks/razorpay/org/:orgId` — tenant's own Razorpay for invoices/appointments
- **Credit top-up:** Creates a Razorpay order (not subscription), captures payment, credits wallet
- **Currency:** INR only, amounts in paise (÷100 for display)

---

## 9. Platform Roadmap Snapshot

> **Status verified against code 2026-06-26** (see `SERVER_AUDIT_REPORT.md`
> Parts F–H). Phase 1 and Phase 2 are now **complete**: the platform credit
> wallet, LAIE per-tenant keys, per-action credit consumption (via the quota
> overage seam), and the auto-topup low-balance sweep are all shipped. The only
> deferred sub-item is unattended auto-CHARGE, blocked on a saved Razorpay
> mandate (see the caveat under Phase 2 below) — auto top-up currently alerts
> rather than silently charges.

### Current (Shipped)

- erix-crm: Full CRM + inbox + automation builder + invoicing + client portal + projects
- erix-laie: Lead gen + enrichment + LAIE Vault (India) + AI qualification + **AI outreach kit generation** (WhatsApp hook + 3-msg email sequence + LinkedIn/Instagram DM; `generateOutreachKit` + `outreachKitWorker` + `laie_outreach_kits`)
- erix-flow: Visual flow builder + execution engine + cross-system nodes + **live run streaming** (`workflow-run-update` Socket.IO emits per node settle, via `stateSync`)
- erix-connect: WhatsApp + Email + Telegram + Razorpay + Meta Embedded Signup + External API keys + **batch send, delivery analytics, webhook logs + replay, usage metering, OAuth2 provider** (`infra/connect/routes/advanced.routes.ts`)
- erix-store: Full Redis/BullMQ replacement (cache, queue, pubsub, locks)
- erix-storage: R2-backed media with CDN
- **Platform credit/billing wallet** — `ecodrix_credit_wallets` + `ecodrix_credit_transactions` (append-only ledger) + `ecodrix_credit_packs`; atomic guarded debit/credit (`platform/services/creditWallet.service.ts`), Razorpay **order**-based top-up + idempotent verify (`createCreditTopupOrder` / `verifyCreditTopupPayment`), rate card (§8.4) via `costFor`/`consumeFeature`, and user routes `/api/platform/credits/*` (balance, transactions, packs, topup/order, topup/verify, auto-topup). Migration `0016_credit_wallets.sql` seeds the three packs.
- **LAIE per-tenant API keys** — `validateLaieKey` now accepts DB-backed `laie_api_keys` (hash + expiry + org-status checks) in addition to the static operator key, pinning `req.orgId`/`req.laieScopes` on success (§2.2).

### Phase 2 (Complete)

- **Per-action credit consumption — WIRED.** A policy layer
  (`platform/services/creditMeter.service.ts`) sits over the wallet with two
  modes (`enforce` / `best_effort`). It is integrated into the central quota
  seam (`shared/middleware/quota.ts`): when a plan feature is configured as
  `{ limit, overage: "credits", creditKey: "<rateCardKey>" }`, exceeding the
  limit charges the wallet (HTTP 402 + top-up prompt when out of credits)
  instead of a hard 429. Features **without** that config keep hard-blocking, so
  **Free-tier hard caps are never credit-bypassed**. Reachable today on every
  billable route that already uses `createQuotaMiddleware` — WhatsApp sends
  (`chat.routes`, `marketing.routes`, `ai.routes`), broadcasts, workflow runs,
  storage, LAIE audits. **Activation per tier is plan-config**: set the feature
  value to the overage shape in the plan `features` jsonb (no code change).
- **Auto top-up sweep — WIRED.** `platform/jobs/credit-autotopup.cron.ts`
  (`runAutoTopupSweep`, scheduled every 6h via `scheduleAutoTopupCron` in the
  cron registry) finds wallets with `autoTopupEnabled` + balance ≤ threshold +
  a selected pack, and raises a high-visibility **billing notification** with a
  top-up deep link.

> **Auto-CHARGE caveat (honest):** a fully unattended auto-charge needs a saved
> Razorpay mandate/customer token for ad-hoc wallet debits. The platform only
> stores a _recurring subscription_ mandate (`providerSubscriptionId`) for plan
> billing — there is no saved token for one-off wallet charges, and charging
> without an authorized mandate is not permitted. The sweep therefore alerts
> rather than silently charges; swap the notify call for
> `createCreditTopupOrder` + mandate capture once a saved-mandate concept exists.

### Phase 3 (Planned)

- Voice agent (SIP + DID + AI streaming) — FUTURE
- Connect: SMS connector (MSG91)
- Connect: Facebook Messenger full inbound→ERIX wiring (outbound + webhook receiver exist)
- LAIE: International markets (beyond India)
- Flow: Workflow marketplace

---

## 10. Platform Notifications (NOT erix-crm)

Notifications are a **platform-level** system, owned outside erix-crm. Per §2.1,
the CRM does **not** own notifications. They live in platform Postgres and work
identically across all db modes (platform / own-mongo / own-postgres).

**Ownership:**

- Service: `platform/services/notification.service.ts` (`NotificationService`)
- Typed event helpers: `platform/services/platform-notifications.ts`
- Storage: `ecodrix_notifications` (platform PG) — never per-tenant CRM DBs
- Real-time: Socket.IO → `platform:notification` + `platform:notification_count`
- Routes: `platform/routes/notifications.routes.ts` → mounted `/api/notifications`

**Categories:** `crm | billing | team | security | infra | product | automation | system`
**Severities:** `info | success | warning | error | critical`

**Service API:** `send`, `broadcast` (org-wide), `list`, `unreadCount`,
`markRead`, `markAllRead`, `dismiss`, `dismissAll`, `emitToSocket`.

**REST API:**

| Method | Path                             | Purpose                                             |
| ------ | -------------------------------- | --------------------------------------------------- |
| GET    | `/api/notifications`             | List (filters: category, unreadOnly, limit, offset) |
| GET    | `/api/notifications/count`       | Unread count (bell badge)                           |
| PATCH  | `/api/notifications/:id/read`    | Mark one read                                       |
| PATCH  | `/api/notifications/read-all`    | Mark all read                                       |
| PATCH  | `/api/notifications/:id/dismiss` | Dismiss one                                         |
| DELETE | `/api/notifications/dismiss-all` | Dismiss all                                         |

> Notifications are produced programmatically by platform services (billing,
> team, security, product, automation). They are not authored from the admin
> panel — the nearest admin control surface is Announcements + email Broadcast
> (`/admin/comms`).

---

## 11. Admin Panel Capabilities (`ECOD/admin/`)

Next.js App Router app. Pages call internal `/api/admin/*` routes, proxied to the
backend (`CORE_API_URL`) with `x-core-api-key` + staff identity headers
(`x-admin-staff-id/email/role`). LAIE relay routes proxy to `/api/laie/v1/relays*`.

What platform admins can manage:

| Capability                     | Status                                    | Route                                      |
| ------------------------------ | ----------------------------------------- | ------------------------------------------ |
| Plans + pricing                | Implemented (edit)                        | `/admin/plans`, `/admin/plans/[id]`        |
| Tenants + subscriptions        | Implemented (full lifecycle)              | `/services/clients`, `/admin/tenants/[id]` |
| Feature flags                  | Implemented (CRUD)                        | `/admin/flags`                             |
| WhatsApp / WABA                | Monitor-only                              | `/admin/whatsapp`                          |
| WhatsApp template approval     | Absent                                    | —                                          |
| LAIE engine                    | Monitor-only                              | `/admin/laie`                              |
| LAIE relays                    | Implemented (CRUD + tuning)               | `/admin/relays`                            |
| LAIE actor management          | Absent                                    | —                                          |
| Revenue                        | Implemented (analytics)                   | `/admin/revenue`                           |
| Billing                        | Implemented (trial/grandfather/reconcile) | `/admin/billing`                           |
| Payment ops                    | Implemented (refund/validate/retry)       | `/admin/payments`                          |
| Compliance (DSAR)              | Implemented                               | `/admin/compliance`                        |
| Security audit logs            | Implemented (+CSV)                        | `/admin/audit`                             |
| Activity logs                  | Implemented                               | `/admin/logs`                              |
| Announcements + broadcast      | Implemented                               | `/admin/comms`                             |
| Support tickets                | Implemented                               | `/admin/tickets`                           |
| Per-tenant Connect connections | Implemented                               | `/services/clients`                        |

> Detailed inventory, statuses, and key files: see
> `.Architecture/SERVER_AUDIT_REPORT.md` (Part D).

---

## 12. Webhook Architecture (Clarification)

- **No platform-level Meta webhook.** A single endpoint
  `/webhooks/meta/whatsapp` handles **all** orgs, routing internally by
  `phone_number_id`.
- Only **Razorpay** has a platform vs org split:
  - Platform billing: `/api/webhooks/razorpay/*` (in `platform/`)
  - Org payment gateway: `/webhooks/razorpay/org/:orgId` (in Connect)
- Webhook flow: Provider → Connect verifies signature → identifies tenant →
  calls ERIX SDK (`handleIncoming` / `EventBus.emit`) → ERIX stores + fires
  automations. **Connect never imports from `@flow/*`.**

---

## 13. Route Topology & Additional Surfaces (verified against code)

Single mount registry: `server/src/routes/index.ts` (`mountSyncRoutes` +
`mountAsyncRoutes`). Verified URL prefixes:

| Prefix                                                        | Module                                                                                               | Auth                                              | Source                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `/api/saas/*`                                                 | erix-crm (chat, images, storage, meet, marketing, ai, events, invoices, …)                           | `validateClientKey` (`x-api-key`+`x-client-code`) | `@erix/routes/*`, `@infra/*`                |
| `/api/crm/*`                                                  | erix-crm core                                                                                        | `validateClientKey`                               | `@erix/routes/crm/crm.router`               |
| `/api/laie/v1/*`                                              | erix-laie                                                                                            | `validateLaieKey` (`x-laie-key`, static env)      | `@laie/routes/*`                            |
| `/api/flow/v1/*`                                              | erix-flow                                                                                            | `tenantResolver` (inside router)                  | `@flow/routes/flow.routes`                  |
| `/api/connect/v1/*`                                           | erix-connect (connections, api-keys, advanced)                                                       | `tenantResolver`                                  | `routes/connect/*`, `@infra/connect/*`      |
| `/api/connect/v1/send/*`                                      | Connect external send                                                                                | `x-connect-key` (`validateConnectKey`)            | `@infra/connect/send/send.routes`           |
| `/api/connect/v1/payments`                                    | Tenant payment-gateway webhook                                                                       | per-`:orgId` signature                            | `routes/connect/payments-webhook.routes`    |
| `/api/erix/v1/*`                                              | **ERIX Automation Platform (Hono gateway)**                                                          | Hono-internal                                     | `services/api-gateway/index`                |
| `/api/notifications`                                          | Platform notifications                                                                               | `tenantResolver`                                  | `platform/routes/notifications.routes`      |
| `/api/admin/*`, `/erix-admin`                                 | Admin control plane (revenue, flags, plans, billing, payments, whatsapp, laie, compliance, audit, …) | `x-core-api-key` + staff headers                  | `platform/routes/admin/*`                   |
| `/api/platform/*`                                             | Plans, entitlements, subscriptions, checkout, billing, **credits (wallet)**, support                 | session/tenant                                    | `platform/routes/*`                         |
| `/api/portal/v1/*`                                            | **Public client portal** (own JWT, per project+tenant)                                               | portal-session JWT                                | `routes/portal/portal.routes`               |
| `/api/v1/email/*`                                             | **Public bearer-token email API**                                                                    | bearer token                                      | `platform/routes/saas/email.routes`         |
| `/api/saas/storage/*`, `/api/saas/images/*`                   | erix-storage                                                                                         | `validateClientKey`                               | `@infra/storage/routes/*`                   |
| `/webhooks/meta/*`, `/webhooks/telegram/*`, `/webhooks/ses/*` | Connect inbound webhooks                                                                             | signature/verify-token                            | `@infra/connect/webhooks/*`                 |
| `/webhooks/razorpay/org/:orgId`                               | Org payment-gateway webhook                                                                          | per-org HMAC (`payments` creds)                   | `@infra/connect/webhooks/razorpay.webhook`  |
| `/api/webhooks/razorpay/*`                                    | Platform billing webhooks (subscriptions)                                                            | signature                                         | `@platform/routes/admin/webhooks/*`         |
| `/api/ses`                                                    | Legacy SES SNS notification sink                                                                     | none (SNS)                                        | `@erix/routes/mail/ses-notification.routes` |
| `/api/saas/whatsapp`, `/api/saas/social`                      | **Legacy** inbound webhook URLs (kept for Meta-console back-compat; run alongside `/webhooks/*`)     | signature                                         | `@infra/connect/channels/*`                 |

### Two frameworks

The API is primarily **Express**. The **ERIX Automation Platform** is a separate
**Hono** app (`services/api-gateway/`) bridged into Express at `/api/erix/v1`
via a fetch-adapter shim (`mountErixAutomationGateway`). A Hono load failure is
caught and logged — it does not cascade to the rest of the API.

### Legacy top-level folders (tech debt)

`server/src/routes/` (the central mount registry + `connect/`, `portal/`,
`infra/` subfolders) and `server/src/services/` (`api-gateway/`, `mail/`,
`queue/`, `scheduler/`, `session-manager/`, `browser-pool/`, `actor-runtime/`,
…) overlap the domain folders. The mount registry's own header comment warns
against adding new top-level folders. Consolidation into the domain layout is a
tracked, non-blocking cleanup.
