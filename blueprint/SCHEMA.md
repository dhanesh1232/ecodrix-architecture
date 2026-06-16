> ⚠️ **SUPERSEDED (v1) — DO NOT TRUST TABLE NAMES.** This schema doc is the most
> drifted: most table names here are wrong (e.g. `users`→`ecodrix_users`,
> `laie_jobs`→`laie_lead_jobs`, `flow_definitions`→`flow_workflows`/`flow_definitions`),
> and the CRM is **Postgres `erix_*` tables**, not the MongoDB collections shown.
> Regenerate from `ECOD/server/src/shared/db/schema/**`. See `../server_capability_audit.md` §2.

# ECODrIx Platform — Backend Schema Documentation

**Version:** 2.0 | **Date:** June 2026

---

## 1. Database Architecture Overview

| Database      | Engine                    | Purpose                                     | Host                         |
| ------------- | ------------------------- | ------------------------------------------- | ---------------------------- |
| Platform DB   | Supabase PostgreSQL 15    | Users, billing, platform config, LAIE       | GCP Cloud SQL, asia-south1   |
| Tenant CRM DB | MongoDB per-tenant        | WhatsApp conversations, contacts, campaigns | MongoDB Atlas, ap-south-1    |
| Cache + Queue | ErixStore (SQLite-backed) | Sessions, queues, rate limits, pub/sub      | AWS EC2 t3.small, ap-south-1 |
| File Storage  | Cloudflare R2             | Media, exports, invoice PDFs                | cdn.ecodrix.com              |

---

## 2. Multi-Tenancy Strategy

> **CRITICAL:** ECODrIx uses Database-per-Tenant isolation for CRM data (MongoDB). Every tenant gets their own MongoDB database named `ecodrix_${userId}`. This ensures zero cross-tenant data access at the database level.

For platform data (PostgreSQL), row-level security is enforced via `tenant_id` column on all tenant-scoped tables. All queries inject `WHERE tenant_id = $1` via middleware.

---

## 3. PostgreSQL Schemas (Drizzle ORM)

### users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    TEXT,
  role          VARCHAR(50) NOT NULL DEFAULT 'owner',  -- owner | admin | member
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### organizations

```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE,         -- subdomain / URL identifier
  gstin           VARCHAR(20),                 -- for GST invoices
  business_type   VARCHAR(100),                -- d2c | agency | realestate | coach | etc
  city            VARCHAR(100),
  state           VARCHAR(100) DEFAULT 'Andhra Pradesh',
  logo_url        TEXT,
  mongo_db_name   VARCHAR(100) UNIQUE,         -- ecodrix_${userId}
  timezone        VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### members

```sql
CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  role            VARCHAR(50) NOT NULL DEFAULT 'agent', -- owner | admin | agent | viewer
  invited_by      UUID REFERENCES users(id),
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
```

### sessions / auth_tokens

```sql
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  token_hash    VARCHAR(255) NOT NULL UNIQUE,  -- hashed refresh token
  expires_at    TIMESTAMPTZ NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  revoked       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### plans

```sql
CREATE TABLE plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product           VARCHAR(50) NOT NULL,       -- erix | laie | flow
  name              VARCHAR(100) NOT NULL,       -- Starter | Growth | Scale | Enterprise
  razorpay_plan_id  VARCHAR(100) UNIQUE,
  price_inr         INTEGER NOT NULL,            -- in paise (₹999 = 99900)
  billing_period    VARCHAR(20) DEFAULT 'monthly',
  contact_limit     INTEGER,                     -- NULL = unlimited
  message_limit     INTEGER,
  agent_limit       INTEGER,
  lead_credit_limit INTEGER,
  ai_post_limit     INTEGER,
  flow_limit        INTEGER,
  flow_run_limit    INTEGER,
  features          JSONB,                       -- feature flags object
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id),
  plan_id               UUID NOT NULL REFERENCES plans(id),
  razorpay_sub_id       VARCHAR(100) UNIQUE,
  razorpay_customer_id  VARCHAR(100),
  status                VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial | active | past_due | cancelled | paused
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### invoices

```sql
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  subscription_id   UUID REFERENCES subscriptions(id),
  razorpay_payment_id VARCHAR(100),
  invoice_number    VARCHAR(50) UNIQUE,          -- ECO-2026-INV-0001
  amount_inr        INTEGER NOT NULL,             -- in paise
  gst_amount        INTEGER,                      -- 18% GST
  total_amount      INTEGER NOT NULL,
  status            VARCHAR(50) DEFAULT 'pending', -- pending | paid | failed | refunded
  pdf_url           TEXT,                          -- Cloudflare R2 URL
  period_start      TIMESTAMPTZ,
  period_end        TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### waba_accounts (ERIX Connect)

```sql
CREATE TABLE waba_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  waba_id           VARCHAR(100) NOT NULL UNIQUE,  -- Meta WABA ID
  phone_number_id   VARCHAR(100) NOT NULL,
  phone_number      VARCHAR(20) NOT NULL,
  display_name      VARCHAR(255),
  access_token_enc  TEXT NOT NULL,                 -- AES-256 encrypted
  webhook_secret    VARCHAR(100),
  status            VARCHAR(50) DEFAULT 'active',  -- active | disconnected | suspended
  connected_at      TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

### laie_jobs

```sql
CREATE TABLE laie_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  source        VARCHAR(50) NOT NULL,   -- google_maps | justdial | sulekha | instagram
  params        JSONB NOT NULL,         -- query, city, limit, enrichment options
  status        VARCHAR(50) DEFAULT 'queued', -- queued | running | completed | failed
  total_found   INTEGER DEFAULT 0,
  total_saved   INTEGER DEFAULT 0,
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### laie_leads

```sql
CREATE TABLE laie_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  job_id          UUID REFERENCES laie_jobs(id),
  source          VARCHAR(50) NOT NULL,
  business_name   VARCHAR(255),
  phone           VARCHAR(20),
  email           VARCHAR(255),
  website         VARCHAR(500),
  address         TEXT,
  city            VARCHAR(100),
  category        VARCHAR(100),
  rating          DECIMAL(3,1),
  review_count    INTEGER,
  ai_score        INTEGER,             -- 0-100 lead quality score
  enrichment_data JSONB,               -- additional enriched fields
  pushed_to_crm   BOOLEAN DEFAULT false,
  crm_contact_id  VARCHAR(50),         -- MongoDB ObjectId if pushed
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### laie_competitors

```sql
CREATE TABLE laie_competitors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  instagram_handle  VARCHAR(100) NOT NULL,
  display_name      VARCHAR(255),
  follower_count    INTEGER,
  following_count   INTEGER,
  post_count        INTEGER,
  bio               TEXT,
  profile_pic_url   TEXT,
  avg_engagement_rate DECIMAL(5,2),
  last_synced_at    TIMESTAMPTZ,
  ai_analysis       JSONB,             -- Claude analysis result
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, instagram_handle)
);
```

### laie_content

```sql
CREATE TABLE laie_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  competitor_id   UUID REFERENCES laie_competitors(id),
  type            VARCHAR(50) NOT NULL,  -- scraped | generated
  content_type    VARCHAR(50),           -- image | reel | carousel
  caption         TEXT,
  hashtags        TEXT[],
  media_url       TEXT,
  scheduled_at    TIMESTAMPTZ,
  posted_at       TIMESTAMPTZ,
  ig_post_id      VARCHAR(100),         -- Meta post ID after publishing
  likes           INTEGER,
  comments        INTEGER,
  reach           INTEGER,
  engagement_rate DECIMAL(5,2),
  status          VARCHAR(50) DEFAULT 'draft', -- draft | scheduled | posted | failed
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### flow_definitions

```sql
CREATE TABLE flow_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  trigger     JSONB NOT NULL,           -- trigger type + config
  nodes       JSONB NOT NULL,           -- node array
  edges       JSONB NOT NULL,           -- edge array
  is_active   BOOLEAN DEFAULT false,
  version     INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

### flow_runs

```sql
CREATE TABLE flow_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id         UUID NOT NULL REFERENCES flow_definitions(id),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  trigger_data    JSONB,               -- incoming event data
  status          VARCHAR(50) DEFAULT 'running', -- running | completed | failed | paused
  current_node_id VARCHAR(100),
  node_results    JSONB,               -- per-node output log
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,   -- billing.subscribe | settings.waba_connect | etc
  resource    VARCHAR(100),            -- contact | campaign | flow | plan
  resource_id VARCHAR(100),
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### notifications

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(100) NOT NULL,   -- scrape_complete | flow_error | payment_due
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### api_tokens

```sql
CREATE TABLE api_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  name        VARCHAR(100) NOT NULL,   -- "Production Key", "Test Key"
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  scopes      TEXT[] NOT NULL,         -- ['read:contacts', 'write:campaigns']
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  revoked     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. MongoDB Collections (Per-Tenant: ecodrix\_${userId})

### contacts

```javascript
{
  _id: ObjectId,
  phone: String,          // E.164 format: +919876543210
  name: String,
  email: String,
  tags: [String],
  custom_fields: Object,  // tenant-defined fields
  source: String,         // manual | csv_import | laie | ig_lead | wa_inbound
  wa_status: String,      // opted_in | opted_out | unknown
  last_message_at: Date,
  deal_ids: [String],     // pipeline deal references
  notes: [{ text: String, created_at: Date, created_by: String }],
  created_at: Date,
  updated_at: Date
}
Indexes: phone (unique), tags, source, last_message_at
```

### conversations

```javascript
{
  _id: ObjectId,
  contact_id: ObjectId,
  waba_id: String,
  wa_conversation_id: String,  // Meta conversation ID
  status: String,              // open | resolved | pending
  assigned_agent_id: String,
  last_message_at: Date,
  unread_count: Number,
  tags: [String],
  created_at: Date,
  updated_at: Date
}
Indexes: contact_id, status, last_message_at, assigned_agent_id
```

### messages

```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  wa_message_id: String,       // Meta message ID
  direction: String,           // inbound | outbound
  type: String,                // text | image | document | template | interactive
  content: Object,             // type-specific content
  template_id: String,
  status: String,              // sent | delivered | read | failed
  status_updated_at: Date,
  sent_at: Date,
  created_at: Date
}
Indexes: conversation_id, wa_message_id (unique), sent_at
```

### campaigns

```javascript
{
  _id: ObjectId,
  name: String,
  template_id: String,
  segment_query: Object,       // filter conditions
  total_recipients: Number,
  sent: Number,
  delivered: Number,
  read: Number,
  failed: Number,
  replied: Number,
  status: String,              // draft | scheduled | running | completed | paused
  scheduled_at: Date,
  started_at: Date,
  completed_at: Date,
  created_by: String,
  created_at: Date
}
```

### deals

```javascript
{
  _id: ObjectId,
  contact_id: ObjectId,
  title: String,
  value: Number,
  currency: String DEFAULT 'INR',
  stage: String,               // new | contacted | qualified | proposal | won | lost
  lost_reason: String,
  assigned_to: String,
  expected_close_date: Date,
  closed_at: Date,
  activities: [{
    type: String,              // note | call | stage_change | wa_message
    content: String,
    created_at: Date,
    created_by: String
  }],
  created_at: Date,
  updated_at: Date
}
Indexes: contact_id, stage, assigned_to, expected_close_date
```

---

## 5. Indexing Strategy

| Table/Collection  | Column(s)                | Index Type       | Reason                  |
| ----------------- | ------------------------ | ---------------- | ----------------------- |
| users             | email                    | UNIQUE B-tree    | Login lookup            |
| laie_leads        | org_id, created_at       | Composite B-tree | Lead list pagination    |
| laie_leads        | org_id, pushed_to_crm    | Composite B-tree | Unpushed leads filter   |
| laie_jobs         | org_id, status           | Composite B-tree | Active jobs query       |
| laie_competitors  | org_id, instagram_handle | UNIQUE Composite | Duplicate prevention    |
| flow_runs         | flow_id, status          | Composite B-tree | Run history queries     |
| flow_runs         | org_id, started_at       | Composite B-tree | Analytics range queries |
| subscriptions     | org_id                   | B-tree           | Plan lookup             |
| invoices          | org_id, created_at       | Composite B-tree | Billing history         |
| MongoDB contacts  | phone                    | Unique           | Dedup on import         |
| MongoDB messages  | conversation_id, sent_at | Composite        | Thread pagination       |
| MongoDB campaigns | status                   | Single           | Active campaign lookup  |

---

## 6. Backup and Retention Policy

| Data               | Backup Frequency   | Retention | Method                          |
| ------------------ | ------------------ | --------- | ------------------------------- |
| PostgreSQL         | Daily automated    | 30 days   | GCP Cloud SQL automated backups |
| MongoDB            | Daily              | 7 days    | MongoDB Atlas automated backups |
| Cloudflare R2      | Versioning enabled | 90 days   | R2 object versioning            |
| ErixStore (SQLite) | Daily snapshot     | 7 days    | AWS S3 cron backup              |
| Audit logs         | Never deleted      | Permanent | PostgreSQL                      |

---

## 7. Assumptions Made

- MongoDB Atlas M0 (free) handles first 100 tenants (512MB per cluster limit — upgrade at 50 tenants)
- PostgreSQL connection pooling via PgBouncer in Cloud SQL handles 500+ concurrent connections
- laie_leads table grows to 10M+ rows — partition by org_id + created_at year when needed
- flow_runs table partitioned monthly after 1M rows
- ErixStore SQLite persistence survives EC2 restarts — daily S3 backup as safety net
- JSONB columns (nodes, edges, params) queried with GIN indexes when full-text search needed
