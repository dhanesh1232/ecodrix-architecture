# ECODrIx — Product Specification

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Active — defines what each module does, for whom, and why.  
**Depends on:** `MARKET_RESEARCH.md`

---

## Table of Contents

1. [Product Philosophy](#1-product-philosophy)
2. [Platform Overview](#2-platform-overview)
3. [Module 1: ERIX CRM](#3-module-1-erix-crm)
4. [Module 2: erix-connect](#4-module-2-erix-connect)
5. [Module 3: LAIE (Lead AI Intelligence Engine)](#5-module-3-laie)
6. [Module 4: erix-flow (Automation)](#6-module-4-erix-flow)
7. [Module 5: erix-storage](#7-module-5-erix-storage)
8. [Module 6: ErixStore (Queue & Cache)](#8-module-6-erixstore)
9. [Module 7: Platform (Auth, Billing, Admin)](#9-module-7-platform)
10. [Module 8: Commerce (Invoicing & Payments)](#10-module-8-commerce)
11. [Module 9: Client Portal](#11-module-9-client-portal)
12. [Module 10: AI Layer](#12-module-10-ai-layer)
13. [Feature Priority Matrix](#13-feature-priority-matrix)
14. [Non-Functional Requirements](#14-non-functional-requirements)

---

## 1. Product Philosophy

### Design Principles

| Principle                             | Meaning                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **WhatsApp-first, not WhatsApp-only** | Every feature assumes the user's primary interaction channel is WhatsApp, but never locks them in |
| **Progressive complexity**            | Day 1: inbox + leads. Month 2: pipeline + automation. Month 6: LAIE + flow builder                |
| **Complete loop**                     | Lead capture → pipeline → won → project → invoice → payment → repeat. No handoffs to other tools  |
| **SMB economics**                     | Never charge per-seat. Usage scales with value delivered                                          |
| **Own your data**                     | Platform-managed by default, bring-your-own-DB for enterprise                                     |

### User Personas

| Persona        | Role                                   | Key need                                   | Feature focus                       |
| -------------- | -------------------------------------- | ------------------------------------------ | ----------------------------------- |
| **Raj**        | Real estate broker, solo               | Don't lose 99acres leads                   | Inbox, auto-capture, pipeline       |
| **Priya**      | Coaching institute owner, 5 staff      | Track admissions, collect fees             | Pipeline, sequences, invoicing      |
| **Dr. Sharma** | Clinic owner, receptionist + 2 doctors | Appointment reminders, patient follow-up   | Appointments, automation, templates |
| **Vikram**     | D2C brand founder, 10-person team      | Broadcast, abandon recovery, support inbox | Campaigns, chatbot, multi-agent     |
| **Meera**      | Digital agency owner, 8 clients        | Manage all clients, resell tools           | Admin, multi-tenant, white-label    |

---

## 2. Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ECODrIx Platform                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ ERIX CRM │  │   LAIE   │  │erix-flow │  │ Commerce │               │
│  │          │  │          │  │          │  │          │               │
│  │ Leads    │  │ Scrape   │  │ Visual   │  │ Invoices │               │
│  │ Pipeline │  │ Enrich   │  │ Builder  │  │ Payments │               │
│  │ Projects │  │ Score    │  │ Triggers │  │ Proposals│               │
│  │ Engage   │  │ Outreach │  │ Actions  │  │ Checkout │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │              │                     │
│  ─────┴──────────────┴──────────────┴──────────────┴─────               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    erix-connect                              │        │
│  │  WhatsApp · Email · Instagram · Facebook · Telegram ·       │        │
│  │  Webchat · Razorpay · Stripe · Google Meet                  │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐          │
│  │ erix-storage │  │  ErixStore   │  │ Platform (Auth/Bill) │          │
│  │ R2 CDN       │  │ Queue/Cache  │  │ Users · Plans · Admin│          │
│  └──────────────┘  └──────────────┘  └──────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module 1: ERIX CRM

### Purpose

The core CRM that manages the entire customer lifecycle from first contact to repeat business.

### Feature Set

#### 3.1 Lead Management

| Feature                 | Description                                                  | Status     | Priority |
| ----------------------- | ------------------------------------------------------------ | ---------- | -------- |
| Lead capture (WhatsApp) | Auto-create lead from inbound WhatsApp message               | ✅ Built   | P0       |
| Lead capture (forms)    | Embeddable web forms → lead creation                         | ✅ Built   | P0       |
| Lead capture (ads)      | Click-to-WhatsApp ad → auto-lead                             | ✅ Built   | P0       |
| Lead import (CSV/Excel) | Bulk import existing contact lists                           | ✅ Built   | P1       |
| Lead assignment         | Round-robin, manual, or rule-based assignment                | ✅ Built   | P0       |
| Lead profile            | Unified view: contact info, conversations, activities, deals | ✅ Built   | P0       |
| Lead scoring            | AI-powered scoring based on engagement + profile signals     | ✅ Built   | P1       |
| Lead segments           | Dynamic segments based on tags, score, behavior              | ✅ Built   | P1       |
| Custom fields           | Add any field to leads (dropdown, text, date, etc.)          | ✅ Built   | P1       |
| Lead deduplication      | Detect and merge duplicate leads                             | 🟡 Partial | P2       |
| Bulk actions            | Mass tag, assign, delete, export                             | ✅ Built   | P1       |

#### 3.2 Pipeline & Deals

| Feature                        | Description                                    | Status   | Priority |
| ------------------------------ | ---------------------------------------------- | -------- | -------- |
| Kanban pipeline view           | Visual drag-and-drop deal stages               | ✅ Built | P0       |
| Multiple pipelines             | Different pipelines per product/team           | ✅ Built | P0       |
| Deal value tracking            | Expected revenue per deal                      | ✅ Built | P0       |
| Win/loss reasons               | Track why deals close or fail                  | ✅ Built | P1       |
| Pipeline analytics             | Conversion rates, velocity, bottlenecks        | ✅ Built | P1       |
| Deal → Project auto-conversion | "Won" deal becomes a project automatically     | ✅ Built | P1       |
| Forecasting                    | Revenue forecast based on pipeline + win rates | 🟡 Basic | P2       |

#### 3.3 Conversations (Unified Inbox)

| Feature                          | Description                                      | Status   | Priority |
| -------------------------------- | ------------------------------------------------ | -------- | -------- |
| WhatsApp conversations           | Send/receive via Meta Cloud API                  | ✅ Built | P0       |
| Email conversations              | Send/receive via SES/Gmail                       | ✅ Built | P0       |
| Instagram DM                     | Receive + reply to DMs                           | ✅ Built | P1       |
| Facebook Messenger               | Receive + reply                                  | ✅ Built | P1       |
| Telegram                         | Bot conversations                                | ✅ Built | P1       |
| Webchat widget                   | Website visitor chat                             | ✅ Built | P1       |
| Multi-agent inbox                | Multiple team members, one inbox                 | ✅ Built | P0       |
| Quick replies / canned responses | Pre-saved response templates                     | ✅ Built | P1       |
| Media support                    | Images, documents, audio, video in conversations | ✅ Built | P0       |
| Conversation assignment          | Assign chats to specific agents                  | ✅ Built | P0       |
| Conversation labels/tags         | Organize by topic, urgency, status               | ✅ Built | P1       |

#### 3.4 Campaigns & Sequences

| Feature                   | Description                                 | Status       | Priority |
| ------------------------- | ------------------------------------------- | ------------ | -------- |
| WhatsApp broadcast        | Send template messages to segments          | ✅ Built     | P0       |
| Email campaigns           | Bulk email with tracking (opens, clicks)    | ✅ Built     | P0       |
| Drip sequences            | Multi-step automated follow-up (WA + email) | ✅ Built     | P0       |
| Sequence enrollment rules | Auto-enroll leads based on events           | ✅ Built     | P1       |
| Exit conditions           | Stop sequence on reply, conversion, etc.    | ✅ Built     | P1       |
| A/B testing               | Test different messages                     | 🔴 Not built | P2       |
| Campaign analytics        | Delivered, read, replied, converted         | ✅ Built     | P1       |

#### 3.5 Automation Rules

| Feature               | Description                                   | Status   | Priority |
| --------------------- | --------------------------------------------- | -------- | -------- |
| Event-triggered rules | "When X happens, do Y"                        | ✅ Built | P0       |
| Conditions/filters    | "Only if lead is tagged 'hot'"                | ✅ Built | P0       |
| Actions               | Send message, assign, tag, move stage, notify | ✅ Built | P0       |
| Custom events         | Define your own trigger events                | ✅ Built | P1       |
| Frequency caps        | Don't over-message (max 1 per day, etc.)      | ✅ Built | P1       |

#### 3.6 Appointments

| Feature                 | Description                               | Status   | Priority |
| ----------------------- | ----------------------------------------- | -------- | -------- |
| Booking page            | Shareable link for appointment scheduling | ✅ Built | P1       |
| Calendar sync (Google)  | Two-way sync with Google Calendar         | ✅ Built | P1       |
| Automated reminders     | WhatsApp reminder before appointment      | ✅ Built | P1       |
| Rescheduling            | One-click reschedule from WhatsApp        | ✅ Built | P2       |
| Google Meet auto-create | Auto-generate Meet link on booking        | ✅ Built | P1       |

#### 3.7 Projects & Delivery

| Feature                      | Description                                 | Status   | Priority |
| ---------------------------- | ------------------------------------------- | -------- | -------- |
| Project creation (from deal) | Won deal → project with tasks               | ✅ Built | P1       |
| Task management              | Create, assign, track project tasks         | ✅ Built | P1       |
| Project templates            | Clone task structure for repeating projects | ✅ Built | P2       |
| Client visibility (portal)   | Client sees their project status            | ✅ Built | P1       |
| Project documents            | Upload/share files per project              | ✅ Built | P1       |

---

## 4. Module 2: erix-connect

### Purpose

The universal integration layer. All external channels, payment gateways, and third-party services connect through this one module.

### Provider Registry

| Provider  | Capability                      | Methods                       | Status  |
| --------- | ------------------------------- | ----------------------------- | ------- |
| WhatsApp  | Messaging (Cloud API)           | Embedded Signup, Manual Token | ✅ Live |
| Email     | Transactional + Marketing       | AWS SES (domain), Gmail OAuth | ✅ Live |
| Instagram | DM conversations                | Manual Token, Embedded Signup | ✅ Live |
| Facebook  | Messenger conversations         | Embedded Signup               | ✅ Live |
| Telegram  | Bot conversations               | Bot Token                     | ✅ Live |
| Google    | Calendar + Meet                 | OAuth                         | ✅ Live |
| Razorpay  | Payment collection (per-tenant) | API Key + Secret              | ✅ Live |
| Stripe    | Payment collection (per-tenant) | API Key + Webhook             | ✅ Live |
| Webchat   | Website widget                  | Domain verification           | ✅ Live |

### Key Capabilities

| Feature                      | Description                                                    | Status |
| ---------------------------- | -------------------------------------------------------------- | ------ |
| Unified send API             | `POST /connect/send/{channel}` — one endpoint for all channels | ✅     |
| Encrypted credential storage | AES-256 per-tenant secrets vault                               | ✅     |
| Webhook ingestion            | Meta, Telegram, SES, Social — all signature-verified           | ✅     |
| Template management          | WhatsApp template CRUD + Meta approval flow                    | ✅     |
| Email templates              | Rich email template builder                                    | ✅     |
| Connect API keys             | External developer access (scoped per capability)              | ✅     |
| Embedded Signup              | 2-minute WhatsApp API activation for tenants                   | ✅     |
| Payment links                | Generate Razorpay/Stripe payment links, send via WhatsApp      | ✅     |
| Payment webhooks             | Auto-mark invoice paid on webhook receipt                      | ✅     |
| Bounce/complaint handling    | SES feedback loop → suppress list                              | ✅     |
| Open/click tracking          | Email pixel + link rewriting                                   | ✅     |
| Unsubscribe (RFC-8058)       | One-click + list-unsubscribe header                            | ✅     |
| Domain verification          | SES domain + DKIM/DMARC setup wizard                           | ✅     |

---

## 5. Module 3: LAIE

### Purpose

Lead AI Intelligence Engine — automated lead discovery, enrichment, and AI-powered outreach generation.

### Feature Set

| Feature                | Description                                               | Status   | Priority |
| ---------------------- | --------------------------------------------------------- | -------- | -------- |
| Web scraping (stealth) | Discover leads from websites, directories, social         | ✅ Built | P1       |
| 22-relay proxy network | Residential proxies via CF Workers + Lambda + GCF         | ✅ Built | P1       |
| Email validation       | Verify deliverability before outreach                     | ✅ Built | P1       |
| WhatsApp validation    | Check if number is on WhatsApp                            | ✅ Built | P1       |
| Data enrichment        | Company info, social profiles, tech stack                 | ✅ Built | P1       |
| AI scoring (composite) | Multi-signal lead scoring (engagement + profile + intent) | ✅ Built | P1       |
| AI outreach generation | Personalized cold outreach via Gemini/Claude              | ✅ Built | P1       |
| Research reports       | AI-generated company research summaries                   | ✅ Built | P2       |
| Competitor analysis    | AI comparison against prospect's alternatives             | ✅ Built | P2       |
| LAIE → CRM export      | Push enriched leads into ERIX CRM pipeline                | ✅ Built | P1       |
| Vault (knowledge base) | Store intelligence for AI reference                       | ✅ Built | P2       |
| Batch processing       | Run enrichment on hundreds of leads                       | ✅ Built | P1       |
| Compliance (DPDP)      | Consent tracking, data minimization                       | ✅ Built | P1       |

### LAIE Pipeline (erix-flow integration)

```
Source → Normalize → Decision Maker → Enrich → Verify →
Competitor Analysis → Score → Intelligence Summary → Deliver → Vault Write
```

---

## 6. Module 4: erix-flow

### Purpose

Visual automation builder — no-code canvas for building event-driven workflows that orchestrate actions across all ECODrIx modules.

### Node Types (29 internal)

| Category          | Nodes                                                                                                                                                           | Description                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Source**        | `source`                                                                                                                                                        | Entry point — trigger from event, schedule, or manual |
| **Enrichment**    | `enrich`, `validate_email`, `validate_wa`                                                                                                                       | Data quality + verification                           |
| **AI**            | `ai_summary`, `ai_painpoints`, `ai_personalize`                                                                                                                 | AI-powered content generation                         |
| **CRM Actions**   | `crm_upsert`, `crm_activity`, `store_artifact`                                                                                                                  | Write to CRM data                                     |
| **Channel Send**  | `email`, `whatsapp`, `instagram`, `facebook`, `telegram`                                                                                                        | Deliver messages                                      |
| **Flow Control**  | `delay`, `before_event`, `condition`, `reply_pause`, `approval`                                                                                                 | Logic + timing                                        |
| **LAIE Pipeline** | `laie_normalize`, `laie_decision_maker`, `laie_enrich`, `laie_verify`, `laie_competitor`, `laie_score`, `laie_deliver`, `laie_vault_write`, `laie_intelligence` | Lead intelligence pipeline                            |

### Key Capabilities

| Feature                    | Description                                                | Status   |
| -------------------------- | ---------------------------------------------------------- | -------- |
| Visual canvas (React Flow) | Drag-and-drop workflow builder                             | ✅ Built |
| Event triggers             | CRM events, custom events, webhooks, schedules             | ✅ Built |
| Condition branching        | If/else logic based on lead data                           | ✅ Built |
| Delay nodes                | Wait X hours/days before next step                         | ✅ Built |
| Approval gates             | Pause flow until human approves                            | ✅ Built |
| Reply-pause                | Wait for recipient to reply before continuing              | ✅ Built |
| Capability gating          | Skip channel nodes if tenant hasn't connected that channel | ✅ Built |
| Per-step analytics         | Records processed, success/fail per node                   | ✅ Built |
| Template seeds             | Pre-built workflow templates for common patterns           | ✅ Built |
| Idempotency                | Don't re-process same record in same run                   | ✅ Built |

---

## 7. Module 5: erix-storage

### Purpose

Managed file and media storage for CRM attachments, project documents, and media campaigns.

### Features

| Feature                     | Description                                          | Status   |
| --------------------------- | ---------------------------------------------------- | -------- |
| File upload (presigned URL) | Direct-to-R2 upload, no server bottleneck            | ✅ Built |
| CDN delivery                | Cloudflare R2 public URLs for fast delivery          | ✅ Built |
| Image transforms            | On-the-fly resize/crop via Cloudflare image services | ✅ Built |
| Per-tenant quota            | Storage limits by plan                               | ✅ Built |
| Bandwidth metering          | Track download bandwidth per org                     | ✅ Built |
| Developer API               | External SDK access via API key                      | ✅ Built |
| Media attachments           | Attach to conversations, projects, leads             | ✅ Built |

---

## 8. Module 6: ErixStore

### Purpose

In-house queue and cache engine — replaces Redis + BullMQ for lower operational cost and per-tenant fairness.

### Capabilities

| Feature                | Description                        | Status  |
| ---------------------- | ---------------------------------- | ------- |
| Job queues             | Reliable async job processing      | ✅ Live |
| Per-tenant fairness    | No single tenant can starve others | ✅ Live |
| WAL-backed persistence | Crash-safe, no data loss           | ✅ Live |
| HTTP + WebSocket API   | Access from any service            | ✅ Live |
| Cache layer            | Key-value with TTL for hot data    | ✅ Live |
| Priority queues        | Urgent jobs process first          | ✅ Live |

### Queue Configuration

| Queue                   | Concurrency | Purpose                                        |
| ----------------------- | ----------- | ---------------------------------------------- |
| `crm`                   | 50          | Lead updates, pipeline moves, activity logging |
| `crm.email_marketing`   | 12          | Bulk email campaign sends                      |
| `automation-events`     | 2           | Automation rule evaluation                     |
| `workflow-executions`   | 1           | Flow engine sequential processing              |
| `ai-respond`            | 5           | AI auto-responder generation                   |
| `laie-scrapers`         | 5           | Web scraping jobs                              |
| `laie-research`         | 5           | AI research report generation                  |
| `laie-enrich`           | 5           | Lead enrichment pipelines                      |
| `laie-scrapers-low-pri` | 2           | Background/bulk scraping                       |

---

## 9. Module 7: Platform

### Purpose

Control plane — authentication, billing, admin panel, feature gating, and organizational management.

### Features

#### 9.1 Authentication & Users

| Feature                                 | Description                                       | Status |
| --------------------------------------- | ------------------------------------------------- | ------ |
| JWT auth (15min access + 30day refresh) | Secure token-based auth                           | ✅     |
| Multi-member organizations              | Invite team members with roles                    | ✅     |
| Role-based access                       | Owner, Admin, Agent, Viewer                       | ✅     |
| Onboarding wizard                       | Guided first-time setup                           | ✅     |
| AI persona engine                       | Adaptive business persona from onboarding answers | ✅     |

#### 9.2 Billing & Subscriptions

| Feature                  | Description                              | Status |
| ------------------------ | ---------------------------------------- | ------ |
| Plan management          | Starter, Growth, Business, Enterprise    | ✅     |
| Razorpay subscriptions   | Recurring billing via Razorpay           | ✅     |
| Entitlements engine      | Feature/quota enforcement per plan       | ✅     |
| Credit system            | Prepaid credits for usage-based features | ✅     |
| Usage metering           | Track messages, leads, storage per org   | ✅     |
| Plan upgrades/downgrades | Self-serve plan changes                  | ✅     |

#### 9.3 Admin Panel

| Feature             | Description                                | Status |
| ------------------- | ------------------------------------------ | ------ |
| Tenant management   | View, edit, suspend tenants                | ✅     |
| Revenue dashboard   | MRR, churn, plan distribution              | ✅     |
| Feature flags       | Toggle features per tenant or globally     | ✅     |
| WhatsApp control    | Monitor message health, template approvals | ✅     |
| LAIE monitoring     | Scraper health, proxy status, job queues   | ✅     |
| Flow monitoring     | Workflow runs, failures, performance       | ✅     |
| Email monitoring    | Deliverability, bounces, complaints        | ✅     |
| API analytics       | Request volume, latency, errors per tenant | ✅     |
| Audit logs          | Full activity trail for compliance         | ✅     |
| Waitlist management | Pre-launch signup management               | ✅     |
| Support tickets     | Internal ticket system for customer issues | ✅     |

---

## 10. Module 8: Commerce

### Purpose

End-to-end revenue collection — from proposal to paid invoice.

### Features

| Feature                   | Description                                   | Status       |
| ------------------------- | --------------------------------------------- | ------------ |
| Invoice generation        | Create professional invoices (GST-compliant)  | ✅ Built     |
| Invoice settings          | Business details, logo, tax config, numbering | ✅ Built     |
| Payment link generation   | Razorpay/Stripe checkout links                | ✅ Built     |
| Send invoice via WhatsApp | One-click invoice delivery on WhatsApp        | ✅ Built     |
| Auto-mark paid            | Webhook triggers → invoice status update      | ✅ Built     |
| Payment reminders         | Automated overdue reminders (WA + email)      | ✅ Built     |
| Proposals                 | Draft → Send → Accept/Reject state machine    | ✅ Built     |
| Proposal → Invoice        | Accepted proposal creates advance invoice     | ✅ Built     |
| Checkout page             | Hosted payment page for clients               | ✅ Built     |
| Recurring invoices        | Monthly billing for subscription services     | 🟡 Partial   |
| Multi-currency            | INR primary, USD/AED/GBP support              | 🟡 Basic     |
| Accounting export         | Tally/Zoho Books compatible export            | 🔴 Not built |

---

## 11. Module 9: Client Portal

### Purpose

External-facing portal where a tenant's clients can track their projects, approve deliverables, and communicate.

### Features

| Feature                    | Description                               | Status       |
| -------------------------- | ----------------------------------------- | ------------ |
| Portal access (token link) | Shareable link for project visibility     | ✅ Built     |
| Credentialed login         | Email + password client accounts          | ✅ Built     |
| Project status view        | Client sees tasks, progress, timeline     | ✅ Built     |
| Document sharing           | Upload/download project files             | ✅ Built     |
| Client ↔ Team messaging    | Dedicated conversation thread per project | ✅ Built     |
| Invoice view + pay         | Client sees invoices, clicks to pay       | ✅ Built     |
| Approval workflow          | Client approves/rejects deliverables      | ✅ Built     |
| Branded (per-tenant)       | Portal carries tenant's branding          | 🟡 Basic     |
| Custom domain              | client.yourdomain.com                     | 🔴 Not built |

---

## 12. Module 10: AI Layer

### Purpose

AI capabilities that enhance every module — not autonomous, but assistive within human-controlled rules.

### Capabilities

| Feature             | Module   | Description                                | Status |
| ------------------- | -------- | ------------------------------------------ | ------ |
| Auto-responder      | CRM      | AI-suggested replies in conversations      | ✅     |
| Lead scoring        | CRM      | Multi-signal composite scoring             | ✅     |
| Outreach generation | LAIE     | Personalized cold messages                 | ✅     |
| Research reports    | LAIE     | Company intelligence summaries             | ✅     |
| Competitor analysis | LAIE     | Position against prospect's alternatives   | ✅     |
| AI summary          | Flow     | Summarize conversation/lead data           | ✅     |
| AI painpoints       | Flow     | Identify customer pain points from data    | ✅     |
| AI personalize      | Flow     | Personalize message content                | ✅     |
| Persona engine      | Platform | Adaptive business persona from onboarding  | ✅     |
| Erix AI copilot     | Platform | In-app AI assistant for platform questions | ✅     |

### AI Models Used

| Model              | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| Gemini (Google)    | Primary generation — outreach, summaries, scoring        |
| Claude (Anthropic) | Complex analysis — research reports, competitor analysis |
| OpenAI GPT         | Fallback generation, embeddings                          |

---

## 13. Feature Priority Matrix

### Legend

- **P0** — Must work perfectly for first 10 users (core loop)
- **P1** — Needed for 50+ users (growth enablers)
- **P2** — Nice-to-have, builds moat (post-PMF)
- **P3** — Future, documented but not scheduled

### The Core Loop (P0 features that must be flawless)

```
1. Sign up (< 2 min)
2. Connect WhatsApp (Embedded Signup, < 3 min)
3. See first inbound message as a lead
4. Reply from inbox
5. Move lead through pipeline stages
6. Mark deal as Won
7. Send invoice with payment link
8. Receive payment notification
```

If this loop works perfectly, we have a product.

### Feature Status Summary

| Status                | Count        | %    |
| --------------------- | ------------ | ---- |
| ✅ Built & working    | ~85 features | ~80% |
| 🟡 Partially built    | ~12 features | ~12% |
| 🔴 Not built (needed) | ~8 features  | ~8%  |

### Critical Gaps (build next)

| #   | Gap                                    | Impact                     | Effort  |
| --- | -------------------------------------- | -------------------------- | ------- |
| 1   | Onboarding wizard completion (< 5 min) | Activation rate            | 1 week  |
| 2   | Mobile-responsive inbox                | Sales teams on phones      | 2 weeks |
| 3   | Tally/accounting export                | Removes objection for CAs  | 1 week  |
| 4   | Recurring invoices (full)              | Subscription businesses    | 1 week  |
| 5   | A/B testing for campaigns              | Growth marketers need this | 2 weeks |
| 6   | Custom domain for portal               | Professional for agencies  | 1 week  |
| 7   | Lead deduplication (smart merge)       | Data hygiene at scale      | 1 week  |
| 8   | Vernacular templates (Hindi)           | Non-English market         | 2 weeks |

---

## 14. Non-Functional Requirements

### Performance

| Metric                     | Target                             |
| -------------------------- | ---------------------------------- |
| API response time (p95)    | < 500ms                            |
| WhatsApp message delivery  | < 3s from trigger to Meta API call |
| Page load (SaaS dashboard) | < 2s (LCP)                         |
| Concurrent users per org   | 25                                 |
| Messages per org per day   | 10,000+                            |

### Security

| Requirement            | Implementation                                    |
| ---------------------- | ------------------------------------------------- |
| Encryption at rest     | AES-256 for credentials, Cloud SQL encryption     |
| Encryption in transit  | TLS 1.3 everywhere                                |
| Multi-tenant isolation | org_id scoping on every query, row-level security |
| Credential storage     | Encrypted vault, never logged, scoped access      |
| DPDP compliance        | Consent capture, data export, right-to-delete     |
| Audit trail            | Full activity log per tenant                      |
| Rate limiting          | Per-tenant, per-endpoint throttling               |

### Reliability

| Metric              | Target                                      |
| ------------------- | ------------------------------------------- |
| Uptime              | 99.5% (excluding planned maintenance)       |
| Data durability     | 99.99% (Cloud SQL + R2 redundancy)          |
| Webhook processing  | At-least-once delivery, idempotent handlers |
| Backup frequency    | Daily automated, 30-day retention           |
| Recovery time (RTO) | < 4 hours                                   |

### Scalability

| Dimension      | Current                     | Target (1,000 tenants)                 |
| -------------- | --------------------------- | -------------------------------------- |
| Database       | Single Cloud SQL instance   | Read replicas + connection pooling     |
| File storage   | Cloudflare R2               | Same (scales natively)                 |
| Job processing | ErixStore (single instance) | Horizontal scaling via worker replicas |
| API server     | Single Cloud Run instance   | Auto-scaling (2-10 instances)          |

---

## Document Governance

| Version | Date     | Change                        |
| ------- | -------- | ----------------------------- |
| 1.0     | Aug 2026 | Initial product specification |

**Cross-references:**

- Market context: `MARKET_RESEARCH.md`
- Customer journey details: `CUSTOMER_JOURNEY_MAP.md`
- Technical deep-dive: `PLATFORM_ARCHITECTURE.md`
- Pricing details: `PRICING_MODEL.md`
