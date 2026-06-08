# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## Backend Schema Documentation

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [Database Architecture Overview](#database-architecture-overview)
2. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
3. [Schema: workflows](#schema-workflows)
4. [Schema: workflow_runs](#schema-workflow_runs)
5. [Schema: node_run_logs](#schema-node_run_logs)
6. [Schema: workflow_templates](#schema-workflow_templates)
7. [Schema: credit_ledger (FLOW-specific extension)](#schema-credit_ledger-flow-specific-extension)
8. [Indexing Strategy](#indexing-strategy)
9. [Backup and Retention Policy](#backup-and-retention-policy)
10. [Assumptions Made](#assumptions-made)

---

## Database Architecture Overview

| Key              | Value                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Platform DB      | GCP Cloud SQL PostgreSQL 15 (ecodrix-pg, asia-south1) — workflow definitions, run logs, templates, billing |
| Tenant CRM DB    | MongoDB 6 per-tenant — leads, contacts, outreach history (extended with FLOW enrichment fields)            |
| In-flight State  | ErixStore (port 6399) — job queue, node output caching, semaphores, run status                             |
| ORM              | Drizzle ORM (PostgreSQL) + Mongoose (MongoDB)                                                              |
| Migration Tool   | drizzle-kit push for PostgreSQL; Mongoose schema versioning for MongoDB                                    |
| Tenant Isolation | Row-level: all PostgreSQL tables include tenant_id UUID NOT NULL with index                                |

---

## Multi-Tenancy Strategy

> **ISOLATION MODEL:** ERIX-FLOW uses row-level tenant isolation in PostgreSQL (tenant*id column on every table). MongoDB uses separate database per tenant (db name = tenant*{tenantId}). ErixStore keys are namespaced with tenantId prefix. No cross-tenant data access is possible at any layer.

- PostgreSQL: every FLOW table has tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
- Drizzle ORM middleware: injects AND tenant_id = ? into all queries using request-scoped tenant context
- MongoDB: per-tenant db with collection prefixing (leads\_{tenantId} not used — separate DB is cleaner)
- ErixStore: all FLOW keys prefixed FLOW.{tenantId}.\* — no unscoped keys permitted
- Admin queries bypass tenant filter only on super-admin JWT role claim

---

## Schema: workflows

### Schema: `workflows`

| Field             | Type           | Nullable | Description                                                           |
| ----------------- | -------------- | -------- | --------------------------------------------------------------------- |
| `id`              | `UUID`         | No       | Primary key, gen_random_uuid(), indexed                               |
| `tenant_id`       | `UUID`         | No       | FK to organizations.id, indexed, ON DELETE CASCADE                    |
| `name`            | `VARCHAR(120)` | No       | User-defined workflow name, NOT NULL                                  |
| `description`     | `TEXT`         | Yes      | Optional workflow description                                         |
| `canvas_json`     | `JSONB`        | No       | React Flow node/edge state serialised as JSON. DEFAULT '{}'           |
| `status`          | `VARCHAR(20)`  | No       | ENUM: draft \| active \| paused \| archived. DEFAULT 'draft'          |
| `trigger_type`    | `VARCHAR(30)`  | No       | ENUM: manual \| scheduled \| webhook. DEFAULT 'manual'                |
| `cron_expression` | `VARCHAR(60)`  | Yes      | Cron string if trigger_type=scheduled. NULL otherwise.                |
| `webhook_secret`  | `VARCHAR(255)` | Yes      | AES-256-GCM encrypted webhook secret for trigger validation           |
| `template_id`     | `UUID`         | Yes      | FK to workflow_templates.id if cloned from template. NULL for custom. |
| `last_run_at`     | `TIMESTAMPTZ`  | Yes      | Timestamp of most recent run. NULL if never run.                      |
| `total_runs`      | `INTEGER`      | No       | Counter of total run attempts. DEFAULT 0                              |
| `created_at`      | `TIMESTAMPTZ`  | No       | UTC creation timestamp. DEFAULT now()                                 |
| `updated_at`      | `TIMESTAMPTZ`  | No       | UTC last-update timestamp. Updated by trigger on row change.          |

---

## Schema: workflow_runs

### Schema: `workflow_runs`

| Field              | Type            | Nullable | Description                                                                    |
| ------------------ | --------------- | -------- | ------------------------------------------------------------------------------ |
| `id`               | `UUID`          | No       | Primary key, gen_random_uuid()                                                 |
| `tenant_id`        | `UUID`          | No       | FK to organizations.id, indexed                                                |
| `workflow_id`      | `UUID`          | No       | FK to workflows.id, indexed. ON DELETE CASCADE                                 |
| `status`           | `VARCHAR(20)`   | No       | ENUM: queued \| running \| completed \| failed \| cancelled \| quota_exceeded  |
| `trigger_type`     | `VARCHAR(30)`   | No       | How run was started: manual \| scheduled \| webhook \| api                     |
| `leads_in`         | `INTEGER`       | Yes      | Total leads entering workflow at first data node. NULL until scrape completes. |
| `leads_out`        | `INTEGER`       | Yes      | Leads that reached final node successfully                                     |
| `credits_consumed` | `DECIMAL(10,2)` | No       | Credits debited for this run. DEFAULT 0                                        |
| `error_message`    | `TEXT`          | Yes      | Top-level error if run failed. NULL on success.                                |
| `parent_run_id`    | `UUID`          | Yes      | FK to workflow_runs.id if this is a retry run                                  |
| `started_at`       | `TIMESTAMPTZ`   | Yes      | When first node started executing                                              |
| `completed_at`     | `TIMESTAMPTZ`   | Yes      | When all nodes reached terminal state                                          |
| `created_at`       | `TIMESTAMPTZ`   | No       | Row creation timestamp (= queue time)                                          |

---

## Schema: node_run_logs

### Schema: `node_run_logs`

| Field              | Type           | Nullable | Description                                                                                                                                             |
| ------------------ | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `UUID`         | No       | Primary key                                                                                                                                             |
| `tenant_id`        | `UUID`         | No       | FK to organizations.id, indexed                                                                                                                         |
| `run_id`           | `UUID`         | No       | FK to workflow_runs.id, indexed. ON DELETE CASCADE                                                                                                      |
| `node_id`          | `VARCHAR(60)`  | No       | React Flow node ID within the canvas (string, not UUID)                                                                                                 |
| `node_type`        | `VARCHAR(40)`  | No       | ENUM: trigger \| scrape \| enrichment \| email_validate \| wa_validate \| whatsapp \| email \| crm_push \| condition \| delay \| storage \| webhook_out |
| `status`           | `VARCHAR(20)`  | No       | ENUM: queued \| running \| completed \| failed \| skipped \| retrying                                                                                   |
| `leads_in`         | `INTEGER`      | Yes      | Lead count entering this node                                                                                                                           |
| `leads_out`        | `INTEGER`      | Yes      | Lead count exiting this node (after filtering/branching)                                                                                                |
| `credits_consumed` | `DECIMAL(8,2)` | No       | Credits used by this node. DEFAULT 0                                                                                                                    |
| `error_message`    | `TEXT`         | Yes      | Sanitised error message on failure. PII stripped.                                                                                                       |
| `retry_count`      | `INTEGER`      | No       | Number of retry attempts made. DEFAULT 0                                                                                                                |
| `duration_ms`      | `INTEGER`      | Yes      | Execution duration in milliseconds                                                                                                                      |
| `started_at`       | `TIMESTAMPTZ`  | Yes      | When node execution started                                                                                                                             |
| `completed_at`     | `TIMESTAMPTZ`  | Yes      | When node reached terminal state                                                                                                                        |

---

## Schema: workflow_templates

### Schema: `workflow_templates`

| Field                       | Type           | Nullable | Description                                                                             |
| --------------------------- | -------------- | -------- | --------------------------------------------------------------------------------------- |
| `id`                        | `UUID`         | No       | Primary key                                                                             |
| `name`                      | `VARCHAR(120)` | No       | Template display name                                                                   |
| `description`               | `TEXT`         | Yes      | What this template does and who it is for                                               |
| `category`                  | `VARCHAR(60)`  | No       | ENUM: real_estate \| edtech \| b2b_saas \| ecommerce \| healthcare \| agency \| generic |
| `canvas_json`               | `JSONB`        | No       | Template node/edge graph — cloned on install                                            |
| `required_modules`          | `TEXT[]`       | No       | Array of module codes required: e.g. {ERIX-LAIE, ErixSender}                            |
| `required_fields`           | `JSONB`        | No       | JSON array of {fieldId, label, type, nodeId} that user must fill on install             |
| `estimated_credits_per_run` | `DECIMAL(8,2)` | No       | Estimated credit cost for 100-lead run                                                  |
| `install_count`             | `INTEGER`      | No       | Total installs across all tenants. DEFAULT 0                                            |
| `is_official`               | `BOOLEAN`      | No       | true = ECODrIx-published template. false = community. DEFAULT false                     |
| `author_tenant_id`          | `UUID`         | Yes      | FK to organizations.id for community templates. NULL for official.                      |
| `created_at`                | `TIMESTAMPTZ`  | No       | Publication timestamp                                                                   |

---

## Schema: credit_ledger (FLOW-specific extension)

### Schema: `credit_ledger`

| Field                 | Type            | Nullable | Description                                                                  |
| --------------------- | --------------- | -------- | ---------------------------------------------------------------------------- |
| `id`                  | `UUID`          | No       | Primary key                                                                  |
| `tenant_id`           | `UUID`          | No       | FK to organizations.id, indexed                                              |
| `run_id`              | `UUID`          | Yes      | FK to workflow_runs.id. NULL for top-up entries.                             |
| `type`                | `VARCHAR(20)`   | No       | ENUM: debit \| credit \| refund \| bonus                                     |
| `amount`              | `DECIMAL(10,2)` | No       | Credits debited (negative) or credited (positive)                            |
| `balance_after`       | `DECIMAL(10,2)` | No       | Running balance after this transaction                                       |
| `description`         | `VARCHAR(255)`  | No       | Human-readable: 'Scrape node: 147 leads x 1 credit' or 'Top-up: Rs 999 pack' |
| `node_type`           | `VARCHAR(40)`   | Yes      | Which node type caused the debit. NULL for top-up.                           |
| `razorpay_payment_id` | `VARCHAR(80)`   | Yes      | Razorpay payment ID for top-up entries. NULL for debits.                     |
| `created_at`          | `TIMESTAMPTZ`   | No       | Transaction timestamp                                                        |

---

## Indexing Strategy

| Table              | Column(s)                    | Index Type       | Reason                                                |
| ------------------ | ---------------------------- | ---------------- | ----------------------------------------------------- |
| workflows          | tenant_id                    | B-tree           | All workflow list queries filter by tenant            |
| workflows          | status, tenant_id            | Composite B-tree | Filter active/paused workflows per tenant             |
| workflow_runs      | workflow_id, created_at DESC | Composite B-tree | Run history pagination per workflow                   |
| workflow_runs      | tenant_id, status            | Composite B-tree | Admin dashboard: active runs across tenants           |
| node_run_logs      | run_id, node_id              | Composite B-tree | Fetch all node logs for a run in one query            |
| node_run_logs      | tenant_id, created_at DESC   | Composite B-tree | Admin audit: recent node executions per tenant        |
| credit_ledger      | tenant_id, created_at DESC   | Composite B-tree | Credit balance history pagination                     |
| workflow_templates | category, install_count DESC | Composite B-tree | Template marketplace sorting by category + popularity |

---

## Backup and Retention Policy

| Key                     | Value                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| PostgreSQL backups      | GCP Cloud SQL automated backups: daily full + continuous WAL archiving. Retained 30 days.                     |
| MongoDB backups         | Atlas automated backups (if MongoDB Atlas used) OR mongodump cron job to GCS bucket. Daily, 30-day retention. |
| ErixStore persistence   | SQLite WAL mode snapshots to Cloudflare R2 every 5 minutes. Recover in-flight jobs on worker restart.         |
| node_run_logs retention | 90 days in hot PostgreSQL storage. Archived to Cloudflare R2 as JSONL after 90 days. Deleted after 1 year.    |
| credit_ledger retention | Permanent — financial record. Never deleted.                                                                  |

---

## Assumptions Made

- organizations table already exists in ECODrIx PostgreSQL schema — FLOW tables FK to it
- ErixStore SQLite persistence is implemented before FLOW worker goes to production
- MongoDB per-tenant database provisioned at tenant signup — FLOW worker assumes db exists
- credit_ledger is a new table specific to FLOW billing — existing ECODrIx subscription billing is separate
- All FLOW PostgreSQL tables live in a 'flow' schema namespace to avoid collision with existing ECODrIx tables

---
