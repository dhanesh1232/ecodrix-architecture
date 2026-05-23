# ECODrIx — Product Requirements Document (PRD)
**Version:** 1.0 | **Date:** May 2026 | **Author:** ECODrIx Product Team

---

## 1. Product Overview

| Field | Value |
|-------|-------|
| Product Name | ECODrIx |
| Tagline | AI-Native Business Operating System for Indian SMBs |
| Category | WhatsApp-first CRM + AI Automation + Lead Intelligence |
| Target Market | Indian micro/small businesses (1-50 employees) |
| Primary Channel | WhatsApp (India's #1 business communication) |
| Delivery Model | SaaS (self-serve) + Service (managed) + SDK (embedded) |
| Pricing | ₹0 - ₹12,299/month |

ECODrIx is not a CRM with AI features bolted on. It's an AI-powered business operating system where AI OPERATES the business and humans SUPERVISE. Starting with WhatsApp-first CRM, expanding to full customer operations automation including invoicing, lead intelligence, and visual workflow automation.

---

## 2. Problem Statement

**Core Problem:** Indian micro-SMEs waste 10+ hours weekly on manual customer management because enterprise-grade tools (Zoho, HubSpot, Salesforce) are:
- Too expensive (₹15-50k/month)
- Too complex (3-month implementation)
- Email-first (irrelevant — India runs on WhatsApp)
- Not AI-native (human does all the work)

**Secondary Problems:**
- Invoice management wastes 10+ hours/week (Itch Score: 67.5, Frequency: 9/10)
- No tool connects WhatsApp → CRM → Invoice → Payment in one flow
- Existing WhatsApp tools (Interakt, Wati) are messaging-only — no CRM pipeline
- Lead research is manual — no automated intelligence gathering
- Automation tools (Zapier, Make) require separate subscriptions and technical knowledge

> **Critical Pain:** A clinic owner receives 50 WhatsApp inquiries/day. They respond manually, track patients in Excel, send invoices via PDF on WhatsApp, and chase payments by calling. This takes 4-6 hours daily. ECODrIx reduces this to 30 minutes of supervision.

---

## 3. Product Vision

**Year 1:** WhatsApp CRM with AI features — compete with Interakt/Wati on features, win on price + AI.

**Year 2:** AI sales agent that uses WhatsApp — new category. The AI handles 80% of conversations, humans handle 20%.

**Year 3:** Full customer operations platform — compete with Zoho/Freshworks on breadth, win on simplicity + WhatsApp-native + AI.

**Year 5:** Operating system for Indian SMBs — platform play. Others build ON ECODrIx (plugins, integrations, marketplace).

---

## 4. Target Audience & ICP

### Primary ICP (Ideal Customer Profile)

| Attribute | Value |
|-----------|-------|
| Geography | India (Tier 1-3 cities) |
| Business Size | 1-50 employees |
| Revenue | ₹10L - ₹10Cr/year |
| Industry | Healthcare, Real Estate, Education, D2C, Services |
| Tech Savviness | Low-Medium (uses WhatsApp daily, may not use CRM) |
| Current Tools | WhatsApp Business + Excel/Google Sheets |
| Pain Intensity | High (losing leads, slow response, no pipeline visibility) |
| Budget | ₹1,500 - ₹12,000/month |

### User Personas

**Persona 1: Dr. Priya (Clinic Owner)**
- Runs a 3-doctor clinic in Hyderabad
- Gets 40-60 WhatsApp inquiries daily
- Tracks patients in a notebook + WhatsApp starred messages
- Wants: auto-respond to inquiries, appointment reminders, invoice patients
- Willing to pay: ₹3,000-5,000/month

**Persona 2: Rahul (Real Estate Agent)**
- Solo agent handling 200+ leads from 99acres/MagicBricks
- Manages leads in Excel, forgets to follow up
- Wants: pipeline view, auto-follow-up, site visit scheduling
- Willing to pay: ₹2,000-4,000/month

**Persona 3: Sneha (Digital Agency Owner)**
- Manages WhatsApp marketing for 15 clients
- Switches between 15 WhatsApp numbers manually
- Wants: multi-client dashboard, bulk campaigns, reporting per client
- Willing to pay: ₹8,000-15,000/month (agency plan)

**Persona 4: Amit (D2C Brand Founder)**
- Sells via Instagram + WhatsApp
- Takes orders in WhatsApp, tracks in Google Sheets
- Wants: order management, payment collection, abandoned cart recovery
- Willing to pay: ₹3,000-8,000/month

---

## 5. Market Positioning

| Competitor | Category | Pricing | Weakness (vs ECODrIx) |
|-----------|----------|---------|----------------------|
| Interakt | WhatsApp tool | ₹2-10k/mo | No CRM pipeline, no AI, no invoicing |
| Wati | WhatsApp tool | ₹2-8k/mo | No CRM, no automation builder, no intelligence |
| AiSensy | WhatsApp marketing | ₹1-5k/mo | Broadcast-only, no CRM, no AI agent |
| Zoho CRM | Full CRM | ₹15-50k/mo | Email-first, complex, expensive, no WhatsApp-native |
| HubSpot | Full CRM | ₹30-80k/mo | Enterprise-focused, overkill for SMBs |
| Freshsales | CRM + phone | ₹15-40k/mo | Phone-first (not WhatsApp), no AI agent |

**ECODrIx Positioning:** "The only platform that combines WhatsApp CRM + AI Agent + Lead Intelligence + Invoicing + Visual Automation in one tool, built specifically for Indian SMBs at ₹2-12k/month."

---

## 6. Business Goals

| KPI | Metric | Target (Year 1) | Timeframe | Owner |
|-----|--------|-----------------|-----------|-------|
| Revenue | MRR | ₹20,00,000 | 12 months | CEO |
| Users | Paying orgs | 500 | 12 months | Growth |
| Retention | Monthly churn | <5% | Ongoing | Product |
| Activation | Register → first lead | >60% in 24h | Ongoing | Product |
| NPS | Net Promoter Score | >50 | Quarterly | CX |
| Service | Managed clients | 50 | 12 months | Operations |
| ARPU | Avg revenue per user | ₹4,000/mo | 12 months | Finance |

---

## 7. Functional Requirements

| Feature | Priority | MVP? | Notes |
|---------|----------|------|-------|
| User registration + org provisioning | P0 | Yes | Auto-create org + isolated data |
| WhatsApp inbox (split-pane) | P0 | Yes | Real-time, thread list + conversation |
| CRM leads table (sortable, filterable) | P0 | Yes | Custom fields, inline edit |
| Pipeline Kanban board | P0 | Yes | Drag-and-drop, stage management |
| Invoice builder + PDF generation | P0 | Yes | Razorpay payment link + WhatsApp send |
| Billing + subscription (Razorpay) | P0 | Yes | Plan selection, upgrade, usage limits |
| LAIE audit (business intelligence) | P1 | Yes | Search → audit → outreach kit |
| AI auto-respond (WhatsApp) | P1 | Yes | Per-org config, confidence threshold |
| WhatsApp templates + broadcasts | P1 | Yes | Template management, bulk send |
| Basic automation (trigger → action) | P1 | Yes | No visual builder in MVP |
| Dynamic CRM field builder | P1 | No | Custom fields per org |
| Visual automation builder (N8N-style) | P1 | No | React Flow canvas |
| Multi-channel inbox (Instagram, email) | P2 | No | Same conversation model |
| Webhook engine | P2 | No | Event → HTTP delivery + retry |
| White-label agency mode | P2 | No | Custom branding, sub-orgs |
| Embeddable SDK developer page | P2 | No | Install instructions, credentials |
| ErixStore dashboard | P2 | No | Queue inspector, metrics |
| Conversational commerce | P3 | No | WhatsApp storefront |
| Voice AI | P3 | No | AI phone agent |
| Offline mobile app | P3 | No | PWA for field sales |

---

## 8. Non-Functional Requirements

| Category | Requirement | Target Metric |
|----------|-------------|---------------|
| Performance | API response time | <200ms p95 |
| Performance | WhatsApp message delivery | <3s end-to-end |
| Performance | Dashboard load time | <2s (LCP) |
| Availability | Uptime SLA | 99.9% |
| Scalability | Concurrent orgs | 10,000+ |
| Scalability | Messages per org/day | 10,000+ |
| Security | Data encryption | AES-256 at rest, TLS 1.3 in transit |
| Security | Auth | JWT (15min) + refresh (30d) + API keys |
| Security | Tenant isolation | org_id on every row, validated in middleware |
| Compliance | Data residency | India (ap-south-1) |
| Compliance | GDPR | Data export + purge endpoints |
| Reliability | Message delivery | Zero message loss (ErixStore WAL) |
| Reliability | Invoice payments | Webhook retry (5 attempts) |

---

## 9. Core Features (Detailed)

### 9.1 Console Dashboard (Cloud Console Pattern)
The main hub — like AWS Console. No sidebar. Product cards + infra services + activity feed + usage meters. Each product (ERIX, LAIE) opens its own full-screen module with its own navigation.

### 9.2 ERIX CRM Module
Full WhatsApp-first CRM with:
- Split-pane inbox (thread list + conversation view)
- Contacts table with custom fields, filters, bulk actions
- Pipeline Kanban with drag-and-drop
- Templates management with variable preview
- Broadcasts with audience targeting
- Automation rules (trigger → condition → action)

### 9.3 Invoice Module
Built INTO the CRM pipeline:
- Invoice builder with line items, tax (GST), discounts
- PDF generation (React-PDF)
- Razorpay payment link auto-creation
- Send via WhatsApp (one click)
- Payment webhook → auto-mark paid
- Recurring invoices (monthly/quarterly/yearly)
- Revenue dashboard (this month, outstanding, overdue)

### 9.4 LAIE Intelligence Module
AI-powered business audit:
- Search any business by name + city
- 60-second audit (website, Google, social, LinkedIn)
- Score card with radial charts
- AI-generated outreach kit (WhatsApp hook, email sequence, LinkedIn DM)
- Push audited leads to ERIX CRM
- Batch audit processing

### 9.5 AI Agent (Per-Organization)
Claude-powered assistant that:
- Auto-responds to WhatsApp messages (configurable confidence threshold)
- Qualifies leads via conversation
- Suggests smart replies (3 options)
- Generates follow-up messages
- Summarizes conversations
- Provides daily morning briefing
- Coaches sales team (post-conversation feedback)

### 9.6 Visual Automation Builder
N8N-style drag-and-drop workflow canvas:
- Trigger nodes: message received, lead created, stage changed, scheduled, webhook
- Condition nodes: if/else, switch, filter, wait-until
- Action nodes: send WhatsApp, send email, move stage, assign agent, AI respond, HTTP request, generate invoice, calculate score
- Execution engine via ErixStore workers
- Execution history with node-level logs
- Pre-built workflow templates

---

## 10. Monetization Strategy

| Tier | Price/mo | Features | Limits |
|------|----------|----------|--------|
| Free | ₹0 | Basic CRM, 50 contacts | No WhatsApp, no AI, no invoicing |
| ERIX Starter | ₹2,399 ($29) | CRM + WhatsApp | 500 contacts, 1 agent |
| LAIE Starter | ₹2,399 ($29) | LAIE audits only | 100 audits/month |
| ECODrIx Pro | ₹6,499 ($79) | CRM + WhatsApp + LAIE + AI + Invoicing | Unlimited contacts, 5 agents, 500 audits |
| ECODrIx Growth | ₹12,299 ($149) | Everything + Infra + Agency | Unlimited everything |

**Service channel pricing:**
- Setup fee: ₹5,000 - ₹25,000 (one-time, covers configuration)
- Monthly: ₹1,500 - ₹5,000 (discounted vs direct, because setup fee covers CAC)

**Revenue targets:**
- 50 service clients × ₹3,000/mo = ₹1.5L/mo + ₹5L setup fees
- 500 direct users × ₹4,000/mo ARPU = ₹20L/mo
- Combined Year 1 target: ₹2.4Cr ARR

---

## 11. Go-To-Market Strategy

**Acquisition Channels:**
1. **WhatsApp groups** — Join 50+ industry WhatsApp groups (clinics, real estate, coaching), provide value, soft-pitch
2. **YouTube content** — "How to automate your clinic's WhatsApp" tutorials
3. **LinkedIn outreach** — Target digital agency owners (they become agency partners)
4. **Google Ads** — "WhatsApp CRM India", "WhatsApp automation tool"
5. **Referral program** — ₹500 credit per referred paying user
6. **Product Hunt launch** — For developer/SDK audience
7. **Freelancing platforms** — Offer WhatsApp setup as a service, convert to SaaS

**Launch Week Sequence:**
- Week 1: Closed beta (20 service clients you already manage)
- Week 2: Open beta (waitlist converts, 100 spots)
- Week 3: Product Hunt launch + LinkedIn content blitz
- Week 4: Google Ads + YouTube content starts
- Week 5-8: Iterate based on feedback, fix top 5 issues
- Week 9-12: Agency partner program launch

**First 100 Users Plan:**
- 20 from existing service clients (already using via admin)
- 30 from waitlist (already collecting)
- 20 from WhatsApp group outreach
- 15 from LinkedIn DMs to agency owners
- 15 from Google Ads (WhatsApp CRM keywords)

---

## 12. User Stories

**US-1: As a clinic owner, I want to auto-respond to patient inquiries on WhatsApp so that no inquiry goes unanswered even at night.**
- Acceptance: AI responds within 30 seconds with contextual message
- Acceptance: I can review AI responses next morning
- Acceptance: I can set custom instructions ("always ask about insurance")

**US-2: As a real estate agent, I want to see all my leads in a pipeline view so that I know which deals to focus on today.**
- Acceptance: Kanban board with drag-and-drop between stages
- Acceptance: Cards show lead name, phone, last activity, deal value
- Acceptance: I can filter by source (99acres, MagicBricks, direct)

**US-3: As a D2C brand owner, I want to send an invoice via WhatsApp and collect payment without leaving the CRM.**
- Acceptance: One-click invoice generation from a won deal
- Acceptance: Razorpay payment link embedded in WhatsApp message
- Acceptance: Auto-notification when payment is received

**US-4: As a digital agency, I want to manage 15 clients from one dashboard so that I don't switch between accounts.**
- Acceptance: Client switcher in the admin panel
- Acceptance: Each client's data is completely isolated
- Acceptance: I can see aggregate stats across all clients

**US-5: As a coaching institute, I want to automatically follow up with leads who haven't responded in 3 days.**
- Acceptance: Automation triggers after 3 days of no reply
- Acceptance: AI generates personalized follow-up based on last conversation
- Acceptance: I can see which automations fired and their results

---

## 13. Platform Scope

| Dimension | Scope |
|-----------|-------|
| Platforms | Web (desktop + mobile responsive) |
| Mobile App | PWA (Phase 5) — not native initially |
| API | REST (via @ecodrix/erix-api SDK) |
| Embeddable | @ecodrix/erix-react (React components) |
| Regions | India (primary), Global (future) |
| Languages | English (primary), Hindi (Phase 5) |
| Currencies | INR (primary), USD (for global pricing page) |

---

## 14. Security Requirements

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- API keys are hashed (bcrypt) — never stored in plaintext
- External DB URIs encrypted with AES-256 before storage
- Rate limiting on all public endpoints (ErixStore sliding window)
- CORS restricted to registered origins per org
- Webhook signatures verified via HMAC-SHA256
- Session tokens: JWT (15min) + httpOnly refresh cookie (30d)
- Admin access requires x-core-api-key (not exposed to users)

> **Critical:** Every database query MUST include `org_id` filter. No exceptions. This is the tenant isolation boundary.

---

## 15. Scalability Goals

| Metric | Year 1 Target | Year 3 Target |
|--------|---------------|---------------|
| Organizations | 500 | 10,000 |
| Total leads (all orgs) | 500,000 | 50,000,000 |
| Messages/day (all orgs) | 100,000 | 10,000,000 |
| Concurrent WebSocket connections | 5,000 | 100,000 |
| ErixStore throughput | 10,000 ops/sec | 100,000 ops/sec |
| API requests/sec | 1,000 | 50,000 |

---

## 16. Assumptions Made

- WhatsApp remains the dominant business communication channel in India through 2028
- Meta Cloud API pricing remains accessible for SMBs (currently free for business-initiated within 24h)
- Indian SMBs are willing to pay ₹2-12k/month for tools that demonstrably save time
- Claude API costs will decrease over time (currently ~$3/1M input tokens for Haiku)
- Razorpay remains the preferred payment gateway for Indian businesses
- The service channel (freelancing) will provide enough training data to make AI significantly better than competitors within 12 months
- ErixStore can handle the load without Redis — single-threaded model scales vertically to 100K ops/sec
- Supabase free/pro tier is sufficient for Year 1 (upgrade to dedicated when >1000 orgs)
