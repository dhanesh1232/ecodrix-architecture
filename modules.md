# ECODrIx — Modules Index

Working index of every module. Use this to find the relevant code, status, and active spec for any
piece of the platform. Status legend: ✅ Built · 🟡 Partial · ⬜ Planned.

## Platform Foundation

| Module                    | Status | Code                                                         | Active spec                              |
| ------------------------- | :----: | ------------------------------------------------------------ | ---------------------------------------- |
| Multi-tenant org model    |   ✅   | `server/src/shared/db/schema/platform/organizations.ts`      | `platform-completion-end-to-end/`        |
| Plans + add-ons           |   ✅   | `server/src/shared/db/schema/platform/plans.ts`              | `platform-pricing-entitlements/`         |
| Subscriptions + lifecycle |   ✅   | `server/src/platform/services/subscription.service.ts`       | `platform-pricing-entitlements/`         |
| Atomic usage metering     |   ✅   | `server/src/shared/services/global/usage.service.ts`         | `platform-pricing-entitlements/`         |
| Entitlement service       |   ✅   | `server/src/platform/services/entitlements.service.ts`       | `platform-pricing-entitlements/`         |
| Cloud storage (R2 + CDN)  |   🟡   | `server/src/infra/storage/`, `ecodrix_cloud_storage`         | `platform-pricing-entitlements/` (Req 8) |
| Audit logs                |   ✅   | `ecodrix_audit_logs`                                         | —                                        |
| API tokens                |   ✅   | `ecodrix_api_tokens`                                         | `platform-completion-end-to-end/`        |
| Waitlist                  |   ✅   | `server/src/platform/services/waitlist/`, `ecodrix_waitlist` | —                                        |

## Multi-Source Data Layer

| Module                            | Status | Code                                                               | Active spec                       |
| --------------------------------- | :----: | ------------------------------------------------------------------ | --------------------------------- |
| `ErixAdapter` interface           |   🟡   | `server/src/erix/lib/erix-adapter/types.ts` (in flight)            | `platform-completion-end-to-end/` |
| `PostgresAdapter`                 |   🟡   | `server/src/erix/lib/erix-adapter/postgres-adapter.ts` (in flight) | `platform-completion-end-to-end/` |
| `MongoAdapter` (legacy bridge)    |   🟡   | wraps `getCrmModels(clientCode)`                                   | `platform-completion-end-to-end/` |
| `DualAdapter` + `erix-sync` queue |   ⬜   | planned                                                            | `platform-completion-end-to-end/` |
| `tenantResolver` middleware       |   🟡   | `server/src/shared/middleware/saasAuth.ts` (being rewritten)       | `platform-completion-end-to-end/` |
| Mongo Atlas provisioner           |   ⬜   | `server/src/services/admin/mongo-provisioner.ts` (planned)         | `platform-completion-end-to-end/` |
| External DB encryption            |   ✅   | `server/src/shared/utils/crypto.ts` (AES-256-CBC)                  | —                                 |

## Auth & Acquisition

| Module                                   | Status | Code                                                           | Active spec                       |
| ---------------------------------------- | :----: | -------------------------------------------------------------- | --------------------------------- |
| NextAuth v5 (saas)                       |   ✅   | `saas/src/app/(auth)/`, `saas/src/lib/auth.ts`                 | —                                 |
| Public registration `/api/auth/register` |   ⬜   | planned                                                        | `platform-completion-end-to-end/` |
| Password reset (`/auth/forgot`)          |   🟡   | `saas/src/app/(auth)/auth/forgot-password/`                    | `platform-completion-end-to-end/` |
| Admin client creation bridge             |   ⬜   | planned (writes both Mongo `Client` + `ecodrix_organizations`) | `platform-completion-end-to-end/` |
| Onboarding wizard                        |   ⬜   | planned at `/onboarding`                                       | `platform-completion-end-to-end/` |

## ERIX CRM

| Module                              | Status | Code                                                    | Active spec                       |
| ----------------------------------- | :----: | ------------------------------------------------------- | --------------------------------- |
| Leads + activities + notes          |   ✅   | `erix_leads`, `erix_lead_activities`, `erix_lead_notes` | `erix-crm-module/`                |
| Pipelines + stages                  |   ✅   | `erix_pipelines`, `erix_pipeline_stages`                | `erix-crm-module/`                |
| Conversations + messages (WhatsApp) |   ✅   | `erix_conversations`, `erix_messages`                   | —                                 |
| WhatsApp templates + broadcasts     |   ✅   | `erix_whatsapp_templates`, `erix_broadcasts`            | —                                 |
| Email templates                     |   ✅   | `erix_email_templates`                                  | —                                 |
| Meetings (Google Meet)              |   ✅   | `erix_meetings`                                         | —                                 |
| Segments + scoring                  |   ✅   | `erix_segments`, `erix_scoring_configs`                 | —                                 |
| Automation rules + sequences        |   ✅   | `erix_automation_rules`, `erix_sequence_enrollments`    | —                                 |
| Visual workflows                    |   ✅   | `erix_workflows`, `erix_workflow_runs`                  | `visual-automation-builder/`      |
| Notifications                       |   ✅   | `erix_notifications`                                    | —                                 |
| Invoices + settings                 |   ✅   | `erix_invoices`, `erix_invoice_settings`                | `invoice-module/`                 |
| Dynamic field builder               |   ⬜   | `erix_field_configs` planned                            | `platform-completion-end-to-end/` |

## LAIE Lead Engine

| Module                                       | Status | Code                                                                | Active spec      |
| -------------------------------------------- | :----: | ------------------------------------------------------------------- | ---------------- |
| Tenant + user + API key                      |   ✅   | `laie_tenants`, `laie_users`, `laie_api_keys`                       | —                |
| Actor runtime                                |   ✅   | `server/src/services/actor-runtime/`                                | —                |
| Actors (Google Maps, web research, LinkedIn) |   ✅   | `server/src/lib/laie/actors/`, `laie_actors`                        | —                |
| Datasets + dataset items                     |   ✅   | `laie_datasets`, `laie_dataset_items`                               | —                |
| Audits (GBP, accessibility, SEO)             |   🟡   | `laie_health_score_checks` and friends                              | `laie-audit-ui/` |
| Lead intelligence (M01–M12)                  |   🟡   | `laie_review_intelligence`, `laie_competitor`, `laie_cluster`, etc. | —                |
| Outreach kits (Claude on Vertex)             |   ✅   | `laie_outreach_kits`, `lib/laie/claudeClient.ts`                    | —                |
| Audit UI (search → progress → result)        |   🟡   | `saas/src/app/(laie)/laie/audit/`                                   | `laie-audit-ui/` |
| Leads + push to ERIX                         |   🟡   | `laie_leads`, `laie_lead_jobs`                                      | —                |
| Workflows + schedules + webhooks             |   ✅   | `laie_workflows`, `laie_schedules`, `laie_webhooks`                 | —                |

## ErixStore (Infrastructure)

| Module                                              | Status | Code                                                     |
| --------------------------------------------------- | :----: | -------------------------------------------------------- | --------------------------------- |
| Cache (LRU + tags + SWR)                            |   ✅   | `erix-store/src/cache/`                                  |
| Job queue v2 (priority, DLQ, retry, heartbeat)      |   ✅   | `erix-store/src/queue-v2/`                               |
| Distributed locks                                   |   ✅   | `erix-store/src/locks/`                                  |
| Pub/Sub + EventBus                                  |   ✅   | `erix-store/src/pubsub/`                                 |
| Rate limiter (sliding window)                       |   ✅   | `erix-store/src/rate-limit/`                             |
| Anomaly detector                                    |   ✅   | `erix-store/src/anomaly/`                                |
| Semantic cache (Google embeddings)                  |   ✅   | `erix-store/src/semantic/`                               |
| Per-tenant usage meter (flushed to `ecodrix_usage`) |   ✅   | `erix-store/src/usage/`                                  |
| WAL + snapshot persistence                          |   ✅   | `store_job_wal`, `store_snapshots`, `store_usage_events` |
| Infra dashboard frontend                            |   ⬜   | planned at `/infra/*`                                    | `platform-completion-end-to-end/` |

## AI

| Module                                     | Status | Code                                            | Active spec        |
| ------------------------------------------ | :----: | ----------------------------------------------- | ------------------ |
| Auto-respond (Gemini 2.0 Flash, Vertex AI) |   ✅   | `server/src/laie/services/ai/auto-responder.ts` | `ai-auto-respond/` |
| Semantic cache integration                 |   ✅   | uses ErixStore `semantic` service               | `ai-auto-respond/` |
| Confidence threshold + queue-for-review    |   ✅   | `server/src/laie/services/ai/confidence.ts`     | `ai-auto-respond/` |
| Outreach kit generation (Claude on Vertex) |   ✅   | `server/src/laie/lib/laie/claudeClient.ts`      | —                  |
| Smart reply suggestions                    |   ✅   | `@ecodrix/erix-react/ai/SmartReplySuggestions`  | —                  |
| Lead score AI snapshot                     |   🟡   | `erix_leads.ai_summary`                         | —                  |
| Predictive pipeline forecast               |   ⬜   | planned                                         | —                  |
| Adaptive learning store                    |   ⬜   | planned (ErixStore-backed)                      | —                  |
| Daily morning briefing                     |   ⬜   | planned                                         | —                  |
| Sales coaching                             |   ⬜   | planned                                         | —                  |

## SDKs (Developer Surface)

| Package                | Version | Status | Notes                                                                                               |
| ---------------------- | ------- | :----: | --------------------------------------------------------------------------------------------------- |
| `@ecodrix/erix-api`    | 1.x     |   ✅   | Isomorphic TS SDK — frontend MUST use this                                                          |
| `@ecodrix/erix-react`  | 0.x     |   🟡   | Embeddable React SDK — pro-tier features (collab, comments, version history) gated via entitlements |
| `@ecodrix/chatbot`     | 0.x     |   🟡   | Embeddable chat widget                                                                              |
| `@ecodrix/erix-client` | n/a     |   ✅   | Internal — used by server to talk to ErixStore                                                      |
| `@ecodrix/erix-worker` | n/a     |   ✅   | Internal — job processor                                                                            |

## Frontends

| App                 | Status | Path         | Notes                                                            |
| ------------------- | :----: | ------------ | ---------------------------------------------------------------- |
| `saas` (direct)     |   🟡   | `ECOD/saas`  | Console, billing, ERIX, LAIE shipped; settings + infra in flight |
| `admin` (freelance) |   ✅   | `ECOD/admin` | Client mgmt, CRM, marketing, monetization, templates             |

## Cross-Cutting

> **Note (post-reorganization):** The platform has been restructured into product modules.
> Use path aliases (`@erix/*`, `@laie/*`, `@flow/*`, `@infra/*`, `@shared/*`, `@platform/*`) for imports.
> See `ECOD/server/README.md` for the full directory structure and module boundary rules.

| Concern                           | Code (new path)                                              |
| --------------------------------- | ------------------------------------------------------------ |
| Logging                           | `server/src/shared/utils/logger.ts` (`@shared/utils/logger`) |
| Encryption                        | `server/src/shared/utils/crypto.ts` (`@shared/utils/crypto`) |
| ErixStore client                  | `server/src/infra/store/client/` (`@infra/store`)            |
| Tenant connection manager (Mongo) | `server/src/shared/utils/connectionManager.ts`               |
| Idempotency keys                  | `server/src/shared/middleware/idempotency.ts`                |
| Rate limit middleware             | `server/src/shared/middleware/rate-limit.ts`                 |
| Quota middleware factory          | `server/src/shared/middleware/quotaGuard.ts`                 |
| Plan boolean gate                 | `server/src/shared/middleware/planGuard.ts`                  |
| Bandwidth + storage tracking      | `server/src/shared/middleware/bandwidthTracking.ts`          |

Last updated: 2026-06-14 · Cross-references: `saas/.kiro/specs/`, `.kiro/specs/platform-reorganization/`.
