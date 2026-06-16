# Blueprint & new_mvp.md — Documentation Audit

**Date:** June 2026 · **Scope:** `.Architecture/blueprint/*` (PRD, TRD, SCHEMA, ROADMAP, APP_FLOW, BUSINESS_MODEL) + `.Architecture/new_mvp.md`
**Method:** Cross-checked every architectural/schema/status claim against the live `ECOD/server`, `ECOD/saas`, `ECOD/admin`, `ECOD/packages/erix-api`, and the Postgres schema/migrations.

> Verdict: the docs are strong as **vision/GTM narrative** but have **drifted materially from the built system** on data architecture, infra protocol, product scope, and pricing. There are also **two conflicting "v2.0" doc sets** (`blueprint/` vs `new_mvp.md`) that disagree with each other. Treat both as out-of-date specs, not as a description of what exists.

---

## 0. Severity legend

- 🔴 **Critical** — doc describes the system in a way that is factually wrong about what's built; will mislead any engineer/agent.
- 🟠 **Major** — significant drift or internal contradiction; needs reconciliation.
- 🟡 **Minor** — naming/detail mismatch or stale aspirational item.

---

## 1. The two doc sets disagree (🔴 reconcile first)

`blueprint/` and `new_mvp.md` are BOTH labelled "v2.0 / June 2026" but describe different products:

| Dimension       | `blueprint/` (PRD/TRD/…)                    | `new_mvp.md`                                                          |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Product naming  | ERIX (WhatsApp CRM), LAIE, ERIX-FLOW        | ERIX-CRM, ERIX-FLOW, ERIX-LAIE + Connect/Storage/ErixStore infra      |
| Entry price     | ₹999 Starter (ERIX)                         | **No ₹999 tier — ₹2,499 minimum** ("eliminates low-value")            |
| Plan structure  | Per-product tiers (ERIX/LAIE/FLOW separate) | Unified Solo/Starter/Growth/Scale across all products                 |
| Revenue streams | 4 (SaaS, DFY, agency, reseller)             | **8 streams** (adds credits, add-ons, partner club, API, marketplace) |
| Voice agent     | Not present (future "ERIX Voice")           | Whole section + Aug 2026 launch plan                                  |
| Scope framing   | 3 products                                  | 3 products + 3 infrastructures                                        |

**Action:** pick ONE canonical blueprint. `new_mvp.md` is the newer thinking (pricing, streams, voice); `blueprint/*` is the older per-product model. Either fold `new_mvp.md` into the blueprint set or archive `blueprint/` as v1. Right now anyone reading "the blueprint" gets contradictory pricing and product names.

---

## 2. Data architecture — biggest drift (🔴)

Both doc sets state CRM data lives in **MongoDB per-tenant** (`ecodrix_${userId}`), e.g. SCHEMA.md §2 "Database-per-Tenant isolation for CRM data (MongoDB)", TRD §6, APP_FLOW (push-to-CRM creates MongoDB contacts).

**Reality in code:**

- The CRM is on **PostgreSQL** — `erix_leads`, `erix_conversations`, `erix_messages`, `erix_pipelines`, `erix_pipeline_stages`, `erix_automation_rules`, `erix_custom_event_defs`, `erix_event_logs`, `erix_notifications`, `erix_checkout_*`, etc. (`server/src/shared/db/schema/erix/*`).
- Tenant residency is handled by the **ErixAdapter** (`server/src/erix/lib/erix-adapter/` → `postgres-adapter.ts` + `mongo-adapter.ts` behind a `factory.ts`), not by a hard "one Mongo DB per user". Postgres is the default backend; Mongo is an optional residency mode.
- The platform itself migrated off Mongo (the `laie-platform-concern-extraction` spec demoted `laie_tenants`, moved identity to `ecodrix_organizations`, and there's a `backfill-platform-mongo` / `teardown-legacy-mongo` script set).
- `SCHEMA.md` MongoDB collection specs (`contacts`, `conversations`, `messages`, `deals`) do not correspond to the live `erix_*` tables that actually back the CRM.

**Impact:** SCHEMA.md is the most outdated doc — its PostgreSQL table list (`users`, `organizations`, `laie_jobs`, `laie_competitors`, `laie_content`, `flow_definitions`, `flow_runs`, `waba_accounts`, `plans`, `subscriptions`) uses names that mostly don't exist in the codebase.

### Table-name reality check (🟠)

| SCHEMA.md says     | Actual table(s)                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `users`            | `ecodrix_users`                                                                          |
| `organizations`    | `ecodrix_organizations`                                                                  |
| `members`          | `ecodrix_members`                                                                        |
| `audit_logs`       | `ecodrix_audit_logs`                                                                     |
| `notifications`    | `ecodrix_notifications`                                                                  |
| `laie_jobs`        | `laie_lead_jobs`                                                                         |
| `laie_competitors` | `laie_lead_competitors`                                                                  |
| `laie_content`     | (no single table; outreach in `laie_outreach_kits`, research in `laie_research_reports`) |
| `flow_definitions` | `flow_workflows` (flow engine schema under `migrations/flow/`)                           |
| `flow_runs`        | flow run/log tables in the flow engine, not `flow_runs` as specced                       |
| `waba_accounts`    | WABA/connect handled via `erix-connect` (`migrations/connect/`)                          |
| `laie_leads`       | ✅ `laie_leads` (matches — though columns differ)                                        |

Also undocumented anywhere in the blueprint: the **40+ live `laie_*` tables** (vault, suppression, run accounting, audits, ab tests, clusters, review intelligence, pipeline velocity, unlock/action ledgers) and the just-shipped **`laie_relays` / `laie_relay_config`** (Dynamic Relay Fabric).

---

## 3. ErixStore — protocol claim is fictional (🔴)

Both doc sets describe ErixStore as a **TCP service on port 6399 with a proprietary `ERIX.*` command namespace** (`ERIX.SET`, `ERIX.PUSH`, `ERIX.ENQUEUE`, `erixcli`, SQLite-backed).

**Reality:** the live client (`@ecodrix/erix-client`, used via `server/src/shared/lib/erix.ts`) is an **HTTP/WebSocket** client to a hosted service (`ERIX_STORE_URL` = `https://store.ecodrix.com`). Its API is method-based — `erix.set/get/del/incr`, `erix.hash.*`, `erix.queueV2.push/claim`, `erix.cache.*`, `erix.pubsub.*`, `setNx`, `getSet`, `multi()`/transactions. There is no `ERIX.SET key value` TCP protocol, no port 6399 in use, and no `erixcli` referenced in the server. The functionality (queue, cache, pub/sub, rate limit, locks) is real; the **protocol/port/CLI description is not**.

**Action:** rewrite the ErixStore sections to describe the actual HTTP/WS SDK surface, or clearly mark the `ERIX.*`/6399 design as "aspirational native protocol, not yet built."

---

## 4. API framework (🟡)

- TRD §1/§4 says "Hono (primary) + Express" and shows `app.route("/auth", …)` Hono routing as the server entry.
- **Reality:** the main API is **Express** (`createLaieRouter` and all `*.routes.ts` use `express.Router`; routes mounted `/api/laie/v1`, `/api/erix`, etc.). **Hono** is used in the **`services/api-gateway`** subsystem (its middleware uses `hono` `Context`). So it's "Express primary, Hono in the gateway" — the inverse of the TRD's "Hono primary."

---

## 5. Automation — single FLOW vs three engines (🟠)

The blueprint presents one clean **ERIX-FLOW** execution engine (PostgreSQL `flow_definitions` JSON + ErixStore queue worker).

**Reality (see `.MD/doc/erix_automation_flow_audit.md`):** there are **multiple coexisting automation systems** —

- CRM Automation Rules (`erix_automation_rules` / `erix_sequence_enrollments`),
- the Mongo/DAG `workflowEngine.service.ts` + ERIX-Store DAG `workflowEngineV2.service.ts` (behind `USE_ERIX_STORE_WORKFLOWS`),
- the visual `flow_workflows` builder,
- the newest `flow/engine` (`/api/flow/v1`) merge engine.

The blueprint's single-engine picture understates the real (and somewhat overlapping) automation surface. The unification plan already lives in `.MD/doc/erix_automation_unified_strategy.md` but isn't reflected in the blueprint.

---

## 6. Per-document scorecard

| Doc                 | Accuracy vs code | Main issues                                                                                                                                |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `PRD.md`            | 🟠 Medium        | Mongo-per-tenant security claim (§14) wrong; ₹999 pricing conflicts w/ new_mvp; product matrix mostly reasonable as intent                 |
| `TRD.md`            | 🟠 Medium        | Hono-primary (inverse); Mongo-per-tenant; ErixStore port/protocol fictional                                                                |
| `SCHEMA.md`         | 🔴 Low           | Most table names wrong; MongoDB collections don't reflect `erix_*`; missing 40+ laie tables + relay fabric                                 |
| `ROADMAP.md`        | 🟡 OK-as-plan    | Repo structure (`apps/console`) doesn't match actual (`ECOD/saas`, `ECOD/admin`, `ECOD/server`, `ECOD/packages`); otherwise fine as a plan |
| `APP_FLOW.md`       | 🟠 Medium        | Flows are reasonable UX intent, but "MongoDB push", `ERIX.SET`, single-engine FLOW are wrong mechanically                                  |
| `BUSINESS_MODEL.md` | 🟢 N/A (GTM)     | Financial projections — not code-verifiable; internally consistent; pricing conflicts with new_mvp's ₹2,499-floor model                    |
| `new_mvp.md`        | 🟠 Medium        | Best strategic doc; same ErixStore-protocol + Mongo-CRM mechanical errors; status matrix partly optimistic (see §7)                        |

---

## 7. new_mvp.md §16 status matrix — spot corrections (🟡)

Cross-checked the "MVP Feature Status Matrix" against code:

| Claim                                   | Reality                                                                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LAIE L4 AI Analyse — 🟠 Building        | Largely **built**: `runResearchAgent` (Gemini) + enrichment pipeline run in `scraperWorker.ts`; pain points exist on `laie_research_reports`. Closer to ✅/🟡 than 🟠. |
| LAIE L5 Outreach — 🔵 Planned           | **Built**: `runOutreachKitGeneration` + `laie_outreach_kits` table exist. Should be 🟡/✅.                                                                             |
| LAIE Scrape Queue — 🔵 Planned          | **Built**: `LAIE_PIPELINE_QUEUE` erix-store queue + `enqueueScrapeJob` (queue/inline modes). Should be ✅.                                                             |
| Connect — Razorpay/Stripe — 🟠 Building | `erix-connect` module + migration exist; checkout tables (`erix_checkout_*`) live. Verify OAuth depth, but infra is further than "building."                           |
| ErixStore — port 6399 SQLite            | Live as HTTP/WS hosted service (see §3), not 6399/SQLite locally.                                                                                                      |
| Voice Agent — 🔵 Planned (Aug)          | `laie/routes/voice.routes.ts` exists (intake stub); accurate as "planned/partial."                                                                                     |

Net: LAIE is **further along** than the matrix says (L4/L5/queue effectively shipped); the relay-fabric reliability layer (new) isn't listed at all.

---

## 8. Things the docs get right (keep)

- Next.js 15 + Tailwind + shadcn frontend; `@ecodrix/erix-api` SDK as the sole FE→BE bridge (real — admin uses `ecodAdmin` SDK, core key server-side). ✅
- Postgres + Drizzle for platform + LAIE data. ✅
- Cloudflare R2 storage, AWS SES email, Meta Cloud API (Tech Provider), Claude + Gemini AI split. ✅
- LAIE scraper stack: Playwright/patchright/Crawlee + multi-tier relays (and now the **dynamic relay fabric** — an evolution worth documenting). ✅
- GCP Cloud Run + Vercel + AWS; JWT 15min / refresh 30d auth. ✅
- The 8-stream revenue model and GTM/positioning narrative are coherent and useful as strategy.

---

## 9. Recommended fixes (priority order)

1. 🔴 **Reconcile the two doc sets.** Make `new_mvp.md` canonical (newer pricing/streams/voice) or merge; archive `blueprint/` as v1. Resolve the ₹999-vs-₹2,499 and product-naming conflict.
2. 🔴 **Rewrite SCHEMA.md from the live schema.** Generate it from `server/src/shared/db/schema/**` (platform `ecodrix_*`, `erix_*`, 40+ `laie_*`, `flow_*`, connect). Drop the MongoDB-collections section or reframe it as the optional Mongo residency adapter.
3. 🔴 **Fix the data-architecture story** in PRD §14 / TRD §6 / APP_FLOW: CRM is Postgres-first via the ErixAdapter, with Mongo as an optional per-tenant residency backend — not a hard "one Mongo DB per user."
4. 🔴 **Correct ErixStore** to the HTTP/WS SDK reality (or label the `ERIX.*`/6399/erixcli native protocol as not-yet-built).
5. 🟠 **Flip the framework note** to "Express primary; Hono in the api-gateway."
6. 🟠 **Replace the single-FLOW description** with the real multi-engine state + the unification plan from `.MD/doc/erix_automation_unified_strategy.md`.
7. 🟠 **Refresh ROADMAP repo structure** to the actual monorepo (`ECOD/{server,saas,admin,packages,services,laie,erix-store,infra}`).
8. 🟡 **Update new_mvp §16 status matrix** (LAIE L4/L5/queue → built; add relay fabric).

---

## 10. One-line summary

The blueprint is an excellent **product/GTM vision** but a **stale technical spec**: the CRM is Postgres (not Mongo-per-tenant), ErixStore is an HTTP/WS service (not a 6399 `ERIX.*` TCP protocol), the API is Express-primary, there are several automation engines (not one FLOW), the schema doc is largely renamed/obsolete, and the two "v2.0" doc sets contradict each other on pricing and product naming. Reconcile to one canonical doc and regenerate SCHEMA from code.
