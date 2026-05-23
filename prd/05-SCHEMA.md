# ECODrIx — Backend Schema Documentation
**Version:** 1.0 | **Date:** May 2026

---

## 1. Database Architecture Overview

| Aspect | Detail |
|--------|--------|
| Primary Database | PostgreSQL 15 (Supabase) |
| ORM | Drizzle ORM (TypeScript, type-safe) |
| Multi-Tenancy | Row-level isolation via `org_id` FK |
| Naming Convention | `domain_entity` (ecodrix_*, erix_*, laie_*, store_*) |
| IDs | UUID v4 (defaultRandom) |
| Timestamps | TIMESTAMPTZ (with timezone) |
| JSON | JSONB (for flexible/nested data) |
| Encryption | AES-256 for sensitive fields (DB URIs, secrets) |

---

## 2. Multi-Tenancy Strategy

> **Row-Level Isolation:** Every CRM table (`erix_*`) has an `org_id` column that references `ecodrix_organizations.id`. Every query MUST include `WHERE org_id = ?`. This is enforced in middleware — no query can execute without org context.

For users who choose "own" data mode, the server connects to their external database and uses the same schema definitions. The `org_id` filter is still applied (their DB may serve multiple sub-accounts).

---

## 3. Entity Relationships

```
ecodrix_organizations (1) ──── (N) ecodrix_members ──── (1) ecodrix_users
         │
         ├── (1) ecodrix_plans (via planId FK)
         ├── (N) ecodrix_subscriptions
         ├── (N) ecodrix_api_tokens
         ├── (N) ecodrix_audit_logs
         │
         ├── (N) erix_leads
         │         ├── (N) erix_lead_activities
         │         ├── (N) erix_invoices
         │         └── (1) erix_conversations ──── (N) erix_messages
         │
         ├── (N) erix_pipelines ──── (N) erix_pipeline_stages
         ├── (N) erix_templates ──── (N) erix_broadcasts
         ├── (N) erix_automations
         ├── (N) erix_workflows ──── (N) erix_workflow_runs
         ├── (N) erix_webhooks
         ├── (1) erix_field_configs
         └── (1) erix_invoice_settings
```

---

## 4. Schema Definitions

All schemas are defined in `IMPLEMENTATION_DETAILS.md` with full Drizzle ORM syntax.

**Summary of tables (37 total):**

### Platform (8 tables)
- `ecodrix_organizations` — tenant identity, config, feature flags
- `ecodrix_users` — login credentials, profile
- `ecodrix_members` — user ↔ org mapping with roles
- `ecodrix_plans` — pricing tiers, feature limits
- `ecodrix_subscriptions` — billing state, payment provider
- `ecodrix_waitlist` — pre-launch signups
- `ecodrix_api_tokens` — API key management
- `ecodrix_audit_logs` — platform audit trail

### CRM (14 tables)
- `erix_leads` — contacts/leads with custom fields
- `erix_conversations` — messaging threads (multi-channel)
- `erix_messages` — individual messages
- `erix_templates` — WhatsApp message templates
- `erix_broadcasts` — bulk campaign tracking
- `erix_pipelines` — deal pipeline definitions
- `erix_pipeline_stages` — stages within pipelines
- `erix_lead_activities` — timeline events per lead
- `erix_automations` — trigger-based automation rules
- `erix_field_configs` — custom field definitions per org
- `erix_invoices` — invoice records with payment tracking
- `erix_invoice_settings` — per-org invoice configuration
- `erix_workflows` — visual automation definitions (nodes + edges)
- `erix_workflow_runs` — execution logs per workflow run
- `erix_webhooks` — outbound webhook configurations

### LAIE (8+ tables — existing)
- `laie_tenants`, `laie_users`, `laie_actors`, `laie_actor_runs`
- `laie_datasets`, `laie_dataset_items`, `laie_audits`
- `laie_leads`, `laie_workflows`, `laie_quotas_usage`, `laie_api_keys`

### ErixStore Persistence (3 tables)
- `store_job_wal` — job write-ahead log
- `store_snapshots` — periodic state snapshots
- `store_usage_events` — per-tenant usage metering

---

## 5. Indexing Strategy

| Table | Column(s) | Index Type | Reason |
|-------|-----------|-----------|--------|
| erix_leads | org_id | B-tree | Tenant isolation (every query) |
| erix_leads | org_id, stage | Composite | Pipeline queries |
| erix_leads | org_id, phone | Unique | Prevent duplicate contacts |
| erix_leads | org_id, created_at | B-tree (DESC) | Recent leads listing |
| erix_messages | conversation_id, created_at | Composite | Message thread loading |
| erix_messages | org_id | B-tree | Tenant isolation |
| erix_conversations | org_id, last_message_at | Composite (DESC) | Inbox sorting |
| erix_invoices | org_id, status | Composite | Invoice filtering |
| erix_invoices | payment_link_id | B-tree | Razorpay webhook lookup |
| ecodrix_organizations | api_key | Unique | Auth middleware lookup |
| ecodrix_organizations | client_code | Unique | SDK auth |
| ecodrix_users | email | Unique | Login lookup |
| store_job_wal | job_id | B-tree | WAL replay |
| store_job_wal | event | B-tree | Prune finalized jobs |

---

## 6. Backup & Retention Policy

| Data | Retention | Backup Frequency | Method |
|------|-----------|-----------------|--------|
| PostgreSQL (all tables) | Indefinite | Daily (Supabase auto) | Point-in-time recovery |
| ErixStore snapshots | Last 5 | Every 5 minutes | store_snapshots table |
| ErixStore WAL | 24 hours | Continuous | store_job_wal (auto-prune) |
| Invoice PDFs (R2) | Indefinite | N/A (durable storage) | Cloudflare R2 replication |
| Audit logs | 2 years | Daily | Part of PostgreSQL backup |

---

## 7. Assumptions Made

- UUID v4 provides sufficient uniqueness without coordination (no sequential IDs needed)
- JSONB is performant enough for custom_fields queries (indexed with GIN if needed)
- Supabase handles connection pooling via PgBouncer (no manual pool management)
- 37 tables is manageable in a single PostgreSQL instance for Year 1
- Drizzle migrations handle schema evolution without downtime
- ErixStore WAL prune (24h) is sufficient — completed jobs don't need longer retention
