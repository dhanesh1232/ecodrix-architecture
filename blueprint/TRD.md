# ECODrIx Platform — Technical Requirements Document

**Version:** 2.0 | **Date:** June 2026 | **Stack:** ECODrIx Native

---

## 1. System Architecture Overview

| Layer         | Technology                                              | Purpose                          |
| ------------- | ------------------------------------------------------- | -------------------------------- |
| Frontend      | Next.js 15 (App Router) + TailwindCSS + shadcn/ui       | SaaS Console UI                  |
| SDK           | @ecodrix/erix-api (820KB) + @ecodrix/erix-react (4.9MB) | Frontend → Server bridge         |
| API Server    | Node.js + TypeScript + Hono (primary) + Express         | REST + WebSocket                 |
| Queue + Cache | ErixStore (port 6399, ERIX.\* protocol)                 | Replaces ALL Redis + BullMQ      |
| Platform DB   | Supabase PostgreSQL + Drizzle ORM                       | Users, billing, platform config  |
| Tenant DB     | MongoDB per-tenant (ecodrix\_${userId})                 | CRM contacts, conversations      |
| LAIE DB       | Supabase PostgreSQL + Drizzle                           | Scrape jobs, leads, content data |
| File Storage  | Cloudflare R2 (cdn.ecodrix.com)                         | Media, exports, uploads          |
| Email         | AWS SES (50K/day)                                       | Transactional + campaigns        |
| WhatsApp      | Meta Cloud API                                          | WA messaging                     |
| AI/LLM        | Anthropic Claude API (claude-sonnet-4)                  | Content generation + enrichment  |
| Payments      | Razorpay                                                | INR subscriptions + one-time     |
| Auth          | JWT (15min) + httpOnly refresh (30d)                    | Stateless auth                   |
| Infra         | GCP Cloud Run + Vercel + AWS EC2                        | Serverless + ErixStore host      |

---

## 2. High-Level Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS (Browser/Mobile)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel (Next.js 15 — ECODrIx Console)          │
│         AWS-style hub. No sidebar. Root = product grid.     │
│    @ecodrix/erix-api SDK — ALL server calls go through here │
└──────────────────────────┬──────────────────────────────────┘
                           │ SDK → REST/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              GCP Cloud Run — Hono API Server                 │
│         auth | erix | laie | flow | billing | admin         │
└──┬──────────────┬──────────────┬──────────────┬─────────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
Supabase PG   MongoDB        ErixStore     Cloudflare R2
(platform +   per-tenant    AWS EC2        cdn.ecodrix.com
 LAIE data)   CRM data      port 6399
                             Queue+Cache

External APIs:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Meta Cloud   │  │ Claude API   │  │ Razorpay     │
│ WhatsApp +   │  │ (Sonnet 4)   │  │ Payments     │
│ Instagram    │  │ AI engine    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
       │                                    │
  AWS SES (email 50K/day)           GCP Cloud SQL
```

---

## 3. Frontend Stack

| Component         | Technology                   | Notes                        |
| ----------------- | ---------------------------- | ---------------------------- |
| Framework         | Next.js 15 (App Router)      | SSR + RSC + streaming        |
| Styling           | TailwindCSS + shadcn/ui      | ECODrIx design tokens        |
| State             | Zustand                      | Client state management      |
| Data Fetching     | TanStack Query (React Query) | Cache + sync                 |
| Server Calls      | @ecodrix/erix-api SDK ONLY   | Never direct fetch to server |
| Forms             | React Hook Form + Zod        | Type-safe validation         |
| Charts            | Recharts                     | Analytics dashboards         |
| Automation Canvas | React Flow                   | ERIX-FLOW drag-and-drop      |
| Rich Text         | Tiptap                       | WhatsApp template editor     |
| Dates             | date-fns                     | Scheduling + calendar        |
| Icons             | Lucide React                 | Consistent iconography       |
| Toasts            | Sonner                       | Notifications                |

### Console Architecture

```
/app
  /(auth)           → Login, signup, onboarding
  /(console)        → AWS-style product hub (no sidebar)
    /dashboard      → Overview metrics
    /erix           → WhatsApp CRM
      /inbox        → Conversations
      /contacts     → Contact management
      /campaigns    → Broadcasts
      /templates    → WA templates
      /pipeline     → Deals
    /laie           → Lead Intelligence
      /leads        → Scrape + manage leads
      /social       → Competitor + content
      /calendar     → Content calendar
    /flow           → ERIX-FLOW automation canvas
    /billing        → Plans + invoices
    /settings       → Workspace + integrations
```

---

## 4. Backend Architecture

### Service Modules (Hono Router-based)

```typescript
// Server entry: server/src/index.ts
import { Hono } from "hono";

const app = new Hono();

app.route("/auth", authRouter); // JWT, refresh, OAuth
app.route("/erix", erixRouter); // CRM, contacts, campaigns
app.route("/laie", laieRouter); // Scraping, enrichment, social
app.route("/flow", flowRouter); // Automation canvas execution
app.route("/billing", billingRouter); // Razorpay, plans, invoices
app.route("/admin", adminRouter); // Platform admin
app.route("/ws", wsRouter); // WebSocket (real-time inbox)
```

### @ecodrix/erix-api SDK Pattern

```typescript
// Frontend ALWAYS uses SDK — never raw fetch
import { erixApi } from "@ecodrix/erix-api";

// Initialize once
erixApi.init({ baseUrl: process.env.NEXT_PUBLIC_API_URL });

// All calls via SDK
const contacts = await erixApi.contacts.list({ page: 1, limit: 50 });
const campaign = await erixApi.campaigns.create({ templateId, segmentId });
const leads = await erixApi.laie.scrape({
  source: "google_maps",
  query: "restaurants Chennai",
});
```

---

## 5. ErixStore — Queue + Cache Engine

**ErixStore replaces ALL Redis and BullMQ. No exceptions.**

```
Architecture:
  - Runs on AWS EC2 t3.small (ap-south-1) — ~₹15/month (covered by credits)
  - Port: 6399
  - Protocol: ERIX.* commands (custom TCP protocol)
  - Persistence: SQLite-backed for queue durability
  - CLI: erixcli (command-line management)

ERIX.* Commands:
  ERIX.SET key value [TTL]        → Cache set
  ERIX.GET key                    → Cache get
  ERIX.DEL key                    → Delete
  ERIX.PUSH queue payload [opts]  → Enqueue job
  ERIX.POP queue                  → Dequeue job
  ERIX.SUBSCRIBE channel          → Pub/Sub subscribe
  ERIX.PUBLISH channel message    → Pub/Sub publish
  ERIX.STATS                      → Queue health stats

Use cases:
  - Rate limiting (WhatsApp message throttling)
  - Job queues (scrape jobs, email sends, flow executions)
  - Session cache (JWT token blacklist)
  - Real-time pub/sub (inbox WebSocket events)
  - Template compilation cache
```

---

## 6. Database Architecture

### Supabase PostgreSQL — Platform + LAIE Data

**Connection:** GCP Cloud SQL PostgreSQL 15 (ecodrix-pg, asia-south1)
**ORM:** Drizzle ORM + TypeScript

Key tables:

- `users` — platform accounts
- `organizations` — workspace/tenant config
- `subscriptions` — Razorpay plan data
- `laie_jobs` — scrape job queue metadata
- `laie_leads` — enriched lead records
- `laie_competitors` — tracked competitor profiles
- `laie_content` — scraped + generated content
- `flow_definitions` — automation flow JSON
- `flow_runs` — execution history

### MongoDB — Per-Tenant CRM Data

**Naming:** `ecodrix_${userId}` — one DB per tenant
**No shared collections between tenants.**

Collections per tenant:

- `contacts` — CRM contacts + custom fields
- `conversations` — WhatsApp thread history
- `messages` — Individual WA messages
- `campaigns` — Broadcast records
- `templates` — WA template cache
- `deals` — Pipeline deals
- `activities` — Timeline events

---

## 7. Meta Integration Architecture

### WhatsApp Cloud API

```
ERIX Connect (Embedded Signup) Flow:
  1. User clicks "Connect WhatsApp" in ECODrIx Console
  2. Meta Embedded Signup popup launches (Tech Provider verified)
  3. User logs in to Meta Business Manager
  4. Selects/creates WhatsApp Business Account
  5. Grants ECODrIx platform permissions
  6. Callback → server stores WABA ID + access token (encrypted)
  7. Test message sent to confirm connection
  8. User's WABA now managed via ECODrIx platform

Webhook setup:
  - Platform-level webhook: server/webhooks/meta
  - Routes events to correct tenant by WABA ID
  - Event types: message, message_status, template_status
  - Processed via ErixStore queue → MongoDB storage → WebSocket push
```

### Instagram API (Meta Graph API)

```
Capabilities (Tech Provider unlocked):
  - Content Publishing API → post images, carousels, reels
  - Comment Reply API → auto-reply to comments
  - Messaging API → DM automation (IG Comment → DM trigger)
  - Insights API → post performance data
  - Business Discovery API → competitor public data

IG Comment → Auto DM Flow:
  1. Webhook receives comment event
  2. ErixStore queue processes within 5 seconds
  3. Checks keyword match (e.g., "INFO", "PRICE")
  4. Sends DM via Messaging API
  5. Contact added to ERIX CRM
  6. Follow-up sequence triggered in ERIX-FLOW
```

---

## 8. LAIE Scraper Architecture

### 5-Layer Scraper System

```
Layer 1: Request Router (Cloudflare Workers)
  → Decides: API call vs scrape vs cache hit
  → Routes to appropriate proxy tier

Layer 2: Proxy Manager
  → GCP Squid (datacenter) — fast, cheap, for non-blocked sites
  → Jio SIM residential — for Instagram, JustDial (blocks datacenter IPs)
  → AWS spot burst — for high-volume parallel scraping

Layer 3: Scraper Engine (Playwright + patchright + Crawlee)
  → patchright: patches Playwright fingerprints (stealth mode)
  → Crawlee: manages concurrency, retries, queue
  → Handles: Google Maps, JustDial, Sulekha, Instagram public profiles

Layer 4: Enrichment Pipeline (Claude API)
  → Input: raw scraped data
  → Output: structured, enriched, scored lead records
  → Content analysis: post categorization, hook extraction, hashtag clusters

Layer 5: Storage + Distribution
  → Raw data: Cloudflare R2
  → Enriched data: Supabase PostgreSQL (laie_leads)
  → Push to ERIX CRM: MongoDB per-tenant
```

### Scrape Job Queue (ErixStore)

```typescript
// Enqueue a scrape job
await erixStore.push("laie:scrape:queue", {
  jobId: uuid(),
  tenantId: user.id,
  source: "google_maps",
  params: { query: "restaurants", city: "Chennai", limit: 200 },
  priority: "normal",
  createdAt: Date.now(),
});

// Worker processes jobs
erixStore.subscribe("laie:scrape:queue", async (job) => {
  const results = await scrapeGoogleMaps(job.params);
  const enriched = await enrichWithClaude(results);
  await saveToDB(job.tenantId, enriched);
  await notifyUser(job.tenantId, job.jobId);
});
```

---

## 9. ERIX-FLOW Execution Engine

```
Flow Definition (stored in PostgreSQL as JSON):
{
  "id": "flow_abc123",
  "tenantId": "user_xyz",
  "name": "IG Comment → WhatsApp Lead",
  "trigger": {
    "type": "instagram_comment",
    "config": { "keyword": "INFO", "postId": "any" }
  },
  "nodes": [
    { "id": "n1", "type": "send_whatsapp", "config": { "templateId": "intro_msg" } },
    { "id": "n2", "type": "add_to_crm", "config": { "tags": ["ig_lead"] } },
    { "id": "n3", "type": "delay", "config": { "hours": 24 } },
    { "id": "n4", "type": "send_whatsapp", "config": { "templateId": "followup_msg" } }
  ],
  "edges": [
    { "from": "trigger", "to": "n1" },
    { "from": "n1", "to": "n2" },
    { "from": "n2", "to": "n3" },
    { "from": "n3", "to": "n4" }
  ]
}

Execution:
  1. Trigger event arrives (Meta webhook / ERIX event / schedule)
  2. ErixStore queue receives job: ERIX.PUSH flow:run <payload>
  3. Flow worker pops job, resolves flow definition
  4. Executes nodes sequentially (with delay support)
  5. Each node action calls relevant service (WA, IG, CRM, Email, AI)
  6. Run result stored in flow_runs table
  7. Error → retry with exponential backoff (3 attempts)
```

---

## 10. Auth Architecture

```
Login Flow:
  POST /auth/login → validate credentials
  → issue accessToken (JWT, 15min, signed HS256)
  → issue refreshToken (opaque, 30d, stored in PostgreSQL)
  → set refreshToken as httpOnly cookie
  → return accessToken in response body

Token Refresh:
  POST /auth/refresh
  → read refreshToken from httpOnly cookie
  → validate against DB (not blacklisted, not expired)
  → issue new accessToken
  → rotate refreshToken

Logout:
  POST /auth/logout
  → blacklist refreshToken in ErixStore (TTL 30d)
  → clear httpOnly cookie

SDK Auth Pattern:
  @ecodrix/erix-api handles token storage + auto-refresh
  No manual token management in frontend code
```

---

## 11. AI Architecture (Claude API)

```
Primary uses:
  1. Lead enrichment — classify, score, append data
  2. Content analysis — categorize competitor posts
  3. Caption generation — brand-voice captions + hashtags
  4. Flow AI node — inline AI action in ERIX-FLOW
  5. Smart reply suggestions — ERIX inbox

Model: claude-sonnet-4-20250514
Max tokens: 2048 per call (content gen)
Context window: Full for enrichment tasks

Prompt architecture:
  /server/src/ai/prompts/
    lead-enrichment.ts
    content-analysis.ts
    caption-generator.ts
    hashtag-generator.ts
    flow-ai-node.ts

Token cost management:
  - Cache enrichment results in Supabase (don't re-enrich same lead)
  - Batch content analysis (process 30 posts in 1 call)
  - User-level monthly AI token quota (tracked in subscriptions table)
```

---

## 12. Payments Architecture (Razorpay)

```
Subscription Flow:
  1. User selects plan in billing UI
  2. SDK calls POST /billing/subscription/create
  3. Server creates Razorpay subscription (plan_id + customer_id)
  4. Returns Razorpay checkout URL
  5. User completes payment
  6. Razorpay webhook → POST /billing/webhook
  7. Server updates subscriptions table
  8. Tenant feature limits updated in Redis/ErixStore cache

Plans pre-created in Razorpay:
  erix_starter_999, erix_growth_2499, erix_scale_5999, erix_enterprise_14999
  laie_starter_1499, laie_growth_3999, laie_scale_7999, laie_agency_19999
  flow_starter_799, flow_growth_1999, flow_scale_4999

Invoice generation:
  → On payment success
  → PDF generated with GSTIN 37GHCPM6574C1Z5
  → Stored in Cloudflare R2
  → Emailed via AWS SES
```

---

## 13. WebSocket Architecture (Real-time Inbox)

```
ERIX Inbox real-time:
  Client → WebSocket connection to /ws/inbox
  Server → subscribes to ErixStore channel: erix:${tenantId}:messages
  Meta Webhook → message arrives → server publishes to ErixStore
  ErixStore → pushes to WebSocket → client updates inbox in real-time

Presence system:
  Agent "online" status: ERIX.SET presence:${agentId} 1 TTL:60s
  Heartbeat: client pings every 30s to refresh TTL
  Conversation assignment: ERIX.SET conv:${convId}:agent ${agentId}
```

---

## 14. Security Architecture

```
API Security:
  - All endpoints require valid JWT (except /auth/*)
  - Tenant isolation middleware: extracts tenantId from JWT, injects into every query
  - Rate limiting via ErixStore: 100 req/min per tenant default
  - Input validation: Zod schemas on all request bodies
  - SQL injection prevention: Drizzle ORM parameterized queries
  - XSS prevention: CSP headers, input sanitization

Data Security:
  - Meta API credentials: AES-256 encrypted, stored in Supabase
  - MongoDB: each tenant's DB has its own connection string
  - No cross-tenant queries possible at code level
  - Audit log: all sensitive actions (billing, settings, delete) logged

Infrastructure Security:
  - GCP Cloud Run: private VPC, no public IP
  - ErixStore: accessible only within VPC
  - Cloudflare: DDoS protection, WAF rules
  - GitHub Actions: secrets in encrypted vault
```

---

## 15. Assumptions Made

- ErixStore handles all cache + queue needs — no Redis instance needed
- Frontend exclusively uses @ecodrix/erix-api SDK — no raw fetch calls
- MongoDB per-tenant strategy scales to 500 tenants on shared Atlas cluster
- GCP asia-south1 region satisfies India data residency requirements
- Anthropic Claude API latency (<2s) is acceptable for content generation
- Instagram Graph API scraping limits stay within Tech Provider quota
- Razorpay handles all INR billing — no Stripe needed for India market
