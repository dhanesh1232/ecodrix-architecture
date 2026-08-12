# ECODrIx Server — Full Audit (for plan + credits seed generation)

> Purpose: a self-contained, code-grounded map of the backend so an agent can
> generate an EXACT `seed-plans.ts` / `seed-addons.ts` / credit rate-card + pack
> plan without guessing. Every claim cites a file. Base API prefix is
> `/v1/api`; the `@ecodrix/erix-api` SDK prepends it. Sibling docs:
> `SERVER_REMEDIATION_PLAN.md` (bug/security backlog),
> `PRICING_RESTRUCTURE_PLAN.md` (the pricing change-set).

---

## 1. Architecture & route surface

- Entry: `routes/index.ts` → `app.use("/v1/api", createV1Router())`; async
  subtrees mounted after socket.io via `mountV1AsyncRoutes()` (`versions/v1.ts`).
- Mount tree (`routes/v1/**`):
  ```
  /v1/api
  ├── /platform
  │   ├── /auth      PUBLIC   (register, invitations, sessions, password)
  │   ├── /public    PUBLIC   (waitlist)
  │   ├── /webhooks   PUBLIC   (razorpay-subscriptions)
  │   ├── /users     tenantAuth (/me /members /sessions /notifications)
  │   ├── /tenants   tenantAuth (/onboarding /persona /console /api-keys /data-export /settings)
  │   ├── /billing   tenantAuth (/entitlements /subscriptions /plans /checkout /user /credits)
  │   ├── /products  tenantAuth
  │   ├── /support   tenantAuth
  │   ├── /account             (tenant-deletion)
  │   ├── /ai        tenantAuth (/copilot)   [async]
  │   └── /admin     adminAuth  (~40 sub-routers, incl. /credits, /plans editor) [async]
  ├── /product
  │   ├── /erix   sync: /ai /events /commerce/* /portal ...; async: /crm (tenantAuth) /chat
  │   ├── /laie   [async]
  │   └── /flow   [async]
  └── /infra
      └── /connect (+ /webhooks async); /storage (tenantAuth) mounted in v1 async phase
  ```
- Two-phase async mounts use `void (async()=>{ router.use(...) })()` with **no
  `.catch`** → a failed dynamic import silently drops a subtree (see Remediation
  P0#3). Relevant because a broken seed/import can make `/billing/*` 404 silently.

---

## 2. Products & services — real lineup vs internal keys

The UI markets **products** `erix / laie / flow` and **infra** `connect /
storage / store`. The entitlement code uses different internal service keys.
This mapping is authoritative:

| Product (UI)       | `features.<key>` | Metered fields (see §4)                                              | Enable flag (org)          |
| ------------------ | ---------------- | -------------------------------------------------------------------- | -------------------------- |
| ERIX CRM           | `erix`           | whatsappMessages                                                     | `org.erixEnabled` (`crm`)  |
| LAIE Intelligence  | `laie`           | auditsPerMonth + 3 axes accessCredits/enrichmentActions/computeUnits | `org.laieEnabled`          |
| ERIX-Flow          | `workflows`      | runsPerMonth                                                         | `org.flowEnabled`          |
| Storage            | `cloud_storage`  | transformsPerMonth, bandwidthGB (+ storageGB)                        | `org.storageEnabled`       |
| Store (cache)      | `erix_store`     | jobsPerMonth                                                         | `org.storeEnabled`         |
| Connect            | **(none — GAP)** | —                                                                    | `org.connectEnabled`       |
| AI (cross-cut)     | `ai`             | callsPerMonth                                                        | —                          |
| "Editor" (doc/PDF) | `editor`         | pdfExport, aiCalls                                                   | — (not a marketed product) |

Notes:

- **Flow = `workflows`**, **Storage = `cloud_storage`**, **Store = `erix_store`**.
  Renaming these keys is a cross-cutting change (see §8 change-list).
- **`connect` has no plan features** — channel access is driven by
  `org.serviceConfig`, not the plan. Real gap to fill.
- **`editor` is NOT dead**: `editor.pdfExport` gates invoice PDF export
  (`product/erix/routes/invoice.routes.ts:154`
  `createQuotaMiddleware("editor","pdfExport")`). Only editor's _other_
  sub-fields are dead. See §8.

---

## 3. Data model (the three seedable tables)

### `ecodrix_plans` (`shared/db/schema/platform/plans.ts`)

`id, name, slug(unique), tier(int: 0/10/20/30/40), priceMonthlyUsd(int),
priceYearlyUsd(int), currency(default "USD"), features(jsonb — SINGLE SOURCE OF
TRUTH), isActive, isDefault, createdAt, updatedAt`. Legacy scalar mirror columns
retired in migration 0028 — `features` is authoritative.

### `ecodrix_addons` (same file)

`id, slug(unique), name, description, service, feature, overrideValue(jsonb),
priceMonthlyUsd(int), priceUnit("month"|"per_call"|"per_gb"), isActive`.
`overrideValue` merge shapes: `{ increment: N }` (additive), `{ paygo: true }`
(overage billing), or a literal boolean/number. Merged at
`org.addOns.${service}.${feature}` by the entitlement service.

### Credits (`shared/db/schema/platform/credits.ts`)

- `ecodrix_credit_wallets`: `orgId(unique), balance(int, never <0),
autoTopupEnabled, autoTopupThreshold, autoTopupPackId, dailySpendCap(nullable),
dailySpendAlertPct(default 80)`.
- `ecodrix_credit_transactions`: append-only ledger `type(purchase|consume|
expire|refund|bonus|topup_auto), amount(+/-), featureKey, balanceAfter,
description, idempotencyKey(unique-when-present), createdAt`.
- `ecodrix_credit_packs`: `slug(unique), name, priceInr(int — **PAISE**, ÷100 to
display), credits(int base), bonusPct(int), isActive`.

---

## 4. Entitlements resolution (how `features` is consumed)

`platform/services/entitlements.service.ts`:

1. Resolve org → active subscription → plan (fallback: default Free plan).
2. `deepMergeFeatures(plan.features, org.addOns)`.
3. Inject `{ limit, remaining }` for each **metered** feature from current-period usage.

**`METERED_FEATURES`** (the exact keys that get usage gauges + enforcement):

```
editor.aiCalls, editor.pdfExport, ai.callsPerMonth,
cloud_storage.transformsPerMonth, cloud_storage.bandwidthGB,
erix.whatsappMessages, laie.auditsPerMonth,
workflows.runsPerMonth, erix_store.jobsPerMonth
```

**Quota middleware** (`shared/middleware/quota.ts`,
`createQuotaMiddleware(service, feature)`):

- Reads `features.<service>.<feature>`; `"unlimited"` → no cap.
- **Credit-overage config**: a feature may be declared as
  `{ limit: N, overage: "credits", creditKey: "<rateCardKey>" }` — exceeding the
  hard limit then falls through to the **credit wallet** instead of a 429.
  Features without this (Free-tier default) hard-block at the limit.
  → This is the hook that lets a plan tie a quota to credit consumption.

**LAIE 3-axis metering** (`product/laie/services/laie/entitlements.ts`):

- `laie.accessCredits` → `laie_unlock_ledger` (env fallback `LAIE_UNLOCK_CREDITS_PER_MONTH`, default 100)
- `laie.enrichmentActions` → `laie_action_ledger` (env fallback `LAIE_ENRICHMENT_ACTIONS_PER_MONTH`, default 1000)
- `laie.computeUnits` → `laie_run_accounting` (env fallback `LAIE_COMPUTE_UNITS_PER_MONTH`, default 5000)
- Resolved from `features.laie.*`; if absent, env default (so plans should set
  all three to be authoritative).

**Feature catalog** (`shared/config/features.ts`) — a parallel list of
`{ path, type, product, description, usageKey }` used by admin/UI; product union
currently includes `"editor"`. Must be kept in sync with `features` keys.

---

## 5. Credits — where they're consumed

Consumption path: `creditMeter.charge(orgId, rateCardKey, units, {mode, idempotencyKey})`
→ `creditWalletService.consume()` (atomic guarded `WHERE balance >= cost`,
append ledger row, respects `dailySpendCap`). Modes: `enforce` (default, blocks
on insufficient) / `best_effort` (logs + allows unmetered). Unknown rate-card
key → never blocks (allows unmetered).

**`CREDIT_RATE_CARD`** (`creditWallet.service.ts`, credits-per-unit; fractional
resolved via `Math.ceil(rate*units)`):

```
whatsapp_send: 1
email_send: 0.2
sms_send: 2
ai_response_1k_tokens: 5
laie_actor_run: 10
laie_enrichment_lookup: 2
laie_vault_export_100_rows: 5
flow_run: 5
storage_overage_gb: 50
```

Credits ledger `featureKey` = the rate-card key (e.g. `whatsapp_send`).

So "where credits are consumed" = any call site invoking `req.platform.billing.meter(rateCardKey, ...)`
or a quota feature configured with `overage: "credits", creditKey`. Credits are
the per-unit currency for sends + AI + LAIE actor/enrichment/export + flow runs +
storage overage.

---

## 6. Admin management surfaces (what humans edit)

- **Credit packs + wallet + rate card**: `platform/routes/admin/credits.routes.ts`
  (`/api/admin/credits/packs` CRUD, `/wallet/:orgId(/adjust)`, `/rate-card` GET).
- **Plans editor**: an admin plans surface exists (the rate-card GET is
  documented as feeding "the plans editor's creditKey picker"). Confirm CRUD at
  `/api/admin/plans*` when wiring.
- **Add-ons**: seeded via `scripts/seed-addons.ts`; served to tenants via the
  billing/addons SDK surface.
- Tenant-facing reads: `GET /platform/billing/entitlements`, `/plans`,
  `/credits/{balance,transactions,packs}`, `/credits/topup/{order,verify}`.

Product intent: **plans, add-ons, credit packs are all admin-managed**; seeds
are the code-owned baseline. ⚠️ A pack seed upserts by slug and would overwrite
admin edits — decide whether packs are code-owned or admin-owned before seeding.

---

## 7. Critical findings & gaps (grounded)

1. **`editor.pdfExport` = invoice PDF quota** (`invoice.routes.ts:154`). Do NOT
   delete `editor` blindly — rehome to `erix.pdfExport` first (see §8).
2. **`connect` has no plan representation** — plans can't express channel gating.
3. **Currency mismatch**: `ecodrix_plans` prices are USD; credit packs are INR
   paise; the product bills INR. Pick one currency for plans (likely INR).
4. **`erix.esignsPerMonth`** is advertised on every plan but read nowhere and
   not in `METERED_FEATURES` — advisory only until e-sign metering ships.
5. **Dead editor sub-fields**: `editor.{comments,versions,mentions,templates,
collaboration,embedsPerDoc,customBranding,whiteLabel,webhooks}` — no readers.
6. **Add-ons seed** references `editor` service + `whiteLabel`/`prioritySupport`
   platform flags. Keep platform flags; drop editor add-ons if editor is removed.
7. Already fixed this session: credits `transactions` 404 (SDK path), feedback
   cross-tenant write (org scoping). See `SERVER_REMEDIATION_PLAN.md`.

---

## 8. Exact change-list if editor is removed (recommended)

Server: `seed-plans.ts` (drop `editor`, add `erix.pdfExport`+`erix.aiAssists`,
add `connect` block), `entitlements.service.ts` `METERED_FEATURES`
(editor._ → erix._), `shared/config/features.ts` (retarget + drop `editor`
union member), `invoice.routes.ts:154` (`"erix","pdfExport"`),
`entitlements.service.test.ts` (asserts), `seed-addons.ts` (drop editor add-ons).
SaaS: `manage/usage`, `manage/billing/upgrade`, `manage/billing/addons`,
`components/platform/AddOnCard.tsx` (drop `editor` group/label; map pdfExport
under ERIX). All mechanical once decided.

---

## 9. What an agent must produce (checklist — no guessing)

To generate the seeds, decide + fill:

**Plans** (`features` per tier for free/starter/growth/scale/enterprise), using
ONLY these service keys (rename decisions in §2/§8):

- `erix`: contacts, agents, whatsappMessages, pipelines, broadcasts(bool),
  customFields(bool), aiAgent(bool), esignsPerMonth, **pdfExport** (invoice PDFs,
  metered), **aiAssists** (if folding editor.aiCalls).
- `laie`: auditsPerMonth, accessibilityChecks(bool), seoChecks(bool),
  customReports(bool), **accessCredits**, **enrichmentActions**, **computeUnits**
  (all three REQUIRED or LAIE falls back to env defaults).
- `workflows` (Flow): activeWorkflows, runsPerMonth(metered), conditionalNodes(bool), customNodes(bool).
- `cloud_storage` (Storage): storageGB, bandwidthGB(metered),
  transformsPerMonth(metered), customDomain(bool), signedUrls(bool).
- `erix_store` (Store): jobsPerMonth(metered), semanticCacheGB, queueRetentionDays.
- `connect` (NEW): define channels quota shape (count and/or per-channel booleans).
- `ai`: callsPerMonth(metered), modelsAccessible(string[]), embeddings(bool).
- platform flags: customDomain, customBranding, whiteLabel, webhooks,
  prioritySupport, sla("none"|"99"|"99.9"|"99.99").
- Plan metadata: tier, price (choose currency), isDefault (free), isActive.

**Metered↔quota consistency:** any numeric feature that should enforce must be
in `METERED_FEATURES`; if it should overflow to credits, declare
`{ limit, overage:"credits", creditKey:"<rateCardKey>" }` and ensure the
`creditKey` exists in `CREDIT_RATE_CARD`.

**Add-ons** (`ecodrix_addons`): slug, name, description, `service`+`feature`
(must match a real `features` path), `overrideValue` (`{increment}`/`{paygo}`/
literal), priceMonthly, priceUnit.

**Credit packs** (`ecodrix_credit_packs`): slug, name, `priceInr` (PAISE),
`credits`, `bonusPct`. Align pack economics with `CREDIT_RATE_CARD` so a pack's
credits map to a sensible number of billable actions (e.g. 1 credit ≈ 1 WhatsApp
send). Decide code-owned vs admin-owned (see §6).

**Rate card** (`CREDIT_RATE_CARD` in `creditWallet.service.ts`): confirm/extend
keys for every billable action a plan's overage or `meter()` call references.
