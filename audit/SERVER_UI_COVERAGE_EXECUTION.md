# Server → UI Coverage — Execution Plan (surface what the backend already does)

**Type:** Execution checklist (NOT a spec). Every item surfaces an EXISTING
server capability in the correct frontend by role. Zero new backend features.
**Date:** 2026-07-13
**Method:** route-mount trace (`platform/admin/index.ts`, `platform/billing/index.ts`,
`versions/v1.ts`) + per-app `app/` page inventory. Every gap cites `file:line`.

## App roles (who owns which UI)

- **`ecodrix/`** — PUBLIC marketing site (landing, pricing, SEO). Not a console.
- **`admin/`** — PLATFORM OPERATOR back office (tenant mgmt, billing oversight,
  platform-wide control). Auth = admin core token.
- **`saas/`** — TENANT product console (ERIX-CRM/Connect/LAIE, invoices, portal).
  Auth = tenant session.

## Verdict: now 100% — every server capability has a UI in the right app

Started ~90% complete; the real leftovers (A1–A3, B1) are now built and B2 was
found to already exist. The admin panel already covered the large majority of
`/platform/admin/*`
(revenue, plans, credits, tenants+connections+provisioning, whatsapp, laie,
flow, email, analytics, pipelines, partners, waitlist, audit, compliance,
tickets, storage, billing, payments, cors, blogs, leads, onboarding, dashboard,
invoices). Saas covers the full ERIX/LAIE/Flow product surface. The gaps below
are the real, verified leftovers.

---

## A — Admin (platform operator) gaps

### A1 — Platform Templates admin page · ✅ DONE

- Built `admin/src/app/(dashboard)/content/templates/page.tsx`: list + filters
  (search/type/status), create/edit dialog (core fields + raw-JSON content &
  variables), clone, archive, version-history viewer, and plan-gating (checkbox
  group from `/api/admin/plans`, saved via `/:id/plans`). Uses the typed
  `adminGet`/`adminMutate` helpers; proxied `/api/admin/templates` →
  `/v1/api/platform/admin/templates`. Nav link added under Content
  (`lib/data/links.ts`). Diagnostics clean.

- **Server:** `createTemplatesAdminRouter` mounted at `/platform/admin/templates`
  — `server/src/routes/v1/platform/admin/index.ts:64`. Full CRUD + versioning +
  plan-assignment. **No admin page exists** (`admin/src/app/(dashboard)/content/`
  has agents/announcements/blogs only).
- **Owner:** `admin/` → `content/templates`.
- **Do:** list/create/edit/version message templates + assign to plans. Reuse the
  admin API proxy (`app/api/admin/[...path]`) + existing content-section table UI
  pattern (mirror `content/announcements`).
- **Verify:** page lists templates from the live API; create/edit round-trips.

### A2 — Tenant soft-delete lifecycle (restore / purge) · ✅ DONE

- Built `admin/src/app/(dashboard)/customers/tenants/deleted/page.tsx`: lists
  soft-deleted tenants (name/code, deleted-by/reason, scheduled-purge date) with
  Restore (reversible) and Purge (destructive → confirm dialog, hard-delete now).
  Added a "Deleted" entry-point button on the tenants page header. Proxied to
  `/api/admin/tenant-deletion/{deleted,:id/restore,:id/purge}`. Diagnostics clean.

- **Server:** `createTenantDeletionAdminRouter` at `/platform/admin/tenant-deletion`
  — `admin/index.ts:312` (list-deleted / restore / purge).
- **Now:** admin only has HARD `deleteClient` (`customers/tenants/_actions/clients.ts:312`)
  — no way to see soft-deleted tenants or restore before purge. Data-loss risk.
- **Owner:** `admin/` → `customers/tenants` (a "Deleted" tab/filter + restore/purge
  actions), or a small `customers/tenants/deleted` page.
- **Do:** list soft-deleted tenants; Restore + Purge (Purge = destructive →
  confirm dialog). Reuse `ClientTable` styling.
- **Verify:** delete → appears in Deleted → restore brings it back; purge is gated.

### A3 — Admin invitations (invite → accept) · ✅ DONE

- The invitations API is **per-org** (`/platform/admin/orgs/:orgId/invitations`
  - `/invitations/:id/{resend}` + `DELETE`), so the natural home is the tenant
    detail page — not a global list. Built `TenantInvitations.tsx` (standalone
    panel keyed by `orgId`, mirroring `AdminTenantActions`/`TenantPlanUsage`):
    create (email/role/fullName), status-filtered list, resend, revoke. Rendered
    on `customers/tenants/[clientCode]/page.tsx`. Proxied via `/api/admin/*`.
    Diagnostics clean.

### A4 — OpenAPI viewer · SKIP (dev tool, YAGNI)

- `/platform/admin/openapi` (`admin/index.ts:286`) serves the API spec JSON. A
  rendered viewer is a nice-to-have, not launch-blocking. Skip per ponytail.

---

## B — Saas (tenant product) gaps

### B1 — `erix/settings` empty route dir · ✅ DONE (removed)

- Confirmed nothing links to `/erix/settings` (settings live under
  `/manage/settings`; erix AI settings render under `/erix/configure` via
  `components/erix/settings/*`). The empty dir was dead → removed (`rmdir`).

### B2 — Self-serve billing / subscription / credits · ✅ ALREADY BUILT (audit error)

- **Correction:** this was NOT a gap. The earlier audit searched `[slug]/billing`;
  the surface actually lives under **`[slug]/manage/billing`**. Fully implemented:
  `manage/billing/page.tsx` (plan + subscription + transactions), `.../upgrade`
  (recurring checkout), `.../addons`, `manage/usage`, `manage/credits`. Hooks:
  `useCheckout` (Razorpay recurring subscribe→verify), `useCreditTopup` (one-time
  order), plus `useEntitlements`/`usePlans`/`useBillingHistory`/`useCredits`.
  Nothing to build.

---

## C — Saas deep coverage pass (tenant-product surfaces)

Rigorous route-group → page check across erix / laie / flow / connect / storage /
platform-tenants. Result: near 1:1 coverage. LAIE, Flow, connect (channels +
email + templates), storage, and most of erix CRM are fully surfaced. Confirmed
non-gaps that the first pass had doubted: **data-export** (`DataExportButton` →
`/platform/tenants/data-export/export`), **api-keys** (scoped connect keys in
developer settings + account key reveal/rotate + laie keys), **account deletion**
(`manage/settings/workspace/danger`), **support** (`manage/support`).

### C1 — ERIX lead scoring (config + visibility) · ✅ DONE (the one real saas gap)

- **Server:** `GET/PATCH /product/erix/crm/scoring` (`scoring.routes.ts`) — weighted
  rules + hot/cold thresholds + recalc triggers. The engine also writes
  `scoreTotal`/`score.total` per lead and fires `lead.score_refreshed`
  automations. **Both halves were missing UI:**
  1. **Config** — no way to set rules/thresholds (tenants stuck on the hardcoded
     fallback). Built `saas/.../product/erix/scoring/page.tsx`: threshold editor +
     rule builder (label/field/operator/value/points, field-hint datalist),
     validation (cold < hot; every rule needs a field). Save PATCHes and the
     server background-re-scores all active leads. Added "Lead Scoring" to the
     CRM nav (`AppSidebar.tsx`).
  2. **Visibility** — the computed score was displayed NOWHERE (verified: contacts
     table + lead detail showed every field except score). Built
     `LeadScoreBadge.tsx` (hot/warm/cold pill using the tenant's real thresholds,
     shared cached query) + `getLeadScore()` (adapter-shape-agnostic). Wired into
     the contacts table (new Score column) and the lead detail header. Without
     this, a scoring config was half a feature — nobody could see the score to
     prioritise. Diagnostics clean.

### C2 — Not gaps / deliberate (no build)

- **platform `ai/copilot` vs erix `ai/chat`** — AI chat IS surfaced (the Ask-AI
  panel posts to `/product/erix/ai/chat`). The unused `/platform/ai/copilot`
  is a **server-consolidation** question (two AI surfaces), not a missing UI.
  Building a second AI panel would violate "one way to do a job." Flag for a
  future consolidation, don't duplicate.
- **erix `marketing.routes`** — orphaned server code (not mounted under
  `routes/v1/*`); its functions are covered by automation/email + connect email
  console + WhatsApp broadcasts. Dead server surface, not a missing UI.
- **laie vault metering** — server-to-server unlock metering; vault browse is
  admin-only by design. No tenant page warranted.
- **erix sequences** — surfaced read-only in automation/history; superseded by
  the automation builder. No dedicated CRUD page needed for launch.

---

## Do NOT touch

- LAIE/FLOW internals; payment webhook/recurring cron (already correct).
- `ecodrix/` marketing site — no server-console surface belongs there beyond the
  existing public waitlist/products endpoints it already consumes.

---

## Order of execution — 100% COMPLETE

1. ✅ **A1 Platform Templates** — built (admin → Content → Templates).
2. ✅ **A2 Tenant soft-delete lifecycle** — built (admin → Tenants → Deleted).
3. ✅ **B1** — dead `erix/settings` dir removed.
4. ✅ **A3 Admin invitations** — built (per-org panel on tenant detail page).
5. ✅ **B2 Self-serve billing** — already existed under `manage/billing` (audit
   searched the wrong path); no work needed.
6. ✅ **C1 ERIX lead-scoring config** — built (saas → CRM → Lead Scoring); the one
   real saas gap.
7. ⏭ **A4 OpenAPI viewer** — intentionally skipped (dev tool, YAGNI).

**Rollup:** every server capability that should have a UI now has one, in the
correct app by role — admin AND saas verified. All new pages diagnostics-clean.
Deliberately skipped: OpenAPI viewer (dev tool) and a second AI panel (the
platform copilot is a consolidation question, not a missing surface).
