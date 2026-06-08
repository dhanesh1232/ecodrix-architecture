# LAIE Design — Consolidated (Existing ✕ New Prompt)

> Purpose: reconcile the aspirational `laie-design.md` prompt against what
> LAIE **actually is today** in `ECOD/saas`, then define the *unique*
> consolidated target. No code yet — this is the decision record we build
> from later.

---

## 0a. PRODUCT BOUNDARY (authoritative — read first)

**LAIE is a lead-acquisition engine, NOT a CRM.** Its job is a linear
pipeline that ends at a handoff:

```
  GENERATE        ENRICH             VALIDATE                PREPARE        HANDOFF
  scrape leads →  fill fields,    →  verify email (SMTP),  → outreach   →  EXPORT to
  (GM/JD/SL)      social, GBP,       phone/WhatsApp,          kits          ERIX CRM
                  owner, lifecycle   social presence                        (import bridge)
```

After a lead is enriched + validated, the user **exports it to ERIX CRM**
(`POST /api/laie/v1/import/crm`) where pipeline, stages, deals, inbox, and
all relationship management live. LAIE never manages a sales pipeline.

### What LAIE DOES (in scope)
- **Generate**: scrape Google Maps / JustDial / Sulekha; map-radius search.
- **Enrich**: website/GBP audit, social link discovery, owner name,
  business lifecycle, digital score, niche/tier.
- **Validate** (the differentiator): email exists (`verifyEmailSMTP`),
  phone/WhatsApp reachable (`waIdentityWorker` → `hasWhatsapp`,
  `waVerifiedAt`), social profiles present (`deepCrawler.socialLinks`).
- **Prepare outreach**: AI outreach kits (WA/email/LinkedIn/IG), pitch
  angles, A/B variants, demo pages.
- **Hand off**: export validated leads to ERIX CRM via the import bridge.
- **Operate**: runs, schedules, datasets, proxy health, usage, data quality.

### What LAIE does NOT do (→ ERIX CRM)
- ❌ Sales **pipeline / kanban / stages** — a CRM concept. Stage is chosen
  at *import time*, in CRM (`POST /import/crm` takes `pipelineId`+`stageId`).
- ❌ Deals, inbox/conversations, contact relationship timelines.
- ❌ CRM-style "move lead through funnel" UI.

### Consequences for this consolidation
- **Pipeline kanban (`/pipeline`) is CANCELLED.** It was a
  category error — LAIE has no `stage` field on `laie_leads` precisely
  because staging belongs to CRM. Do not add one. (Supersedes the earlier
  "Pipeline backing decision" — there is nothing to decide; it's out of
  scope.)
- The lead **detail drawer** stays triage-only (validation status, scores,
  contact, outreach readiness) — NOT a CRM record editor. The full `[id]`
  route keeps research/outreach tabs, not pipeline/deal tabs.
- The **new flagship surface is "Validation"**, not pipeline: a view that
  shows, per lead, email/phone/WhatsApp/social validation state and lets
  the user run/re-run validation, then export the validated set to ERIX.
- "Push to ERIX" / bulk **Export to CRM** is the primary terminal CTA on
  the Lead Table and Validation views (the BulkActionBar "Campaign" action
  from Phase 2 should be reframed as **Export to ERIX**).

---

## 0. TL;DR — the three big reconciliations

1. **Design system: keep the existing one, reject the prompt's palette.**
   The prompt specifies a **navy + electric-blue** system
   (`--navy:#0A1628`, `--electric:#1E7AFF`, fonts Outfit / JetBrains Mono /
   DM Serif). The app already ships a mature, different system: **void-black
   + purple/cyan** (`#060608` base, `#7C6EFA` purple, `#22D3EE` cyan, CSS
   vars `--color-accent-primary` etc.) used by every console, ERIX, and
   infra surface. Adopting the prompt's palette would fork LAIE away from
   the platform. **Decision: keep the platform tokens; map the prompt's
   intent (source brand colors, status semantics) onto existing vars.**

2. **Navigation: the prompt's "LAIE-specific 220px navy sidebar" already
   exists — as a config entry in the shared `AppSidebar`.** We do NOT build
   a separate sidebar. We extend `SIDEBAR_CONFIG.laie` groups. The prompt's
   tab list is the gap analysis input (§2).

3. **Scope: LAIE is further along than the prompt assumes.** Many "NEW"
   tabs already exist (campaigns, runs, schedules, webhooks, settings,
   datasets, intelligence, outreach, analytics). The real work is
   *consolidation + the genuinely missing pieces* (Validation surface,
   Proxy network ✅, Data Ops ✅), not a greenfield build. **Pipeline is
   out of scope** (CRM concern — see §0a).

---

## 1. Route gap analysis — prompt tabs vs. on-disk reality

Existing routes under `app/(product)/product/laie/`:

```
page.tsx · layout.tsx · error.tsx · loading.tsx · not-found.tsx
analytics/        audit/ + audit/[id]/      batches/
campaigns/ + campaigns/[id]/ + campaigns/new/
datasets/         intelligence/
leads/ + leads/[id]/ + leads/compare/ + leads/map/ + leads/signals/
outreach/ + outreach/ab-testing/ + outreach/follow-ups/
runs/             schedules/
settings/ + settings/api-keys/ + settings/scoring/
templates/        usage/            webhooks/
```

| Prompt tab | Prompt path | Reality | Verdict |
|---|---|---|---|
| Lead Table | `/leads` | ✅ `leads/` (+ `[id]`, `compare`, `map`, `signals`) | **Exists, richer.** Enhance, don't rebuild. |
| Scraper Runs | `/runs` | ✅ `runs/` | Exists. Verify run-detail/log stream depth. |
| Proxy Network | `/proxy` | ❌ none (but `RelayHealthDashboard.tsx` exists) | **Genuinely new route**, partial component. |
| AI Enrichment | `/enrich` | ⚠️ folded into `intelligence/` + `leads/[id]` research | **Decide:** dedicated `/enrich` vs. keep in intelligence. |
| SEO Audit | `/seo` | ⚠️ lives as `audit/` (+ `audit/[id]`) | **Naming clash.** `audit` IS the SEO/digital audit. Rename or alias. |
| Pipeline | `/pipeline` | ❌ none | **CANCELLED — out of scope** (CRM concern; staging happens at ERIX import, see §0a). |
| Campaigns | `/campaigns` | ✅ `campaigns/` (+ `[id]`, `new`) — full builder exists | Exists, mature. Reconcile builder steps. |
| Scheduler | `/scheduler` | ✅ `schedules/` (naming: plural) | Exists. Align name → keep `schedules`. |
| Data Ops | `/dataops` | ❌ none (dedup/quality/import/export) | **Genuinely new.** Highest-value gap. |
| Webhooks & API | `/webhooks` | ✅ `webhooks/` + `settings/api-keys/` | Exists, split across two routes. |
| Settings | `/settings` | ✅ `settings/` (+ `api-keys`, `scoring`) | Exists, richer. |
| — | — | ✅ `analytics/` | Prompt has no Analytics tab; we keep it. |
| — | — | ✅ `batches/` | Prompt has no Batches tab; reconcile vs. Runs. |
| — | — | ✅ `datasets/` | Prompt folds this into Data Ops; keep as data store. |
| — | — | ✅ `intelligence/` | Prompt's "AI" concept; already a home. |
| — | — | ✅ `templates/`, `outreach/` | Campaign message assets; keep. |

**Net new routes to build:** `validation/` (the flagship — see §0a), plus
`proxy/` ✅ and `dataops/` ✅ (both shipped). **`pipeline/` is cancelled.**
Everything else is *enhance + consolidate + rename-align*.

---

## 2. Naming reconciliation (avoid duplicate concepts)

| Concept | Prompt name | Existing name | Decision |
|---|---|---|---|
| Recurring jobs | `/scheduler` | `/schedules` | **Keep `/schedules`** (plural, already shipped). Sidebar label "Scheduler". |
| Digital/SEO audit | `/seo` | `/audit` | **Keep `/audit`** as the umbrella; SEO is one audit dimension. Don't add a second `/seo`. |
| Enrichment | `/enrich` | `intelligence/` + lead research | **Promote** a dedicated `/enrich` ONLY if the waterfall-column UX lands; until then enrichment stays in `intelligence`. Parked. |
| API keys | under `/webhooks` | `settings/api-keys` | **Keep `settings/api-keys`**; cross-link from a `/webhooks` "API" tab. |
| Batches vs Runs | `/runs` only | both `runs/` + `batches/` | **Consolidate:** Runs = scraper executions; Batches = multi-lead audit jobs. Document the split or merge under Runs with a type filter. |

---

## 3. Design tokens — map prompt intent → platform vars

The prompt's palette is **rejected as literal hex**; its *semantics* are
mapped onto existing platform CSS variables (the "no hardcoded hex" rule in
the prompt actually agrees with this).

| Prompt token | Prompt hex | Platform var to use |
|---|---|---|
| `--navy` (surface) | `#0A1628` | `--color-card` / `--color-surface` |
| `--bg-base` | `#060d1a` | `--color-background` (`#060608`) |
| `--electric` (primary) | `#1E7AFF` | `--color-accent-primary` (`#7C6EFA`) |
| `--orange` (hot) | `#FF6B1A` | `--color-warning` |
| `--success` | `#10b981` | `--color-success` |
| `--danger` | `#ef4444` | `--color-error` |
| `--purple` (AI) | `#a78bfa` | `--color-accent-primary` (already purple) |
| `--muted` | `#64748b` | `--color-secondary` |

**Source brand colors** (GM/JD/SL/LI/IG) are the one place literal brand
hex is legitimate — they're external brand identities, not theme. Define
them once in a `SOURCE_COLORS` map (data, not theme tokens) and render
Source Pills from it.

**Fonts:** the prompt wants Outfit / JetBrains Mono / DM Serif. The app
already standardizes on its own `--font-sans` / `--font-mono`. **Keep the
platform fonts**; the editorial "black tracking-tight headings" in
`PageShell` already deliver the intended feel. Do NOT add DM Serif.

---

## 4. Shared component reconciliation

The prompt's §4 library vs. what exists in `components/laie/`:

| Prompt component | Existing equivalent | Action |
|---|---|---|
| Stat Card | `dashboard/PageShell → MetricCard`, `MetricsGrid` | **Reuse** MetricCard. |
| Status Badge | `ScoreBadge`, `leads/LeadScoreBadge` | Generalize into one `StatusBadge`. |
| Source Pill | — (logic in LeadTable) | **Extract** to `shared/SourcePill` from `SOURCE_COLORS`. |
| Score Bar | `ScoreBar.tsx` ✅ | Reuse. |
| Health Arc | `ScoreRadial.tsx` ✅ | Reuse/rename. |
| Toggle Switch | shadcn `Switch` | Reuse platform Switch. |
| Bulk Action Bar | ❌ | **New** `shared/BulkActionBar`. |
| Command Palette | `shared/CommandPalette.tsx` ✅ | Reuse. |
| Empty State | `PageShell → EmptyPlate` ✅ | Reuse. |
| Confirmation Modal | shadcn dialog (platform) | Reuse platform dialog. |
| Lead Detail Drawer | `leads/LeadDetail.tsx` + `[id]` route | **Consolidate:** today detail is a full route; prompt wants a right drawer. Decide drawer vs. route (see §5). |
| AI Insight Banner | ❌ | **New** `shared/AIInsightBanner`. |
| Notification Center | `dashboard/NotificationCenter.tsx` ✅ | Reuse. |
| Usage Bar | `usage/` route + sidebar widget? | Reuse usage data; add sidebar widget. |

**Genuinely new shared components:** `SourcePill`, `BulkActionBar`,
`AIInsightBanner`. Everything else already exists in some form.

---

## 5. UX decisions that need your call (parked, non-blocking)

- **D1 — Lead detail: drawer vs. route.** Today `leads/[id]` is a full
  page with Radix tabs; the prompt wants a 480px right drawer. The
  deep-link convention (`?id=` opens drawer) favors the **drawer** for
  quick triage while keeping `[id]` as the deep/printable view. Recommend:
  drawer for list triage, route for full profile. Both share `LeadDetail`.
- **D2 — `?ids=` compare.** Already exists but nothing writes it. With the
  new deep-link standard, either keep `ids` as a documented multi-value
  exception or build a multi-select in `LeadTable` that composes it.
- **D3 — Enrichment home.** Dedicated `/enrich` waterfall vs. staying in
  `intelligence`. Build `/enrich` only when the drag-reorder waterfall UX
  is committed.
- **D4 — Batches vs Runs.** Merge under `/runs` with a type filter, or keep
  separate. Leaning merge to reduce nav surface.

---

## 6. Consolidated target nav (extend `SIDEBAR_CONFIG.laie`)

Keep the single shared `AppSidebar`. Proposed LAIE groups, ordered to
mirror the linear pipeline (generate → enrich → validate → outreach →
export):

```
Acquire
  Leads            /product/laie/leads          (table v2 — ✅ shipped)
  Map Search       /product/laie/leads/map
  Runs             /product/laie/runs           (scraper executions)
  Campaigns        /product/laie/campaigns
  Scheduler        /product/laie/schedules

Enrich & Validate
  Audit            /product/laie/audit          (SEO/digital audit umbrella)
  Intelligence     /product/laie/intelligence   (enrichment home)
  Validation       /product/laie/validation     ← NEW (flagship: email/phone/WA/social)

Outreach
  Outreach         /product/laie/outreach
  Templates        /product/laie/templates

Export & Ops
  Export to ERIX   (action, not a page — bulk CTA on Leads/Validation)
  Data Ops         /product/laie/dataops        ← ✅ shipped
  Datasets         /product/laie/datasets
  Proxy Network    /product/laie/proxy          ← ✅ shipped

Platform
  Analytics        /product/laie/analytics
  Usage            /product/laie/usage
  Webhooks & API   /product/laie/webhooks
  Settings         /product/laie/settings
```

> `Pipeline` is intentionally absent — staging is a CRM concern handled at
> ERIX import time (§0a).

---

## 7. Build order (when we proceed)

Phased so each lands independently. Items marked ✅ are already shipped.

1. ✅ **Shared primitives** — `SourcePill`, `BulkActionBar`,
   `AIInsightBanner`, `StatusBadge`.
2. ✅ **Lead Table v2** — bulk bar + source pills + triage drawer (`?id=`),
   deep-link wired.
3. ✅ **Proxy Network** `/proxy` — live relay health + circuit breaker
   (real `infra/status`).
4. ✅ **Data Ops** `/dataops` — real field-coverage quality aggregate.
5. **Validation surface** `/validation` (flagship, NEXT) — per-lead
   email (`verifyEmailSMTP`), phone/WhatsApp (`waIdentityWorker`), and
   social (`deepCrawler.socialLinks`) validation state; run/re-run;
   then **Export to ERIX** the validated set. Needs a server
   `/leads/:id/validate` (or batch) endpoint + a validation-status read.
6. **Reframe "Export to ERIX"** — make the import bridge
   (`POST /import/crm`) the primary terminal CTA on Lead Table +
   Validation (replaces the placeholder "Campaign" bulk action).
7. **Reconcile** Runs/Batches, Webhooks/API, Enrichment home per §5 calls.

> **Pipeline kanban is removed from the build order** (CRM concern, §0a).

Each phase: `tsc --noEmit` + `biome` + `getDiagnostics` clean, real SDK
data only (no mocks), loading/error/empty states, deep-link query state
where applicable.

---

## 8. Hard constraints carried from the prompt (we agree)

- No light backgrounds; dark only. ✓ (platform already enforces)
- No hardcoded hex — CSS vars only (except `SOURCE_COLORS` brand data). ✓
- No direct fetch — all server calls via `@ecodrix/erix-api` SDK. ✓
- Every component: loading + error + empty states. ✓
- No `any`. ✓ (both codebases at 0 type errors)
- Max 3 source pills inline + `+N` overflow. ✓
- LAIE sidebar only inside LAIE, never at console hub. ✓ (AppShell enforces)
