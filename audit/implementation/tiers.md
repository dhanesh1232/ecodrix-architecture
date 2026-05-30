Honest answer: "perfect" is a moving target. Let me give you a concrete plan instead — what to do, in what order, with the cost/value of each step. Then you pick how far down the list to go.

## Tier 0 — Stability blockers (must-fix before anything else)

These are bugs found in the audit that will hurt real users.

| #   | Action                                                                                                                                                                         | Effort | Impact                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------- |
| 1   | Fix `crm.leads.bulkDelete` verb/path mismatch (SDK uses `DELETE /api/crm/leads`, server has `POST /bulk-delete`).                                                              | 5 min  | Restores a broken SDK method. |
| 2   | Audit `routes/erix/workflow.routes.ts` for `req.clientCode` being passed where a UUID is expected. If true, fix the schema/lookup before more workflow data accumulates wrong. | 30 min | Prevents data corruption.     |
| 3   | Confirm `routes/automation/index.ts` is unmounted; delete if dead.                                                                                                             | 10 min | Removes confusion.            |
| 4   | Decide on `corsRouter` double-mount: pick `validateClientKey` (tenant-scoped) OR `verifyCoreToken` (admin-only), not both.                                                     | 15 min | Removes ambiguous auth path.  |

**Total ~1 hour. Do this first.**

## Tier 1 — Security & gating consistency (the audit's main output)

Close the metered-but-ungated gaps so unbridged tenants stop draining shared resources.

| #   | Action                                                                                                                                                               | Effort |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 5   | Add `requireFeature("erix.broadcasts") + createQuotaMiddleware("erix","whatsappMessages", recipients-count)` to `POST /api/saas/chat/broadcast`.                     | 10 min |
| 6   | Gate `POST /api/saas/marketing/emails/test` (low quota or feature flag).                                                                                             | 10 min |
| 7   | Gate `POST /api/crm/payments/capture` with `requireFeature("payments")` + audit log.                                                                                 | 15 min |
| 8   | Gate `POST /api/crm/automations/:id/test` and `POST /api/saas/workflows/:id/runs/:runId/resume` with `createQuotaMiddleware("workflows","runsPerMonth")`.            | 10 min |
| 9   | Add a per-IP rate limiter to `POST /api/saas/workflows/:id/test-run`.                                                                                                | 10 min |
| 10  | Pick a gating convention: router-level `router.use(requireFeature(...))` (like `laie/webhooks.routes.ts`) vs per-route. Apply across the 5+ routers that mix styles. | 30 min |

**Total ~1.5 hours. Tier 1 closes the audit's "unwanted gaps" column entirely.**

## Tier 2 — Required things still missing (functionality the spec promised)

Pulling from the spec's `[~]` and `[ ]` items that block real workflows.

| #   | Action                                                                                                                                                                                                                                | Effort    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 11  | NextAuth in saas (`lib/auth.ts`) needs to actually call backend `/api/auth/login` against `ecodrix_users`, not the legacy Mongo `User` model. The `register.routes.ts` `/login` endpoint already exists; just repoint NextAuth at it. | 1–2 hours |
| 12  | `POST /api/admin/external-db/test` route — open + ping + close, reject save on failure with specific stage. Unblocks admin "Test connection" button.                                                                                  | 1 hour    |
| 13  | `services/admin/mongo-provisioner.ts` + `POST /api/admin/provision-mongo` (Atlas Admin API). The biggest remaining freelance-onboarding gap.                                                                                          | 4–6 hours |
| 14  | Wire `conversations.adapter.ts` into `routes/erix/ai.routes.ts` (3 call sites). Removes top-3 Mongo callers in one PR.                                                                                                                | 30 min    |
| 15  | Build `services/saas/crm/automations.adapter.ts` and migrate `routes/erix/crm/automation.routes.ts` (5 sites) + `jobs/saas/automationWorker.ts` (2 sites).                                                                            | 4–6 hours |
| 16  | Build `services/saas/crm/event-log.adapter.ts` and migrate `routes/erix/event-log.routes.ts` (4 sites).                                                                                                                               | 2–3 hours |
| 17  | Build `services/saas/crm/email-templates.adapter.ts` and migrate `routes/erix/mail/email-templates.routes.ts` (8 sites).                                                                                                              | 3–4 hours |

**Total ~16–22 hours. Tier 2 is where "saas backend" becomes truly multi-tenant on Postgres.**

## Tier 3 — Quality of life (if you have time)

| #   | Action                                                                                                           | Effort   |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 18  | DualAdapter (Wave 7 in tasks.md) — `data_mode="both"` actually works instead of falling back to Postgres-only.   | 2–3 days |
| 19  | E2E verification script extensions (`14.3` and `14.4`): freelance onboarding + mode switch flows.                | 1 day    |
| 20  | Infra dashboard backend (`infraMetricsService` + `/api/infra/metrics`) — frontend already wants this.            | 2 days   |
| 21  | Adapter contract test suite (Wave 6.12 / 2.8) — same fixtures against Postgres + Mongo + Dual adapters.          | 1 day    |
| 22  | Documentation: `ECOD/.Architecture/adapters.md` (`15.4`), schema doc updates (`15.2`).                           | 4 hours  |
| 23  | SDK additions for the new tenant control plane (`me`, `members`, `fields`, `onboarding`) for external consumers. | 1 day    |

## Tier 4 — Nice-to-haves (defer indefinitely unless someone asks)

| #   | Action                                                                    |
| --- | ------------------------------------------------------------------------- |
| 24  | `/settings/security` page (sessions, 2FA, audit log viewer).              |
| 25  | `/settings/data-source` page (data_mode switcher with health check).      |
| 26  | Email verification quota throttle UI feedback in saas.                    |
| 27  | White-label endpoints + `requireFeature("platform.whiteLabel")`.          |
| 28  | Postgres-tenant mirroring for `external_db_type="postgresql"` (Wave 7.5). |

## What "perfect" actually means here

The phrase doesn't usefully apply to a multi-product backend like this — there's always more spec, more migration, more telemetry. What you can hit are these milestones:

- **Stable** = Tier 0 done. ~1 hour.
- **Secure & consistent** = Tier 0 + Tier 1. ~2.5 hours.
- **Spec-complete for v3.0** = Tier 0 + 1 + 2. ~3 days.
- **Production-grade for multi-source DB** = Tier 0 + 1 + 2 + 3. ~1.5 weeks.

## My recommendation

Knock out Tier 0 + Tier 1 right now in a single PR — it's ~2.5 hours of work, fixes real bugs, and closes every metered-but-ungated gap. Then evaluate whether Tier 2 is worth it before the next deploy or whether you'd rather ship and iterate.

Want me to start on Tier 0 (4 small fixes) right now? Or jump straight to Tier 0 + Tier 1 in one PR?
