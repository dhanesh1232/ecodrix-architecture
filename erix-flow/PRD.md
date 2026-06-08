# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## Product Requirements Document

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Problem Statement](#problem-statement)
3. [Product Vision](#product-vision)
4. [Target Audience and ICP](#target-audience-and-icp)
5. [User Personas](#user-personas)
6. [Market Positioning](#market-positioning)
7. [Business Goals](#business-goals)
8. [Functional Requirements](#functional-requirements)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [Core Features](#core-features)
11. [Secondary Features](#secondary-features)
12. [Monetization Strategy](#monetization-strategy)
13. [Go-To-Market Strategy](#go-to-market-strategy)
14. [User Stories](#user-stories)
15. [Use Cases](#use-cases)
16. [Platform Scope](#platform-scope)
17. [Security Requirements](#security-requirements)
18. [Compliance Considerations](#compliance-considerations)
19. [Scalability Goals](#scalability-goals)
20. [Future Expansion](#future-expansion)
21. [Assumptions Made](#assumptions-made)

---

## Product Overview

_ERIX-FLOW is the automation orchestration module within the ECODrIx SaaS console. It provides a visual, drag-and-drop canvas for building end-to-end business workflows that span every ECODrIx module._

| Key                 | Value                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Product Name        | ERIX-FLOW                                                                   |
| Module Type         | ECODrIx Console Module (within existing SaaS platform)                      |
| Primary Interface   | Visual node-based automation canvas                                         |
| Target Users        | SMB owners, digital agency operators, sales teams across India              |
| Core Value          | Replace Clay + n8n + Zapier + Apollo + WATI with one native canvas          |
| Module Code         | ERIX-FLOW                                                                   |
| Console Integration | Accessible from ECODrIx Console Hub as top-level module                     |
| Pricing Model       | Credits-based (prepaid) + monthly subscription floor (Starter/Growth/Scale) |

ERIX-FLOW unifies all five ECODrIx modules — ERIX-CRM, ERIX-LAIE, ErixStore, ErixStorage, and ErixSender — into a single no-code automation surface. Users build workflows by connecting trigger nodes, action nodes, and AI nodes on a canvas. A workflow can scrape leads from Google Maps via LAIE, enrich them with AI pain-point analysis, validate phone numbers and emails, store contacts in the CRM, and fire WhatsApp and email outreach — all without writing a single line of code.

The module is positioned as the connective tissue of the ECODrIx platform: every module gains compound value when ERIX-FLOW links them together.

---

## Problem Statement

Indian SMBs and digital agencies currently piece together 5 to 8 separate tools to run a lead generation and outreach pipeline. They pay for Apollo or JustDial scraping, a separate enrichment tool like Clay, a WhatsApp API provider like WATI, an email platform, and a CRM. Each handoff is manual: export CSV from source, import into next tool, re-map fields, handle failures manually. The fragmentation costs money, wastes 3 to 5 hours per campaign, and introduces data loss at every boundary.

> **CRITICAL PAIN POINT:** A typical Hyderabad agency running 3 outreach campaigns/month spends ~Rs 12,000/month across fragmented tools (Apollo Rs 4,000 + Clay Rs 6,000 + WATI Rs 2,000) and loses 40% of leads to manual errors. ERIX-FLOW eliminates this entire stack at Rs 4,999/month on the Growth plan.

- No single tool covers scraping + enrichment + CRM + WhatsApp + email in one canvas
- Clay and n8n require technical setup; Indian SMBs have no developer resources
- Apollo and Hunter do not scrape Indian-native sources (JustDial, Sulekha, IndiaMART)
- WATI and AiSensy handle only WhatsApp — no lead generation, no enrichment
- Data handoff between tools causes field mapping errors and duplicate contacts
- No tool offers pain-point AI analysis tailored to Indian business context

---

## Product Vision

ERIX-FLOW becomes the automation brain of ECODrIx — the layer that makes every other module exponentially more powerful. The vision is a world where an SMB owner in Vijayawada can wake up, open ECODrIx, and find 50 pre-enriched, pre-validated leads already queued for WhatsApp outreach, their pain points summarised by AI, ready to convert — with zero manual intervention.

In the medium term, ERIX-FLOW evolves into a marketplace where pre-built workflow templates (Lead Gen for Real Estate, E-commerce Recovery, B2B SaaS Outreach) can be one-click activated. In the long term, AI agents autonomously optimize and rewrite workflows based on conversion data from ERIX-CRM.

---

## Target Audience and ICP

ERIX-FLOW targets the same pan-India SMB and agency segment as ECODrIx, but specifically addresses users who run any form of outbound sales, lead generation, or marketing automation. The module unlocks the most value for users who currently manage multi-step campaigns manually.

| Key           | Value                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Geography     | Pan-India (Tier 1: Mumbai, Delhi, Bangalore; Tier 2: Hyderabad, Pune, Ahmedabad, Chennai, Jaipur)     |
| Business Type | Digital agencies, real estate firms, EdTech startups, healthcare clinics, B2B SaaS, e-commerce brands |
| Team Size     | 1 to 50 employees (solo founder to small agency)                                                      |
| Tech Comfort  | Non-technical to semi-technical; can use Canva and Google Sheets                                      |
| Current Stack | Juggling 3 to 8 tools; pays Rs 5,000 to Rs 20,000/month across fragmented services                    |
| Primary Pain  | Manual CSV export-import between tools; paying for 5 tools that don't talk to each other              |

- Persona A — Agency Owner: Runs 3 to 10 client campaigns/month, needs hands-off automation, will pay for results
- Persona B — Solo Founder / Consultant: Building outbound pipeline, no team, needs zero-code tools
- Persona C — Sales Manager at SMB: Has a team of 2 to 5 sales reps, needs CRM-connected outreach flows
- Persona D — Growth Hacker at D2C Brand: Needs lead gen + retargeting automation via WhatsApp

---

## User Personas

### Persona A: Ravi — Digital Agency Owner, Hyderabad

| Key            | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Age            | 32                                                                          |
| Business       | Full-service digital agency with 8 staff, 15 active clients                 |
| Goal           | Automate client lead generation so team focuses on delivery, not data entry |
| Current Tools  | JustDial manual scrape + Excel + WATI + Gmail                               |
| Frustration    | Spends 2 hours/day cleaning CSV files before importing to WATI              |
| Trigger to Buy | Demo showing JustDial scrape to WhatsApp outreach in under 5 minutes        |

### Persona B: Priya — EdTech Founder, Bangalore

| Key            | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Age            | 27                                                                    |
| Business       | Online coaching platform, solo founder, 200 active students           |
| Goal           | Build automated nurture sequences for trial users who did not convert |
| Current Tools  | Razorpay + Google Forms + manual WhatsApp messages                    |
| Frustration    | No time to follow up with every lead; loses 60% to lack of follow-up  |
| Trigger to Buy | Template: EdTech Trial-to-Paid Conversion Flow                        |

---

## Market Positioning

ERIX-FLOW occupies a unique position: the only no-code automation canvas built natively for Indian-market lead sources and WhatsApp-first outreach. All competitors either focus on global data (Apollo, Hunter) or automation only (n8n, Make) without built-in Indian scraping or WhatsApp compliance.

| Competitor   | What They Do                         | What They Lack                                    | ERIX-FLOW Advantage                          |
| ------------ | ------------------------------------ | ------------------------------------------------- | -------------------------------------------- |
| Clay         | Lead enrichment + outreach sequences | No Indian sources, no WhatsApp, Rs 50,000/month   | India-native scraping, WhatsApp, 10x cheaper |
| n8n          | No-code workflow automation          | No lead data, no CRM, requires self-hosting       | Built-in lead gen, CRM, zero infra setup     |
| Apollo.io    | B2B contact database + sequences     | US-focused data, no JustDial/Sulekha, no WhatsApp | Indian SMB data sources, WhatsApp outreach   |
| WATI         | WhatsApp Business automation         | No lead gen, no enrichment, no email              | Full pipeline from scrape to WhatsApp        |
| Instantly.ai | Cold email outreach                  | Email only, no Indian lead sources, no WhatsApp   | Multi-channel: email + WhatsApp native       |
| Zapier       | App connection automation            | No built-in data, expensive per-zap pricing       | All-in-one with owned data, credit model     |

---

## Business Goals

1. Ship ERIX-FLOW MVP (canvas + 5 node types + LAIE integration) within 8 weeks of kickoff
2. Drive 30% of ECODrIx paying users to activate ERIX-FLOW within 60 days of launch
3. Increase average revenue per user (ARPU) by Rs 1,500/month via FLOW credit consumption
4. Establish 10 pre-built workflow templates in the template marketplace by Week 12
5. Achieve 50+ active FLOW tenants by end of Month 3

| KPI                                                    | Target                            | Timeframe           | Owner            |
| ------------------------------------------------------ | --------------------------------- | ------------------- | ---------------- |
| FLOW module activation rate                            | 30% of all paying tenants         | 60 days post-launch | Dhanesh / Growth |
| Avg credits consumed per FLOW workflow run             | 50 credits per full pipeline run  | Week 4 post-launch  | Product          |
| Template marketplace installs                          | 200 total installs                | Month 3             | Product          |
| Canvas workflow completion rate (user creates + saves) | 60% of users who open canvas      | Month 1             | UX               |
| Outreach delivery success rate                         | 98% WhatsApp + 95% email delivery | Ongoing             | Engineering      |
| Support tickets related to FLOW confusion              | Under 5% of active users/month    | Ongoing             | Support          |

---

## Functional Requirements

| Feature                                                  | Priority | MVP? | Notes                                        |
| -------------------------------------------------------- | -------- | ---- | -------------------------------------------- |
| Drag-and-drop node canvas (React Flow based)             | P0       | Yes  | Pan, zoom, snap-to-grid, undo/redo           |
| Trigger nodes: Manual, Scheduled, Webhook                | P0       | Yes  | Cron via ErixStore scheduler                 |
| LAIE scraper node (Google Maps, JustDial, Sulekha)       | P0       | Yes  | Uses existing LAIE scraper service           |
| Lead enrichment node (AI pain-point analysis via Claude) | P0       | Yes  | Gemini/Claude API call per lead              |
| Email validation node (Hunter.io / LAIE-NET)             | P0       | Yes  | MX record + disposable check                 |
| WhatsApp validation node (Meta API phone check)          | P0       | Yes  | Check if number is on WhatsApp               |
| WhatsApp outreach node (ErixSender + Meta Cloud API)     | P0       | Yes  | Template-based, variable injection           |
| Email outreach node (ErixSender + AWS SES)               | P0       | Yes  | Template designer integration                |
| CRM push node (write to ERIX-CRM)                        | P0       | Yes  | Create/update contact + custom fields        |
| Condition/branch node (if/else logic)                    | P0       | Yes  | Based on field values or enrichment output   |
| Delay/wait node                                          | P1       | Yes  | Wait N minutes/hours between steps           |
| Storage node (ErixStorage file upload/retrieve)          | P1       | No   | Phase 2                                      |
| AI agent node (multi-step reasoning with Claude)         | P1       | No   | Phase 2 — agentic loops                      |
| Workflow template marketplace                            | P1       | No   | Phase 2                                      |
| Run history + log viewer                                 | P0       | Yes  | Per-run execution trace with status per node |
| Real-time run progress indicator on canvas               | P1       | Yes  | Node glow / status badge during live run     |
| Workflow versioning                                      | P2       | No   | Phase 3                                      |
| Sub-workflow (call another flow as node)                 | P2       | No   | Phase 3                                      |
| Webhook output node (POST to external URL)               | P1       | No   | Phase 2                                      |

---

## Non-Functional Requirements

| Category      | Requirement                                  | Target Metric                                            |
| ------------- | -------------------------------------------- | -------------------------------------------------------- |
| Performance   | Canvas load time (workflow with 20 nodes)    | Under 1.5 seconds                                        |
| Performance   | Node execution handoff latency               | Under 200ms per node transition                          |
| Throughput    | Concurrent workflow runs per tenant          | Up to 10 parallel runs on Growth plan                    |
| Throughput    | Leads processed per run (scrape to outreach) | Up to 500 leads per workflow run on Growth               |
| Reliability   | Workflow execution success rate              | 99.5% uptime for job queue (ErixStore)                   |
| Security      | Tenant data isolation                        | Row-level isolation; no cross-tenant node access         |
| Security      | API keys stored in workflow config           | AES-256 encrypted at rest in PostgreSQL                  |
| Scalability   | Concurrent tenants running workflows         | 100+ tenants with no queue degradation                   |
| Observability | Failed node alert delivery                   | Within 30 seconds of failure via in-console notification |
| Compliance    | WhatsApp template compliance                 | All outreach nodes enforce Meta-approved templates only  |

---

## Core Features

### 1. Visual Automation Canvas

A React Flow-powered drag-and-drop canvas where users place, connect, and configure nodes. The canvas supports pan and zoom, mini-map navigation, undo/redo (Ctrl+Z), and snap-to-grid alignment. Nodes connect via directed edges representing data flow.

- Node library sidebar: categorised by Triggers, Data, AI, Outreach, Logic, Storage
- Right-click context menu on canvas for quick node insert
- Node configuration panel slides in on click (no modal, persistent right panel)
- Edge labels show data type passing between nodes (leads array, string, boolean)
- Save workflow as draft or publish (live/paused toggle)

### 2. LAIE Lead Generation Nodes

Native integration with ERIX-LAIE scrapers. Users configure source (Google Maps, JustDial, Sulekha, IndiaMART), search query, city, and lead count. The node returns a structured lead array with name, phone, email, address, category, and website.

- Supports up to 500 leads per scrape node per run on Growth plan
- Proxy rotation handled internally by LAIE-NET — zero config for user
- Output preview: first 5 leads shown in node tooltip on hover
- Scrape status badges: Queued, Running, Done, Failed with lead count

### 3. AI Enrichment Node (Claude-powered)

Each lead is passed through an AI enrichment node that calls Claude API. The node analyses the business name, category, website, and location to generate: top 3 pain points, recommended offer angle, outreach tone, and a personalised first-line opener for WhatsApp and email.

- Enrichment output stored as structured JSON in lead record in ERIX-CRM
- Pain points displayed in enrichment table view (LAIE dashboard)
- Users can override AI enrichment per lead in CRM
- Consumes 2 credits per lead enriched (configurable by plan)

### 4. Validation Nodes (Email + WhatsApp)

- Email validation: MX record lookup, disposable domain check, SMTP ping via LAIE-NET
- WhatsApp validation: Meta Cloud API phone lookup to confirm WA-registered number
- Validation results appended to lead record: is_email_valid (boolean), is_wa_valid (boolean)
- Branch node can route valid leads to outreach and invalid leads to a secondary email-only flow

### 5. Outreach Nodes (WhatsApp + Email)

- WhatsApp node: select Meta-approved template, map lead fields to variables, send via ErixSender
- Email node: select ErixSender template (GrapesJS-designed), inject AI-generated opener as personalisation variable
- Batch sending: respects Meta rate limits and SES sending quotas automatically
- Outreach results (delivered, read, bounced) written back to ERIX-CRM contact timeline

### 6. Run History and Execution Logs

- Every workflow run logged with start time, end time, node-by-node status, lead counts at each stage
- Expandable log drawer per run: see exact data passed into and out of each node
- Failed nodes highlighted in red on canvas with error message tooltip
- Re-run from failed node: skip completed nodes, restart from point of failure

---

## Secondary Features

- Workflow template marketplace: browse, preview, install community or ECODrIx-official templates
- Storage node: upload generated reports or lead exports to ErixStorage (Cloudflare R2)
- Sub-workflow node: call another saved workflow as a reusable action block
- Webhook trigger: receive external data (Razorpay payment, Typeform submission) to start a flow
- Webhook output: POST enriched lead data to any external CRM or Slack channel
- AI agent node: multi-step autonomous reasoning loop with access to CRM data
- Workflow versioning: save named snapshots, compare versions, roll back
- Team collaboration: multiple users can view canvas in read-only; edit lock on active workflows
- Workflow scheduler: calendar view of upcoming scheduled runs
- Credit estimation: show estimated credit cost before running a workflow

---

## Monetization Strategy

ERIX-FLOW is not a standalone product — it is a value multiplier within the ECODrIx Console. Revenue comes from two sources: plan upgrades triggered by FLOW usage, and prepaid credit consumption for node executions (scraping, enrichment, outreach). FLOW itself does not add to the monthly subscription floor but increases credit burn rate, driving top-up purchases.

| Plan       | Monthly Price   | FLOW Access                | Workflow Runs/Month | Leads/Run   | Credits Included |
| ---------- | --------------- | -------------------------- | ------------------- | ----------- | ---------------- |
| Free       | Rs 0            | View-only (no run)         | 0                   | 0           | 100 credits      |
| Starter    | Rs 2,499 / $29  | Full canvas access         | 20 runs             | 100 leads   | 2,000 credits    |
| Growth     | Rs 4,999 / $59  | Full + templates           | 100 runs            | 500 leads   | 10,000 credits   |
| Scale      | Rs 9,999 / $119 | Full + AI agents + API     | Unlimited           | 2,000 leads | 50,000 credits   |
| Enterprise | Rs 25,000+      | Custom + dedicated support | Unlimited           | Custom      | Custom           |

> **CREDIT PRICING:** Top-up packs: Rs 499 = 1,000 credits | Rs 999 = 3,000 credits | Rs 1,999 = 8,000 credits. Credit costs: Scrape = 1 credit/lead | AI Enrichment = 2 credits/lead | Email Validation = 0.5 credits/lead | WA Validation = 0.5 credits/lead | WhatsApp send = 1 credit/message | Email send = 0.2 credits/email.

---

## Go-To-Market Strategy

ERIX-FLOW launches as a module update to existing ECODrIx console tenants first — no new acquisition needed for first 30 days. The GTM strategy is a three-phase approach: internal activation, template-driven viral growth, and paid acquisition targeting agency owners.

- Phase 1 (Week 1-2): Email existing ECODrIx users announcing ERIX-FLOW beta access. Offer 5,000 bonus credits for first workflow published.
- Phase 2 (Week 3-4): Launch 3 pre-built templates (Real Estate Lead Gen, Clinic Outreach, Agency B2B Scrape) on LinkedIn with demo video. DM 50 agency owners/day with personalised outreach generated by ERIX-FLOW itself.
- Phase 3 (Month 2+): Meta Ads targeting digital agency owners and sales managers in Tier 1-2 cities. Budget: Rs 5,000/month. Creative: before/after showing 3-hour manual pipeline vs 5-minute ERIX-FLOW canvas.
- Pricing psychology: Lead with Growth plan (Rs 4,999) as hero. Starter for solo founders. Scale for established agencies. Free plan as top-of-funnel, not revenue tier.
- First 100 users: Outbound via LAIE scraping agencies on JustDial and LinkedIn in Hyderabad, Bangalore, Mumbai. Hand-onboard first 10 users on video call. Build case studies from their results.

---

## User Stories

**As a** digital agency owner,  
**I want to** build a workflow that scrapes Google Maps for restaurants in Hyderabad, validates their WhatsApp numbers, and sends a personalised menu-digitalisation offer,  
**So that** I can run an entire outreach campaign in one click without touching Excel or WATI separately

**Acceptance Criteria:**

- Google Maps scrape node returns at least 100 leads with name, phone, address in under 3 minutes
- WhatsApp validation filters to WA-valid numbers before outreach node is reached
- Outreach node sends Meta-approved template with restaurant name variable injected correctly
- Run history shows exactly how many leads were scraped, validated, and messaged

**As a** solo EdTech founder,  
**I want to** install the EdTech Trial-to-Paid template from the marketplace and configure it for my product in under 10 minutes,  
**So that** I do not need to build automation from scratch and can start converting trial users immediately

**Acceptance Criteria:**

- Template installs with pre-configured nodes and only requires filling 3 fields: product name, WhatsApp template ID, and CRM tag
- Template preview shows the full flow before installation
- After saving, workflow can be tested with a single test lead before going live

**As a** sales manager,  
**I want to** view the run history of all workflows and see exactly how many leads passed each node in yesterday's run,  
**So that** I can identify bottlenecks in the pipeline and optimise conversion at each stage

**Acceptance Criteria:**

- Run history table shows date, workflow name, total leads in, leads at each node, completion status
- Clicking a run opens a canvas view with node-level lead counts overlaid as badges
- Failed runs show the exact node that failed with the error message

**As a** agency owner,  
**I want to** use the condition node to send WhatsApp to validated leads and email-only to leads with no valid WA number,  
**So that** No leads are wasted — every contact gets an outreach attempt on the best available channel

**Acceptance Criteria:**

- Condition node accepts is_wa_valid boolean field as branch condition
- True branch connects to WhatsApp node; false branch connects to email node
- Both branches merge into CRM push node that records outreach type used

**As a** growth hacker,  
**I want to** see the estimated credit cost of my workflow before running it,  
**So that** I can decide whether to run now or reduce scope to stay within my credit balance

**Acceptance Criteria:**

- Cost estimator appears in a sticky footer when workflow is opened in run mode
- Estimate shows breakdown: X credits for scrape, Y credits for enrichment, Z credits for outreach
- If estimated cost exceeds current balance, a top-up prompt appears with one-click Razorpay link

---

## Use Cases

1. **Real Estate Agency Lead Campaign**
   Full pipeline from scrape to WhatsApp outreach for real estate agents.
   - LAIE scrape node: JustDial, query='real estate agents', city='Pune', limit=200
   - AI enrichment node: generate pain points around manual site visits and no CRM
   - Email validation node: filter to valid emails
   - WA validation node: filter to WA numbers
   - Condition node: branch WA-valid to WhatsApp node, rest to email node
   - CRM push node: save all leads with enrichment data and outreach status
2. **Clinic Patient Re-engagement Flow**
   Re-engage patients who visited a clinic 60+ days ago.
   - CRM trigger node: filter contacts with last_visit > 60 days and tag=patient
   - AI enrichment node: generate personalised follow-up message based on last treatment type
   - Delay node: wait 1 hour
   - WhatsApp outreach node: send appointment reminder template with personalised greeting
   - CRM push node: update last_contacted date and outreach_type=wa_reminder
3. **Cold Email Outreach for SaaS B2B**
   Find decision-makers on LinkedIn, enrich, send cold email sequence.
   - LAIE scrape node: LinkedIn, query='CTO fintech startup', city='Bangalore', limit=50
   - AI enrichment node: analyse company, generate personalised pain point and opener
   - Email validation node: validate professional email addresses
   - Email outreach node: send Day 1 cold email with AI-generated opener
   - Delay node: wait 3 days
   - Email outreach node: send Day 4 follow-up template

---

## Platform Scope

| Key         | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Web Console | Full canvas, run history, templates, settings — accessible on desktop/tablet |
| Mobile      | View-only: run history and workflow status. Canvas editing is desktop-only.  |
| API Access  | Scale and Enterprise plans: trigger workflows via REST API, read run history |
| Embedded    | Not applicable for ERIX-FLOW MVP. Phase 3 consideration.                     |
| Admin Panel | ECODrIx admin can view all tenant workflow runs, credit consumption, errors  |

---

## Security Requirements

> **CRITICAL:** Workflow node configurations may store API keys, phone numbers, and Meta template IDs. All sensitive config values must be encrypted at rest using AES-256 before storage in PostgreSQL. Never log raw config values in run history or error traces.

- All workflow data scoped to tenant_id — no cross-tenant read possible at database layer
- Webhook trigger endpoints require HMAC-SHA256 signature validation
- Run history logs must redact phone numbers and email addresses (show first 3 chars + asterisks)
- Rate limiting on workflow run API: max 10 concurrent runs per tenant (Growth)
- All outreach via Meta Cloud API uses tenant-specific WABA ID and phone number ID — no shared credentials
- LAIE scraper proxies rotated per-tenant to prevent IP association between tenants

---

## Compliance Considerations

- WhatsApp outreach nodes enforce Meta-approved templates only — no free-form messages outside 24-hour window
- DPDP Act 2023 (India): users must confirm lead data source legitimacy before running outreach workflow
- Opt-out handling: WhatsApp replies with STOP must trigger automatic CRM tag update (opt_out=true) and suppress future outreach
- Email: CAN-SPAM and India IT Rules compliance — unsubscribe link injected automatically in all email templates
- Scraping compliance: LAIE scraper respects robots.txt and rate limits per source; no login-required scraping
- GSTIN 37GHCPM6574C1Z5 must appear on all invoices generated for ERIX-FLOW credit purchases

---

## Scalability Goals

| Key                                | Value                                                               |
| ---------------------------------- | ------------------------------------------------------------------- |
| Concurrent workflow runs (Month 1) | 50 runs across all tenants                                          |
| Concurrent workflow runs (Month 6) | 500 runs across all tenants                                         |
| Leads processed per day (Month 1)  | 10,000 leads/day                                                    |
| Leads processed per day (Month 6)  | 500,000 leads/day                                                   |
| Queue backend                      | ErixStore (custom in-memory + SQLite persistence) — no BullMQ       |
| Horizontal scale trigger           | When ErixStore job queue depth exceeds 1,000 pending jobs for 5 min |

---

## Future Expansion

1. AI Agent Node: autonomous multi-step agents that can browse websites, extract data, and make decisions within a workflow
2. ERIX-FLOW API: allow external apps to trigger workflows and read results programmatically (Phase 3)
3. Template Marketplace with community submissions: third-party agencies publish templates and earn credit revenue share
4. LinkedIn DM outreach node (via LAIE LinkedIn automation, subject to ToS review)
5. Instagram DM outreach node for D2C brand outreach campaigns
6. Workflow analytics: funnel-style conversion tracking from lead scraped to deal closed in CRM
7. Multi-language enrichment: Tamil, Telugu, Hindi pain point generation for hyper-local outreach
8. White-label ERIX-FLOW for agency resellers: agencies brand the canvas for their own clients

---

## Assumptions Made

- ErixStore is production-ready for job queue operations before ERIX-FLOW MVP ships
- ERIX-LAIE scraper services (Google Maps, JustDial, Sulekha) are stable and callable via internal API
- ErixSender (WhatsApp + email delivery) API is available and supports per-tenant WABA credentials
- ERIX-CRM contact schema has extension fields for enrichment data (pain_points, wa_valid, email_valid)
- React Flow library is approved for use in ECODrIx Console Next.js frontend
- Claude API (Anthropic) is the AI provider for enrichment nodes; budget allocated per enrichment call
- All module-to-module communication is via @ecodrix/erix-api SDK — no direct DB cross-module access
- GSTIN 37GHCPM6574C1Z5 is active and will be used on all ERIX-FLOW credit invoices

---
