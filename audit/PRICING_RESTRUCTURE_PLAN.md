# Pricing / Entitlements Restructure — grounded plan (2026-07)

> Goal (from product): plans, add-ons, and credit packs must reflect only what
> we actually provide — products **erix / laie / flow** and infra **connect /
> storage / store(cache)** — drop "editor" and other non-shipped surfaces, fill
> gaps, and keep all three seedable + admin-managed. This doc is grounded in the
> code that _consumes_ the plan `features`, so we don't break metering.

## How entitlements actually work (so we don't restructure blind)

- `seed-plans.ts` writes `ecodrix_plans.features` (JSONB) = **single source of
  truth**. `entitlements.service.ts` merges `plan.features ⊕ org.addOns`, injects
  `{limit, remaining}` for metered features, and caches.
- **What the resolver meters** (`METERED_FEATURES`, entitlements.service.ts):
  `editor.aiCalls`, `editor.pdfExport`, `ai.callsPerMonth`,
  `cloud_storage.transformsPerMonth`, `cloud_storage.bandwidthGB`,
  `erix.whatsappMessages`, `laie.auditsPerMonth`, `workflows.runsPerMonth`,
  `erix_store.jobsPerMonth`.
- **Product-name ↔ DB-key map** (the keys are internal; the UI relabels):
  | Product (UI) | DB feature key | Metered field |
  |---|---|---|
  | ERIX CRM | `erix` | whatsappMessages |
  | LAIE | `laie` | auditsPerMonth (+ 3 LAIE axes: accessCredits/enrichmentActions/computeUnits) |
  | ERIX-Flow | `workflows` | runsPerMonth |
  | Storage | `cloud_storage` | transformsPerMonth, bandwidthGB (+ storageGB) |
  | Store (cache) | `erix_store` | jobsPerMonth |
  | AI (cross-cutting) | `ai` | callsPerMonth |
  | Connect | **(none — GAP)** | — |
  | "Editor" | `editor` | pdfExport, aiCalls |
- **Credits** = platform prepaid wallet (`ecodrix_credit_wallets` + append-only
  `ecodrix_credit_transactions`), consumed per billable action (whatsapp/email
  sends, AI tokens, quota overage) via a **rate card** (admin
  `/api/admin/credits/rate-card`). Packs (`ecodrix_credit_packs`) are priced in
  **INR paise** with `credits` + `bonusPct`. **Admin CRUD exists**
  (`admin/credits.routes.ts`); there is **no seed script** (managed in admin).
- **Add-ons** (`ecodrix_addons`) = per-feature entitlement overrides merged at
  `${service}.${feature}` (`{increment}` / `{paygo}` / literal). Seed exists
  (`seed-addons.ts`).

---

## CRITICAL finding — "editor" is NOT dead

`editor.pdfExport` is the live quota for **invoice PDF export**:
`product/erix/routes/invoice.routes.ts:154` → `createQuotaMiddleware("editor", "pdfExport")`.
`editor.aiCalls`/`pdfExport` also appear in `shared/config/features.ts` (catalog),
`METERED_FEATURES`, `entitlements.service.test.ts`, and saas
`manage/usage`, `manage/billing/upgrade`, `manage/billing/addons`, `AddOnCard`.

**Therefore:** deleting `editor` blindly removes the invoice-PDF limit. The
dead parts are only `editor.{comments,versions,mentions,templates,collaboration,
embedsPerDoc,customBranding,whiteLabel,webhooks}` — nothing reads those.

**Decision needed (A):** either

- **A1 (recommended):** rehome the two live editor meters onto `erix` —
  `erix.pdfExport` (invoice PDFs) and fold `editor.aiCalls` into `erix.aiAgent`/
  a new `erix.aiAssists`. Then delete `editor` everywhere. Cleaner: matches
  "products are erix/laie/flow".
- **A2:** keep an `editor` key but shrink it to `{pdfExport, aiCalls}` only.
  Less churn, but leaves a namespace you don't market.

---

## Change set (per file) — for A1

**Server**

1. `scripts/seed-plans.ts`
   - Remove the `editor` service block (interface + all 5 tiers).
   - Add `erix.pdfExport` (invoice PDFs) + `erix.aiAssists` (was editor.aiCalls) to every tier.
   - Add a **`connect`** block (channels quota) — the missing infra product.
   - Keep `laie` axes, `cloud_storage`, `erix_store`, `workflows`, `ai`, platform flags.
   - Drop the dead editor sub-fields.
2. `platform/services/entitlements.service.ts` — `METERED_FEATURES`: replace
   `editor.aiCalls`/`editor.pdfExport` with `erix.aiAssists`/`erix.pdfExport`.
3. `shared/config/features.ts` — retarget the two editor entries to `erix.*`;
   drop `"editor"` from the product union.
4. `product/erix/routes/invoice.routes.ts:154` — `createQuotaMiddleware("erix", "pdfExport")`.
5. `platform/services/entitlements.service.test.ts` — update `editor.*` asserts to `erix.*`.
6. `scripts/seed-addons.ts` — drop the 3 editor add-ons (comments/templates/mentions);
   the `service` union loses `"editor"`.

**SaaS** 7. `manage/usage/page.tsx`, `manage/billing/upgrade/page.tsx`,
`manage/billing/addons/page.tsx`, `components/platform/AddOnCard.tsx` —
drop the `editor` service group/label; map `pdfExport` under ERIX CRM.

**Benefit:** plan vocabulary matches the real product lineup; invoice-PDF
metering keeps working; no dead namespace; one fewer service in every UI list.

---

## GAP — `connect` has no plan representation

Connect (channels/credentials) is a shipped infra product but no `features.connect`
exists, so plans can't express "how many channels / which channels". Today channel
enablement is driven by `serviceConfig`, not the plan.

**Decision needed (B):** what does Connect gate per tier? Options: `channels`
(count), per-channel booleans (`whatsapp`/`email`/`instagram`/`telegram`),
`credentialsPerChannel`. Until wired into a quota middleware it's advisory
(like `erix.esignsPerMonth` today).

---

## Credits & packs — seedability

- Packs currently live only in the DB via **admin CRUD** (no seed). The console
  already renders Starter/Growth/Pro (₹499 / ₹999→+10% / ₹2,499→+20%).
- **Decision needed (C):** do you want a `seed-credit-packs.ts` for
  reproducibility? ⚠️ It would upsert by slug and could **overwrite
  admin-edited packs** — only add it if packs should be code-owned, not
  admin-owned. Given "we manage from admin", recommend **NOT** seeding packs;
  instead document the canonical set in admin.
- The **rate card** (what each action costs in credits) is the real "where
  credits are consumed" surface — confirm it's seeded/complete for:
  whatsapp_send, email_send, sms_send, ai_tokens, laie_actor_run, enrichment.

---

## Decisions to confirm before I execute

- **A**: A1 (rehome editor meters onto `erix`, delete editor) vs A2 (shrink editor).
- **B**: Connect's per-tier gate shape.
- **C**: seed credit packs in code (risk: clobbers admin edits) — recommend no.
- **Quotas/prices**: per-tier numbers + **currency** (plans are USD today; the
  product bills INR — align to INR?). These are commercial decisions; give me
  the numbers and I'll fill them exactly.

Once A/B/C + numbers are set, the change set above is mechanical and I'll apply
it server + saas + seeds in one pass with `tsc`/diagnostics verification.
