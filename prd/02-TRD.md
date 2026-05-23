# ECODrIx — Technical Requirements Document (TRD)
**Version:** 1.0 | **Date:** May 2026

---

## 1. System Architecture Overview

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend (User) | Next.js 15, TailwindCSS, shadcn/ui | User-facing console dashboard |
| Frontend (Admin) | Next.js 16, TailwindCSS, shadcn/ui | Internal agency management panel |
| Frontend (Embedded) | @ecodrix/erix-react (React SDK) | Embeddable components for client websites |
| SDK | @ecodrix/erix-api (TypeScript) | Isomorphic API client (browser + Node.js) |
| Backend | Express 5 + Hono (Node.js, TypeScript) | API layer, auth, business logic, AI engine |
| Database (Primary) | PostgreSQL 15 (Supabase) | All platform + CRM + LAIE data |
| Database (Legacy) | MongoDB (Mongoose) | Existing CRM data (migration in progress) |
| Cache/Queue/Locks | ErixStore (custom, port 6399) | Replaces Redis + BullMQ entirely |
| Real-time | Socket.io + ErixStore Pub/Sub | Live updates, typing indicators, notifications |
| AI | Anthropic Claude (Sonnet 4 + Haiku) | Auto-respond, qualify, score, generate content |
| Email | AWS SES | Transactional + marketing emails |
| Storage | Cloudflare R2 (S3-compatible) | Files, media, invoice PDFs |
| Payments | Razorpay | Subscriptions, invoice payment links |
| WhatsApp | Meta Cloud API | Messaging, templates, broadcasts |
| Scraping | Playwright + Crawlee + Cheerio | LAIE business intelligence actors |

---

## 2. High-Level Infrastructure

> **Critical Decision:** ErixStore replaces Redis AND BullMQ. This eliminates two external dependencies, reduces costs, and gives full control over the caching/queuing layer. ErixStore persists to the same PostgreSQL instance via WAL + snapshots.

```
Internet → Vercel (frontends) → API (Render) → PostgreSQL (Supabase)
                                      ↕
                               ErixStore (Render, port 6399)
                                      ↕
                               PostgreSQL (WAL persistence)
```

---

## 3. Frontend Stack

| Aspect | Choice | Reason |
|--------|--------|--------|
| Framework | Next.js 15 (App Router) | SSR + RSC + API routes + middleware |
| Styling | TailwindCSS 3 + shadcn/ui | Rapid UI, dark theme, accessible |
| State (server) | TanStack Query v5 | Cache, refetch, optimistic updates |
| State (client) | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Performant, type-safe validation |
| Tables | TanStack Table v8 | Sorting, filtering, pagination, virtual scroll |
| DnD | @dnd-kit/core | Kanban board, workflow builder |
| Charts | Recharts | Dashboard metrics, score radials |
| Automation UI | React Flow | N8N-style visual workflow builder |
| PDF | @react-pdf/renderer | Invoice PDF generation (client-side) |
| Icons | Lucide React | Consistent, tree-shakeable |
| Notifications | Sonner | Toast notifications |
| API Client | @ecodrix/erix-api | Official SDK — NO direct fetch/axios |

---

## 4. Backend Stack

| Aspect | Choice | Reason |
|--------|--------|--------|
| Runtime | Node.js 18+ | Async I/O, TypeScript native |
| Framework | Express 5 + Hono | Express for compatibility, Hono for performance |
| ORM | Drizzle ORM | Type-safe, lightweight, PostgreSQL-native |
| Validation | Zod | Runtime + compile-time type safety |
| Auth | JWT + API keys | Stateless, multi-tenant |
| Queue | ErixStore (@ecodrix/erix-worker) | Priority queue, DLQ, retry, heartbeat |
| Cache | ErixStore (@ecodrix/erix-client) | LRU, tag-based invalidation, semantic cache |
| Real-time | Socket.io | Bi-directional, room-based, auto-reconnect |
| AI | @anthropic-ai/sdk | Claude Sonnet 4 (complex), Haiku (fast) |
| Email | @aws-sdk/client-sesv2 | Transactional + bulk |
| Storage | @aws-sdk/client-s3 | R2-compatible, presigned URLs |
| Payments | razorpay (npm) | Payment links, subscriptions, webhooks |
| Linting | Biome | Fast, replaces ESLint + Prettier |
| Testing | Vitest | Fast, ESM-native, compatible with Jest API |

---

## 5. Database Strategy

| Database | Purpose | Access Pattern |
|----------|---------|----------------|
| PostgreSQL (Supabase) | All structured data | Drizzle ORM, org_id isolation |
| MongoDB (legacy) | Existing CRM data during migration | Mongoose, per-tenant connection |
| MongoDB (external) | User's own DB (when data_mode="own") | Dynamic connection, our schema |
| ErixStore | Ephemeral data (cache, queue, locks, pub/sub) | @ecodrix/erix-client SDK |

**Multi-tenancy:** Row-level isolation via `org_id` FK on every CRM table. Middleware validates org ownership on every request.

**External DB support:** Users can provide their own MongoDB/PostgreSQL URI. Server connects on-demand, uses ECODrIx schema definitions, stores data in their database.

---

## 6. API Architecture

- **Style:** REST (resource-oriented)
- **Versioning:** URL-based (`/api/v1/...`) for public, unversioned for internal
- **Auth:** `x-api-key` + `x-client-code` headers (SDK handles automatically)
- **Admin:** `x-core-api-key` header for elevated access
- **Response format:** `{ success: boolean, data?: T, error?: { code, message, field? } }`
- **Pagination:** `{ data: T[], meta: { page, total, limit, pages } }`
- **Rate limiting:** Per-org sliding window via ErixStore (100 req/min default)
- **Idempotency:** `Idempotency-Key` header for POST/PATCH (SDK supports)

---

## 7. Authentication & Authorization

**Flow:**
1. User logs in via NextAuth (frontend) — credentials or Google OAuth
2. NextAuth issues JWT with: userId, orgId, role, plan, features
3. Frontend creates ECODrIxAPI instance with org's apiKey + clientCode
4. SDK automatically includes auth headers on every request
5. Server middleware validates API key → resolves org → attaches to request
6. Every downstream query filters by `req.orgId`

**Roles:** owner | admin | agent | viewer
**Feature gates:** erixEnabled, laieEnabled, infraEnabled, aiAgentEnabled

> **Critical:** The `saasAuth` middleware is the SINGLE point of tenant resolution. If it doesn't attach `req.orgId`, the request MUST be rejected.

---

## 8. AI/LLM Infrastructure

| Model | Use Case | Token Budget | Est. Cost/1K calls |
|-------|----------|-------------|-------------------|
| Claude Sonnet 4 | Auto-respond, qualify, outreach generation | 2000 output | $0.045 |
| Claude Haiku | Classification, scoring, quick replies | 500 output | $0.003 |
| Google text-embedding-004 | Semantic cache, similar lead matching | 256 dims | $0.001 |

**AI Memory (via ErixStore):**
- Semantic Cache: similar questions → cached responses (92% threshold)
- Context Store: per-lead conversation summary (compressed by AI)
- Learning Store: what templates/timing works per industry

**Cost Control:**
- Semantic cache reduces API calls by ~40%
- Haiku for classification (cheap), Sonnet only for generation (expensive)
- Per-org monthly AI token budget (configurable in plan)
- Graceful degradation: if budget exceeded, disable auto-reply, keep suggestions

---

## 9. Caching Strategy

All caching via ErixStore (NOT Redis):

| Cache Type | TTL | Invalidation | Use Case |
|-----------|-----|-------------|----------|
| API response cache | 30s | Tag-based (on mutation) | Contact lists, pipeline data |
| Session cache | 15min | On logout/token refresh | User session data |
| Org config cache | 1h | On settings update | Plan limits, feature flags |
| AI response cache | 24h | Semantic similarity (92%) | Similar questions |
| Template cache | 1h | On template CRUD | WhatsApp templates |

---

## 10. Queue & Async Infrastructure

All via ErixStore Job Queue V2 (NOT BullMQ):

| Queue | Priority | Max Attempts | Use Case |
|-------|----------|-------------|----------|
| whatsapp-send | 8 | 3 | Outbound WhatsApp messages |
| broadcast-worker | 5 | 5 | Bulk broadcast delivery |
| webhook-delivery | 3 | 5 | Outbound webhook HTTP calls |
| laie-audit | 5 | 3 | LAIE business audit pipeline |
| ai-respond | 7 | 2 | AI auto-response generation |
| invoice-generate | 6 | 3 | PDF generation + payment link |
| data-sync | 2 | 5 | Sync to external user DB |
| workflow-execute | 6 | 3 | Visual automation execution |
| email-send | 4 | 3 | Transactional + marketing email |

---

## 11. Third-Party Integrations

| Service | Purpose | Method | Package |
|---------|---------|--------|---------|
| Meta WhatsApp | Messaging, templates, broadcasts | REST API + Webhooks | Custom (in server) |
| Anthropic Claude | AI responses, scoring, generation | REST API | @anthropic-ai/sdk |
| AWS SES | Email delivery | AWS SDK | @aws-sdk/client-sesv2 |
| Cloudflare R2 | File/media storage | S3 API | @aws-sdk/client-s3 |
| Razorpay | Payments, subscriptions, invoices | REST API + Webhooks | razorpay |
| Google Places | Business search (LAIE) | REST API | Custom fetch |
| Google Meet | Video meeting scheduling | OAuth + Calendar API | googleapis |
| Supabase | PostgreSQL hosting | Connection string | Drizzle ORM |

---

## 12. API Cost Model

| Service | Unit | Price | Est. Monthly Volume | Monthly Cost |
|---------|------|-------|--------------------:|-------------:|
| Claude Sonnet 4 | 1M input tokens | $3.00 | 10M tokens | $30 |
| Claude Haiku | 1M input tokens | $0.25 | 50M tokens | $12.50 |
| Google Embeddings | 1M tokens | $0.01 | 5M tokens | $0.05 |
| AWS SES | 1000 emails | $0.10 | 100K emails | $10 |
| Cloudflare R2 | 1M requests | $0.36 | 500K requests | $0.18 |
| Cloudflare R2 | 1 GB storage | $0.015 | 50 GB | $0.75 |
| Supabase Pro | Fixed | $25/mo | — | $25 |
| Render (server) | Fixed | $7-25/mo | — | $25 |
| Render (ErixStore) | Fixed | $7/mo | — | $7 |
| Vercel (frontends) | Fixed | $20/mo | — | $20 |
| **TOTAL** | | | | **~$130/mo** |

At 500 paying users (₹4,000 ARPU = ₹20L/mo = ~$2,400/mo), infrastructure cost is ~5% of revenue. Healthy margin.

---

## 13. Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WhatsApp API rate limits | Medium | High | Queue with tenant fairness, exponential backoff |
| Claude API cost spike | Medium | Medium | Semantic cache, Haiku for cheap ops, budget caps |
| ErixStore single point of failure | Low | Critical | WAL persistence, auto-restart, snapshot restore |
| Supabase connection limits | Medium | Medium | Connection pooling (PgBouncer), query optimization |
| MongoDB → PostgreSQL migration data loss | Low | Critical | Dual-write phase, validation scripts, rollback plan |
| Meta API policy changes | Medium | High | Abstract behind SDK, support multiple providers |
| Razorpay webhook failures | Low | Medium | Retry queue (5 attempts), manual reconciliation UI |

---

## 14. Assumptions Made

- ErixStore handles 10K ops/sec on a single Render instance (validated in load tests)
- Supabase Pro tier supports 500 concurrent connections (sufficient for Year 1)
- Claude Haiku latency is <500ms for classification tasks
- Meta WhatsApp Cloud API remains free for business-reply messages within 24h window
- Drizzle ORM performs comparably to raw SQL for our query patterns
- Single-region deployment (ap-south-1) is acceptable for Year 1 (India-only)
- WebSocket connections scale to 5K concurrent on a single Render instance
