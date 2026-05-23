# ECODrIx — Architecture Documentation

> **AI-Native Business Operating System for Indian SMBs**  
> WhatsApp CRM · AI Agent · Lead Intelligence · Invoicing · Visual Automation

This directory contains the complete architecture specification for ECODrIx. Every document here is a living reference — designed to be fed directly into AI agents (Kiro, Antigravity, Cursor) or read by engineers joining the project.

---

## Document Index

| # | File | Purpose | Read When |
|---|------|---------|-----------|
| — | `KIRO_AGENT_PROMPT.md` | Master architecture brief for AI agents | Starting any new feature with an AI agent |
| — | `IMPLEMENTATION_DETAILS.md` | DB schemas, env variables, API contracts | Setting up dev environment, writing backend code |
| 00 | `prd/00-ARCHITECTURE-BRIEF.md` | One-page product + tech stack summary | Quick orientation, decision reference |
| 01 | `prd/01-PRD.md` | Full Product Requirements Document | Understanding what to build and why |
| 02 | `prd/02-TRD.md` | Technical Requirements Document | Architecture decisions, stack choices, infra setup |
| 03 | `prd/03-UIUX-BRIEF.md` | UI/UX design system and patterns | Building or reviewing any frontend screen |
| 04 | `prd/04-APP-FLOW.md` | Application flow and navigation architecture | Routing, page transitions, module structure |
| 05 | `prd/05-SCHEMA.md` | PostgreSQL schema reference | Database work, migration, ORM queries |
| 06 | `prd/06-ROADMAP.md` | Phased implementation roadmap | Sprint planning, prioritization |
| 07 | `prd/07-VISUAL-ARCHITECTURE.md` | Visual system diagrams | Understanding data flow, component hierarchy |
| 08 | `prd/08-DEVELOPMENT-GUIDE.md` | Developer setup and conventions | Onboarding, environment setup, coding standards |

---

## Product at a Glance

ECODrIx is not a CRM with AI features bolted on. It is an AI-powered business operating system where **AI operates the business and humans supervise**.

| Dimension | Value |
|-----------|-------|
| **Target market** | Indian micro/small businesses · 1–50 employees |
| **Primary channel** | WhatsApp (India's #1 business communication) |
| **Delivery model** | SaaS (self-serve) · Service (managed) · SDK (embedded) |
| **Pricing** | ₹0 – ₹12,299 / month |
| **Complexity** | 9/10 — multi-tenant, AI agent, real-time, visual automation, embeddable SDK |

### Core Modules

```
ECODrIx
├── ERIX          → WhatsApp CRM (inbox, contacts, pipeline, templates, broadcasts)
├── LAIE          → AI lead intelligence (audit, score, outreach kit)
├── Invoice       → Builder + PDF + Razorpay + WhatsApp delivery
├── AI Agent      → Claude-powered auto-respond, qualify, suggest, brief
└── Automation    → Visual N8N-style workflow builder (React Flow)
```

---

## Tech Stack

### Frontend
| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | TailwindCSS + shadcn/ui |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| DnD | @dnd-kit/core |
| Automation UI | React Flow |
| Charts | Recharts |
| Icons | Lucide React |
| API client | `@ecodrix/erix-api` (never raw fetch/axios) |

### Backend
| Layer | Choice |
|-------|--------|
| Runtime | Node.js 18+ · TypeScript |
| Framework | Express 5 + Hono |
| ORM | Drizzle ORM |
| Validation | Zod |
| Cache + Queue | ErixStore (custom — replaces Redis + BullMQ) |
| Real-time | Socket.io |
| AI | Anthropic Claude (Sonnet 4 + Haiku) |
| Email | AWS SES |
| Storage | Cloudflare R2 (S3-compatible) |
| Payments | Razorpay |

### Infrastructure
```
Internet → Vercel (frontends) → API (Render) → PostgreSQL (Supabase)
                                      ↕
                               ErixStore (Render, port 6399)
                                      ↕
                               PostgreSQL (WAL persistence)
```

---

## Codebase Status

| Package | Built | What Exists |
|---------|------:|-------------|
| `ECOD/server` | 85% | Express+Hono, multi-tenant auth, WhatsApp, email, storage, LAIE actors, AI, Socket.io |
| `ECOD/erix-store` | 95% | Cache, Queue, Locks, Pub/Sub, Rate Limit, Anomaly Detection, Semantic Cache, WAL |
| `@ecodrix/erix-api` | 90% | CRM, WhatsApp, email, marketing, meetings, storage, agency, checkout, real-time |
| `@ecodrix/erix-react` | 75% | Dashboard, CRM, WhatsApp inbox, editor, analytics, AI, permissions, i18n, offline |
| `ECOD/admin` | 70% | Client management, CRM, WhatsApp, marketing, monetization, templates |
| `ECOD/saas` | 30% | Basic auth + dashboard shell **(needs full redesign)** |
| `LAIE` | 40% | Actors (Google Maps, LinkedIn, web scraping), Claude outreach generation |

---

## What's Being Built (Priority Order)

| Priority | Feature | Est. Effort |
|----------|---------|-------------|
| **P0** | Console dashboard redesign (`ECOD/saas`) | 2 weeks |
| **P0** | PostgreSQL migration (Client → `ecodrix_organizations`) | 1 week |
| **P0** | ERIX CRM frontend (table + kanban + inbox) | 3 weeks |
| **P0** | Invoice module (builder + PDF + Razorpay + WhatsApp) | 2 weeks |
| **P0** | Billing + Razorpay subscription | 1 week |
| **P1** | LAIE audit frontend (search + progress + results) | 2 weeks |
| **P1** | AI auto-respond (per-org config) | 1 week |
| **P1** | Visual automation builder (React Flow) | 3 weeks |
| **P1** | Dynamic CRM field builder | 2 weeks |
| **P2** | ErixStore dashboard UI | 1 week |
| **P2** | Webhook engine | 1 week |
| **P2** | Developer settings page | 1 week |
| **P2** | Multi-channel inbox (Instagram, email) | 2 weeks |
| **P3** | White-label agency mode | 2 weeks |
| **P3** | Conversational commerce | 3 weeks |
| **P3** | Voice AI | 4 weeks |

**MVP (revenue-ready): ~12 weeks · Full platform: ~24 weeks**

---

## Monorepo Structure

```
ECOD/
├── saas/                    → User-facing console (Next.js 15)
├── admin/                   → Agency management panel (Next.js 16)
├── server/                  → Backend API (Express + Hono)
├── erix-store/              → In-memory engine (cache, queue, locks, pub/sub)
├── packages/
│   ├── erix-api/            → TypeScript SDK (@ecodrix/erix-api)
│   └── erix-react/          → React component SDK (@ecodrix/erix-react)
└── .Architecture/
    ├── README.md            ← You are here
    ├── KIRO_AGENT_PROMPT.md → AI agent master prompt
    ├── IMPLEMENTATION_DETAILS.md → Schemas + env vars
    └── prd/                 → Full specification set (PRD, TRD, UI, Schema, Roadmap)
```

---

## Key Architecture Decisions

### ErixStore replaces Redis + BullMQ
A custom in-memory engine running on port 6399. Provides cache, job queue, pub/sub, distributed locks, rate limiting, semantic cache, and WAL persistence — with zero external dependency on Redis. Built and maintained in-house.

### Strict multi-tenancy via `org_id`
Every CRM table has an `org_id` FK. The `saasAuth` middleware is the single point of tenant resolution. If it doesn't attach `req.orgId`, the request is rejected. Every query must include `org_id` — no exceptions.

### SDK-first API consumption
Frontend never calls the backend directly with `fetch` or `axios`. All API access goes through `@ecodrix/erix-api`. This enforces contract consistency and makes auth header management automatic.

### Claude as AI backbone
Sonnet 4 for complex generation (auto-respond, outreach kits). Haiku for cheap classification and scoring. Semantic cache via ErixStore reduces API calls by ~40%.

---

## Monetization Tiers

| Tier | Price/mo | Key Features |
|------|----------|--------------|
| Free | ₹0 | Basic CRM, 50 contacts, no WhatsApp/AI/invoicing |
| ERIX Starter | ₹2,399 | CRM + WhatsApp · 500 contacts · 1 agent |
| LAIE Starter | ₹2,399 | 100 audits/month only |
| ECODrIx Pro | ₹6,499 | CRM + WhatsApp + LAIE + AI + Invoicing · 5 agents |
| ECODrIx Growth | ₹12,299 | Everything + Infra + Agency · Unlimited |

**Year 1 target:** 500 paying orgs × ₹4,000 ARPU = ₹20L MRR (~₹2.4Cr ARR)

---

## Non-Functional Targets

| Metric | Target |
|--------|--------|
| API response time | < 200ms p95 |
| WhatsApp delivery | < 3s end-to-end |
| Dashboard LCP | < 2s |
| Uptime SLA | 99.9% |
| Concurrent orgs | 10,000+ |
| Messages/org/day | 10,000+ |
| Data residency | India (ap-south-1) |
| Infra cost at 500 users | ~$130/mo (~5% of revenue) |

---

## How to Use These Docs with AI Agents

1. **Starting a new feature:** Paste `KIRO_AGENT_PROMPT.md` as system context, then reference the relevant PRD section.
2. **Backend work:** Reference `IMPLEMENTATION_DETAILS.md` for schemas and `02-TRD.md` for API contracts.
3. **Frontend work:** Reference `03-UIUX-BRIEF.md` for design system and `04-APP-FLOW.md` for routing.
4. **Sprint planning:** Use `06-ROADMAP.md` as the canonical task list.
5. **Schema changes:** Update `05-SCHEMA.md` before writing any migration.

> All docs are plain markdown. No tooling required to read them.
