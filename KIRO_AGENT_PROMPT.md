# ECODrIx Platform — Complete Architecture & Execution Blueprint
## AI-Native Business Operating System for Indian SMBs

> **Implementation Details:** Full schemas, code patterns, and env vars are in
> `ECOD/.Architecture/IMPLEMENTATION_DETAILS.md`

---

## VISION

ECODrIx is not a CRM with AI bolted on. It's an AI-powered business operating
system where AI OPERATES and humans SUPERVISE. Starting with WhatsApp-first CRM,
expanding to full customer operations automation.

```
Year 1: WhatsApp CRM + AI features (compete with Interakt/Wati)
Year 2: AI sales agent that uses WhatsApp (new category)
Year 3: Full customer operations platform (compete with Zoho/Freshworks)
Year 5: Operating system for Indian SMBs (platform — others build ON you)
```

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ECODrIx PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTENDS:                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │ ECOD/saas    │  │ ECOD/admin   │  │ @ecodrix/erix-react              │   │
│  │ User Console │  │ Agency Panel │  │ Embeddable SDK (client websites) │   │
│  │ Next.js 15   │  │ Next.js 16   │  │ React components + hooks         │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────────┘   │
│         │                  │                          │                     │
│         └──────────────────┼──────────────────────────┘                     │
│                            │                                                │
│                            ▼                                                │
│  SDK LAYER:    ┌──────────────────────────┐                                 │
│                │ @ecodrix/erix-api (v1.3.8)│                                │
│                │ Isomorphic TypeScript SDK  │                               │
│                │ CRM + WhatsApp + Email +   │                               │
│                │ Storage + Meetings + Queue │                               │
│                └────────────┬──────────────┘                                │
│                             │ HTTP + WebSocket                              │
│                             ▼                                               │
│  BACKEND:      ┌──────────────────────────┐                                 │
│                │ ECOD/server (Express+Hono)│                                │
│                │ Auth + Routes + Services  │                                │
│                │ AI Engine + Automation    │                                │
│                └──┬─────────┬──────────┬──┘                                 │
│                   │         │          │                                    │
│         ┌─────────┘         │          └─────────┐                          │
│         ▼                   ▼                    ▼                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐                   │
│  │ PostgreSQL   │  │ ErixStore    │  │ External APIs    │                   │
│  │ (Supabase)   │  │ (port 6399)  │  │ WhatsApp/SES/R2  │                   │
│  │ Primary DB   │  │ Cache+Queue  │  │ Claude/Razorpay  │                   │
│  └──────────────┘  └──────────────┘  └──────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CODEBASE STATUS & DEVELOPMENT PROGRESS

### Existing Packages (What's Built)

| Package | Path | Version | Status | Built % |
|---------|------|---------|--------|---------|
| Backend Server | `ECOD/server` | 2.0.1 | Production | **85%** |
| ErixStore | `ECOD/erix-store` | 1.1.0 | Production | **95%** |
| SDK (API) | `ECOD/packages/erix-api` | 1.3.8 | Published | **90%** |
| SDK (React) | `ECOD/packages/erix-react` | 0.2.3 | Published | **75%** |
| Admin Panel | `ECOD/admin` | 0.1.0 | Production | **70%** |
| SaaS Dashboard | `ECOD/saas` | 0.1.0 | Needs Redesign | **30%** |
| LAIE (open-design) | `open-design` | — | In Development | **40%** |

### What Exists in Each Package

**ECOD/server (85% built):**
- ✅ Express 5 + Hono dual routing
- ✅ Multi-tenant auth (saasAuth, verifyCoreToken, validateLaieKey)
- ✅ MongoDB per-tenant CRM (TenantConnectionManager, getCrmModels)
- ✅ WhatsApp integration (Meta Cloud API)
- ✅ Email (AWS SES + Nodemailer)
- ✅ Storage (Cloudflare R2)
- ✅ Google Meet scheduling
- ✅ LAIE actors (Google Maps, LinkedIn, web scraping)
- ✅ AI integration (Anthropic, OpenAI, Google GenAI)
- ✅ Job queue (ErixStore integration)
- ✅ Socket.io real-time
- ✅ Drizzle ORM (LAIE PostgreSQL tables)
- ⬜ PostgreSQL migration for Client/Org (currently MongoDB)
- ⬜ Visual automation execution engine
- ⬜ Invoice generation + Razorpay payment links
- ⬜ AI Autopilot mode

**ECOD/erix-store (95% built):**
- ✅ Key/Value store (String, Hash, List, Set, SortedSet)
- ✅ Job Queue V2 (priority, DLQ, retry, heartbeat, tenant fairness)
- ✅ Distributed Locks (mutex, R/W, semaphore, deadlock detection)
- ✅ LRU Cache (512MB, tag-based, stale-while-revalidate)
- ✅ Pub/Sub (event bus + SSE)
- ✅ Rate Limiter (sliding window)
- ✅ Anomaly Detector (Z-score alerts)
- ✅ Usage Meter (per-tenant, Postgres flush)
- ✅ Semantic Cache (Google embeddings)
- ✅ WebSocket transport (binary MessagePack)
- ✅ PostgreSQL persistence (WAL + snapshots)
- ✅ Tables renamed: store_job_wal, store_snapshots, store_usage_events
- ⬜ Dashboard metrics API (for frontend visualization)

**@ecodrix/erix-api (90% built):**
- ✅ CRM: leads, pipelines, activities, analytics, automations, scoring, sequences
- ✅ WhatsApp: messages, conversations, templates, broadcasts
- ✅ Email: send, templates
- ✅ Marketing: campaigns
- ✅ Meetings: schedule, list
- ✅ Storage: upload, media
- ✅ Services: client management
- ✅ Settings: get/update
- ✅ Queue: list, status
- ✅ Agency: white-label management
- ✅ Checkout: sessions, products
- ✅ Real-time: Socket.io events (.on/.off/.joinRoom)
- ✅ Raw escape hatch: .request(method, path, data)
- ⬜ Invoice namespace
- ⬜ Workflow namespace
- ⬜ AI agent namespace

**@ecodrix/erix-react (75% built):**
- ✅ ErixProvider (apiKey + clientCode auth)
- ✅ ErixDashboard (full shell with module routing)
- ✅ CRM: KanbanBoard, LeadCard, CRMViewContainer
- ✅ WhatsApp: Inbox, MessageBubble, TemplateSelector, Broadcast
- ✅ Analytics: Dashboard, StatCard, funnel/sources/team
- ✅ Editor: RichText with AI menu, slash commands, toolbar
- ✅ Email: TemplateBuilder, TemplateEditor, VariablePalette
- ✅ Meetings: MeetingList
- ✅ AI: LeadScoreBadge, SmartReplySuggestions, AI summary
- ✅ Real-time: RealtimeProvider, useErixChannel
- ✅ Permissions: RBAC guard, role presets
- ✅ Notifications: in-app system
- ✅ Offline queue, Command palette, i18n, Devtools
- ✅ Checkout: ErixCheckoutButton, CheckoutModal
- ✅ Routing: Module router with Next.js/React Router adapters
- ✅ Style isolation (ErixContainer)
- ⬜ Invoice components
- ⬜ Visual automation builder components
- ⬜ Dynamic field builder components

**ECOD/admin (70% built):**
- ✅ Client management (create, list, detail, config, secrets, datasource)
- ✅ CRM leads + pipeline (operates on selected client)
- ✅ WhatsApp management
- ✅ Marketing campaigns
- ✅ Monetization (plans, subscriptions, invoices, coupons)
- ✅ Templates (WhatsApp + Email)
- ✅ CORS management
- ✅ Blog management
- ✅ Uses @ecodrix/erix-api SDK
- ⬜ AI agent configuration per client
- ⬜ Workflow builder (visual)
- ⬜ Analytics dashboard

**ECOD/saas (30% built — needs full redesign):**
- ✅ NextAuth v5 (credentials + Google OAuth)
- ✅ Basic dashboard layout + sidebar
- ✅ Services page, WhatsApp page, settings, billing, analytics
- ✅ TanStack Query, Zustand, shadcn/ui
- ⬜ Console-style dashboard (cloud console redesign)
- ⬜ ERIX module (own layout + full CRM)
- ⬜ LAIE module (own layout + audit engine)
- ⬜ Infrastructure hub (ErixStore dashboard)
- ⬜ Invoice module
- ⬜ Visual automation builder
- ⬜ Dynamic CRM field builder
- ⬜ Developer settings (embeddable SDK config)

---

## TECH STACK

### Frontend (`ECOD/saas`)
```
Framework:       Next.js 15 (App Router, TypeScript strict)
Auth:            NextAuth.js v5 (credentials + Google OAuth)
Styling:         TailwindCSS 3+ + shadcn/ui (dark-themed)
State (server):  TanStack Query v5
State (client):  Zustand
Forms:           React Hook Form + Zod
API Client:      @ecodrix/erix-api (official SDK — NO direct fetch)
Charts:          Recharts
Icons:           Lucide React
Notifications:   Sonner
Tables:          TanStack Table v8
DnD:             @dnd-kit/core (Kanban + workflow builder)
PDF:             @react-pdf/renderer
Real-time:       Socket.io (via SDK .on() events)
Automation UI:   React Flow (for N8N-style visual builder)
```

### Backend (`ECOD/server`)
```
Runtime:         Node.js 18+ (TypeScript, tsx for dev)
Framework:       Express 5 + Hono (dual routing)
Database:        PostgreSQL (Supabase) via Drizzle ORM — PRIMARY
                 MongoDB (Mongoose) — legacy CRM data + external user DBs
Cache/Queue:     ErixStore (@ecodrix/erix-client + @ecodrix/erix-worker)
                 — NO Redis, NO BullMQ, NO ioredis
Real-time:       Socket.io + ErixStore Pub/Sub
AI:              Anthropic SDK (Claude Sonnet 4 + Haiku)
Scraping:        Playwright, Crawlee, Cheerio
Email:           AWS SES
Storage:         Cloudflare R2
Payments:        Razorpay SDK
Linting:         Biome
Testing:         Vitest
```

### Infrastructure (`ECOD/erix-store`)
```
Type:            In-memory data structure server
Transport:       HTTP + WebSocket (binary MessagePack)
Persistence:     PostgreSQL (store_job_wal, store_snapshots, store_usage_events)
Port:            6399
Multi-tenant:    Built-in (x-tenant-id header)
Capabilities:    Cache, Queue, Locks, Pub/Sub, Rate Limit, Anomaly Detection,
                 Semantic Cache, Usage Metering, Pipeline batching
```

---

## DATABASE ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Supabase) — PRIMARY DATABASE                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Platform:     ecodrix_organizations, ecodrix_users, ecodrix_members,    │
│                ecodrix_plans, ecodrix_subscriptions, ecodrix_api_tokens, │
│                ecodrix_waitlist, ecodrix_audit_logs                      │
│                                                                          │
│  CRM:          erix_leads, erix_conversations, erix_messages,            │
│                erix_templates, erix_broadcasts, erix_pipelines,          │
│                erix_pipeline_stages, erix_lead_activities,               │
│                erix_automations, erix_field_configs, erix_invoices,      │
│                erix_invoice_settings, erix_workflows, erix_workflow_runs,│
│                erix_webhooks                                             │
│                                                                          │
│  LAIE:         laie_tenants, laie_users, laie_actors, laie_actor_runs,   │
│                laie_datasets, laie_audits, laie_leads, laie_workflows    │
│                                                                          │
│  ErixStore:    store_job_wal, store_snapshots, store_usage_events        │
│                                                                          │
│  ISOLATION:    Every erix_* row has org_id FK. All queries filter by it. │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  External DB (OPTIONAL — user's own, when data_mode = "own"/"both")      │
│  User provides MongoDB or PostgreSQL URI. We use OUR schema, store in    │
│  THEIR database. Server connects on-demand.                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Storage Modes (per organization)

| Mode | Where CRM Data Lives | Use Case |
|------|---------------------|----------|
| `platform` (default) | Our Supabase PostgreSQL, isolated by `org_id` | Most clients |
| `own` | User's own MongoDB/PostgreSQL (we design schema, they host) | Enterprise/compliance |
| `both` | Ours (primary) + sync to theirs (secondary) via ErixStore queue | Hybrid needs |

---

## CLIENT ACQUISITION MODEL

### Two Channels → Same Result

| | Service/Freelance | Direct (Self-Serve) |
|---|---|---|
| **How created** | You create from ECOD/admin | User registers on ECOD/saas |
| **Pricing** | Setup fee ₹5-25k + discounted ₹1.5-5k/mo | Standard ₹2.4-12.3k/mo |
| **Who operates** | You (from admin panel) | User (from saas console) |
| **Auth** | x-core-api-key (admin) | x-api-key + x-client-code (SDK) |
| **Result** | Same org record, same features, same isolated data | Same |

### Organization Record (PostgreSQL)

```typescript
export const ecodrix_organizations = pgTable("ecodrix_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  clientCode: text("client_code").unique().notNull(),
  apiKey: text("api_key").unique(),
  status: text("status").default("active"),
  acquisitionChannel: text("acquisition_channel").default("direct"),
  agencyId: uuid("agency_id"), // self-ref FK for agency hierarchy
  setupFee: integer("setup_fee"),
  planId: uuid("plan_id").references(() => ecodrix_plans.id),
  subscriptionStatus: text("subscription_status").default("free"),
  erixEnabled: boolean("erix_enabled").default(true),
  laieEnabled: boolean("laie_enabled").default(false),
  infraEnabled: boolean("infra_enabled").default(false),
  dataMode: text("data_mode").default("platform"),
  externalDbType: text("external_db_type"),
  externalDbUri: text("external_db_uri"), // encrypted
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  whatsappPhone: text("whatsapp_phone"),
  aiAgentEnabled: boolean("ai_agent_enabled").default(false),
  aiAgentPrompt: text("ai_agent_prompt"),
  aiAutoReply: boolean("ai_auto_reply").default(false),
  isAgency: boolean("is_agency").default(false),
  brandConfig: jsonb("brand_config").default("{}"),
  secrets: jsonb("secrets").default("{}"),
  industry: text("industry"),
  country: text("country").default("IN"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## FRONTEND ARCHITECTURE (`ECOD/saas`)

### Console-Style Dashboard (Cloud Console Pattern)

The main page (`/`) is a launch pad — NO sidebar. Each product opens its own full-screen module.

```
/                    → Console (product cards + infra + activity + usage)
/erix/*              → ERIX CRM (own sidebar: inbox, contacts, pipeline, templates, invoices, automation)
/laie/*              → LAIE (own sidebar: audit, leads, outreach, intelligence)
/infra/*             → Infrastructure (email, storage, ErixStore dashboard)
/billing             → Plans + invoices + usage
/settings/*          → Profile, org, team, security, developer, fields
/auth/*              → Login, register, forgot
```

### SDK-First Pattern

Frontend NEVER calls server directly. Always through `@ecodrix/erix-api`:

```typescript
// Provider wraps all authenticated pages:
<EcodProvider apiKey={session.tenant.apiKey} clientCode={session.tenant.clientCode}>
  {children}
</EcodProvider>

// All hooks use the SDK:
const ecod = useEcod();
await ecod.crm.leads.list({ status: "new" });
await ecod.whatsapp.messages.send({ to, text });
await ecod.request("POST", "/api/laie/audit", data); // escape hatch
```

---

## CORE MODULES (What to Build)

### Module 1: ERIX CRM — Built % 50% | Need 50%

| Feature | Status | Priority |
|---------|--------|----------|
| Contacts/Leads table | ✅ Backend, ⬜ New frontend | P0 |
| Pipeline Kanban | ✅ Backend, ⬜ New frontend | P0 |
| WhatsApp Inbox (split-pane) | ✅ Backend, ⬜ New frontend | P0 |
| Templates management | ✅ Backend, ⬜ New frontend | P1 |
| Broadcasts | ✅ Backend, ⬜ New frontend | P1 |
| Dynamic field builder | ⬜ Both | P1 |
| Multiple CRM views (table/kanban/calendar/timeline) | ⬜ Frontend | P2 |
| Inline editing in table | ⬜ Frontend | P2 |
| Saved custom views | ⬜ Both | P2 |

### Module 2: Invoicing — Built % 10% | Need 90%

| Feature | Status | Priority |
|---------|--------|----------|
| Invoice builder UI | ⬜ Frontend | P0 |
| erix_invoices + erix_invoice_settings tables | ⬜ Backend | P0 |
| PDF generation (React-PDF) | ⬜ Backend | P0 |
| Razorpay payment link creation | ⬜ Backend | P0 |
| Send invoice via WhatsApp | ⬜ Backend | P0 |
| Payment webhook (mark paid) | ⬜ Backend | P1 |
| Recurring invoices | ⬜ Both | P2 |
| Revenue dashboard | ⬜ Frontend | P2 |
| Auto-generate on deal won | ⬜ Backend (automation) | P2 |

### Module 3: Visual Automation Builder — Built % 15% | Need 85%

| Feature | Status | Priority |
|---------|--------|----------|
| erix_workflows + erix_workflow_runs tables | ⬜ Backend | P0 |
| Node-based canvas UI (React Flow) | ⬜ Frontend | P0 |
| Trigger nodes (message received, lead created, stage changed, scheduled) | ⬜ Both | P0 |
| Action nodes (send WhatsApp, send email, move stage, assign, wait) | ⬜ Both | P0 |
| Condition nodes (if/else, switch, filter) | ⬜ Both | P1 |
| AI nodes (qualify, respond, score) | ⬜ Both | P1 |
| Workflow execution engine (ErixStore workers) | ⬜ Backend | P0 |
| Execution history + node-level logs | ⬜ Both | P1 |
| Test run mode | ⬜ Both | P2 |
| Pre-built workflow templates (marketplace) | ⬜ Both | P3 |

### Module 4: AI Agent — Built % 20% | Need 80%

| Feature | Status | Priority |
|---------|--------|----------|
| Claude integration | ✅ Backend | — |
| Per-org AI config (prompt, auto-reply toggle) | ⬜ Backend | P0 |
| Auto-respond to WhatsApp (with confidence threshold) | ⬜ Backend | P0 |
| Lead qualification via conversation | ⬜ Backend | P1 |
| Smart reply suggestions (3 options) | ✅ erix-react | P1 |
| Conversation summary | ⬜ Backend | P1 |
| AI-generated follow-ups | ⬜ Backend | P1 |
| Morning briefing (daily digest) | ⬜ Backend | P2 |
| Sales coaching (post-conversation feedback) | ⬜ Backend | P3 |
| Predictive scoring (ML-based) | ⬜ Backend | P3 |
| Adaptive learning (improves over time) | ⬜ Backend | P3 |

### Module 5: LAIE Intelligence — Built % 40% | Need 60%

| Feature | Status | Priority |
|---------|--------|----------|
| Business search (Google Maps actor) | ✅ Backend | — |
| Website audit | ✅ Backend | — |
| Social media audit | ✅ Backend (partial) | P1 |
| LinkedIn audit | ✅ Backend (partial) | P1 |
| Claude outreach kit generation | ✅ Backend | — |
| Audit search UI | ⬜ Frontend | P0 |
| Progress tracker UI | ⬜ Frontend | P0 |
| Result card with score radials | ⬜ Frontend | P0 |
| Leads table + push to ERIX | ⬜ Frontend | P1 |
| Batch audits | ⬜ Both | P2 |

### Module 6: Infrastructure Dashboard — Built % 60% | Need 40%

| Feature | Status | Priority |
|---------|--------|----------|
| ErixStore running + all services | ✅ Backend | — |
| Email API (AWS SES) | ✅ Backend | — |
| Storage (Cloudflare R2) | ✅ Backend | — |
| ErixStore dashboard UI (stats, queues, cache) | ⬜ Frontend | P1 |
| Key explorer | ⬜ Frontend | P2 |
| Queue inspector | ⬜ Frontend | P1 |
| Pub/Sub monitor | ⬜ Frontend | P2 |
| Live metrics (Recharts) | ⬜ Frontend | P2 |

---

## POWER FEATURES (Competitive Moat)

### Feature 1: Embeddable React SDK (`@ecodrix/erix-react`) — 75% Built

Clients install ONE package, pass apiKey + clientCode, get the entire platform
embedded in their own website. Backend validates feature access per plan.

```typescript
import { ErixProvider, ErixDashboard } from "@ecodrix/erix-react";
import "@ecodrix/erix-react/styles";

<ErixProvider apiKey="ecod_live_sk_..." clientCode="CLINIC_ABC">
  <ErixDashboard />  {/* Full CRM + WhatsApp + Analytics */}
</ErixProvider>

// Or individual modules:
import { WhatsAppInbox } from "@ecodrix/erix-react/whatsapp";
import { KanbanBoard } from "@ecodrix/erix-react/crm";
import { ErixEditor } from "@ecodrix/erix-react/editor";
```

Developer settings page (`/settings/developer`) shows install instructions,
credentials, allowed origins, and feature toggles.

### Feature 2: Dynamic CRM Field Builder (Shopify-Style) — 5% Built

Users customize their CRM schema visually:
- Add custom fields (text, number, select, date, currency, formula, relation, file)
- Drag to reorder, set visibility per view (table/kanban/detail)
- Live preview of how table/kanban will look
- `erix_field_configs` table stores per-org field definitions
- Custom field data in `erix_leads.custom_fields` JSONB

### Feature 3: Multi-Channel Inbox — 40% Built (WhatsApp only)

All channels converge into same tables:
- ✅ WhatsApp (Meta Cloud API)
- ⬜ Instagram DMs (Meta API — same infra)
- ⬜ Facebook Messenger (Meta API — same infra)
- ⬜ Email inbound (SES/Mailgun webhook)
- ⬜ SMS (Twilio)
- ⬜ Web Chat Widget (embeddable via erix-react)

`erix_conversations.channel` = "whatsapp" | "instagram" | "email" | "sms" | "webchat"

### Feature 4: Webhook Engine — 20% Built

Fire webhooks on CRM events. Integrates with Zapier/Make/n8n:
- `erix_webhooks` table (url, events, secret, failCount)
- HMAC-signed delivery
- Retry via ErixStore queue (5 attempts)
- Events: lead.created, message.received, stage.changed, invoice.paid, etc.

### Feature 5: White-Label / Agency Mode — 30% Built

- `isAgency` flag on org
- `brandConfig`: logo, colors, appName, custom domain
- Agency manages sub-orgs (agencyId FK)
- Agency billing: charge clients through platform
- Sub-accounts with permission scoping

### Feature 6: Conversational Commerce — 10% Built

WhatsApp as a full storefront:
- Product catalog in WhatsApp (Meta Commerce API)
- Customer selects items → cart in conversation
- Payment link auto-generated (Razorpay)
- Order status updates via WhatsApp
- Returns/refunds in same thread

### Feature 7: Predictive Pipeline — 5% Built

AI forecasting:
- "You'll close ₹4.2L this month" (based on pipeline + history)
- "3 deals at risk — no activity in 5 days"
- "Best time to contact Ravi: Tuesday 11am"
- Revenue forecasting with confidence intervals

### Feature 8: Voice AI — 0% Built (Future)

- AI voice agent answers calls (Exotel + ElevenLabs)
- Qualifies leads by phone
- Books appointments into calendar
- Transcribes calls → adds to lead timeline
- WhatsApp voice note → AI transcribes + responds

### Feature 9: Micro-App Builder — 0% Built (Future)

No-code mini-apps for clients' customers:
- Appointment booking page
- Order tracking page
- Feedback/review form
- Referral program page
- Hosted on ECODrIx subdomain or client's domain

### Feature 10: Offline-First Mobile — 0% Built (Future)

React Native / PWA for field sales:
- Works offline (queue via ErixStore)
- GPS check-in at lead locations
- Business card scanner → auto-create lead (OCR)
- Voice note → AI transcribes → creates activity

---

## AI ARCHITECTURE

### AI Tiers

| Tier | What AI Does | Status |
|------|-------------|--------|
| **Operates** | Auto-respond, qualify, move pipeline, generate invoices | 20% built |
| **Learns** | Adapts timing, retires bad templates, improves scoring | 0% built |
| **Creates** | Writes templates, email sequences, workflows, reports | 10% built |
| **Predicts** | Forecasts revenue, identifies at-risk deals, optimal timing | 0% built |
| **Coaches** | Post-conversation feedback, weekly performance reports | 0% built |

### AI Integration Points

```
Event                    → AI Action
─────                      ─────────
Message received         → Classify intent + auto-respond (if enabled)
Lead created             → Score + assign + suggest next action
Stage changed            → Generate appropriate follow-up
No reply in X days       → Craft re-engagement message
Deal won                 → Generate invoice + thank you
Deal lost                → Analyze why + suggest recovery
Daily 9am                → Morning briefing
Weekly Monday            → Performance report + recommendations
```

### AI Memory (via ErixStore)

- **Semantic Cache:** Similar questions → cached responses (save API costs)
- **Learning Store:** What templates get replies, what timing works
- **Context Store:** Per-lead conversation summary, per-org business context

---

## EXECUTION PLAN (Priority Order)

### Phase 1: Foundation (Weeks 1-4) — Get to Revenue

```
1. Migrate Client → PostgreSQL (ecodrix_organizations)
2. Redesign ECOD/saas as console-style dashboard
3. Build ERIX CRM module (contacts table + pipeline kanban + inbox)
4. Wire up @ecodrix/erix-api SDK as the only API layer
5. Build auth flow (register → auto-provision org)
6. Build billing page (Razorpay integration)
```

### Phase 2: Core Product (Weeks 5-8) — Differentiate

```
7. Build invoice module (builder + PDF + Razorpay link + WhatsApp send)
8. Build LAIE audit UI (search + progress + result card)
9. Build AI auto-respond (per-org config, confidence threshold)
10. Build basic automation (trigger → action, no visual builder yet)
11. Build dynamic field builder (custom fields per org)
```

### Phase 3: Power Features (Weeks 9-12) — Sticky

```
12. Build visual automation builder (React Flow canvas)
13. Build webhook engine (event → delivery → retry)
14. Build ErixStore dashboard (queue inspector, metrics)
15. Build developer settings page (embeddable SDK config)
16. Build multi-view CRM (table + kanban + calendar + timeline)
```

### Phase 4: AI & Scale (Weeks 13-16) — Moat

```
17. AI qualification flow (conversation → score → route)
18. AI-generated follow-ups + templates
19. Predictive pipeline (revenue forecast)
20. Morning briefing (daily AI digest)
21. Smart reply suggestions in inbox
22. Adaptive learning (track what works, auto-adjust)
```

### Phase 5: Platform (Months 5-6) — Network Effect

```
23. White-label agency mode (custom branding, sub-orgs)
24. Multi-channel inbox (Instagram, email, SMS)
25. Conversational commerce (WhatsApp storefront)
26. Pre-built automation templates (marketplace)
27. Plugin API (third-party extensions)
28. Mobile PWA (offline-first)
```

---

## DESIGN SYSTEM

```css
:root {
  --color-bg-base:        #0A1628;
  --color-bg-surface:     #0F2040;
  --color-bg-elevated:    #1A3050;
  --color-accent-primary: #1E7AFF;
  --color-accent-secondary:#FF6B1A;
  --color-text-primary:   #FFFFFF;
  --color-text-secondary: #8FA8C8;
  --color-text-disabled:  #3A5070;
  --color-success:        #22C55E;
  --color-warning:        #F59E0B;
  --color-error:          #EF4444;
  --color-border:         #1E3A5A;
}
```

Dark mode ONLY. Inter (body), JetBrains Mono (code/metrics).
All shadcn/ui components re-themed to match. No white/gray defaults.

---

## QUALITY REQUIREMENTS

- [ ] TypeScript strict — zero `any`, zero `ts-ignore`
- [ ] Frontend uses ONLY @ecodrix/erix-api SDK — no direct fetch
- [ ] All CRM queries include `org_id` filter (PostgreSQL) or use isolated connection (MongoDB)
- [ ] All forms have Zod validation with inline errors
- [ ] All list views: skeleton loading, empty state, error state with retry
- [ ] All buttons: loading state during async
- [ ] Dark navy design system everywhere
- [ ] Console layout: NO sidebar (topbar + card grid)
- [ ] Product layouts (ERIX/LAIE): own sidebar, "← Console" back link
- [ ] EcodProvider wraps all authenticated pages

---

## COMPETITIVE POSITIONING

```
vs Interakt/Wati/AiSensy (WhatsApp tools):
  → They're messaging. You're full CRM + AI + automation + invoicing.

vs Zoho/HubSpot/Freshsales (traditional CRM):
  → They're email-first. You're WhatsApp-first (India's #1 channel).
  → They bolt on AI. You're AI-native.
  → They cost ₹15-50k/mo. You cost ₹2-6k/mo.

vs N8N/Make/Zapier (automation):
  → They're generic. You're CRM-specific (tighter, simpler).
  → They need separate subscriptions. You're all-in-one.

vs Razorpay Invoice (invoicing):
  → Standalone tool. Yours is INSIDE the CRM pipeline.
  → Won deal → invoice → WhatsApp → payment → all one flow.
```

### Your 6 Moats

1. **ErixStore** — own infrastructure, no Redis/BullMQ bills
2. **@ecodrix/erix-react** — embeddable SDK (network effect)
3. **LAIE intelligence** — AI-powered lead research (unique data)
4. **WhatsApp + CRM + Invoice in ONE flow** — integration depth
5. **Visual automation builder** — sticky (users invest time building)
6. **Service channel trains AI** — 100 managed clients = training data across 20 industries

---

## REVENUE MODEL

| Channel | Pricing | Target |
|---------|---------|--------|
| Service/Freelance | Setup ₹5-25k + ₹1.5-5k/mo | 50 clients → ₹18L/year |
| Direct SaaS | ₹2.4-12.3k/mo (no setup) | 500 users → ₹2.4Cr/year |
| Embeddable SDK | Usage-based (per message/contact) | Developer platform revenue |
| Agency white-label | Revenue share on sub-org billing | Agency partners |

---

## DEMO CREDENTIALS

```
Email:    demo@ecodrix.com
Password: Demo@2026
Plan:     ECODrIx Pro (ERIX + LAIE enabled)
Org:      ECODrIx Demo
```

---

## FINAL DELIVERABLE

A working platform that:
1. Console hub at `/` — cloud-console style
2. ERIX CRM at `/erix/*` — inbox, contacts, pipeline, templates, invoices, automation
3. LAIE at `/laie/*` — audit engine, AI outreach, leads
4. Infrastructure at `/infra/*` — email, storage, ErixStore dashboard
5. Billing at `/billing` — plans, Razorpay, usage
6. Settings at `/settings/*` — profile, org, team, security, developer, fields
7. AI agent operating 24/7 — auto-respond, qualify, follow-up
8. Visual automation builder — N8N-style drag-and-drop
9. Invoicing — generate, send via WhatsApp, collect via Razorpay
10. Embeddable SDK — clients embed in their own apps
11. Multi-tenant isolation — org_id on PostgreSQL, external DB support
12. ErixStore as sole infrastructure — no Redis/BullMQ
13. Dark navy brand design throughout
