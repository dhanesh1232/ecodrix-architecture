# ECODrIx — Implementation Details
## Schemas, Code Patterns, Screen Designs, Integration Examples

This file contains the detailed implementation reference for the architecture
defined in `KIRO_AGENT_PROMPT.md`. Use that file for the overview and this
file for the code-level details.

---

## 1. DATABASE SCHEMAS (Drizzle ORM — PostgreSQL)

### Platform Tables (`ecodrix_*`)

```typescript
// server/src/shared/db/schema/platform.ts
import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, serial } from "drizzle-orm/pg-core";

export const ecodrix_organizations = pgTable("ecodrix_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  clientCode: text("client_code").unique().notNull(),
  apiKey: text("api_key").unique(),
  status: text("status").default("active"),
  acquisitionChannel: text("acquisition_channel").default("direct"),
  agencyId: uuid("agency_id"),
  setupFee: integer("setup_fee"),
  planId: uuid("plan_id").references(() => ecodrix_plans.id),
  subscriptionStatus: text("subscription_status").default("free"),
  erixEnabled: boolean("erix_enabled").default(true),
  laieEnabled: boolean("laie_enabled").default(false),
  infraEnabled: boolean("infra_enabled").default(false),
  dataMode: text("data_mode").default("platform"),
  externalDbType: text("external_db_type"),
  externalDbUri: text("external_db_uri"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncDirection: text("sync_direction"),
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  whatsappPhone: text("whatsapp_phone"),
  whatsappStatus: text("whatsapp_status").default("disconnected"),
  aiAgentEnabled: boolean("ai_agent_enabled").default(false),
  aiAgentPrompt: text("ai_agent_prompt"),
  aiAutoReply: boolean("ai_auto_reply").default(false),
  isAgency: boolean("is_agency").default(false),
  brandConfig: jsonb("brand_config").default("{}"),
  secrets: jsonb("secrets").default("{}"),
  industry: text("industry"),
  website: text("website"),
  country: text("country").default("IN"),
  teamSize: text("team_size"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ecodrix_users = pgTable("ecodrix_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").default(false),
  phone: text("phone"),
  timezone: text("timezone").default("Asia/Kolkata"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ecodrix_members = pgTable("ecodrix_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  userId: uuid("user_id").references(() => ecodrix_users.id).notNull(),
  role: text("role").default("agent"),
  erixAccess: boolean("erix_access").default(true),
  laieAccess: boolean("laie_access").default(true),
  invitedBy: uuid("invited_by"),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecodrix_plans = pgTable("ecodrix_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  erixEnabled: boolean("erix_enabled").default(false),
  laieEnabled: boolean("laie_enabled").default(false),
  infraEnabled: boolean("infra_enabled").default(false),
  priceMonthlyUsd: integer("price_monthly_usd").default(0),
  priceYearlyUsd: integer("price_yearly_usd").default(0),
  laieAuditsPerMonth: integer("laie_audits_per_month").default(0),
  erixContactsLimit: integer("erix_contacts_limit").default(100),
  erixAgentsLimit: integer("erix_agents_limit").default(1),
  features: jsonb("features").default("{}"),
  isActive: boolean("is_active").default(true),
});

export const ecodrix_subscriptions = pgTable("ecodrix_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  planId: uuid("plan_id").references(() => ecodrix_plans.id).notNull(),
  status: text("status").default("active"),
  paymentProvider: text("payment_provider"),
  providerSubscriptionId: text("provider_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecodrix_waitlist = pgTable("ecodrix_waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  phone: text("phone"),
  productInterest: text("product_interest").array(),
  source: text("source"),
  position: serial("position"),
  inviteSentAt: timestamp("invite_sent_at"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecodrix_api_tokens = pgTable("ecodrix_api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  service: text("service").notNull(),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").unique().notNull(),
  scopes: text("scopes").array(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecodrix_audit_logs = pgTable("ecodrix_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").default("{}"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### CRM Tables (`erix_*`)

```typescript
// server/src/shared/db/schema/erix.ts

export const erix_leads = pgTable("erix_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  phone: text("phone"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  company: text("company"),
  stage: text("stage").default("new"),
  pipelineId: uuid("pipeline_id"),
  stageId: uuid("stage_id"),
  assignedTo: uuid("assigned_to"),
  source: text("source").default("manual"),
  score: integer("score").default(0),
  value: integer("value"),
  tags: text("tags").array(),
  metadata: jsonb("metadata").default("{}"),
  customFields: jsonb("custom_fields").default("{}"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const erix_conversations = pgTable("erix_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  leadId: uuid("lead_id").references(() => erix_leads.id),
  phone: text("phone").notNull(),
  channel: text("channel").default("whatsapp"),
  status: text("status").default("open"),
  unreadCount: integer("unread_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  assignedTo: uuid("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_messages = pgTable("erix_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  conversationId: uuid("conversation_id").references(() => erix_conversations.id).notNull(),
  direction: text("direction").notNull(),
  contentType: text("content_type").default("text"),
  body: text("body"),
  mediaUrl: text("media_url"),
  waMessageId: text("wa_message_id"),
  status: text("status").default("sent"),
  sentBy: uuid("sent_by"),
  metadata: jsonb("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_templates = pgTable("erix_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  language: text("language").default("en"),
  body: text("body").notNull(),
  header: text("header"),
  footer: text("footer"),
  variables: text("variables").array(),
  status: text("status").default("pending"),
  waTemplateId: text("wa_template_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_broadcasts = pgTable("erix_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  name: text("name").notNull(),
  templateId: uuid("template_id").references(() => erix_templates.id),
  recipientFilter: jsonb("recipient_filter").default("{}"),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  status: text("status").default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_pipelines = pgTable("erix_pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_pipeline_stages = pgTable("erix_pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  pipelineId: uuid("pipeline_id").references(() => erix_pipelines.id).notNull(),
  name: text("name").notNull(),
  color: text("color"),
  order: integer("order").default(0),
});

export const erix_lead_activities = pgTable("erix_lead_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  leadId: uuid("lead_id").references(() => erix_leads.id).notNull(),
  type: text("type").notNull(),
  content: text("content"),
  metadata: jsonb("metadata").default("{}"),
  actorId: uuid("actor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_automations = pgTable("erix_automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  conditions: jsonb("conditions").default("{}"),
  actions: jsonb("actions").default("[]"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const erix_field_configs = pgTable("erix_field_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  entity: text("entity").default("lead"),
  fields: jsonb("fields").default("[]"),
  fieldOrder: text("field_order").array(),
  tableColumns: text("table_columns").array(),
  kanbanCardFields: text("kanban_card_fields").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const erix_invoices = pgTable("erix_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  leadId: uuid("lead_id").references(() => erix_leads.id),
  billTo: jsonb("bill_to").default("{}"),
  items: jsonb("items").default("[]"),
  subtotal: integer("subtotal").default(0),
  taxAmount: integer("tax_amount").default(0),
  discount: integer("discount").default(0),
  total: integer("total").default(0),
  currency: text("currency").default("INR"),
  status: text("status").default("draft"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  paidAmount: integer("paid_amount"),
  paymentProvider: text("payment_provider"),
  paymentLinkId: text("payment_link_id"),
  paymentLinkUrl: text("payment_link_url"),
  sentVia: text("sent_via"),
  sentAt: timestamp("sent_at"),
  pdfUrl: text("pdf_url"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"),
  nextInvoiceDate: timestamp("next_invoice_date"),
  notes: text("notes"),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const erix_invoice_settings = pgTable("erix_invoice_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull().unique(),
  prefix: text("prefix").default("INV"),
  nextNumber: integer("next_number").default(1),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyGstin: text("company_gstin"),
  companyPan: text("company_pan"),
  logoUrl: text("logo_url"),
  defaultTerms: text("default_terms"),
  defaultNotes: text("default_notes"),
  defaultDueDays: integer("default_due_days").default(15),
  taxRate: integer("tax_rate").default(18),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  bankDetails: jsonb("bank_details"),
});

export const erix_workflows = pgTable("erix_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").default("[]"),
  edges: jsonb("edges").default("[]"),
  compiledPlan: jsonb("compiled_plan"),
  isActive: boolean("is_active").default(false),
  lastRunAt: timestamp("last_run_at"),
  runCount: integer("run_count").default(0),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const erix_workflow_runs = pgTable("erix_workflow_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  workflowId: uuid("workflow_id").references(() => erix_workflows.id).notNull(),
  triggeredBy: text("triggered_by"),
  status: text("status").default("running"),
  nodeResults: jsonb("node_results").default("{}"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

export const erix_webhooks = pgTable("erix_webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => ecodrix_organizations.id).notNull(),
  url: text("url").notNull(),
  events: text("events").array(),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true),
  failCount: integer("fail_count").default(0),
  lastDeliveredAt: timestamp("last_delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 2. SDK USAGE PATTERNS

See `KIRO_AGENT_PROMPT.md` → "SDK-First Pattern" section.
Full SDK namespace reference available in `ECOD/packages/erix-api/README.md`.

---

## 3. ERIXSTORE INTEGRATION

See `ECOD/erix-store/README.md` for full API reference.
Tables use `store_*` prefix (store_job_wal, store_snapshots, store_usage_events).

---

## 4. SEED DATA

```typescript
// server/scripts/seed-platform.ts
const plans = [
  { name: "Free", slug: "free", erixEnabled: false, laieEnabled: false, priceMonthlyUsd: 0 },
  { name: "ERIX Starter", slug: "erix_starter", erixEnabled: true, priceMonthlyUsd: 29, erixContactsLimit: 500 },
  { name: "LAIE Starter", slug: "laie_starter", laieEnabled: true, priceMonthlyUsd: 29, laieAuditsPerMonth: 100 },
  { name: "ECODrIx Pro", slug: "ecodrix_pro", erixEnabled: true, laieEnabled: true, priceMonthlyUsd: 79, laieAuditsPerMonth: 500, erixContactsLimit: -1, erixAgentsLimit: 5 },
  { name: "ECODrIx Growth", slug: "ecodrix_growth", erixEnabled: true, laieEnabled: true, infraEnabled: true, priceMonthlyUsd: 149, laieAuditsPerMonth: -1, erixContactsLimit: -1, erixAgentsLimit: -1 },
];

// Demo org: ECODrIx Demo (Pro plan)
// Demo user: demo@ecodrix.com / Demo@2026
// 5 sample leads, 2 LAIE audits, 1 WhatsApp template, 1 broadcast
```

---

## 5. ENVIRONMENT VARIABLES

### Frontend (`ECOD/saas/.env.local`)
```bash
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXT_PUBLIC_API_URL="http://localhost:4000"
API_URL="http://localhost:4000"
```

### Backend (`ECOD/server/.env`)
```bash
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://..."
SUPABASE_URL=""
SUPABASE_SERVICE_KEY=""
MONGODB_URI="mongodb://localhost:27017"
ERIX_STORE_URL="http://localhost:6399"
ERIX_API_KEY=""
CORE_API_KEY=""
ANTHROPIC_API_KEY=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-south-1"
R2_ACCOUNT_ID=""
R2_ACCESS_KEY=""
R2_SECRET_KEY=""
META_WA_TOKEN=""
META_WA_PHONE_ID=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
GOOGLE_PLACES_API_KEY=""
```

### ErixStore (`ECOD/erix-store/.env`)
```bash
DATABASE_URL="postgresql://..."
ERIX_API_KEY=""
PORT=6399
GOOGLE_API_KEY=""
```
