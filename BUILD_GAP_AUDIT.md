# ECODrIx — Build-Gap Audit (what's missing / what to build)

> Date: 2026-07-08 · Basis: the **beta scope** (Option A = "CRM + Inbound
> Automation"; outbound/Flow deferred) and the **Power Pack proposal**
> (`POWER_PACK_PROPOSAL.md`). Reconciled against what shipped this cycle
> (`AUDIT_BETA_LAUNCH_2026-07.md` §0.1) and code read live this session.
>
> Purpose: separate **what still needs BUILDING** from what's already built,
> what's ops/decision, and what's deferred — so the next build is chosen on
> evidence, not vibes. Ruleset: `AGENTS.md` (ponytail — build only what the
> beta needs).

Legend: ✅ built · 🔨 needs build (code) · ⚙️ ops/config (not code) ·
🧭 decision · ⏸️ deferred (outbound, Option A).

---

## 0. Update 2026-07-08 — Tier-1 progress

- **B1 ✅ done** — Client Portal Inbox page built (`product/erix/portal/page.tsx`,
  team-side threads via the `portalInbox` SDK) + surfaced in the ERIX nav
  (Projects group). Documents/e-sign were already reachable per-project
  (`projects/[projectId]/documents`). No diagnostics.
- **B3 ✅ verified** — activation builder green (94 tests); recipes + checklist +
  funnel wired. Remaining is a manual fresh-tenant click-through (no code gap).
- **B2 ✅ DONE (2026-07-08)** — webchat built end-to-end: public ingress
  (`/v1/api/infra/connect/webhooks/webchat/:clientCode/{message,messages}`,
  rate-limited, reuses `ConversationSDK`), the public `/widget-frame` chat page,
  and the copy-paste embed snippet in Settings → Developer. v1 records visitor
  messages into the tenant inbox (reply from Client Portal); AI auto-reply is a
  later add. Documented in `usage.md` §12 (public-by-design).
- Remaining decision-free build: **B9** (storage quota/CDN verify — needs infra
  access). **B2/B4/B8** each still need one decision (see below).

---

## 1. Reconciliation with the Power Pack proposal (§3 "Add needed")

The proposal listed an "Add needed" per capability. Current truth:

| Power Pack capability                              | Proposal said add             | Status now                           |
| -------------------------------------------------- | ----------------------------- | ------------------------------------ |
| Website Automations (site event → rules)           | none                          | ✅ shipped                           |
| Social Growth Autopilot (comment→DM→lead→sequence) | template pack                 | ✅ 6 niche recipes added             |
| Omnichannel Inbox (WA/IG/email/Telegram)           | unify social→ConversationSDK  | ✅ unified this cycle                |
| AI Copilot (auto-reply, smart replies)             | gate to Power Pack            | 🔨 gating only (built, ungated)      |
| Lead Finder (LAIE discovery→CRM)                   | finish LAIE→CRM push          | ✅ bridge fixed + push drawer exists |
| Embed Anywhere (dashboard + chat widget)           | polish + docs                 | 🔨 polish + docs                     |
| Client Portal + e-Sign                             | UI verification + nav surface | 🔨 verify + surface                  |
| Metered credits                                    | none                          | ✅ + spend cap added                 |

**Takeaway:** most proposal "adds" are done. What genuinely remains to BUILD is
small and packaging-oriented, not core product.

---

## 2. What still needs BUILDING (code) — ranked

### Tier 1 — makes the beta claims _true_ (build before/at beta)

| #   | Gap                                                                    | Why it matters                                                                                                                                                                                                                                                                | Effort | Evidence                                           |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| B1  | 🔨 **Client Portal + e-Sign: surface in nav + verify the flow**        | Proposal lists it as a Power Pack capability + the auth showcase advertises it ("E-sign • document vault"). Backend (`portal.routes`, `project-documents.routes`, external `(portal)/portal` + `SignaturePad`) exists but the tenant-side management isn't surfaced/verified. | S–M    | `(portal)/portal/*`, `project-documents.routes.ts` |
| B2  | 🔨 **Embed polish + docs** (`@ecodrix/erix-react`, `@ecodrix/chatbot`) | A named wedge ("Embed Anywhere") + agency virality. SDKs exist (🟡). Needs a working embed snippet + scoped-key docs.                                                                                                                                                         | M      | `modules.md` SDKs 🟡                               |
| B3  | 🔨 **Activation loop end-to-end verify**                               | Recipes + checklist + funnel shipped; verify "connect → import recipe → fire" actually flows for a fresh tenant (no dead links, recipe import works).                                                                                                                         | S      | `ActivationChecklist.tsx`, templates               |

### Tier 2 — monetization (build when gating decision is made)

| #   | Gap                                                                                                                         | Why                                         | Effort | Notes                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B4  | 🔨 **Power Pack gating** — apply `planGuard` to AI copilot / Lead Finder / Website Automations / Embed; seed Pro plan flags | Turns built capability into a sellable tier | M      | Mechanism EXISTS (`planGuard` + entitlements). Needs 🧭 gate-in-beta decision + tier→flag map. Risk: gating open features can cut off users if flags unset. |

### Tier 3 — outbound (⏸️ deferred by Option A; build only if reprioritized)

| #   | Gap                                                                       | Why                                   | Effort | Notes                                                                      |
| --- | ------------------------------------------------------------------------- | ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| B5  | ⏸️ **Mount ERIX Flow** (`createFlowProductRouter`)                        | The documented flagship outbound loop | L      | `routes/v1/product/index.ts` has `// TODO: wire createFlowProductRouter()` |
| B6  | ⏸️ **Task 6 — flow-node worker routing** (`flow.node → dispatchFlowNode`) | Makes Flow runs execute via the queue | M      | Prereq to retire A″/System B                                               |
| B7  | ⏸️ **Retire A″ + System B engines**                                       | Remove ~remaining dead engine code    | S      | Blocked on B6 + `workflow_execute` traffic = 0                             |

> Note: the **approval/review queue is NOT missing** — `FlowReviewTable.tsx`
> (approve/reject/edit → `/runs/:runId/approve`) and LAIE's `LeadDrawer` +
> `usePushToErix` already exist. They're just behind unmounted Flow (B5). The
> earlier audit overstated this as "Missing".

### Tier 4 — production hardening (code slices)

| #   | Gap                                        | Why                   | Effort | Notes                                                                                                         |
| --- | ------------------------------------------ | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| B8  | 🔨 **Error tracking + backlog alerting**   | Monitored prod        | S–M    | Queue/DLQ dashboard shipped; needs 🧭 provider (Sentry-style) + DSN, then wire the error handler + alert rule |
| B9  | 🔨 **Cloud storage quota/CDN edge verify** | Media limits truthful | S      | `infra/storage` 🟡                                                                                            |

---

## 3. NOT a build — ops / config / decision (blocks launch, not code)

| Item                                                                                       | Type |
| ------------------------------------------------------------------------------------------ | ---- |
| Apply `0019`/`0020`/`0021` to prod + deploy                                                | ⚙️   |
| Live money-path smoke test (Razorpay)                                                      | ⚙️   |
| Security checklist (`ADMIN_ALLOWED_EMAILS`, live keys, CORS, rate limits)                  | ⚙️   |
| Meta app id + ES config id + Tech-Provider review (unlocks embedded signup, already built) | ⚙️   |
| Legal (privacy/ToS/refund/DPDP) + WhatsApp opt-in/unsubscribe + template approval          | ⚙️🧑 |
| Power Pack: gate-in-beta? + tier→feature+price map                                         | 🧭   |
| Outbound in beta scope? (reverses Option A)                                                | 🧭   |
| Alerting provider choice                                                                   | 🧭   |

---

## 4. Suggested build order

**Before beta (make the claims true):** B3 (verify activation) → B1 (portal
surface) → B9 (storage verify). All small, all in the inbound wedge.

**At/just after beta (revenue + safety):** B4 (Power Pack gating, once the gate
decision lands) → B8 (error tracking, once provider chosen) → B2 (embed polish).

**Only if outbound is reprioritized:** B5 → B6 → B7 (mount Flow → wire Task 6 →
retire A″/B).

---

## 5. Bottom line

The inbound beta is **code-complete** for its core wedge. The genuine remaining
BUILD work is **small and mostly packaging/hardening** (B1–B4, B8–B9) — not new
product. The biggest apparent gaps from the earlier audit (approval queue, LAIE
push, inbox unification) are **already built or fixed**. The largest untouched
surface (outbound Flow, B5–B7) is **deliberately deferred** by the beta scope.

**Nothing needs to be built _before_ the beta can launch** — the launch path is
ops (§3). The Tier-1 builds (B1–B3) make the marketed feature set fully truthful;
Tier-2+ are revenue/hardening once their one decision each is made.
