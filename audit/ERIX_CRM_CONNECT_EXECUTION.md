# ERIX-CRM + Connect — Execution Plan (Lead → Cash)

**Type:** Execution checklist (NOT a spec). Pick up and start — no re-investigation.
**Scope:** `erix-crm` + `erix-connect` only. Zero new features. LAIE/FLOW untouched.
**Goal:** Lead → Deal → Project → Invoice → Payment → Signed Contract works for one
real tenant (Lakshmi Lavanyah, recurring-invoice).
**Date:** 2026-07-13
**Method:** code trace + mechanical greps; every item cites `file:line`.

> **Verified reality:** the money-loop (invoice → payment link → webhook → paid)
> and recurring-invoice generation are **already built and wired**
> (`webhook.routes.ts:255-320`, `platform/jobs/cron.ts:82`). The launch blockers
> are **empty dashboards** (analytics stubs) and an **invisible gateway-connect
> prerequisite** — not the payment plumbing.

---

## Execution log — 2026-07-13

**Corrections after code trace (audit over-flagged):**

- Analytics were **not** all zeros — overview/funnel/forecast/sources/leaderboard/
  WhatsApp were already real. Only 5 advanced metrics were stubbed.
- **P1.1 SDK-bypass = all false positives.** Verified each: `NodeConfigPanel:1081`
  & `automation/events:81` build a **display** curl/webhook URL (not a fetch);
  `documents:112` PUTs to a **presigned R2 URL** (correct); `erix/page.tsx` is a
  **server component** (RSC convention); `EmailTemplates`/`EmailApiConsole` show
  the API base URL. **No code changes needed** — data layer is SDK-compliant.

**Done:**

- [x] P0.1 — **ALL 5** analytics stubs done (`analytics.service.ts`):
      `getScoreDistribution`, `getPredictiveConversionScore`, `getAvgTimeInStage`,
      `getPipelineVelocity`, `getActivityHeatmap`. The last needed a new org-wide
      `activities.countByDayAndType(orgId,{since,until})` adapter method — added to
      the `ErixAdapter` interface + `PostgresAdapter` (SQL group-by day+type).
- [x] P0.2: gateway-not-connected → actionable "Open Connect" toast — `InvoiceActions.tsx`.
- [x] P2 recurring-invoice owner notification — `recurring.service.ts`.
- [x] P2 **stage-history persistence (keystone)** — `moveStage` now records the
      outgoing stage's `{stageId, enteredAt, leftAt}` into `erix_leads.stage_history`
      (columns pre-existed, no migration; capped 200). Fixes the data-loss item
      AND unblocked the two velocity metrics. `postgres-adapter.ts`.

- [x] P2.1 **deal→project as an OPT-IN automation action** (not hardcoded on
      deal-won — many tenants never run client projects). Added `create_project`
      to `ActionExecutor` (the builder engine's dispatcher) + flipped the
      catalog node `coming_soon`→`ready` + aligned config to `nameTemplate`
      (supports `{{lead.firstName}}`). Tenants wire it behind any trigger.
      `actionExecutor.service.ts`, `nodeCatalog.ts` (ruleExecutor already had it).
- [x] P2.2 **payment→automation event** (not hardcoded contract — real-world:
      tenant decides). `markInvoicePaidByLinkId` now emits an invoice-scoped
      `invoice.paid` CRM event (with lead linkage) via the existing
      `emitCrmEvent`; mapped `invoice.paid`→`invoice_paid` in the eventBus.
      Tenants wire "when invoice paid → create project / send contract / thank-
      you". `webhook.routes.ts`, `eventBus.service.ts`. (Generic
      `payment.captured` was already emitted at line 184.)

- [x] P1.2 **`@laie/lib/postgres` → `@shared/db/postgres`** — repointed **71**
      erix/connect files (incl. tests) off the `@deprecated` shim: renamed
      `getLaieDb`→`getDb`, `LaieDb`→`Db`, import path → `@shared/db/postgres`.
      0 `@laie/lib/postgres` imports and 0 `getLaieDb` refs remain in
      erix/connect. Verified via broad per-file diagnostics (20+ files across
      services/routes/jobs/adapter/channels) — all clean.
      NOTE: the shim stays for platform/laie/flow (out of audit scope); remove
      it once those migrate too. Full server `tsc --noEmit` PASSED clean.

**Launch-blocking work complete.** Verified: **full server `tsc --noEmit`
passes clean** (whole-project, `NODE_OPTIONS=--max-old-space-size=6144`) — this
validates all server changes incl. the 71-file DB repoint across the dep graph.
Frontend `tsc` clean.

**⚠️ Still PENDING (polish/cleanup — NOT launch-blocking):**

- [x] **P0.2 proactive variant** — DONE. `InvoiceActions.tsx` now reads the
      Connect `payments` provider state up-front (`listConnections()`, same
      pattern as `ConnectorGrid.stateOf`, 60s cache) and, when not connected,
      swaps the "Payment Link" button for a "Connect to collect" CTA that routes
      to `/infra/connect/payments`. One control both disables the dead-end action
      AND surfaces the prerequisite (defaults optimistic → no CTA flash while
      loading; the reactive toast still backstops any race). Frontend diagnostics
      clean.
- **P2 Segment refresh + Activity/timeline "PG ports" — WON'T DO (YAGNI).**
  Re-reviewed: NOT broken stubs. `segment.refreshSegment`/`getSegmentMembers`
  fully work (page leads + evaluate rules in-memory via `ConditionEvaluator`);
  `activity.getActivities` works (cap-and-slice window). The
  `TODO(postgres-migration)` notes are **SQL-side performance optimizations**
  (push the filter into the adapter) that only matter at a scale the SMB
  launch tenant won't hit. Per "no speculative refactors / no new features
  until 3 paying customers," deferred until real load demands it. Not broken,
  not launch-blocking.
- [ ] **Manual critical-path test** — needs a live stack + connected gateway;
      not executable from static analysis.

The checkboxes in the P0/P1/P2 sections below are the ORIGINAL plan; where they
diverge from the Execution log above, the log is authoritative (e.g. deal→project
was done as an opt-in automation action, not a stage→won hook).

Follow-ups: commit (all uncommitted) + full server `tsc`/build before merge.

---

## Order of execution

Do P0 → P1 → P2. Each task is self-contained. Check the box, run the verify step, move on.

---

## P0 — blocks a convincing Lakshmi launch (≈10–14h)

### P0.1 — Implement CRM analytics (kill the zeros) · 8–12h

- **Where:** `server/src/product/erix/services/crm/analytics.service.ts:585,601,614,623,643`
- **Problem:** stage-velocity, pipeline-velocity, conversion buckets, activity-by-day
  are `TODO(postgres-migration)` **zero-valued stubs** → overview/dashboards show 0.
- **Do:**
  - [ ] Port each `$group`/`$bucket` aggregation to the PG adapter (`@erix/lib/erix-adapter`) using drizzle `sql` aggregates over `erix_leads` / `erix_lead_activities`.
  - [ ] `analytics.sources()` already works — mirror its adapter pattern.
  - [ ] Keep the SDK response shape identical (frontend `OverviewCharts` already consumes it).
- **Verify:** overview page shows non-zero once seed/real data exists; `tsc` clean.

### P0.2 — Surface "connect a payment gateway" in the invoice flow · 2h

- **Where (server, already correct):** `services/invoice/payment.service.ts:96-101` throws `PaymentGatewayNotConnectedError` when no `payments` Connect credential.
- **Where (frontend gap):** `app/[slug]/(product)/product/erix/invoices/*`, `components/erix/invoices/InvoiceSettingsForm.tsx`
- **Problem:** Lakshmi can't collect until Razorpay is connected; failure only shows as an error after she tries.
- **Do:**
  - [ ] Read Connect `payments` connection state via the SDK; if ≠ `connected`, render a "Connect Razorpay/Stripe" CTA linking to `manage/settings/developer/connect/payments` (or the Connect payments surface) **before** the "Generate payment link" button.
  - [ ] Disable "Generate payment link" until connected.
- **Verify:** with no gateway → CTA shown, button disabled; after connect → link generates.

---

## P1 — compliance / isolation (fast, mechanical) (≈7h)

### P1.1 — Remove SDK-bypass direct server calls · 4h

Route all through `@ecodrix/erix-api` (`useEcod()` / `ecod.request`). No raw `fetch`/`getBackendUrl`/`NEXT_PUBLIC_BACKEND_URL` in product UI.

- [ ] `app/[slug]/(product)/product/erix/page.tsx:29,105` — `getBackendUrl()` + `fetch('/api/me')` → `ecod.platform.users.me.get()`
- [ ] `app/[slug]/(product)/product/erix/automation/events/page.tsx:81` — direct backend URL
- [ ] `components/erix/automation/builder/NodeConfigPanel.tsx:1081`
- [ ] `components/connect/EmailTemplates.tsx:772`
- [ ] `components/connect/EmailApiConsole.tsx:825`
- [ ] `app/[slug]/(product)/product/erix/projects/[projectId]/documents/page.tsx:112` — raw `fetch(url)` (doc upload; route via SDK or the storage upload-url flow)
- **Verify:** `grep -rnE "getBackendUrl|NEXT_PUBLIC_BACKEND|fetch\(" components/erix components/connect app/[slug]/(product)/product/erix | grep -v refetch` returns nothing meaningful.

### P1.2 — Repoint shared DB off the LAIE namespace · 3h

- **Where:** every erix service imports `getLaieDb` from `@laie/lib/postgres` — e.g. `services/invoice/payment.service.ts:29`, `services/proposal/delivery.service.ts:21`, `services/automation/{workflow-trigger,unifiedResolve}.ts`.
- **Problem:** violates product isolation (erix coupled to laie package path).
- **Do:**
  - [ ] Re-export the shared accessor from `@shared/db` (e.g. `export { getLaieDb as getDb } from ...`) and repoint erix/connect imports. Mechanical, no logic change.
- **Verify:** `grep -rn "@laie/lib/postgres" server/src/product/erix server/src/infra/connect` → empty; server diagnostics clean.

---

## P2 — flow-chaining + cleanup (≈14–16h)

- [ ] **Deal-won → auto-create Project** (currently manual). Hook stage→`won` in `services/crm/lead.service.ts` / pipeline route to create+link a project. · 3h
- [ ] **Payment-paid → contract/sign-request** (currently manual). Emit an ErixStore event from `webhook.routes.ts:255+` that the project portal consumes to open a sign request. · 3h
- [x] **Recurring-invoice owner notification** — DONE: `NotificationService.broadcast` (billing/info) on auto-generation, fire-and-forget. `services/invoice/recurring.service.ts`.
- [ ] **Lead stage history** — persist `stageHistory`/`enteredStageAt` (lost in Mongo→PG). `services/crm/lead.service.ts:357`. · 2h
- [ ] **Segment refresh** PG port — `services/crm/segment.service.ts:106,155`. · 3h
- [ ] **Activity/timeline** PG port — `services/crm/activity.service.ts:124,262,312`. · 3h

---

## Do NOT touch

- LAIE, FLOW code (no "improve while I'm here").
- ErixStore internals (`@shared/lib/erix`) — no confirmed blocking bug.
- Payment webhook / recurring cron — already correct.
- Any `*rollback*` / `*drop*` migration.

---

## Manual critical-path test (run against local stack + a connected gateway)

Blocking runtime checks not executable from static analysis — run once P0 lands:

1. [ ] Create lead → appears in pipeline.
2. [ ] WhatsApp thread sync (send/receive) → conversation shows in inbox.
3. [ ] Move deal stage → persists + (after P2.1) project created.
4. [ ] Generate invoice → payment link created on tenant Razorpay.
5. [ ] Pay link → webhook flips invoice `paid` + owner notification.
6. [ ] Recurring template → next invoice auto-generates at cron (or trigger `recurringInvoiceJob` manually).
       Record pass/fail + repro per step.

---

## Rollup

| Bucket    | Hours     |
| --------- | --------- |
| P0        | 10–14     |
| P1        | 7         |
| P2        | 14–16     |
| **Total** | **31–37** |

**Ship gate:** P0.1 + P0.2 done → Lakshmi's recurring-invoice tenant is production-real.
