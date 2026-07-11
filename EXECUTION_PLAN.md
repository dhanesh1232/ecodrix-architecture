# ECODrIx — Unified Execution Plan (Audit × Power Pack)

> Date: 2026-07-07 · Merges `AUDIT_BETA_LAUNCH_2026-07.md` (what to fix) with
> `POWER_PACK_PROPOSAL.md` (what to sell). One sequenced roadmap: stabilize →
> ship the built wedge → package the Power Pack → expand to outbound.
>
> **Owner legend:** 🧑 = you (ops / prod / business decision) · 🤖 = agent
> (in-repo code, verifiable) · 👥 = both.
> **Positioning north star:** _"The client-operations OS for freelancers &
> micro-agencies — discover leads, automate WhatsApp/Instagram/email, run the
> full pipeline, and wire it to your own website — one place, SMB price."_

---

## Phase 0 — Stabilize & de-risk (P0, gate to any launch)

No GTM, no marketing, no paid users until this phase is green.

| #   | Task                                                                                                                                                            | Owner | Effort | Done when                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ---------------------------------------------------------------- |
| 0.1 | Generate migration files for all schema drift (start with `erix_custom_event_defs.icon/color`, `erix_automation_rules.canvas/execution_count/last_executed_at`) | 🤖    | S      | Migration SQL committed; `drizzle-kit` diff clean vs schema      |
| 0.2 | Apply migrations to staging + prod; verify no drift                                                                                                             | 🧑    | S      | `drizzle-kit push`/apply run on every env; core flows return 200 |
| 0.3 | Live money-path smoke test (subscription, credit top-up + idempotency, overage 402, wallet adjust, Razorpay webhook)                                            | 🧑    | M      | All 5 paths pass on live Razorpay (test→live)                    |
| 0.4 | Security checklist (`ADMIN_ALLOWED_EMAILS`≠`*`, live keys+webhook secret, CORS restricted, rate limits, AES-256 at rest)                                        | 🧑    | S      | `PRODUCTION_READINESS.md` §6 fully checked                       |
| 0.5 | **Beta scope decision** — recommended: "CRM + Inbound Automation" (built); defer outbound                                                                       | 🧑    | —      | Positioning locked; marketing copy matches built scope           |

**Exit criteria:** build-clean, migrations applied, money paths verified, scope locked.

---

## Phase 1 — Ship the built wedge + consolidate (P1)

Everything here is built or safe code. This is the beta product.

| #   | Task                                                                                                                          | Owner | Effort | Done when                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ---------------------------------------------------------------------- |
| 1.1 | Beta surface = CRM + Connect (WA/IG/email/Telegram) + Automations + Website Triggers + Billing                                | 👥    | —      | Nav/onboarding reflect only these                                      |
| 1.2 | **Consolidate credentials** — accept Connect key (`email:send`) on `/email/send`; deprecate `ecodrix_api_tokens` Bearer       | 🤖    | M      | One credential story: scoped Connect keys; Bearer marked legacy        |
| 1.3 | **Unify inbox** — route social inbound (IG/FB/Telegram) through `ConversationSDK` so all channels share one inbox             | 🤖    | M      | Social + WhatsApp appear in the same inbox; tests pass                 |
| 1.4 | **Builder clarity** — badge triggers "Callable from your website" (custom events, fire-URL) vs "Fires automatically" (system) | 🤖    | S      | Builder visually distinguishes the two; fire-URL panel already shipped |
| 1.5 | Frictionless channel connect (WhatsApp/IG embedded signup) as onboarding centerpiece                                          | 👥    | S      | "Connect a channel" is step 1 of onboarding                            |
| 1.6 | Refresh `modules.md` to real status (registration, onboarding, field builder, portal, e-sign, adapters)                       | 🤖    | S      | Doc matches code                                                       |

**Exit criteria:** one inbox, one credential model, a builder that teaches the website-trigger, docs true.

---

## Phase 2 — Activation & Power Pack packaging (P1→P2)

Turn built capability into attraction + revenue.

| #   | Task                                                                                                                                                    | Owner | Effort | Done when                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | --------------------------------------------------------- |
| 2.1 | **Niche recipe gallery** (#1 activation lever) — extend `AUTOMATION_TEMPLATES` into per-niche playbooks (salon, coach, D2C, clinic) with 1-click import | 🤖    | M      | ≥8 niche recipes; import → configure → activate in <2 min |
| 2.2 | Onboarding flow: "connect a channel → import a recipe → see it fire"                                                                                    | 👥    | M      | New tenant reaches first automation fire in one session   |
| 2.3 | **Free LAIE audit funnel** — public "get your free business audit" → signup                                                                             | 👥    | M      | Public audit page converts to workspace creation          |
| 2.4 | **Power Pack tier** — gate AI copilot + Lead Finder + Website Automations + Embed via existing entitlements; wire credit costs                          | 👥    | M      | Pro tier unlocks the bundle; credits meter AI/sends       |
| 2.5 | Embeddable dashboard + chat widget polish (`@ecodrix/erix-react`, `@ecodrix/chatbot`, scoped keys)                                                      | 👥    | M      | Agency can embed under a scoped key with docs             |

**Exit criteria:** a new user hits the "aha" fast; Power Pack is a purchasable bundle.

---

## Phase 3 — Outbound expansion (conditional on 0.5)

Only if the outbound "Autopilot" story is chosen. Larger build.

| #   | Task                                                                                                                                                                                                                                                                                  | Owner | Effort | Done when                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | ---------------------------------------------------------- |
| 3.1 | ✅ **LAIE → ERIX lead push** — import bridge repointed from the dead legacy `/api/crm/*` mount to the canonical `/v1/api/product/erix/crm/*`; source (`laie_scraper`) + outreach kit already mapped into lead metadata; idempotence preserved; path asserted in the integration test. | 🤖    | M      | ✅ Discovered/enriched leads land in CRM with source + kit |
| 3.2 | **Approval / review queue UI** (approve/reject/edit/snooze)                                                                                                                                                                                                                           | 👥    | L      | Reviewed leads enter sequences                             |
| 3.3 | Mount + finish **ERIX Flow** playbook surface (or express playbooks via existing sequences)                                                                                                                                                                                           | 👥    | L      | ICP → discover → approve → sequence → reply-pause works    |
| 3.4 | Package "Lead Finder + Autopilot" into the Power Pack headline                                                                                                                                                                                                                        | 👥    | S      | GTM updated once the loop is real                          |

**Exit criteria:** the documented `MVP.md` outbound loop is a real product surface.

---

## Phase 4 — Polish & fast-follow (P2→P3)

| #   | Task                                                    | Owner | Effort |
| --- | ------------------------------------------------------- | ----- | ------ |
| 4.1 | Client portal + e-Sign UI verification + surface in nav | 👥    | M      |
| 4.2 | Cloud storage (R2) quota/CDN edge verification          | 👥    | S      |
| 4.3 | Infra dashboard frontend (`/infra/*`)                   | 👥    | M      |

---

## Start-here (first executable batch) — ✅ COMPLETE (2026-07-08)

The moment Phase 0.5 (scope) is decided, the agent can run this batch — all
in-repo, each verified — in order:

1. ✅ **0.1** schema-drift migration files (`0019_erix_schema_drift.sql`; idempotent, verified vs local DB).
2. ✅ **2.1** niche recipe gallery (6 niche recipes added to `AUTOMATION_TEMPLATES`; 94 builder tests pass).
3. ✅ **1.4** builder "callable from your website" badges (`TriggerSourceBadge` in `NodeConfigPanel`).
4. ✅ **1.2** credential consolidation (`/email/send` accepts Connect key `email:send`/master key via `externalAuth`; Bearer deprecated with `Deprecation`/`Warning` headers).
5. ✅ **1.3** inbox unification (both inbound social paths record through `ConversationSDK` via shared `recordSocialConversation`; 4 tests pass).
6. ✅ **1.6** `modules.md` refresh (deprecated API tokens, added Connect keys/custom events/event-trigger API/lead policy/unified inbox; flow engine marked retired).

**Remaining owner tasks:** apply `0019` to Supabase (**0.2**) _before_ deploying
the server, then push `master` (server) + Vercel (saas). Ops (**0.2–0.4**) run in
parallel; scope decision (**0.5**) first.

---

## Phase 5 — Launch readiness (non-code, runs alongside Phase 0–1)

These are NOT product/engineering scope — they are the compliance, legal, and
operational gates required to run a **paid beta with real users and messaging**.
Items 5.1–5.2 are hard launch blockers; 5.3–5.4 are operational must-haves.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                   | Owner | Effort | Priority | Done when                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ | -------- | ------------------------------------------------------------------------------------------- |
| 5.1 | **Messaging compliance & consent** — WhatsApp (Meta Tech-Provider status, template approval, 24h window, opt-in capture), Instagram messaging policy, email one-click unsubscribe + consent. Wire opt-in + unsubscribe into the send/automation flows.                                                                                                                                 | 👥    | M      | P0       | Every outbound channel has documented opt-in + working unsubscribe; Meta templates approved |
| 5.2 | **Legal to take money + PII** — privacy policy, terms of service, refund policy, and India DPDP / Razorpay data-processing stance.                                                                                                                                                                                                                                                     | 🧑    | M      | P0       | Policies published + linked in app; payment + PII storage is legally covered                |
| 5.3 | 🟡 **Observability & alerting** — ✅ ErixStore **queue/DLQ dashboard** shipped (`GET /admin/analytics/queues` + Background Queues card). Remaining: error tracking (Sentry-style), uptime/backlog **alerting** (needs provider choice), log retention.                                                                                                                                 | 🤖👥  | M      | P1       | Queue depth/DLQ visible; error + backlog + downtime alerting pending a provider             |
| 5.4 | **Backups & migration rollback** — automated DB backups + a tested restore, and a rollback plan for each prod migration (ties to 0.1/0.2).                                                                                                                                                                                                                                             | 🧑    | S      | P1       | Backup runs on schedule; restore verified once; each migration has a down-path              |
| 5.5 | ✅ **Activation instrumentation** — first-touch funnel table `ecodrix_activation_events` (migration `0021`) + `activationService`; emits at signup / channel_connected / automation_created / automation_fired / paid; `GET /admin/analytics/activation`; **admin Analytics page funnel view shipped**. `paid` fires on subscription activation AND first credit top-up. 5 tests pass. | 🤖👥  | M      | P1       | ✅ Funnel counts + conversion visible in the admin analytics view                           |
| 5.6 | ✅ **AI/send cost controls** — per-tenant daily spend cap (hard stop in `CreditWalletService.consume`) + approaching-cap billing alert. Config UI in Credits page; `PATCH …/credits/spend-cap`. Migration `0020`. 13 wallet tests pass.                                                                                                                                                | 🤖    | S      | P1       | ✅ A runaway automation is hard-stopped at the cap; an alert fires at the threshold         |

**Exit criteria:** compliant to send, legal to charge, observable in prod,
recoverable from failure, and measurable on activation.

---

## Phase mapping (where 5.x slots in)

- **5.1, 5.2** run during **Phase 0** — they gate launch alongside migrations +
  money-path verification.
- **5.3, 5.4** run during **Phase 0→1** — operational safety before real users.
- **5.5** lands in **Phase 2** — you need funnel data to judge activation.
- **5.6** lands in **Phase 1→2** — before you expose credit-metered AI/sends.

---

## Deployment mechanics — how a change reaches production

ECODrIx is a monorepo with four deploy surfaces, each with its own path to prod:

| Surface                        | Pipeline                                                                                               | Runs on                                                                                                           | How a change lands                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ECOD/server` (API + worker)   | push `master` → Cloud Build (`ecodrix-server-master` → `cloudbuild.yaml`) → builds `ecodrix-api` image | **API** on Cloud Run (`ecodrix-api`); **worker** (`ecodrix-jobs`) on GCE VM `ecodrix-infra` from the _same_ image | commit → push → CI build → new Cloud Run revision + worker redeploy             |
| `ECOD/saas` (customer app)     | Next.js build/deploy (Vercel)                                                                          | Vercel                                                                                                            | push → Vercel build → deploy                                                    |
| `ECOD/packages/erix-api` (SDK) | workspace package imported by saas                                                                     | bundled into saas                                                                                                 | ships on saas rebuild; publish only if external integrators use the npm package |
| Supabase Postgres (DB)         | migrations applied **manually** (`drizzle-kit` / `psql`)                                               | Supabase                                                                                                          | **not automatic** — run the migration before/with the server deploy             |

### How each change type flows

- **Server code** (credential consolidation 1.2, inbox unify 1.3, cost caps 5.6):
  commit → push `master` → Cloud Build → new `ecodrix-api` revision **and** GCE
  worker redeploy (same image). No DB change. Rollback = redeploy prior revision.
- **Schema/migrations (0.1):** apply SQL to Supabase **first**, _then_ deploy the
  server that expects the columns. Deploying code before the column exists is
  exactly the drift that 500'd custom-events + automations locally. Manual by design.
- **saas UI** (recipe gallery 2.1, builder badges 1.4): frontend-only. Recipes are
  static templates compiled into the bundle → **no server deploy**, just a
  saas/Vercel deploy.
- **SDK (`erix-api`):** ships when saas rebuilds (workspace import); bump+publish
  only for external consumers.
- **Runtime config (no deploy):** `autoCreateLeads` (`service_config` via settings
  API), plan/entitlement gating (admin → DB rows), connect keys (via API) take
  effect immediately.

### Safe rollout sequence for any change

```
local (hot-reload verify) → commit → [migrate Supabase if schema change]
→ push master → Cloud Build → Cloud Run + GCE worker → smoke-test money/health
→ saas/Vercel deploy → verify UI
```

### Ordering rules

- **Migrations before server deploy** (0.1 → 0.2) or the drift 500s return.
- **Server + saas deploy as a pair** for features spanning both (e.g. credential
  consolidation = server route + Developer UI).
- **Frontend-only items** (recipes, badges) ship independently and fast — early wins.
- **Config items** (entitlements, `autoCreateLeads`) flip live with no deploy —
  good for beta toggling.

### Boundary (owner split, restated)

🤖 makes + verifies **code** locally (diagnostics/tests) and hands you build-clean
commits + exact migration SQL + smoke steps. 🧑 owns **push to `master`, Supabase
migrations, Cloud Build/Vercel deploys, and prod env** — deliberately the gate,
since they cross into prod credentials and live data.

---

## One-page summary

- **Phase 0 = don't-skip safety** (mostly yours: migrate, verify money, secure)
  **+ compliance/legal gates (5.1, 5.2)**.
- **Phase 1 = ship what's built** + kill fragmentation (mostly mine: code)
  **+ observability/backups (5.3, 5.4)**.
- **Phase 2 = attract + monetize** (recipes, onboarding, Power Pack gating)
  **+ activation analytics + cost caps (5.5, 5.6)**.
- **Phase 3 = outbound**, only if you choose it (bigger build).
- **Phase 4 = polish.**

**Two truths:** (1) the platform is closer to revenue than the docs suggest —
the _product_ work is **stabilize + assemble + name**, not build-from-scratch;
(2) but a _paid beta_ also needs the **non-code launch gates** in Phase 5 —
compliance, legal, observability, backups — which no amount of code replaces.

**Absolute first moves:** (a) 🧑 decide beta scope (0.5); (b) 🧑 kick off
compliance + legal (5.1, 5.2) since they have external lead time; (c) 🤖 start
the code batch (0.1 → 2.1 → 1.4 → 1.2 → 1.3 → 1.6) on your green light.
