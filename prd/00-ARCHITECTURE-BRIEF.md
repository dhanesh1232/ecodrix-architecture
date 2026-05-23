# ECODrIx — Architecture Decision Brief

```
PRODUCT:          ECODrIx — AI-Native Business Operating System for Indian SMBs
BUILD MODE:       AI-Native + Platform-API (Complexity 9/10)
COMPLEXITY:       9/10 — Multi-tenant, AI agent, real-time, visual automation,
                  embeddable SDK, invoicing, multi-channel, marketplace elements

DOCS TO GENERATE:
  01-PRD.md              Product Requirements Document
  02-TRD.md              Technical Requirements Document
  03-UIUX-BRIEF.md       UI/UX Design Brief
  04-APP-FLOW.md          App Flow Architecture
  05-SCHEMA.md            Backend Schema Documentation
  06-ROADMAP.md           Implementation Roadmap

TECH STACK (ECODrIx defaults):
  Frontend:    Next.js 15 (App Router) + TailwindCSS + shadcn/ui + TanStack Query + Zustand
  Backend:     Node.js + TypeScript (Express 5 + Hono) + Zod + Drizzle ORM
  Database:    PostgreSQL (Supabase) primary + MongoDB (per-tenant external DBs)
  Cache/Queue: ErixStore (custom — replaces Redis + BullMQ)
  Storage:     Cloudflare R2 via @aws-sdk/client-s3
  Email:       AWS SES
  WhatsApp:    Meta Cloud API via @ecodrix/erix-api
  Auth:        NextAuth v5 (JWT) + API key auth (x-api-key + x-client-code)
  AI/LLM:      Anthropic Claude (Sonnet 4 + Haiku) + Google Embeddings
  Payments:    Razorpay (India)
  Packages:    @ecodrix/erix-api (SDK), @ecodrix/erix-react (embeddable UI),
               @ecodrix/erix-client (ErixStore client), @ecodrix/erix-worker (job processor)
  Infra:       Render (backend + ErixStore) + Vercel (frontends) + Supabase (DB)

KEY ASSUMPTIONS:
  1. WhatsApp is the #1 business communication channel in India (not email)
  2. Indian SMBs will pay ₹2-12k/mo for a tool that saves 10+ hours/week
  3. Service channel (freelancing) provides training data for AI that direct users benefit from
  4. ErixStore eliminates Redis/BullMQ dependency — single infrastructure service
  5. Embeddable SDK (@ecodrix/erix-react) creates network effect and developer lock-in
```

---

## Existing Codebase Status

| Package | Built % | What Exists |
|---------|---------|-------------|
| ECOD/server | 85% | Express+Hono, multi-tenant auth, WhatsApp, email, storage, LAIE actors, AI, Socket.io |
| ECOD/erix-store | 95% | Cache, Queue, Locks, Pub/Sub, Rate Limit, Anomaly Detection, Semantic Cache, WAL persistence |
| @ecodrix/erix-api | 90% | CRM, WhatsApp, email, marketing, meetings, storage, agency, checkout, real-time |
| @ecodrix/erix-react | 75% | Dashboard, CRM, WhatsApp inbox, editor, analytics, AI, permissions, i18n, offline |
| ECOD/admin | 70% | Client management, CRM, WhatsApp, marketing, monetization, templates |
| ECOD/saas | 30% | Basic auth + dashboard shell (needs full redesign) |
| LAIE | 40% | Actors (Google Maps, LinkedIn, web scraping), Claude outreach generation |

## What Needs to Be Built (Priority)

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Console dashboard redesign (ECOD/saas) | 2 weeks |
| P0 | PostgreSQL migration (Client → ecodrix_organizations) | 1 week |
| P0 | ERIX CRM frontend (table + kanban + inbox) | 3 weeks |
| P0 | Invoice module (builder + PDF + Razorpay + WhatsApp) | 2 weeks |
| P0 | Billing + Razorpay subscription | 1 week |
| P1 | LAIE audit frontend (search + progress + results) | 2 weeks |
| P1 | AI auto-respond (per-org config) | 1 week |
| P1 | Visual automation builder (React Flow) | 3 weeks |
| P1 | Dynamic CRM field builder | 2 weeks |
| P2 | ErixStore dashboard UI | 1 week |
| P2 | Webhook engine | 1 week |
| P2 | Developer settings page | 1 week |
| P2 | Multi-channel inbox (Instagram, email) | 2 weeks |
| P3 | White-label agency mode | 2 weeks |
| P3 | Conversational commerce | 3 weeks |
| P3 | Voice AI | 4 weeks |
