# ERIX Suite — Server Capability Audit & Launch Blueprint

> Scope: `ECOD/server`. Goal: (1) audit what the server can do today, (2) blueprint the
> beta launch (ERIX-CRM + ERIX-Connect, ERIX-Flow as a custom add-on), (3) remove the
> hard-coded CRM automation and promote ERIX-Flow to the single global automation/
> orchestration layer, (4) restate the server as a **modular monolith** (not a big-ball
> monolith).
>
> Status: **audit + proposal**. No code deleted yet — the removal in Part C is destructive
> and waits on the decisions in Part F.

---

## 0. Executive summary

The server is already a **well-structured monolith** with clean top-level seams
(`platform / product / infra / shared / routes`). It is not a big ball of mud — the module
boundaries you want for a modular monolith mostly exist. Three gaps stand between "today"
and "launch":

1. **Automation is split across three overlapping systems.** A prior consolidation
   (`flow/engine/dispatch.ts`) already funnels every event through one idempotent entry
   point, but it still fans out to **System A** (hard-coded CRM rule engine,
   `erix/services/crm/automation.service.ts` + `erix/services/automation/*`) and
   **System B** (`workflow-trigger.ts`) _in addition to_ the Flow engine. This is the
   "hard-coded automation" you want gone. ERIX-Flow (System C) is the keeper.

2. **Launch surface is wider than the launch scope.** LAIE (lead scraping/enrichment,
   ~30 tables, relay fabric, browser pool) and the full automation UI ship in the same
   process. For a CRM + Connect beta they should be **flag-gated off**, not deleted.

3. **Module boundaries are convention, not enforced.** Products import each other through
   `@erix/*`, `@flow/*`, `@infra/*` path aliases with no dependency direction rule. A
   modular monolith needs an explicit, enforced dependency graph and per-module enable
   flags.

Recommendation: keep the single deployable, delete System A/B, make Flow the only engine,
gate LAIE + Flow behind product-enablement flags, and codify the module boundaries. This is
mostly **deletion and boundary-tightening**, not a rewrite.

---

## PART A — AUDIT: what the server does today

### A.1 Runtime shape

- Node 20 + TypeScript 5.9, **Express 5** (primary) with a small **Hono** gateway for the
  LAIE actor SDK. Socket.IO for realtime (inbox, flow run updates).
- Postgres (Drizzle) is the system of record; **ErixStore** (external HTTP/WS service) is
  queue + cache + pub/sub + locks + rate-limit (Redis/BullMQ replacement); Cloudflare R2
  for media. MongoDB is legacy/deprecated (Postgres-only since "Phase 7").
- `server.ts` binds the port immediately, mounts sync routes, then mounts async routes +
  in-process workers/cron in the background (Cloud Run cold-start safe).
- Route composition is centralized in `routes/index.ts` → `versions/v1.ts`, everything
  under one canonical tree `/v1/api/*`. Legacy `/api/*` paths survive only as externally
  registered exceptions (Google OAuth, Meta webhooks, LAIE gateway alias).

### A.2 Capability inventory by module

| Module               | Path                  | What it can do today                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERIX-CRM**         | `src/product/erix`    | Leads (CRUD, scoring, merge, custom fields/16 types, segments), pipelines/stages, unified inbox, projects + client portal (auth, dual-thread messages, documents), invoices (PDF, payments, export, GST), proposals, checkout/commerce, appointments, forms, campaigns/marketing, referrals, feedback, analytics/revenue, **plus the hard-coded automation surface (see A.4)**. |
| **ERIX-Flow**        | `src/product/flow`    | No-code DAG automation engine: 21 built-in node types + custom webhook/HTTP nodes, idempotent dispatch, delays/before-event/wait-for-event/approval, per-node analytics, templates, capability gating, frequency caps/quiet hours, run history + retry-from-failed. The single event dispatcher (`dispatch.ts`) lives here.                                                     |
| **ERIX-LAIE**        | `src/product/laie`    | Lead discovery/scraping (Maps, JustDial, Sulekha, IndiaMART…), validation, enrichment, AI pain-point analysis, outreach prep, self-managing relay/proxy fabric (AWS Lambda + CF Workers auto-provision), browser pool, actor runtime, vault, ~30 `laie_*` tables, 8 cron jobs.                                                                                                  |
| **ERIX-Connect**     | `src/infra/connect`   | Channel abstraction + credential vault (AES-256). Providers: WhatsApp (Meta Cloud), Email (SES/SMTP/Gmail), Instagram, Facebook, Telegram, Google (Meet/Calendar), Payments (Razorpay/Stripe). Owns the **ConversationSDK** (one inbox, all channels), webhooks (Meta/SES/social), send facade, API keys, usage/analytics, OAuth.                                               |
| **ERIX-Storage**     | `src/infra/storage`   | R2-backed CDN media: presigned upload, image transforms, per-tenant prefix isolation, bandwidth tracking + quota, AI image description.                                                                                                                                                                                                                                         |
| **ErixStore client** | `src/shared/lib/erix` | Wrapper over the external queue/cache/pubsub service.                                                                                                                                                                                                                                                                                                                           |
| **Editor**           | `src/infra/editor`    | Editor capabilities + entitlement gating (website/page editor surface).                                                                                                                                                                                                                                                                                                         |
| **Platform**         | `src/platform`        | Auth (JWT + refresh, OAuth, email verify, reset), orgs/tenants, members/roles, billing + Razorpay subscriptions, entitlements + plan gates, credits/wallet/metering, notifications (DB + Socket.IO), onboarding, personas, products/plans, tenant deletion + purge, webhooks delivery, cron (revenue snapshot, credit auto-topup, subscription lifecycle).                      |
| **Shared**           | `src/shared`          | Drizzle schema (5 domains), ~35 middlewares (auth tiers, tenant resolve/scope, quota, rate-limit, idempotency, signing, versioning, security), variable resolution engine, crypto/field-encryption, utils.                                                                                                                                                                      |

### A.3 Auth tiers (already segmented)

| Surface                                          | Gate                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `/v1/api/platform/auth/*`                        | public → issues JWT                                                   |
| Product/CRM (`/product/erix/*`)                  | `tenantAuth` (x-api-key + x-client-code / session)                    |
| Connect (`/infra/connect/*`)                     | `tenantResolver`                                                      |
| Event ingestion (`/product/erix/events/trigger`) | `externalAuth("events:emit")` scoped Connect key or tenant master key |
| Flow (`/product/flow/*`)                         | `tenantResolver`                                                      |
| Portal (`/product/erix/portal/*`)                | portal Bearer JWT                                                     |
| Admin/ErixStore                                  | `x-erix-admin-secret` / platform-admin                                |

### A.4 The automation reality (the core of this project)

Automation currently exists as **three systems behind one dispatcher**:

```
event source (CRM action / webhook / /events/trigger / schedule)
        │
        ▼
EventBus.emit ──► dispatchEvent()  [flow/engine/dispatch.ts]   ← ONE idempotent claim
        │
        ├─ System A: runAutomations()  ← HARD-CODED rule engine
        │     erix/services/crm/automation.service.ts
        │     erix/services/automation/{actionExecutor,sequenceEngine,
        │       condition-evaluator,workflowEngineV2,nodeCatalog,unifiedResolve}.ts
        │     → REST: /product/erix/crm/automations[...], /sequences,
        │       automation-dashboard, automation-history
        │     → tables: erix_automation_rules
        │
        ├─ System B: triggerWorkflows()  ← fan-out to visual workflows (legacy bridge)
        │     erix/services/automation/workflow-trigger.ts
        │     → tables: flow_workflows (legacy), workflow-execute queue
        │
        └─ System C: startFlow()  ← ERIX-FLOW engine (KEEP)
              flow/engine/* → flow_* tables, flow.routes.ts
```

Findings:

- The double-fire bug was already fixed by the single idempotency claim; A + B + C run
  _behind_ it. But A and B are exactly the **hard-coded, non-customizable** automation you
  want removed.
- `dispatch.ts` already contains the seam to make C the only path: `runInline` re-points
  the trivial ops (add_tag, move_stage, set_field, assign, reply_template) at the **shared
  Flow action library** (`flow/engine/actions`), and `startFlow` starts named Flow
  definitions. The inline branch is wired-but-dormant precisely because A still runs.
- **Custom events already exist** (`/product/erix/crm/custom-events`, `EventDefService`,
  `erix_custom_event_defs`). This is the "customized" trigger vocabulary you want — it just
  needs to feed Flow directly instead of the hard-coded rule matcher.
- ConversationSDK (in Connect) is already the channel-agnostic send/receive surface Flow
  nodes call. So "Flow drives conversations for CRM + Connect" is a small wiring change, not
  new infrastructure.

Conclusion: the groundwork for "delete hard-coded automation, keep Flow, make it global"
is **already laid**. This is a removal + rewiring, not a build.

---

## PART B — LAUNCH SCOPE

| Product          | Beta launch                  | How                                                                                                                                                  |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERIX-CRM**     | ✅ ship                      | Core CRM minus the automation-rules UI/engine (Part C).                                                                                              |
| **ERIX-Connect** | ✅ ship                      | All channels + ConversationSDK + credential vault.                                                                                                   |
| **ERIX-Flow**    | ⚙️ ship as **custom add-on** | Entitlement-gated. It becomes the _only_ automation surface; CRM users without the add-on get event ingestion + custom events but no visual builder. |
| **ERIX-LAIE**    | ⛔ defer                     | Flag-gate the routes, cron, workers, browser pool, relay fabric off for beta. Keep code in-repo; do not deploy-enable.                               |
| **ERIX-Storage** | ✅ ship                      | Needed by CRM inbox media + portal.                                                                                                                  |

Everything stays in **one deployable** (modular monolith). "Off" = product-enable flag =
routes unmounted + workers unregistered, not code deleted.

---

## PART C — REMOVE HARD-CODED AUTOMATION, GLOBALIZE FLOW

### C.1 Delete (System A + System B)

| Area                | Files / surfaces                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM rule engine     | `erix/services/crm/automation.service.ts` (keep only the **pure `matchRules` / `normalizeRule`** if we still route rules → Flow; delete `runAutomations` + execution) |
| Legacy executors    | `erix/services/automation/{actionExecutor,sequenceEngine,workflowEngineV2,condition-evaluator,nodeCatalog,unifiedResolve,automationRouter}.service?.ts`               |
| System B bridge     | `erix/services/automation/workflow-trigger.ts` + `workflow-execute` queue/worker                                                                                      |
| CRM automation REST | `erix/routes/crm/automation.routes.ts`, `automation-dashboard.routes.ts`, `automation-history.routes.ts`, `sequence.routes.ts` (+ their mounts in `crm.router.ts`)    |
| CRM automation SDK  | `erix/sdk/automation.sdk.ts` `triggerSequence` / `executeAction` (keep event-def + event-log query methods)                                                           |
| Worker              | `registerAutomationWorkers` in `server.ts` (System A/B worker)                                                                                                        |
| Data                | `erix_automation_rules` (+ legacy `flow_workflows` if unused by Flow) — migrate/drop **after** code stops reading them                                                |

### C.2 Keep + rewire

- **Event ingestion** `/product/erix/events/trigger` — the one external entry point. Keep;
  point its dispatch at Flow only.
- **Custom events** `/product/erix/crm/custom-events` + `EventDefService` — this is the
  customizable trigger registry. Keep; it becomes the trigger vocabulary for Flow.
- **`dispatch.ts`** — collapse to a single downstream: remove `runRules` + `runWorkflows`,
  keep `startFlow` + `runInline` (now the only paths). Idempotency, metering, frequency
  caps stay.
- **ConversationSDK** (Connect) — already the send/receive seam. Flow's channel nodes and
  the conversation trigger both use it, giving you "Flow drives conversations for CRM +
  Connect" for free.
- **Flow shared action library** `flow/engine/actions` — the single residency-aware
  implementation for add_tag/move_stage/send_whatsapp/etc. Both inline dispatch and visual
  nodes resolve here.

### C.3 Flow as the global orchestration layer

Promote Flow from "product" to a **global capability** consumed by CRM, Connect, and future
features:

- **Triggers (global):** CRM events, Connect inbound (conversation.received across all
  channels), custom events, webhooks, schedules, manual.
- **Actions (global):** CRM ops (upsert/tag/stage/field/assign), Connect sends (all
  channels via ConversationSDK), email, AI nodes, store artifact, HTTP/custom.
- **Consumers:** CRM (lifecycle automations), Connect (auto-reply, routing, escalation),
  and "extra features" (e.g. review requests, follow-ups) build as Flow templates instead of
  bespoke services.

Net effect: one engine, one action library, one trigger vocabulary. Users customize via the
Flow canvas + custom events instead of the fixed rule list.

---

## PART D — MODULAR MONOLITH TARGET

The layout already implies the target. Codify it:

### D.1 Dependency direction (enforced, one-way)

```
shared        ← depended on by everyone, depends on nothing internal
  ▲
infra (connect, storage, store, editor)   ← platform primitives + channels
  ▲
platform (auth, billing, entitlements, orgs)
  ▲
product (erix-crm, flow, laie)            ← may depend on infra + platform + shared
```

Rules:

- Products **never** import other products directly. CRM ↔ Flow talk through events
  (`/events/trigger` + dispatch) and the Flow SDK, not by importing each other's services.
- Connect stays product-agnostic (it already hosts ConversationSDK as infra, reading the
  neutral data-plane adapter — keep that seam).
- `shared` holds only cross-cutting code (db schema, middleware, utils, variable engine).
- Enforce with an import-boundary lint rule (e.g. Biome/eslint `no-restricted-imports` on
  path aliases, or `dependency-cruiser` in CI) so violations fail the build.

### D.2 Module manifest + enable flags

Each product/infra module exposes a small manifest: `{ id, routes(), workers(), crons(),
requires: capabilities[] }`. `server.ts` + `routes/index.ts` mount a module **only when its
product-enable flag is on** (`features.ts`). Beta = CRM + Connect + Storage on; Flow gated by
entitlement; LAIE off. This turns "launch scope" into config, not code churn.

### D.3 Optional (later): workspace packages

`pnpm-workspace.yaml` already exists. If you want hard boundaries, graduate `shared`,
`connect`, and `flow` into workspace packages (`@ecodrix/shared`, `@ecodrix/connect`,
`@ecodrix/flow`) so the compiler enforces the public surface. Not required for launch —
lint-enforced aliases are enough. Defer unless boundary drift becomes real.

### D.4 What NOT to do

- Do **not** split into microservices. The blast radius (shared DB, ErixStore, auth,
  entitlements) is not worth it for a beta; the modular monolith gives you the isolation you
  asked for without the ops cost.
- Do **not** delete LAIE. Flag it off.

---

## PART E — SEQUENCING (when approved)

Order matters (migrations before code that stops reading columns):

1. **Flag-gate LAIE + Flow** (features + module manifests). Verify beta boots CRM + Connect
   only. (Reversible, no deletion.)
2. **Rewire `dispatch.ts`** to Flow-only (drop `runRules`/`runWorkflows`); keep
   `/events/trigger` + custom events feeding it. Run the flow engine test suite.
3. **Delete System A/B** code + routes + worker (Part C.1). Fix references. `pnpm type` +
   tests.
4. **Wire Connect conversation triggers** into Flow (auto-reply/routing as templates).
5. **Data migration**: drop `erix_automation_rules` (+ legacy `flow_workflows` if orphaned)
   _after_ step 3 ships and reads nothing. Idempotent, with down-path.
6. **Add import-boundary lint** to CI to lock the modular structure.

Each step is independently shippable and reversible up to step 5.

---

## PART F — DECISIONS NEEDED FROM YOU (before I touch code)

1. **Rule → Flow bridge:** Delete `erix_automation_rules` entirely (pure Flow going
   forward), or keep the _pure_ `matchRules` so a saved "rule" auto-starts a Flow? (Recommend:
   keep custom events + Flow only; drop rules table.)
2. **Existing tenant data:** Are there production tenants with live `erix_automation_rules` /
   `flow_workflows` rows that need migrating to Flow definitions, or is this pre-launch
   greenfield (safe hard-drop)?
3. **Flow entitlement:** Is Flow a paid add-on (entitlement flag) or on-for-all-beta?
4. **LAIE:** Confirm fully off for beta (routes + cron + workers + relay fabric).
5. **Scope of my next step:** Want me to start with Part E step 1–2 (reversible: flag-gate +
   dispatch rewire) and stop for review before the deletions in step 3?

---

_Audit basis: `server.ts`, `routes/index.ts`, `versions/v1.ts` tree, `product/{erix,flow,laie}`,
`infra/connect`, `flow/engine/dispatch.ts`, CRM automation routes/services, ConversationSDK,
ARCHITECTURE.md/README.md. No runtime behavior was changed._
