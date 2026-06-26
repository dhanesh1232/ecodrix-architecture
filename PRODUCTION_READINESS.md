# ECODrIx — Production Readiness & Go-Live Runbook

> Status as of 2026-06-26. The codebase is **build-clean and test-green** across
> all three apps. What remains to be "sellable in production" is operational:
> apply the DB migration, set live credentials, deploy, and smoke-test the money
> paths. This document is the checklist.

---

## 0. Current verified state (code)

| App                      | Typecheck | Production build | Tests                          |
| ------------------------ | --------- | ---------------- | ------------------------------ |
| `server/`                | ✅ 0 errs | ✅ `dist/`       | ✅ 1940 pass / 10 skip, 0 fail |
| `saas/` (customer app)   | ✅ 0 errs | ✅ `next build`  | ✅ 969 pass, 0 fail            |
| `admin/` (control plane) | ✅ 0 errs | ✅ `next build`  | ✅ 109 pass, 0 fail            |

Notes:

- Perf benchmarks are now **opt-in** (`RUN_BENCH=1`); they no longer flake CI.
- `socialInbound` test no longer hits the live ERIX store (was a flaky timeout).
- Playwright `saas/e2e/*` specs are excluded from Vitest; run them with Playwright.

---

## 1. Database migration (REQUIRED before credits work)

The credit wallet tables ship in `server/src/shared/db/migrations/0016_credit_wallets.sql`.
Apply it to the production Postgres (Supabase) **before** deploying the new server:

```bash
psql "$LAIE_DATABASE_URL" -f server/src/shared/db/migrations/0016_credit_wallets.sql
```

Creates: `ecodrix_credit_wallets`, `ecodrix_credit_transactions`
(append-only ledger, partial-unique idempotency index), `ecodrix_credit_packs`
(+ seeds Starter/Growth/Pro). The SQL is idempotent (`IF NOT EXISTS` /
`ON CONFLICT DO NOTHING`) — safe to re-run.

Verify:

```sql
SELECT slug, credits, bonus_pct, price_inr FROM ecodrix_credit_packs;
```

---

## 2. Environment variables

### server/

| Var                                                                 | Purpose                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `LAIE_DATABASE_URL` / `DATABASE_URL`                                | Supabase Postgres (platform + products)                                  |
| `ERIX_STORE_URL`, `ERIX_STORE_API_KEY`, `ERIX_TENANT_ID`            | ErixStore (cache/queue/pubsub). Default port 6399                        |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **LIVE** keys for subscriptions + credit top-up orders                   |
| `LAIE_API_KEY`                                                      | Static operator key (per-tenant keys also supported via `laie_api_keys`) |
| R2: `R2_*` (account, access key, secret, bucket)                    | Media storage                                                            |
| Meta: system-user token / app secret                                | WhatsApp + IG/FB webhooks                                                |

### saas/

| Var                                                        | Purpose                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` / `BACKEND_URL`                  | Points the app + SDK at the live API                           |
| `NEXTAUTH_*` / auth provider secrets                       | Session + OAuth                                                |
| `NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_META_ES_CONFIG_ID` | WhatsApp Embedded Signup (falls back to manual creds if unset) |

### admin/

| Var                                | Purpose                                             |
| ---------------------------------- | --------------------------------------------------- |
| `CORE_API_URL`, `CORE_API_KEY`     | Proxy → backend `/api/admin/*`                      |
| `ADMIN_ALLOWED_EMAILS`             | Staff allowlist (missing = gate CLOSED; `*` = open) |
| `AUTH_GOOGLE_ID/SECRET` (optional) | Staff Google SSO                                    |

---

## 3. Deploy order

1. **Apply migration 0016** (§1).
2. **Deploy `server/`** (`npm run build` → run `dist/server.js`). Health-check `/`.
3. **Configure Razorpay webhooks** to the live server:
   - Platform billing: `/api/webhooks/razorpay/*`
   - Org payment gateway: `/webhooks/razorpay/org/:orgId`
4. **Deploy `saas/`** and **`admin/`** (`next build` → `next start`), env pointed at the live server.
5. Confirm `GET /api/platform/credits/packs` returns the 3 seeded packs.

---

## 4. Go-live smoke tests (money paths — do NOT skip)

Run against the live stack with a real (test-mode first, then live) Razorpay account:

1. **Subscription checkout**: saas → `/manage/billing/upgrade` → pick a paid plan →
   Razorpay modal → pay → verify subscription becomes `active`
   (`/api/platform/checkout/verify`). Confirms the plan-`id` fix end-to-end.
2. **Credit top-up**: saas → `/manage/credits` → buy a pack → Razorpay order →
   pay → wallet balance increases; a `purchase` row appears in transactions.
   Re-submit the same payment id → balance does NOT double (idempotency).
3. **Credit overage**: set a plan feature to `{ limit, overage:"credits", creditKey }`
   in admin → `/admin/plans/[id]` → exceed the limit on a billable route → expect
   402 `INSUFFICIENT_CREDITS` when wallet empty, and a wallet debit when funded.
   Confirm the saas "Buy credits" toast fires on 402.
4. **Admin wallet adjust**: admin → tenant → Wallet tab → grant +N credits →
   ledger shows a `bonus` row; balance updates.
5. **Webhook**: trigger a Razorpay test webhook → confirm signature verification
   passes and the subscription/credit state updates.

---

## 5. Known limitations to disclose / track

- **Unattended credit auto-charge is NOT enabled.** Auto-topup currently **alerts**
  (low-balance billing notification) rather than silently charging, because there
  is no saved Razorpay mandate/customer token for ad-hoc wallet debits. To enable
  true auto-charge, add a saved-mandate flow and swap the notify call in
  `platform/jobs/credit-autotopup.cron.ts` for `createCreditTopupOrder` + capture.
- **WhatsApp selling** requires Meta Tech Provider status + template approval
  (external business process, not code).
- **Fractional credit costs** (e.g. email = 0.2) round up per call via `Math.ceil`;
  batch sends are exact. Documented in `creditWallet.service.ts`.

---

## 6. Security checklist (verify before public launch)

- [ ] `requirePlatformAdmin` rejects non-admin roles (staff cannot escalate).
- [ ] `ADMIN_ALLOWED_EMAILS` is set (not `*`) in production.
- [ ] Razorpay **live** keys + webhook secret set; signature verification on.
- [ ] All credentials AES-256 at rest; never logged.
- [ ] Per-tenant LAIE keys: rotate/scope as needed; static `LAIE_API_KEY` is operator-only.
- [ ] CORS origins restricted to known frontends.
- [ ] Rate limiting active on public/auth routes.
