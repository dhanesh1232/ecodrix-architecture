# ERIX CRM Suite — Backend Schema Documentation
**Version 1.0 | ECODrIx Technologies**

---

## 1. Database Architecture Overview

Single Supabase PostgreSQL database, Drizzle ORM. All tables carry `tenant_id` for row-level multi-tenancy. No MongoDB, no per-tenant database split at this scale.

| Property | Value |
|---|---|
| Engine | PostgreSQL 15 (Supabase) |
| ORM | Drizzle |
| Multi-tenancy | Row-level, tenant_id on every table |
| Migrations | Versioned in repo, applied via CI/CD pre-deploy |

---

## 2. Multi-Tenancy Strategy

> **Callout:** Row-level isolation chosen over schema-per-tenant for MVP simplicity — every query is scoped by `tenant_id` at the ORM layer, enforced via middleware that injects the filter automatically. Revisit schema-per-tenant only for a Scale-tier client requiring dedicated isolation.

---

## 3. Entity Relationship Overview

`tenants` own everything. `users` belong to tenants via `members`. `contacts` are the anchor entity — they link to `inbox_threads` (1:1 per channel), `deals` (1:many), and indirectly to `projects` (via deal close). `pipelines` contain `stages`, which contain `deals`. `projects` contain `tasks`. `automations` reference trigger conditions on `deals`/`inbox_threads` and produce `activity_logs`.

---

## 4. Schema: users

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| avatar_url | TEXT | nullable |
| phone | VARCHAR(20) | nullable |
| email_verified_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 5. Schema: tenants

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | UNIQUE, indexed |
| business_type | VARCHAR(50) | e.g. agency, real_estate, d2c |
| plan_id | UUID | FK -> plans.id |
| gst_number | VARCHAR(20) | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| status | ENUM('active','suspended','trial') | NOT NULL, DEFAULT 'trial' |

---

## 6. Schema: members

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| user_id | UUID | FK -> users.id, indexed |
| role | ENUM('owner','admin','agent','viewer') | NOT NULL |
| invited_by | UUID | FK -> users.id, nullable |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 7. Schema: roles_permissions

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| role | ENUM('owner','admin','agent','viewer') | NOT NULL |
| resource | VARCHAR(50) | e.g. deals, inbox, projects |
| action | VARCHAR(50) | e.g. create, read, update, delete |
| allowed | BOOLEAN | NOT NULL, DEFAULT true |

---

## 8. Schema: sessions

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK -> users.id, indexed |
| refresh_token_hash | TEXT | NOT NULL |
| device_info | JSONB | nullable |
| expires_at | TIMESTAMPTZ | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 9. Schema: oauth_accounts

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK -> users.id, indexed |
| provider | VARCHAR(50) | e.g. google |
| provider_account_id | VARCHAR(255) | NOT NULL |
| access_token | TEXT | encrypted at rest |
| refresh_token | TEXT | encrypted at rest, nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 10. Schema: plans

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(50) | Free, Solo, Small Team, Growth, Scale |
| price_inr | DECIMAL(19,4) | NOT NULL |
| contact_limit | INTEGER | NOT NULL |
| user_limit | INTEGER | NOT NULL |
| features | JSONB | feature flag map |

---

## 11. Schema: subscriptions

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| plan_id | UUID | FK -> plans.id |
| razorpay_subscription_id | VARCHAR(100) | nullable |
| status | ENUM('active','past_due','cancelled') | NOT NULL |
| current_period_end | TIMESTAMPTZ | NOT NULL |

---

## 12. Schema: invoices

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| subscription_id | UUID | FK -> subscriptions.id |
| amount_inr | DECIMAL(19,4) | NOT NULL |
| status | ENUM('paid','pending','failed') | NOT NULL |
| issued_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 13. Schema: contacts

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| full_name | VARCHAR(255) | nullable |
| phone | VARCHAR(20) | indexed |
| email | VARCHAR(255) | nullable, indexed |
| source | VARCHAR(50) | e.g. whatsapp, instagram, manual |
| tags | JSONB | array of tag strings |
| custom_fields | JSONB | tenant-defined fields |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 14. Schema: pipelines

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| name | VARCHAR(100) | NOT NULL |
| is_default | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 15. Schema: pipeline_stages

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| pipeline_id | UUID | FK -> pipelines.id, indexed |
| name | VARCHAR(100) | NOT NULL |
| position | INTEGER | NOT NULL, order in board |
| wip_limit | INTEGER | nullable |

---

## 16. Schema: deals

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| contact_id | UUID | FK -> contacts.id, indexed |
| pipeline_id | UUID | FK -> pipelines.id |
| stage_id | UUID | FK -> pipeline_stages.id, indexed |
| owner_id | UUID | FK -> users.id, nullable |
| value_inr | DECIMAL(19,4) | nullable |
| status | ENUM('open','won','lost') | NOT NULL, DEFAULT 'open' |
| stage_entered_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 17. Schema: inbox_threads

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| contact_id | UUID | FK -> contacts.id, indexed |
| channel | ENUM('whatsapp','instagram','email') | NOT NULL |
| assigned_to | UUID | FK -> users.id, nullable |
| status | ENUM('open','unassigned','closed') | NOT NULL, DEFAULT 'unassigned' |
| last_message_at | TIMESTAMPTZ | indexed, NOT NULL |

---

## 18. Schema: inbox_messages

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| thread_id | UUID | FK -> inbox_threads.id, indexed |
| direction | ENUM('inbound','outbound') | NOT NULL |
| body | TEXT | NOT NULL |
| media_url | TEXT | nullable, R2 signed URL |
| sender_id | UUID | FK -> users.id, nullable for inbound |
| sent_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 19. Schema: projects

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| contact_id | UUID | FK -> contacts.id, nullable |
| deal_id | UUID | FK -> deals.id, nullable |
| name | VARCHAR(255) | NOT NULL |
| status | ENUM('active','completed','archived') | NOT NULL, DEFAULT 'active' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 20. Schema: tasks

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK -> projects.id, indexed |
| title | VARCHAR(255) | NOT NULL |
| assignee_id | UUID | FK -> users.id, nullable |
| status | ENUM('todo','in_progress','done') | NOT NULL, DEFAULT 'todo' |
| due_date | TIMESTAMPTZ | nullable |
| position | INTEGER | NOT NULL |

---

## 21. Schema: automations

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| trigger_type | VARCHAR(50) | e.g. stage_change, tag_added |
| trigger_config | JSONB | condition definition |
| action_type | VARCHAR(50) | e.g. send_template, assign_owner |
| action_config | JSONB | action payload |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |

---

## 22. Schema: notifications

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK -> users.id, indexed |
| type | VARCHAR(50) | e.g. new_message, task_overdue |
| payload | JSONB | context data |
| read_at | TIMESTAMPTZ | nullable, indexed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 23. Schema: jobs (ErixStore-backed, mirrored for audit)

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| job_type | VARCHAR(50) | e.g. webhook_process, automation_send |
| status | ENUM('queued','processing','done','failed') | NOT NULL |
| payload | JSONB | job data |
| attempts | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## 24. Schema: audit_logs

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| actor_id | UUID | FK -> users.id, nullable |
| action | VARCHAR(100) | e.g. deal.stage_changed |
| entity_type | VARCHAR(50) | e.g. deal, contact |
| entity_id | UUID | indexed |
| metadata | JSONB | before/after diff |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now(), indexed |

---

## 25. Schema: api_tokens

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| key_hash | VARCHAR(64) | SHA-256, UNIQUE |
| prefix | VARCHAR(12) | e.g. sk_ext_ |
| scopes | JSONB | permission array |
| last_used_at | TIMESTAMPTZ | nullable |

---

## 26. Schema: files

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK -> tenants.id, indexed |
| r2_key | TEXT | NOT NULL |
| filename | VARCHAR(255) | NOT NULL |
| content_type | VARCHAR(100) | NOT NULL |
| size_bytes | BIGINT | NOT NULL |
| uploaded_by | UUID | FK -> users.id, nullable |

---

## 27. Indexing Strategy

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| contacts | tenant_id, phone | Composite B-tree | Fast lookup on inbound webhook contact match |
| deals | tenant_id, stage_id | Composite B-tree | Pipeline board queries |
| inbox_threads | tenant_id, last_message_at | Composite B-tree DESC | Inbox sort order |
| audit_logs | tenant_id, created_at | Composite B-tree DESC | Activity feed pagination |
| notifications | user_id, read_at | Composite B-tree | Unread count queries |

---

## 28. Data Partitioning

No partitioning at MVP scale. If `inbox_messages` or `audit_logs` grow beyond tens of millions of rows, consider monthly range partitioning on `created_at`/`sent_at`.

- Revisit only after Scale-tier tenant volume is confirmed
- Archive strategy: move audit_logs older than 12 months to cold storage table

---

## 29. Backup and Retention Policy

| Item | Policy |
|---|---|
| Database backups | Supabase automated daily + point-in-time recovery |
| Media files (R2) | Versioned, 90-day retention on deleted objects |
| Audit logs | Retained 12 months active, archived thereafter |

---

## 30. Query Optimization Notes

- Avoid N+1 on inbox thread list — join contact + last message in single query
- Avoid unbounded `SELECT *` on deals table — always project needed columns for pipeline board payload
- Automation rule evaluation must batch-fetch active rules per tenant, not per-event query

---

## Assumptions Made

- MongoDB is fully excluded from this schema — all entities live in Supabase PostgreSQL
- ErixStore jobs table is a lightweight audit mirror; actual queue state lives in ErixStore's own SQLite persistence
- Custom fields on contacts/deals use JSONB rather than a separate EAV table for MVP simplicity
