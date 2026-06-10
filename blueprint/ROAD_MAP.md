# ECODrIx Platform — Implementation Roadmap

**Version:** 2.0 | **Date:** June 2026 | **Builder:** Solo Founder (Dhanesh)

---

## 1. Product Development Strategy

ECODrIx is built by a solo founder. Every phase is sized for **one developer + Claude Code**. No feature gets built until the previous phase's core loop is proven with paying customers. Ship fast, charge early, iterate on feedback.

**Core principle:** Revenue beats perfection. A working WhatsApp CRM with 5 paying customers is worth more than a perfect one with zero.

---

## 2. MVP Scope

| Feature                        | In MVP? | Rationale                     | Effort |
| ------------------------------ | ------- | ----------------------------- | ------ |
| ERIX Connect (Embedded Signup) | ✅      | Day 1 value — WABA connection | M      |
| Contact import (CSV)           | ✅      | Core CRM utility              | S      |
| WhatsApp inbox (real-time)     | ✅      | Core value prop               | L      |
| Message templates (send)       | ✅      | Required for broadcasting     | M      |
| Broadcast campaign             | ✅      | First monetizable feature     | M      |
| Contact pipeline (Kanban)      | ✅      | CRM differentiation           | M      |
| LAIE Google Maps scraper       | ✅      | Immediate lead value          | L      |
| LAIE JustDial scraper          | ✅      | India-specific lead source    | M      |
| Export leads to CRM            | ✅      | Closes the loop               | S      |
| Instagram competitor scraper   | Later   | Phase 2                       | L      |
| AI content calendar            | Later   | Phase 2                       | M      |
| IG auto-post                   | Later   | Phase 2                       | M      |
| ERIX-FLOW canvas               | Later   | Phase 3                       | XL     |
| WhatsApp chatbot builder       | Later   | Phase 3                       | L      |
| Razorpay billing               | ✅      | Charge from Day 1             | M      |
| Admin panel                    | ✅      | Founder ops                   | S      |

---

## 3. Phase 1: Foundation (Weeks 1–3)

**Goal:** Deployable platform with auth, DB, and core infrastructure running.

| Task                                                    | Owner   | Priority | Effort |
| ------------------------------------------------------- | ------- | -------- | ------ |
| Next.js 15 console scaffold (App Router + shadcn/ui)    | Founder | P0       | M      |
| Hono API server setup (TypeScript + Zod)                | Founder | P0       | M      |
| Supabase PostgreSQL + Drizzle ORM setup                 | Founder | P0       | S      |
| JWT auth (login + refresh + logout)                     | Founder | P0       | M      |
| @ecodrix/erix-api SDK — auth endpoints                  | Founder | P0       | M      |
| MongoDB per-tenant provisioning on signup               | Founder | P0       | M      |
| ErixStore connection + basic SET/GET/PUSH/POP           | Founder | P0       | S      |
| Razorpay subscription integration (plans + checkout)    | Founder | P0       | M      |
| Organization + member model in PostgreSQL               | Founder | P0       | S      |
| GitHub Actions CI/CD (deploy to GCP Cloud Run + Vercel) | Founder | P1       | S      |

**Phase 1 Deliverable:** Working auth + org system + billing + DB. No features yet — just the skeleton that everything hangs off.

---

## 4. Phase 2: ERIX MVP (Weeks 4–7)

**Goal:** WhatsApp CRM live with paying customers.

| Task                                             | Owner   | Priority | Effort |
| ------------------------------------------------ | ------- | -------- | ------ |
| ERIX Connect — Meta Embedded Signup flow         | Founder | P0       | L      |
| WABA credentials encrypted storage               | Founder | P0       | S      |
| Meta webhook handler (messages + status)         | Founder | P0       | M      |
| WhatsApp inbox UI (WebSocket real-time)          | Founder | P0       | L      |
| Contact management (list, add, import CSV)       | Founder | P0       | M      |
| Message template management (list + send)        | Founder | P0       | M      |
| Broadcast campaign (create + schedule + execute) | Founder | P0       | L      |
| ErixStore rate limiter (WA message throttling)   | Founder | P0       | S      |
| Pipeline Kanban (stages + drag)                  | Founder | P1       | M      |
| Contact tags + segments                          | Founder | P1       | S      |
| Basic analytics (campaign delivery rates)        | Founder | P1       | M      |
| @ecodrix/erix-api SDK — ERIX endpoints           | Founder | P0       | M      |

**Phase 2 Deliverable:** ERIX WhatsApp CRM live. Onboard first 5 paying customers. Collect ₹5,000+ MRR.

---

## 5. Phase 3: LAIE Lead Scraper (Weeks 8–10)

**Goal:** Lead generation engine live. First lead customers paying.

| Task                                          | Owner   | Priority | Effort |
| --------------------------------------------- | ------- | -------- | ------ |
| LAIE scraper worker (GCP Cloud Run)           | Founder | P0       | L      |
| Google Maps scraper (Playwright + patchright) | Founder | P0       | L      |
| JustDial scraper                              | Founder | P0       | M      |
| Proxy manager (GCP Squid + Jio SIM routing)   | Founder | P0       | M      |
| ErixStore job queue (laie:scrape:queue)       | Founder | P0       | S      |
| laie_jobs + laie_leads PostgreSQL tables      | Founder | P0       | S      |
| Leads dashboard UI (table + filters + export) | Founder | P0       | M      |
| Push leads to ERIX CRM (1-click)              | Founder | P0       | S      |
| CSV export                                    | Founder | P0       | S      |
| Lead enrichment via Claude API (scoring)      | Founder | P1       | M      |
| @ecodrix/erix-api SDK — LAIE endpoints        | Founder | P0       | M      |

**Phase 3 Deliverable:** LAIE lead scraper live. First 10 LAIE subscribers. ₹20,000+ LAIE MRR.

---

## 6. Phase 4: LAIE Social Intelligence (Weeks 11–14)

**Goal:** Competitor analysis + AI content calendar + Instagram auto-post live.

| Task                                               | Owner   | Priority | Effort |
| -------------------------------------------------- | ------- | -------- | ------ |
| Instagram competitor scraper (public profiles)     | Founder | P0       | L      |
| laie_competitors + laie_content PostgreSQL tables  | Founder | P0       | S      |
| Competitor analysis dashboard UI                   | Founder | P0       | M      |
| Claude API — content analysis pipeline             | Founder | P0       | M      |
| Claude API — AI caption + hashtag generator        | Founder | P0       | M      |
| Content calendar UI (month grid view)              | Founder | P0       | L      |
| Instagram auto-post (Meta Content Publishing API)  | Founder | P0       | M      |
| ErixStore scheduler (ig:post:queue with delay)     | Founder | P0       | M      |
| IG Comment → Auto DM trigger (Meta webhook)        | Founder | P1       | M      |
| Post performance tracking (likes, comments, reach) | Founder | P1       | M      |

**Phase 4 Deliverable:** LAIE Social live. 30 LAIE subscribers. ₹60,000+ LAIE MRR.

---

## 7. Phase 5: ERIX-FLOW Automation Canvas (Weeks 15–19)

**Goal:** No-code automation canvas live. High-value feature for retention + upsell.

| Task                                              | Owner   | Priority | Effort |
| ------------------------------------------------- | ------- | -------- | ------ |
| React Flow canvas setup (drag + drop)             | Founder | P0       | L      |
| Node library UI (triggers + actions + conditions) | Founder | P0       | L      |
| Flow definition JSON schema + storage             | Founder | P0       | M      |
| Flow execution engine (ErixStore queue worker)    | Founder | P0       | XL     |
| Trigger: WA message received                      | Founder | P0       | M      |
| Trigger: IG comment with keyword                  | Founder | P0       | M      |
| Trigger: Schedule (cron)                          | Founder | P0       | S      |
| Action: Send WhatsApp template                    | Founder | P0       | M      |
| Action: Add/update CRM contact                    | Founder | P0       | S      |
| Action: Post to Instagram                         | Founder | P1       | M      |
| Condition: Delay / wait node                      | Founder | P0       | M      |
| Condition: If/else branch                         | Founder | P0       | M      |
| AI node (Claude API inline)                       | Founder | P1       | M      |
| 10 pre-built flow templates                       | Founder | P1       | M      |
| Flow run history + error logs                     | Founder | P1       | M      |

**Phase 5 Deliverable:** ERIX-FLOW live. 20+ FLOW subscribers. ₹1L+ total SaaS MRR.

---

## 8. Sprint Structure

| Sprint    | Duration   | Focus            | Key Deliverable                       |
| --------- | ---------- | ---------------- | ------------------------------------- |
| Sprint 1  | Week 1–3   | Foundation       | Auth + billing + DB + infra           |
| Sprint 2  | Week 4–5   | ERIX Connect     | WABA + webhook + inbox                |
| Sprint 3  | Week 6–7   | ERIX CRM         | Contacts + broadcast + pipeline       |
| Sprint 4  | Week 8–9   | LAIE Scraper     | Google Maps + JustDial + queue        |
| Sprint 5  | Week 10    | LAIE Polish      | Enrichment + push to CRM + export     |
| Sprint 6  | Week 11–12 | LAIE Social      | IG scraper + analysis + Claude        |
| Sprint 7  | Week 13–14 | Content Calendar | AI generator + auto-post              |
| Sprint 8  | Week 15–16 | FLOW Canvas      | UI + node library + definitions       |
| Sprint 9  | Week 17–19 | FLOW Engine      | Execution engine + triggers + actions |
| Sprint 10 | Week 20+   | Growth           | Analytics + reseller + API            |

---

## 9. Feature Prioritization Matrix

| Feature                        | Business Value | Dev Effort | Priority |
| ------------------------------ | -------------- | ---------- | -------- |
| ERIX Connect (Embedded Signup) | Very High      | Medium     | P0 🔴    |
| WhatsApp Inbox                 | Very High      | High       | P0 🔴    |
| Broadcast Campaign             | Very High      | Medium     | P0 🔴    |
| LAIE Google Maps Scraper       | High           | High       | P0 🔴    |
| AI Content Calendar            | Very High      | Medium     | P0 🔴    |
| IG Auto-Post                   | High           | Medium     | P0 🔴    |
| ERIX-FLOW Canvas               | Very High      | Very High  | P1 🟡    |
| IG Comment → Auto DM           | High           | Medium     | P1 🟡    |
| WhatsApp Chatbot Builder       | Medium         | High       | P2 🟢    |
| LinkedIn Lead Scraper          | Medium         | High       | P2 🟢    |
| Public API                     | Medium         | Medium     | P2 🟢    |
| Mobile App                     | Low            | Very High  | P3 ⚪    |

---

## 10. Folder / Repo Structure

```
ecodrix/
├── apps/
│   ├── console/          → Next.js 15 (SaaS UI)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (console)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── erix/
│   │   │   │   ├── laie/
│   │   │   │   ├── flow/
│   │   │   │   └── billing/
│   │   │   └── layout.tsx
│   │   └── components/
│   └── admin/            → Internal admin panel
├── packages/
│   ├── erix-api/         → @ecodrix/erix-api SDK
│   ├── erix-react/       → @ecodrix/erix-react components
│   └── erix-types/       → Shared TypeScript types
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── erix.ts
│   │   │   ├── laie.ts
│   │   │   ├── flow.ts
│   │   │   └── billing.ts
│   │   ├── workers/
│   │   │   ├── laie-scraper.ts
│   │   │   ├── flow-engine.ts
│   │   │   └── ig-poster.ts
│   │   ├── ai/
│   │   │   └── prompts/
│   │   ├── webhooks/
│   │   │   └── meta.ts
│   │   └── db/
│   │       ├── postgres/   → Drizzle schema
│   │       └── mongo/      → MongoDB models
├── infra/
│   ├── terraform/        → GCP + AWS IaC
│   └── docker/
└── .github/
    └── workflows/        → CI/CD pipelines
```

---

## 11. Environment Setup

| Environment | Stack                                        | URL Pattern                     |
| ----------- | -------------------------------------------- | ------------------------------- |
| Development | Local Next.js + local Hono + local ErixStore | localhost:3000 / localhost:4000 |
| Staging     | Vercel preview + GCP Cloud Run staging       | staging.ecodrix.com             |
| Production  | Vercel + GCP Cloud Run + AWS EC2             | console.ecodrix.com             |

---

## 12. Risk Register

| Risk                                   | Likelihood | Impact   | Mitigation                                                  |
| -------------------------------------- | ---------- | -------- | ----------------------------------------------------------- |
| Meta changes Tech Provider policy      | Low        | Critical | Maintain compliance, renew Aug 2026 on time                 |
| Instagram scraping blocked             | Medium     | High     | Use official Graph API where possible; patchright as backup |
| Solo founder burnout                   | Medium     | Critical | NEVER MISS TWICE discipline; 6h deep work max/day           |
| MongoDB Atlas free tier limit hit      | Medium     | Medium   | Migrate to paid Atlas at 50 tenants (₹2,000/month)          |
| ErixStore EC2 instance down            | Low        | High     | Daily SQLite snapshots to S3; restart script automated      |
| Razorpay subscription webhook failures | Low        | High     | Idempotent webhook handler + 3-retry mechanism              |
| LAIE scraper JustDial blocks           | High       | Medium   | Jio SIM residential proxies; multiple IPs; rate limiting    |
| GCP credits exhausted early            | Low        | Medium   | AWS credits as backup; infra cost <₹5K at scale             |
| First customers churn month 1          | Medium     | High     | DFY onboarding call for first 20 customers personally       |

---

## 13. Complexity and Timeline Estimate

| Phase                 | Scope                             | Complexity | Weeks            |
| --------------------- | --------------------------------- | ---------- | ---------------- |
| Phase 1: Foundation   | Auth + billing + infra            | 6/10       | 3                |
| Phase 2: ERIX MVP     | WhatsApp CRM core                 | 7/10       | 4                |
| Phase 3: LAIE Scraper | Lead generation engine            | 8/10       | 3                |
| Phase 4: LAIE Social  | Competitor + AI content + IG post | 7/10       | 4                |
| Phase 5: ERIX-FLOW    | Automation canvas + engine        | 9/10       | 5                |
| Phase 6: Growth       | Analytics + reseller + API        | 6/10       | 4+               |
| **Total**             |                                   |            | **~19–23 weeks** |

---

## 14. Future Version Roadmap

| Version | Theme                   | Key Features                   | ETA      |
| ------- | ----------------------- | ------------------------------ | -------- |
| v1.0    | WhatsApp CRM + Lead Gen | ERIX + LAIE scraper            | Month 3  |
| v1.5    | Social Intelligence     | LAIE Social + IG auto-post     | Month 5  |
| v2.0    | Automation Canvas       | ERIX-FLOW full canvas          | Month 6  |
| v2.5    | Agency Platform         | Reseller + white-label         | Month 9  |
| v3.0    | AI-First Platform       | LAIE deep intelligence + voice | Month 12 |
| v4.0    | International           | SEA market expansion           | Year 2   |

---

## 15. Assumptions Made

- Solo founder allocates 5–6 focused hours/day to product development
- Claude Code on AWS Bedrock handles 60% of boilerplate code generation
- React Flow library is sufficient for ERIX-FLOW canvas at MVP scale
- Phase deliverables sized as "shippable MVP" not production-perfect
- Services revenue handled in parallel — doesn't consume full developer time
- ErixStore implementation already partially complete (architecture finalized)
- Meta Embedded Signup implementation uses existing Tech Provider credentials
