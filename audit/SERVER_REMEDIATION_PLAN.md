# Server Remediation Plan — grounded audit (2026-07)

> Every item is backed by a specific file/handler (no blind/generic advice).
> Base prefix for all routes is `/v1/api`; the `@ecodrix/erix-api` SDK prepends
> it automatically. Two-phase mount: sync `createV1Router()` + async
> `mountV1AsyncRoutes()` after socket.io.

Status legend: ✅ done this pass · 🔜 planned · 🔎 investigate.

---

## P0 — Broken / exploitable (user-facing or security)

### 1. Credits transactions 404 ✅ DONE

- **Where:** `saas/src/hooks/platform/useCredits.ts`.
- **Evidence:** hook called `GET /api/platform/credits/transactions?limit=50` —
  extra `/api` prefix **and** missing the `billing` segment. Router is mounted
  at `/platform/billing/credits/*` (`routes/v1/platform/billing/index.ts`).
  Balance/packs worked because they use the SDK.
- **Fix applied:** switched to `ecod.platform.billing.credits.transactions()`.
- **Benefit:** Credits transaction history loads instead of 404; kills the
  console error loop; removes the last hand-written `/api/`-prefixed raw path
  (verified none remain in saas).

### 2. Cross-tenant write in feedback responses ✅ DONE

- **Where:** `product/erix/routes/crm/feedback.routes.ts` → `POST /feedback/responses`.
- **Evidence:** inserted with client-supplied `surveyId` and bumped
  `totalResponses WHERE id = surveyId` with **no `orgId` predicate** — a tenant
  could write to / inflate another org's survey by supplying its UUID.
- **Fix applied:** verify the survey belongs to `req.orgId` before insert (404
  otherwise); scope the counter update by `orgId`.
- **Benefit:** closes a real tenant-isolation breach; no change for legit callers.

### 3. Silent async-mount failures 🔜

- **Where:** the `void (async () => { router.use(...) })()` IIFE pattern —
  `platform/billing/index.ts`, `platform/users|tenants|ai/index.ts`,
  `product/erix/index.ts` (`mountErixAsyncRoutes`), ~40 IIFEs in
  `platform/admin/index.ts`. Plus `versions/v1.ts` wraps LAIE/Flow in
  `try/catch → console.warn`.
- **Evidence:** no `.catch` on the IIFEs; a throwing dynamic `import()` silently
  drops the whole subtree → 404s with zero logging. A LAIE/Flow dep misconfig
  unmounts the entire product surface with only a warn.
- **Plan:** wrap each IIFE body in try/catch that `log.error`s the subtree+path;
  on LAIE/Flow failure emit a structured error + health flag, not a bare warn.
- **Benefit:** turns invisible 404s into actionable logs — the root-cause class
  behind bugs like #1 being caught only by a screenshot.

---

## P1 — Isolation fragility & auth-model divergence

### 4. Raw-drizzle-in-routes instead of the adapter (systemic) 🔜

- **Where:** CRM handlers call `getDb()` with manual `eq(table.orgId, req.orgId!)`
  — `crm/form|feedback|referral|membership|appointment|automation-history|pipeline.routes.ts`.
  Others use RLS context (`runInOrgContext + scopedDb`): `field-configs.routes.ts`,
  `invoice.routes.ts`. `platform/routes/tenant-settings.routes.ts` also raw.
- **Evidence:** two coexisting isolation styles; any handler that forgets the
  manual filter leaks (finding #2 was exactly that slip).
- **Plan:** standardize on the `ErixAdapter` / `runInOrgContext` (AGENTS.md
  rung-2); migrate raw-filter handlers incrementally, writes first. Add review
  rule: "no `getDb()` in a route without org scoping."
- **Benefit:** removes the class of bug, not just the instance.

### 5. Duplicate session surfaces 🔜

- **Where:** `platform/routes/auth/register.routes.ts` (`GET/DELETE /sessions`,
  internal-secret, mounted `/platform/auth/*`) — **what the frontend uses**. Vs
  `platform/routes/sessions.routes.ts` (`tenantResolver`, mounted
  `/platform/users/sessions/*`) — **no frontend consumer**, reads via `getLaieDb()`.
- **Plan:** delete the unused `sessions.routes.ts` + its mount after confirming
  zero consumers.
- **Benefit:** one auth model for sessions; removes dead code (ponytail).

### 6. `/product/erix/chat` has no mount-level `tenantAuth` 🔎

- **Where:** `mountErixAsyncRoutes` — `/crm` gets `tenantAuth`, `/chat` doesn't.
- **Evidence:** not currently exploitable (chat handlers apply `validateClientKey`
  - `getOrgIdFromClientCode` per-route), but isolation relies on per-handler
    discipline.
- **Plan:** add the mount-level guard (verify no double tenant-resolution first).
- **Benefit:** mount-level guarantee over per-handler discipline.

---

## P2 — Hygiene / cleanup

### 7. Internal error messages leaked to clients 🔜

- **Where:** `credits.routes.ts`, `tenant-settings.routes.ts`, CRM route catches
  return raw `err.message` in the body.
- **Plan:** return generic `{ error: "INTERNAL_ERROR" }` + `log.error` server-side
  (auth/session routes already do this — mirror them).
- **Benefit:** no internal detail leak; consistent client error contract.

### 8. Duplicate admin invoice mount & root-mounted admin routers 🔎

- **Where:** `admin/index.ts` mounts `agency-invoices.routes` at both
  `/agency-invoices` and `/invoices`; several admin routers mount at `/`.
- **Plan:** one canonical invoice path; explicit prefixes for root-mounted routers.

### 9. Comment/path drift & dead placeholders 🔜

- **Where:** stale `/api/...` doc comments (`portal-inbox.routes.ts`,
  `me.routes.ts`, `register.routes.ts`); empty `routes/v1/platform/settings/`;
  `routes/v1/infra/index.ts` TODOs for storage/connect that are actually mounted
  in `versions/v1.ts`.
- **Plan:** fix comments to real mounted paths; delete the empty dir; note async
  mounts in the infra index.
- **Benefit:** the next contract change isn't misled by stale docs (drift like
  #1 starts here).

---

## Sequencing & benefit summary

1. **P0 #1, #2 — done** (broken endpoint + security hole closed now).
2. **P0 #3** next: highest leverage — makes the whole class of "silent 404" bugs
   visible in logs instead of screenshots.
3. **P1 #4/#5/#6:** collapse to one isolation model + one session surface —
   removes the _cause_ of #2 and shrinks the auth surface.
4. **P2:** error-contract consistency + dead-code/comment cleanup.

Owner split (AGENTS.md): in-repo code changes are agent-owned and locally
verifiable; prod deploy, DB, and env remain human-owned.
