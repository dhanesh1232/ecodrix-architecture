# API Linking Audit — server ↔ saas (2026-06)

> Cross-checked every saas client call against server Express routes and the
> saas Next.js proxy layer. This records the verified findings, the fixes
> applied, and the one genuine feature gap that remains.

---

## How the layers connect (reference)

- **LAIE** — saas calls `/api/laie/v1/*`. A catch-all proxy
  (`app/api/laie/v1/[...path]/route.ts`) forwards everything to
  `${BACKEND_URL}/api/laie/v1/*` with `x-laie-key` + `x-laie-user-email`.
  Dedicated proxy routes exist for a few paths (leads, quality, validation,
  pipeline-summary, campaigns, profile, …); the rest fall through the
  catch-all. Server mounts LAIE at `/api/laie/v1` behind `validateLaieKey`.
- **ERIX / CRM / platform / storage** — saas calls the backend **directly**
  via the `@ecodrix/erix-api` SDK (`ecod.request`, `ecod.crm.*`,
  `ecod.media.*`) against `BACKEND_URL`. Server mounts these at
  `/api/saas/*`, `/api/crm`, `/api/platform`, `/api/*` (me/members/…).
- **Auth** — NextAuth in saas; backend `/api/auth/*` for credential/oauth.

The catch-all means most LAIE path mismatches fail at the **server** (404),
not the proxy.

---

## Fixed this pass (verified client→server mismatches)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| A1 | "Run"/"Retry" on Campaigns + Runs pages 404 | client called `POST /campaigns/:id/run`; server only has `POST /flows/:id/run` (a campaign IS a Lead_Flow) | repoint both callers to `/flows/:id/run` (`runs/page.tsx`, `campaigns/page.tsx`) |
| A2 | Dataset "Download" 404 | client called `GET /datasets/:id/download`; server has `/datasets/:id/items`, no `/download` | fetch `/items` + serialize JSON client-side (`datasets/page.tsx`) |
| A3 | Webhook "Test" 404 | client called `POST /webhooks/:id/test`; endpoint didn't exist | **added** `POST /webhooks/:id/test` server-side — fires a real `webhook.test` POST + records a delivery row (`webhooks.routes.ts`) |

All three verified by reading the server route files; both codebases
typecheck + lint clean after the fixes.

---

## Confirmed OK (looked suspicious, actually correct)

- `POST /flows/:id/clone` (campaign detail) → exists in `leadActions.routes.ts`. ✓
- Lead intelligence calls (`/leads/:id/research`, `/research-report`,
  `/competitors`, `/signals`, `/find-email`) → all in `intelligence.routes.ts`. ✓
- `routes/automation/index.ts` (`/api/v1/automation/*`) → **not orphaned**;
  mounted at `/api/laie/v1/automation/*` via `products/laie/index.ts`
  (per `audit/implementation/re-audit-2026-06-06.md`). ✓
- The many `/dashboard/*` strings are page nav, not API — already swept and
  fixed in a prior pass.

---

## ⚠️ Genuine feature gap (NOT a simple link fix) — the Audit pipeline

The entire **Audit** UI (`/product/laie/audit`, `audit/[id]`) calls:

- `POST /api/laie/audit`            (`useRunAudit`)
- `GET  /api/laie/audit/:id`        (`useAuditResult`, `useAuditProgress`)
- `GET  /api/laie/audit/:id/pdf`    (`AuditActions`)
- socket `audit:{id}:progress`

…via the **ERIX SDK** (`ecod.request` → `BACKEND_URL` directly, bypassing the
LAIE proxy). Two problems:

1. **Wrong prefix** — missing `/v1` (`/api/laie/audit`, not `/api/laie/v1/...`).
2. **No server endpoint exists at all** — there is no `/audit*` route anywhere
   under `routes/laie/**`. It was specified in the PRD/TRD
   (`prd/02-TRD.md`, `prd/04-APP-FLOW.md`: `POST /api/laie/audit` with quota
   `laie.auditsPerMonth` → enqueue 5-step audit job) and in the spec
   `laie-service-delivery-readiness`, but **never implemented**.

**Why not auto-fixed:** this is a whole pipeline (quota gate → enqueue audit
job → 5 scoring steps Website/Google/Social/LinkedIn → outreach kit →
progress socket → PDF), not a path typo. Building it is a feature task, and
it overlaps conceptually with the existing scrape→enrich→validate flow —
worth a product decision on whether "single-business Audit" remains a
distinct surface or folds into a 1-lead campaign.

**Recommendation:** scope the Audit pipeline as its own spec. Until then the
Audit UI is non-functional (calls 404). Either (a) implement
`POST/GET /api/laie/v1/audit*` + fix the hook prefixes, or (b) retire the
Audit UI and route users to the campaign/lead flow.

---

## Lower-priority / informational

- **Outreach kits** have two divergent implementations: a saas-local
  in-memory stub (`app/api/laie/v1/leads/[id]/outreach/route.ts` +
  `regenerate`, `outreachStore`) AND a server path
  (`POST /leads/:id/generate-kit`). The table/validation flow uses the
  server path; the lead-detail outreach tab uses the stub. Consolidate when
  the NLP service is wired.
- **autocomplete/cities|niches** proxy routes are intentionally local
  (static lists) — fine.
- Orphan server endpoints with no saas caller (low priority): `/readiness`,
  `/jobs/:jobId/logs` (used by LiveTerminal indirectly), `/health-score/*`,
  `/leads/:id/monitor`, `/leads/bulk/*` (some), `/demos/view/:shortCode`
  (public tracking), `/ai/niche-discovery`. Not bugs — capability ahead of UI.

---

## Net

Three real broken client→server links fixed (run, dataset download, webhook
test); one new server endpoint added (webhook test). One genuine
unimplemented feature documented (Audit pipeline) for a follow-up spec. All
other flagged items verified as already-correct or intentional. Both
codebases typecheck + lint clean.
