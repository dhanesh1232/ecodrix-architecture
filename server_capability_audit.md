# ECODrIx Server — Capability Audit vs Product Vision

**Date:** June 2026 · **Method:** Inventoried `ECOD/server/src` (routes, services, schema, infra) + `ECOD/saas` app routes + `ECOD/packages` and mapped each to the LAIE / CRM / FLOW / Connect / Storage / Store vision.

> **Headline:** ECODrIx is **~75–85% built** against the vision. The three products and Store are real and deep; the gaps are concentrated in **Connect-payments**, the **credentialed client portal**, **Storage external delivery**, **Voice (not started)**, and **automation-engine consolidation** (tech debt). Nothing here requires a rebuild — these are finish-and-harden items.

> **🟢 PROGRESS UPDATE (June 2026).** Acting on this audit: **G1 (Connect-Payments)** and **G2 (credentialed client portal)** are now **shipped + migrated**; **G3 (automation consolidation)** has a complete spec (`.kiro/specs/automation-engine-consolidation`) + its Phase-1 idempotency foundation shipped & tested; **G4** docs are reconciled (`new_mvp.md` is canonical, `blueprint/*` bannered) and **Storage external delivery was found already-built** (see G4 below — corrected). Remaining: G3 later phases (send-site dedup, engine retirement) + **G5 Voice** (planned).

---

## 1. Capability scorecard (verified in code)

| Capability (vision)                                       | Status         | Evidence in `server/src`                                                                                                                   |
| --------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **LAIE** scrape → validate → enrich → analyse → outreach  | ✅ ~90%        | `laie/jobs/scraperWorker.ts`, `laie/services/ai/*`, `laie_outreach_kits`, `laie_research_reports`, relay fabric                            |
| LAIE relay reliability (scale)                            | ✅ Done        | `laie/lib/proxyKit/*` + dynamic relay fabric (just shipped)                                                                                |
| LAIE → CRM export                                         | ✅             | import/export routes + `crm_contact_id` linkage                                                                                            |
| **CRM** lead mgmt + pipelines + scoring + segments        | ✅             | `erix/services/crm/{lead,pipeline,scoring,segment}.service.ts`, `erix_leads`, `erix_pipelines`                                             |
| CRM unified inbox (WA/IG/email)                           | ✅             | `erix_conversations`, `erix_messages`, connect channels                                                                                    |
| CRM automation rules + sequences                          | ✅ (debt)      | `erix_automation_rules`, `erix_sequence_enrollments`, `automation.service.ts`                                                              |
| CRM → Project management (internal)                       | ✅             | `erix/routes/crm/project.routes.ts`, `erix_projects`/`erix_project_tasks`/`erix_proposals`                                                 |
| **Client portal (public, per-tenant)**                    | 🟡 Partial     | `erix_projects.portalToken` exists (token-link access) — but vision wants **email+password client login**, dual thread, doc upload/approve |
| **FLOW** cross-product engine                             | ✅ (debt)      | `flow/engine/*` (crmNodes, laieNodes, aiNodes, outreachNodes, crmTrigger, runService, capabilityGating, nodeRegistry)                      |
| FLOW — multiple overlapping engines                       | 🟠 Debt        | 4 engines coexist (CRM rules, 2 DAG workflow services, flow/engine) — consolidation needed                                                 |
| **Connect** channels (WA/IG/FB/Telegram/Email/Google/SMS) | ✅             | `infra/connect/providerRegistry.ts` + channels/providers, encrypted secrets facade                                                         |
| Connect — payment gateways (per-tenant)                   | 🔴 Gap         | Razorpay is **platform-billing only** (global env keys); not a per-tenant Connect provider; **Stripe missing**                             |
| **ERIX-Storage** (R2 CDN)                                 | 🟡 Partial     | `infra/storage/StorageService.ts` + `r2.client.ts` + public CDN URL; external **API-key delivery** (cloudinary-like) thin                  |
| **ErixStore** (queue/cache)                               | ✅ Live        | hosted HTTP/WS service via `@ecodrix/erix-client`                                                                                          |
| **AI within rules** (assist, not autonomous)              | ✅             | `laie/services/ai/auto-responder.ts`, `laie/workers/ai-respond.worker.ts`, `shared/middleware/ai-access.ts`, flow `ai-respond` node        |
| **Voice agent** (Asterisk/LiveKit/Gemini)                 | 🔵 Not started | Only `laie/routes/voice.routes.ts` intake stub — Aug 2026                                                                                  |
| Billing/subscriptions/entitlements                        | ✅             | `platform/services/{subscription,entitlements,plans}` + Razorpay webhook                                                                   |
| Auth (JWT 15m + refresh 30d) + members + onboarding       | ✅             | `platform/services/auth/*`, `ecodrix_users/members/organizations`                                                                          |

---

## 2. The gaps that actually matter (ranked)

### 🔴 G1 — Connect payments are not per-tenant (blocks the flagship flow)

The doc's headline loop is "lead won → Razorpay payment link on WhatsApp → webhook → invoice." In code, Razorpay (`infra/connect/providers/payments/razorpay.ts`) reads **global** `RAZORPAY_KEY_ID/SECRET` — it's the platform's own billing, not the _tenant's_ gateway. There is **no `payments` provider in the Connect registry** and **no Stripe**. So a tenant cannot connect their own Razorpay/Stripe and collect from their clients. This is the single biggest functional gap.
**Do:** add a `payments` provider to `providerRegistry.ts` (Razorpay + Stripe, per-tenant OAuth/keys, encrypted via the secrets facade) → connect/config/test flow → payment-link action → webhook → invoice hook. Fits the existing registry pattern (no schema churn).

### 🟡 G2 — Client portal is token-link, not credentialed login

Vision: client logs in with their email + a password they set on first access; only your user + that client can see the page; dual conversation thread (team↔client); client uploads/approves docs. Code has `erix_projects.portalToken` (a shared public link) — good for read-only tracking, but **not** per-client credentials, not a dual thread, not upload/approve.
**Do:** add client-auth (email + set-password, scoped to project/tenant), a client↔team message thread on the project, and doc upload/approve. There's a related `erix-editor-public-access` spec to reuse.

### 🟠 G3 — Four automation engines (scaling debt, not a feature gap)

`flow/engine` + CRM `automation.service` + two DAG workflow services coexist (see `.MD/doc/erix_automation_flow_audit.md`). Works today, but doubles maintenance and risks the EventBus double-fire bug already flagged. **Do (before scaling):** converge on `flow/engine` as the one engine; make CRM rules a thin trigger layer. Plan already exists in `.MD/doc/erix_automation_unified_strategy.md`.

### 🟢 G4 — ERIX-Storage external delivery — CORRECTED: already built

On verification the cloudinary-like external delivery is essentially present, not "thin": public CDN delivery via `R2_PUBLIC_URL`, Cloudflare `/cdn-cgi/image/` transforms (`image.utils.ts`), presigned upload/download URLs (`StorageService`), the `@ecodrix/erix-api` `storage` SDK resource, per-tenant API key (`x-api-key` / `validateClientKey`) for external SDK access, and `bandwidthTracking` metering. The `developer-storage-surface` spec (5/5 done) shipped the API-key + install-snippet + SDK-access developer surface.
**Verdict:** no build needed. Optional future polish: signed time-boxed delivery tokens + a per-key usage dashboard. (Reclassified 🟡→🟢.)

### 🔵 G5 — Voice agent not started

Only an intake stub. It's the highest-margin add-on but a whole subsystem (Asterilk/LiveKit/Gemini Live + Airtel SIP). **Defer to its own August spec** — don't let it pull focus from G1/G2.

### 🟢 G6 — Docs drift (already audited)

See `blueprint_audit.md`. Reconcile the two "v2.0" doc sets; regenerate `SCHEMA.md` from live schema.

---

## 3. What this means for scale & growth

- **You are not early — you're ~80% to a sellable platform.** LAIE (with the new relay fabric), CRM, FLOW, Connect channels, Store, billing, and rule-bound AI are all real. That is a _lot_ for a solo founder and is genuinely defensible.
- **The remaining work is "close the revenue loop," not "build the platform."** G1 (per-tenant payments) + G2 (credentialed client portal) are exactly the two pieces that let a customer run the full _lead → won → paid → delivered_ cycle inside ECODrIx. Those two unlock the "complete GTM stack" pitch.
- **Scaling risk is operational, not architectural.** The multi-engine automation debt (G3) is the one thing that will slow you down as customers grow — fix it while customer count is low.
- **Growth sequence:** finish G1 + G2 → 20–30 reference customers on the full loop → consolidate automation (G3) → open Partner Club → then Voice (G5) + Storage delivery (G4) + marketplace as expansion revenue.

---

## 4. Recommended next actions (in order)

1. **🔴 Connect-Payments spec + build** — Razorpay (per-tenant) + Stripe as Connect providers, payment-link action, webhook → invoice. _Closes the flagship flow. Highest ROI._
2. **🟡 Client-Portal spec + build** — credentialed client login + dual thread + doc upload/approve. _Completes the CRM → project → client loop._
3. **🟠 Automation consolidation spec** — converge to one FLOW engine; CRM rules → thin trigger layer. _Removes the main scaling drag._
4. **🟢 Doc reconciliation** — make `new_mvp.md` canonical, regenerate `SCHEMA.md`. _Cheap, unblocks future work._
5. **🟡 Storage external delivery** — tenant API key + signed delivery + metering.
6. **🔵 Voice agent** — its own August spec (Asterisk + LiveKit + Gemini Live + Airtel SIP).

**Start with #1 (Connect-Payments).** It's bounded, fits the existing registry, and is the missing link in the money flow. I can spin up the `erix-connect-payments` spec (requirements → design → tasks) and implement it the same way the relay fabric was delivered.
