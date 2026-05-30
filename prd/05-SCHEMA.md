# 05 — Schema Reference

> Comprehensive list of every Postgres table the platform uses today, grouped by domain. Authoritative
> source of truth: `ECOD/server/src/shared/db/schema/{platform,erix,laie}/*.ts`. This doc is the
> human-readable index — when in doubt, read the Drizzle file.

## 1. Database Architecture Overview

| Aspect           | Detail                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Primary database | PostgreSQL 15 (Supabase)                                                                                                 |
| ORM              | Drizzle ORM (TypeScript, type-safe)                                                                                      |
| Migrations       | One config (`ECOD/server/drizzle.config.ts`), three folders: `migrations/platform`, `migrations/erix`, `migrations/laie` |
| Multi-tenancy    | Row-level isolation via `org_id` FK to `ecodrix_organizations`                                                           |
| IDs              | UUID v4 (`defaultRandom()`); some legacy bigserial in waitlist                                                           |
| Timestamps       | `timestamp with time zone`                                                                                               |
| JSON             | `jsonb` for flexible / nested data                                                                                       |
| Encryption       | AES-256-CBC for stored secrets (external DB URIs, third-party tokens)                                                    |
| Tenant Mongo     | Only for `data_mode="own"+mongodb` orgs (legacy + freelance), behind `MongoAdapter`                                      |

## 2. Multi-Tenancy & Data Modes

> **Boundary:** every CRM and LAIE row carries `org_id`. The `tenantResolver` middleware loads
> `ecodrix_organizations` and attaches it to the request — no query reaches the DB without
> `req.org.id`.

| Mode                 | Where data lives               | Adapter                             |
| -------------------- | ------------------------------ | ----------------------------------- |
| `platform`           | This Postgres, `org_id` filter | `PostgresAdapter`                   |
| `own` + `mongodb`    | Tenant's isolated Mongo        | `MongoAdapter`                      |
| `own` + `postgresql` | Tenant's PG, our schema        | `PostgresAdapter` (per-tenant pool) |
| `both`               | This PG primary + queued sync  | `DualAdapter`                       |

## 3. Platform Tables (`ecodrix_*`)

Source: `server/src/shared/db/schema/platform/`.

| Table                   | File               | Purpose                                                                                                                                                   |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ecodrix_organizations` | `organizations.ts` | Tenant identity, plan, entitlements (`add_ons` jsonb), data mode, WhatsApp state, AI agent config, branding                                               |
| `ecodrix_users`         | `organizations.ts` | Login identity (email, password hash, name, timezone)                                                                                                     |
| `ecodrix_members`       | `organizations.ts` | User ↔ org join with role and per-product access flags                                                                                                    |
| `ecodrix_plans`         | `plans.ts`         | Plan catalog. `tier` integer for ordered comparison, `features` jsonb covers all services                                                                 |
| `ecodrix_addons`        | `plans.ts`         | Add-on catalog with override path + price unit                                                                                                            |
| `ecodrix_subscriptions` | `subscriptions.ts` | Active subscriptions (one row per base plan or add-on); tracks lifecycle (active / past_due / cancelled / expired); stores queued downgrade in `metadata` |
| `ecodrix_usage`         | `usage.ts`         | Atomic per-period counters; unique on `(orgId, service, feature, periodStart)` for `INSERT … ON CONFLICT` upserts                                         |
| `ecodrix_cloud_storage` | `cloud-storage.ts` | File metadata for the unified cloud storage / CDN service                                                                                                 |
| `ecodrix_api_tokens`    | `security.ts`      | API keys with `key_prefix` + `key_hash` (bcrypt) + scopes                                                                                                 |
| `ecodrix_audit_logs`    | `security.ts`      | Org-level audit trail (plan change, mode change, key regenerate, member invite, …)                                                                        |
| `ecodrix_waitlist`      | `waitlist.ts`      | Public waitlist signups                                                                                                                                   |

### Entity relationships

```
ecodrix_users ──< ecodrix_members >── ecodrix_organizations
                                          │
                ┌─────────────────────────┼──────────────────────────────────┐
                │                         │                                  │
       ecodrix_subscriptions      ecodrix_usage                       ecodrix_audit_logs
                │                         │
       ecodrix_plans                ecodrix_addons (catalog)
```

## 4. ERIX CRM Tables (`erix_*`)

Source: `server/src/shared/db/schema/erix/`. All have `org_id → ecodrix_organizations.id`.

### 4.1 Pipelines + leads

| Table                  | File           | Purpose                                                                       |
| ---------------------- | -------------- | ----------------------------------------------------------------------------- |
| `erix_pipelines`       | `pipelines.ts` | Sales pipelines (one default per org via partial unique index)                |
| `erix_pipeline_stages` | `pipelines.ts` | Stages with order, color, isWon/isLost, probability, `auto_actions` jsonb     |
| `erix_leads`           | `leads.ts`     | Lead identity, deal info, score, dynamic_fields, AI summary, LAIE leadGenData |
| `erix_lead_activities` | `leads.ts`     | Immutable timeline events (whatsapp*\*, email*\*, stage_change, deal_won, …)  |
| `erix_lead_notes`      | `leads.ts`     | Long-form collaborative notes, pinnable                                       |

### 4.2 Conversations + messages

| Table                | File               | Purpose                                                                                                                                                  |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erix_conversations` | `conversations.ts` | One thread per (org, phone, channel); aggregates last-message snapshot                                                                                   |
| `erix_messages`      | `conversations.ts` | Append-only messages with full WA surface (text/image/video/audio/voice/document/sticker/interactive/template/location/reaction/order/catalog/flow/etc.) |

### 4.3 Templates + broadcasts

| Table                     | File           | Purpose                                                           |
| ------------------------- | -------------- | ----------------------------------------------------------------- |
| `erix_whatsapp_templates` | `templates.ts` | WA templates registered with Meta; variable mapping per CRM field |
| `erix_broadcasts`         | `templates.ts` | Bulk template sends with per-recipient counters                   |
| `erix_email_templates`    | `templates.ts` | Reusable HTML/text email templates with version + layouts         |

### 4.4 Automation

| Table                       | File            | Purpose                                                                   |
| --------------------------- | --------------- | ------------------------------------------------------------------------- |
| `erix_automation_rules`     | `automation.ts` | Declarative trigger + condition tree + actions/sequence steps             |
| `erix_sequence_enrollments` | `automation.ts` | Per-lead state machine for sequence progression                           |
| `erix_workflows`            | `workflows.ts`  | Visual Automation Builder graph (`nodes` + `edges` jsonb), `trigger_type` |
| `erix_workflow_runs`        | `workflows.ts`  | Per-execution log with `node_results` jsonb                               |

### 4.5 Other CRM

| Table                   | File               | Purpose                                                           |
| ----------------------- | ------------------ | ----------------------------------------------------------------- |
| `erix_meetings`         | `meetings.ts`      | Google Meet bookings + reminder schedule                          |
| `erix_segments`         | `segments.ts`      | Dynamic segment rules + cached member count                       |
| `erix_scoring_configs`  | `segments.ts`      | One scoring config per org (rules, thresholds, recalc triggers)   |
| `erix_notifications`    | `notifications.ts` | CRM user notifications (alerts + actionable items)                |
| `erix_invoices`         | `invoices.ts`      | Invoice records with payment tracking + Razorpay link             |
| `erix_invoice_settings` | `invoices.ts`      | Per-org invoice config (company info, prefix, tax, Razorpay keys) |

### 4.6 Planned (in flight)

| Table                | Purpose                                                                           | Spec                                       |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| `erix_field_configs` | Dynamic CRM field builder (entity, key, type, config, per-view visibility, order) | `platform-completion-end-to-end/` (Req 26) |
| `erix_webhooks`      | Outbound webhook subscriptions per org                                            | `platform-completion-end-to-end/`          |

### 4.7 ERIX entity diagram (logical)

```
ecodrix_organizations
   │
   ├── erix_pipelines ──< erix_pipeline_stages >── erix_leads
   │                                                  │
   │                                                  ├── erix_lead_activities
   │                                                  ├── erix_lead_notes
   │                                                  ├── erix_meetings
   │                                                  └── erix_invoices
   │
   ├── erix_conversations ──< erix_messages
   ├── erix_whatsapp_templates ──< erix_broadcasts
   ├── erix_email_templates
   ├── erix_automation_rules ──< erix_sequence_enrollments
   ├── erix_workflows ──< erix_workflow_runs
   ├── erix_segments
   ├── erix_scoring_configs
   ├── erix_notifications
   └── erix_invoice_settings
```

## 5. LAIE Lead Engine Tables (`laie_*`)

Source: `server/src/shared/db/schema/laie/`. 28 schemas; all carry `tenant_id` (LAIE's own tenant
boundary, distinct from `ecodrix_organizations.id`). Mapping between LAIE tenants and platform orgs
lives in `laie_tenants.platform_org_id` (rolling out as schemas evolve).

### 5.1 Core

| Table               | File                |
| ------------------- | ------------------- |
| `laie_tenants`      | `tenant.schema.ts`  |
| `laie_users`        | `user.schema.ts`    |
| `laie_profiles`     | `profile.schema.ts` |
| `laie_sessions`     | `session.schema.ts` |
| `laie_api_keys`     | `api-key.schema.ts` |
| `laie_proxies`      | `proxy.schema.ts`   |
| `laie_quotas_usage` | `quota.schema.ts`   |

### 5.2 Actor runtime

| Table                | File                  |
| -------------------- | --------------------- |
| `laie_actors`        | `actor.schema.ts`     |
| `laie_actor_runs`    | `actor-run.schema.ts` |
| `laie_datasets`      | `dataset.schema.ts`   |
| `laie_dataset_items` | `dataset.schema.ts`   |

### 5.3 Lead intelligence

| Table                      | File                           |
| -------------------------- | ------------------------------ |
| `laie_lead_flows`          | `leadFlow.schema.ts`           |
| `laie_lead_jobs`           | `leadJob.schema.ts`            |
| `laie_lead_followups`      | `leadFollowUp.schema.ts`       |
| `laie_lead_clusters`       | `leadCluster.schema.ts`        |
| `laie_lead_competitors`    | `leadCompetitor.schema.ts`     |
| `laie_review_intelligence` | `reviewIntelligence.schema.ts` |
| `laie_pipeline_velocity`   | `pipelineVelocity.schema.ts`   |
| `laie_health_score_checks` | `healthScoreCheck.schema.ts`   |
| `laie_research_reports`    | `researchReport.schema.ts`     |
| `laie_outreach_kits`       | `outreachKit.schema.ts`        |
| `laie_call_notes`          | `callNote.schema.ts`           |
| `laie_ab_tests`            | `abTest.schema.ts`             |
| `laie_demo_page_views`     | `demoPageView.schema.ts`       |
| `laie_analytics_events`    | `analyticsEvent.schema.ts`     |
| `laie_leads`               | `laiaLead.schema.ts`           |

### 5.4 Automation Platform

| Table            | File                 |
| ---------------- | -------------------- |
| `laie_workflows` | `workflow.schema.ts` |
| `laie_schedules` | `schedule.schema.ts` |
| `laie_webhooks`  | `webhook.schema.ts`  |

LAIE's automation is a separate engine from ERIX's `erix_workflows` because LAIE focuses on lead
enrichment / batch jobs, while ERIX workflows are CRM-event-driven.

## 6. ErixStore Persistence Tables (`store_*`)

Source: `ECOD/erix-store/src/db/`. Lives in the same Postgres but owned by ErixStore.

| Table                | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `store_job_wal`      | Write-ahead log for queue jobs (zero-loss on crash)                   |
| `store_snapshots`    | Periodic full-state snapshots (every 5 min, last 5 retained)          |
| `store_usage_events` | Per-tenant raw events flushed before aggregation into `ecodrix_usage` |

## 7. Indexing Highlights

Per-table indexes are defined inside each Drizzle file. Key patterns:

| Table                   | Index                                             | Why                                 |
| ----------------------- | ------------------------------------------------- | ----------------------------------- |
| `erix_leads`            | `(org_id, phone)` unique                          | One master lead per phone per org   |
| `erix_leads`            | `(pipeline_id, stage_id, is_archived)`            | Kanban board queries                |
| `erix_leads`            | `(org_id, status, score_total)`                   | Sorted by score                     |
| `erix_messages`         | `(conversation_id, created_at)`                   | Thread loading                      |
| `erix_conversations`    | `(org_id, last_message_at)`                       | Inbox sorting                       |
| `erix_invoices`         | `(org_id, status)`, `(payment_link_id)`           | Filtering + Razorpay webhook lookup |
| `erix_workflows`        | `(org_id, is_active)`, `(trigger_type)`           | Trigger matching                    |
| `ecodrix_organizations` | `api_key`, `client_code` unique                   | Auth                                |
| `ecodrix_users`         | `email` unique                                    | Login                               |
| `ecodrix_usage`         | `(org_id, service, feature, period_start)` unique | Atomic upsert                       |
| `ecodrix_subscriptions` | `(org_id, status)`                                | Lifecycle worker scans              |

## 8. Backup & Retention

| Data                                    | Retention                  | Backup                |
| --------------------------------------- | -------------------------- | --------------------- |
| Postgres (all platform / ERIX / LAIE)   | Indefinite                 | Supabase daily + PITR |
| ErixStore WAL (`store_job_wal`)         | 24h auto-prune             | n/a                   |
| ErixStore snapshots (`store_snapshots`) | Last 5 (≈25 min coverage)  | n/a                   |
| ErixStore usage (`store_usage_events`)  | Until aggregated → flushed | n/a                   |
| Invoice PDFs (R2)                       | Indefinite                 | R2 region replication |
| Audit logs (`ecodrix_audit_logs`)       | 2 years                    | Part of PG backup     |

## 9. Encryption

All stored secrets are encrypted via AES-256-CBC (`server/src/lib/crypto.ts`):

- `ecodrix_organizations.external_db_uri`
- `ecodrix_organizations.secrets` (jsonb of third-party tokens)
- `erix_invoice_settings.razorpay_key_secret`
- API keys are stored as `bcrypt(rawKey)` (not encrypted, hashed) plus a non-secret `key_prefix`

## 10. Migration Conventions

- Schema lives in `server/src/shared/db/schema/{platform,erix,laie}/*.ts`
- Generate migrations: `pnpm db:generate` (writes to `migrations/{family}/`)
- Apply: `pnpm db:push` (dev) or `pnpm db:migrate` (prod, versioned)
- Dual-write transitional periods (when reshaping `clientCode` → `org_id`) are managed by code, not migrations.

## 11. Mongo (legacy + freelance tenants)

The `MongoAdapter` reads/writes to per-tenant Mongo databases provisioned during `freelance` onboarding.
Schemas mirror our Drizzle types via mapper functions; Mongo `_id: ObjectId` is converted to string IDs
on the boundary. This adapter remains available indefinitely — freelance tenants are not forced to
migrate to platform Postgres.

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/postgresql-migration/`, `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/visual-automation-builder/`.
