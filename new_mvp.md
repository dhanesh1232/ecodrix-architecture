# ECODrIx Platform Blueprint v2.0

### Complete Revenue Architecture · Market Analysis · Product Specification · Execution Roadmap

**Version:** 2.0 · **Date:** June 2026 · **Classification:** CONFIDENTIAL  
**Author:** Dhanesh · Founder, ECODrIx Digital Studio · dhanesh@ecodrix.com  
**Entity:** ECODrIx Digital Studio · Tirupati, Andhra Pradesh, India  
**GST:** 37GHCPM6574C1Z5 · **MSME:** UDYAM-AP-23-0027846

---

> _"Competitors sell a wheel. ECODrIx sells the car."_

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Revenue Architecture — 8 Streams](#2-revenue-architecture--8-streams)
3. [Unit Economics & Revenue Projections](#3-unit-economics--revenue-projections)
4. [Market Longevity Analysis](#4-market-longevity-analysis)
5. [Product 1 — ERIX-CRM](#5-product-1--erix-crm)
6. [Product 2 — ERIX-FLOW](#6-product-2--erix-flow)
7. [Product 3 — ERIX-LAIE](#7-product-3--erix-laie)
8. [Infrastructure — ERIX-Connect](#8-infrastructure--erix-connect)
9. [Infrastructure — ERIX-Storage](#9-infrastructure--erix-storage)
10. [Infrastructure — ErixStore](#10-infrastructure--erixstore)
11. [Voice Agent System (August 2026)](#11-voice-agent-system-august-2026)
12. [Technical Architecture](#12-technical-architecture)
13. [AI Architecture & Behaviour Rules](#13-ai-architecture--behaviour-rules)
14. [Pricing Architecture](#14-pricing-architecture)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [MVP Feature Status Matrix](#16-mvp-feature-status-matrix)
17. [Competitive Moat Analysis](#17-competitive-moat-analysis)
18. [Risk Register](#18-risk-register)
19. [Founder Execution Principles](#19-founder-execution-principles)

---

## 1. Platform Overview

### What ECODrIx Is

ECODrIx is the **complete Indian GTM (Go-To-Market) stack** for SMBs. Three tightly integrated products backed by three proprietary infrastructure layers give businesses everything needed to go from cold lead discovery to closed client to delivered project — fully automated, WhatsApp-first, AI-native.

```
LEAD DISCOVERY  →  OUTREACH  →  CRM  →  AUTOMATION  →  PAYMENT  →  PROJECT  →  REPEAT
     LAIE               LAIE + FLOW       CRM           FLOW        CONNECT      CRM Portal
```

### Three Products

| Product       | Western Reference              | Core Job                                       |
| ------------- | ------------------------------ | ---------------------------------------------- |
| **ERIX-CRM**  | HubSpot + Basecamp             | Lead mgmt → pipeline → inbox → project portal  |
| **ERIX-FLOW** | n8n + Zapier                   | Cross-product visual automation canvas         |
| **ERIX-LAIE** | Apollo + Clay + Apify + Hunter | Scrape → validate → enrich → analyse → prepare |

### Three Infrastructures

| Infrastructure   | Role                                                        | Status          |
| ---------------- | ----------------------------------------------------------- | --------------- |
| **ERIX-Connect** | Channel hub: WhatsApp, Instagram, payments, voice           | Live + building |
| **ERIX-Storage** | Media CDN + client API key delivery                         | Partial         |
| **ErixStore**    | Custom queue engine (Redis + BullMQ replacement, port 6399) | Live            |

### Current Foundation (Already Built)

- Next.js 15 SaaS + Express/Hono server on GCP Cloud Run
- `@ecodrix/erix-api` npm SDK (BSL licensed) — all frontend-server calls
- Supabase PostgreSQL + Drizzle ORM (platform + LAIE data)
- MongoDB per-tenant `ecodrix_${userId}` (CRM isolation)
- ErixStore operational — SQLite-backed, ERIX.\* command namespace
- Meta Tech Provider status — Embedded Signup + Instagram DM APIs
- AWS SES 50K emails/day capacity
- Active GCP + AWS Activate credits
- Live clients: Fortune Future Vibe, Care & Move, Nirvisham

---

## 2. Revenue Architecture — 8 Streams

ECODrIx is not a single-revenue business. Eight distinct streams compound over time. Most require no additional build — they emerge from existing product as client base grows.

---

### Stream 1 — SaaS Subscriptions (Core MRR)

**Type:** Recurring · **Predictability:** High · **CAC Recovery:** Month 1–3

The foundation. Monthly or annual subscription to the platform. Four tiers priced for Indian SMB psychology — ₹2,499 minimum entry eliminates perceived-low-value clients, ₹25,000+ Scale tier targets agencies and enterprises.

```
Solo    ₹2,499/mo  →  freelancers, micro-businesses
Starter ₹4,999/mo  →  small teams, growing SMBs
Growth  ₹9,999/mo  →  established businesses, agencies
Scale   ₹25,000+   →  enterprise, white-label operators
```

**Annual plan incentive:** 2 months free (16.6% discount) → reduces churn, improves cash flow, increases LTV.

**International tier (USD):** $29 / $59 / $119 / $299+ — unlocked Q4 2026 as SaaS matures.

---

### Stream 2 — Usage-Based Credits (Variable Revenue)

**Type:** Prepaid · **Predictability:** Medium · **Margin:** 80–95%

Clients purchase credit packs on top of subscription. Credits gate resource-intensive operations: LAIE lead scraping, AI analysis runs, extra email sends, ERIX-Storage overages.

| Credit Type     | Unit          | Price per Unit | Cost to ECODrIx   |
| --------------- | ------------- | -------------- | ----------------- |
| LAIE leads      | per 100 leads | ₹99            | ~₹8 (GCP compute) |
| AI analysis run | per 50 leads  | ₹49            | ~₹4 (Claude API)  |
| Extra emails    | per 10,000    | ₹299           | ~₹20 (AWS SES)    |
| Storage overage | per 10GB      | ₹149           | ~₹12 (R2)         |

**Why this works:** Base plan includes enough credits for typical use. Power users top up. Margin on credits = 85–95%. No credit expiry anxiety needed — credits roll over 12 months.

---

### Stream 3 — Add-On Products (High-Margin Upsell)

**Type:** Recurring on top of base · **Margin:** 90–97%

Premium capabilities sold as monthly add-ons. Client already trusts platform — add-on conversion rate expected 30–40% at scale.

| Add-On                         | Monthly Price | Infra Cost   | Margin |
| ------------------------------ | ------------- | ------------ | ------ |
| Voice Agent Starter (200 min)  | ₹2,999        | ~₹350        | 88%    |
| Voice Agent Growth (600 min)   | ₹5,999        | ~₹800        | 87%    |
| Voice Agent Scale (unlimited)  | ₹12,999       | ~₹2,200      | 83%    |
| ERIX-Storage 50GB              | ₹499          | ~₹40         | 92%    |
| ERIX-Storage 200GB             | ₹999          | ~₹120        | 88%    |
| White-label domain embed       | ₹4,999        | ~₹0 (config) | ~99%   |
| Extra LAIE credits 1,000 leads | ₹999 one-time | ~₹80         | 92%    |

---

### Stream 4 — Partner Club Commissions (Zero-CAC Revenue)

**Type:** Revenue share · **Scalability:** Infinite · **CAC:** ₹0

Partners refer clients. Partners earn recurring commission on every client they bring. ECODrIx pays commission from subscription revenue — no upfront cost. Each partner is a distributed sales team member paid only on results.

| Tier      | Commission    | Monthly Referral Req | Benefits                    |
| --------- | ------------- | -------------------- | --------------------------- |
| Associate | 15% recurring | 1+                   | Dashboard + tracking links  |
| Silver    | 20% recurring | 3+                   | Co-marketing support        |
| Gold      | 25% recurring | 8+                   | Priority support + training |
| Platinum  | 30% recurring | 15+                  | White-label rights          |

**Math:** 50 Gold partners × 3 clients each × ₹4,999/mo × 25% = ₹18.7L/mo commission paid, ₹56L/mo revenue received. Net to ECODrIx: ₹37.3L/mo from partner-sourced clients alone.

---

### Stream 5 — White-Label Licensing (B2B2B Revenue)

**Type:** High-ticket recurring · **Target:** Digital agencies, marketing firms  
**Price:** ₹4,999–₹15,000/mo per agency + their client subscriptions flow through

Agencies buy rights to resell ECODrIx under their own brand. ECODrIx powers the platform — agency owns client relationship. Two revenue sources: (1) agency license fee, (2) reduced-rate subscriptions for their clients.

**White-label scope:**

- Custom domain (client.agencyname.com)
- Agency logo, brand colors
- Custom onboarding emails
- Agency support team fronts all client queries
- ECODrIx is invisible to end client

**Why agencies pay:** Building their own CRM = ₹50L+. White-labeling ECODrIx = ₹5,000/mo. No-brainer arbitrage for agencies.

---

### Stream 6 — API Access Tier (Developer Revenue)

**Type:** High-ticket recurring · **Target:** Developers, SaaS builders, large enterprises  
**Price:** ₹15,000–₹50,000/mo

Developers get raw API access to LAIE, CRM data, FLOW triggers, and ERIX-Connect channels. Build custom workflows, integrate with proprietary systems, embed ECODrIx data into their own products.

**API endpoints unlocked:**

- `GET /laie/leads` — query enriched lead database
- `POST /laie/scrape` — trigger scrape job via API
- `POST /crm/contacts` — create/update contacts programmatically
- `POST /flow/trigger` — fire any flow from external webhook
- `GET /connect/messages` — read inbox threads
- `POST /connect/send` — send WhatsApp/email via API

**Monetisation model:** Rate-limited by tier. Pay per 1,000 API calls above base limit. Enterprise = custom contract.

---

### Stream 7 — Professional Services (One-Time + Retainer)

**Type:** Project-based or monthly retainer · **Margin:** 70–85%

Not scalable indefinitely — but high-value during early growth while product matures. Services ECODrIx already delivers with existing clients.

| Service                     | Pricing Model           | Example                                      |
| --------------------------- | ----------------------- | -------------------------------------------- |
| Platform setup & onboarding | ₹5,000–₹25,000 one-time | Full CRM migration, LAIE config, FLOW build  |
| Custom FLOW builds          | ₹3,000–₹15,000/flow     | Industry-specific automation workflows       |
| LAIE campaign execution     | ₹8,000–₹25,000/campaign | Managed lead gen for client                  |
| Monthly retainer (managed)  | ₹3,000–₹8,000/mo        | ECODrIx operates platform on client's behalf |
| WhatsApp template library   | ₹5,000 one-time         | 20 approved templates built + submitted      |

**Important:** Professional services fund SaaS development. This is the "services fund SaaS" bootstrapping model in action.

---

### Stream 8 — FLOW Template Marketplace (Platform Revenue)

**Type:** Transaction-based · **Timeline:** Q4 2026  
**Commission:** 30% of template sale price

Users build high-value FLOW templates (industry-specific automations) and sell in the ECODrIx marketplace. ECODrIx takes 30% of every transaction. Buyers get plug-and-play flows. Sellers earn passive income.

**Why this becomes valuable:**

- FLOW templates = intellectual property with recurring demand
- "Real estate agency full automation flow" → every real estate user wants it
- Top creators earn ₹20,000–₹1L/mo passively
- ECODrIx earns 30% without building the content
- Creates viral loop: creators bring their audience to ECODrIx

**Template pricing range:** ₹499–₹4,999 per template  
**ECODrIx cut:** 30% = ₹150–₹1,500 per sale

---

### Revenue Stream Summary

```
Stream 1: SaaS Subscriptions    → Core MRR, predictable, compounding
Stream 2: Usage Credits         → Variable, high margin, scales with usage
Stream 3: Add-On Products       → Upsell from existing base, 85–97% margin
Stream 4: Partner Commissions   → Zero CAC, infinite scale, pays on results only
Stream 5: White-Label License   → B2B2B, high ticket, agency market
Stream 6: API Access            → Developer market, enterprise entry point
Stream 7: Pro Services          → Funds SaaS dev, high margin, relationship-builder
Stream 8: FLOW Marketplace      → Platform revenue, network effect, creator economy
```

**Compounding logic:** Client starts on Stream 1 → buys credits (Stream 2) → adds voice (Stream 3) → refers friends (Stream 4) → becomes agency (Streams 4+5) → builds templates (Stream 8). Average client can touch 4–5 streams simultaneously.

---

## 3. Unit Economics & Revenue Projections

### Unit Economics Per Client

```
Average Contract Value (ACV)     ₹4,500/mo (blended across tiers)
Annual ACV                       ₹54,000
CAC (Partner-sourced)            ₹0–₹2,000
CAC (Direct outreach)            ₹2,000–₹5,000
Payback Period                   < 1 month (partner) · 1–2 months (direct)
Gross Margin                     82–94%
Estimated Churn (Year 1)         8–12%/mo → target < 5% by Month 6
LTV (12-month, 8% churn)         ₹3,87,000
LTV (24-month, 5% churn)         ₹8,64,000
LTV:CAC Ratio                    80:1 (partner) · 40:1 (direct)
```

### Monthly Revenue Model

| Month    | Clients | Avg Plan | Base MRR  | Add-Ons   | Pro Services | Total MRR |
| -------- | ------- | -------- | --------- | --------- | ------------ | --------- |
| Jul 2026 | 10      | ₹3,500   | ₹35,000   | ₹5,000    | ₹40,000      | ₹80,000   |
| Aug 2026 | 20      | ₹4,000   | ₹80,000   | ₹25,000   | ₹30,000      | ₹1,35,000 |
| Sep 2026 | 35      | ₹4,500   | ₹1,57,500 | ₹60,000   | ₹25,000      | ₹2,42,500 |
| Oct 2026 | 50      | ₹4,999   | ₹2,49,950 | ₹75,000   | ₹20,000      | ₹3,44,950 |
| Nov 2026 | 70      | ₹5,200   | ₹3,64,000 | ₹1,20,000 | ₹20,000      | ₹5,04,000 |
| Dec 2026 | 100     | ₹5,500   | ₹5,50,000 | ₹2,00,000 | ₹15,000      | ₹7,65,000 |

### Infrastructure Cost vs Revenue

| Month    | Total Revenue | Infra Cost             | Gross Profit | Margin |
| -------- | ------------- | ---------------------- | ------------ | ------ |
| Jul 2026 | ₹80,000       | ₹8,000 (credits cover) | ₹72,000      | 90%    |
| Sep 2026 | ₹2,42,500     | ₹18,000                | ₹2,24,500    | 92%    |
| Dec 2026 | ₹7,65,000     | ₹45,000                | ₹7,20,000    | 94%    |

_GCP + AWS credits absorb infra cost until ~Month 4. By Month 5, revenue covers infra with high margin._

### Voice Agent Break-Even

```
1 Starter Voice client (₹2,999)  >  Full voice infra cost (₹2,200/mo)
Break-even = 1 client
10 voice clients = ₹29,990 revenue on ₹2,200 infra = 93% margin
```

---

## 4. Market Longevity Analysis

### How Long Will ECODrIx Survive?

**Short answer: Multi-decade. If built correctly.**

### Category Lifespan Reference

| Category             | Pioneer           | Age      | Status              |
| -------------------- | ----------------- | -------- | ------------------- |
| CRM                  | Salesforce (1999) | 25 years | Dominant, $200B+    |
| Marketing automation | HubSpot (2006)    | 18 years | Growing, $20B       |
| Workflow automation  | Zapier (2011)     | 13 years | Growing, $5B+       |
| Data enrichment      | Apollo.io (2015)  | 9 years  | Unicorn, $1.6B      |
| WhatsApp CRM         | WATI (2020)       | 4 years  | Growing, acquired   |
| AI-native CRM        | Clay (2021)       | 3 years  | $1.3B, hypergrowth  |
| Voice AI agents      | 2023–present      | 2 years  | Early, 10yr+ runway |

**Conclusion:** CRM + automation = 15–25 year category minimum. ECODrIx is entering in 2026 — 20+ years of runway in base category alone.

### India-Specific Tailwinds (2026–2035)

```
63 million SMBs in India → <1% digitised on CRM today
WhatsApp penetration: 500M+ users → primary business channel
UPI + Razorpay normalising digital payments for SMBs
DPDP Act 2023 → businesses need compliant data handling (ECODrIx = compliant)
4G/5G rural expansion → SMB digital adoption accelerating
GST digitalisation → every SMB must go digital
AI adoption in India: 2026 = inflection year
Startup India + DPIIT → tailwind for B2B SaaS
```

### Moat Analysis

| Moat Type                     | ECODrIx Moat                                                                              | Strength    | Notes                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ----------- | ---------------------------------------- |
| **Switching cost**            | Client portal, conversation history, trained AI, team workflows all inside ECODrIx        | Very High   | After 6 months, near-impossible to leave |
| **Data network effect**       | More clients → more LAIE scraping data → better lead intelligence → better results        | Medium-High | Builds over 12–18 months                 |
| **Workflow lock-in**          | ERIX-FLOW automations are unique to platform → migration = rebuilding entire business ops | Very High   | Flows are not portable                   |
| **WhatsApp channel**          | Meta Tech Provider status → Embedded Signup = clients connect WhatsApp inside ECODrIx     | High        | Not available to non-partners            |
| **Vertical bundling**         | LAIE + CRM + FLOW + Voice + Payments in one = competitors must replicate 5 products       | High        | Years to replicate                       |
| **Indian pricing psychology** | ₹2,499 entry vs $49 WATI vs $50 HubSpot = 10x price advantage for same Indian SMB         | High        | Price moat for India market              |
| **Brand**                     | ECODrIx = first-mover in WhatsApp-native CRM + AI for Indian SMBs                         | Growing     | First-mover advantage compounds          |

### Disruption Scenarios & Response

| Threat                                        | Likelihood | ECODrIx Response                                                         |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| HubSpot launches India-specific WhatsApp tier | Low-Medium | Deeper India features (Telugu, Hindi), local pricing psychology          |
| WATI adds LAIE-like features                  | Medium     | FLOW depth + Voice Agent + white-label = still 3 products ahead          |
| New Indian CRM startup                        | High       | Partner Club = distribution moat. Switching cost = retention moat        |
| Meta changes WhatsApp Business API            | Low        | ERIX-Connect multi-channel = not WhatsApp-only                           |
| AI commoditises CRM features                  | Medium     | ECODrIx = orchestration layer. AI is a node inside FLOW, not the product |
| Funding competitor copies features            | Medium     | Speed (solo founder ships fast). LAIE data depth. ErixStore = unique IP  |

### 10-Year Survival Probability

```
Year 1–2:  Validate → survive on services + 10–50 SaaS clients
Year 3–4:  Scale → 500+ clients, Partner Club active, white-label launched
Year 5–6:  Platform → marketplace, API economy, potential Series A
Year 7–10: Category leader → Indian GTM stack standard
           OR: strategic acquisition by Zoho, Freshworks, or Meta

Failure scenario: <5 clients by Month 9 = pivot required
Success scenario: 100 clients by Month 12 = compound flywheel starts
```

**Verdict:** Category is durable 20+ years. ECODrIx specific survival depends on reaching 50 clients before credits run out. That is the critical milestone.

---

## 5. Product 1 — ERIX-CRM

### Position

> HubSpot + Basecamp combined. WhatsApp-first. AI-native. Client portal included. Indian pricing.

ERIX-CRM manages the full relationship lifecycle: cold lead → qualified prospect → active deal → won client → delivered project → retained account. No hand-off to external project tools needed.

---

### Module 1.1 — Lead Management

**What it does:** Full contact + company records with complete activity timeline.

**Core capabilities:**

- Contact profiles: name, phone, email, company, source, tags, custom fields
- Company profiles: linked contacts, deal value, industry, digital maturity score
- Activity timeline: every email, WhatsApp message, call, note, stage change logged automatically
- Lead scoring: manual stars + AI-assisted score from LAIE enrichment data
- Duplicate detection: merge duplicate contacts without data loss
- Import: from LAIE (one-click), CSV, external CRMs via ERIX-Connect

**Data model (MongoDB per tenant):**

```javascript
Contact {
  _id, tenantId, firstName, lastName,
  phone, email, company,
  source: 'laie' | 'manual' | 'import' | 'connect',
  score: 0–100,
  tags: string[],
  customFields: Record<string, any>,
  laieProfileId?: string,    // linked LAIE enrichment
  timeline: TimelineEvent[], // all activity
  assignedTo: userId,
  pipelineStage: string,
  createdAt, updatedAt
}
```

---

### Module 1.2 — Pipeline Management

**What it does:** Visual deal tracking from first contact to close.

**Core capabilities:**

- Unlimited custom pipelines per tenant (Sales, Projects, Partnerships, etc.)
- Kanban view: drag-drop cards across stages
- List view: sortable by value, date, score, stage
- Stage-based automation triggers → fires ERIX-FLOW on stage change
- Deal value tracking: estimated vs actual revenue per deal
- Win/loss analysis: why deals close or die, time-in-stage averages
- **Close-Won trigger:** When deal moves to won stage → automatically creates Project Management portal for that client

---

### Module 1.3 — Sequences & Automation Rules

**What it does:** Multi-step, multi-channel nurture campaigns running on autopilot.

**Sequence types:**

- Email sequences: step 1 email → wait 2 days → step 2 email → if opened → branch A → if not → branch B
- WhatsApp sequences: Meta-compliant templates → conversational follow-ups
- Mixed: email day 1 → WhatsApp day 3 → Instagram DM day 7
- Condition branching: opened, clicked, replied, bounced, not replied in X days
- AI reply detection: if lead replies, AI qualifies before handing to human

**Automation rules (simple, different from FLOW):**

- IF [lead score > 70] AND [stage = Interested] → assign to senior sales
- IF [no activity in 7 days] → send re-engagement WhatsApp
- IF [email bounced] → switch to WhatsApp delivery

---

### Module 1.4 — Unified Conversation Inbox

**What it does:** All channel messages in one inbox. No tab-switching. No missed messages.

**Channels unified:**

- WhatsApp (Meta Cloud API — Tech Provider)
- Email (AWS SES inbound + outbound)
- Instagram DM (Meta OAuth2)
- Voice call transcript (August 2026)
- Future: SMS, Telegram, LinkedIn DM

**Inbox features:**

- Threaded conversations per contact across all channels
- Channel tag on each message (WA / Email / IG / Voice)
- AI thread summary: "Lead asked about pricing twice, showed interest in Growth plan, hasn't replied in 3 days"
- AI next-action suggestion: "Send pricing breakdown + offer free demo call"
- Voice transcript tab: full call transcript with speaker labels (User / Lead)
- Audio playback icon: click to replay call recording from inbox
- Timeline integration: every inbox event auto-logged in contact timeline

**AI behaviour in inbox:**

```
User sets rule: "If lead asks about pricing, share our pricing page link"
Lead: "How much does it cost?"
AI: Detects pricing intent → shares pricing link → logs action
AI does NOT: make pricing commitments, offer discounts, make promises
AI DOES: converse within user-defined rules, summarise, suggest, escalate
```

---

### Module 1.5 — Project Management Portal

**What it does:** Internal project board + client-facing secure portal. No need for Basecamp, Notion, or separate project tools.

**Internal board (team view):**

- Tasks with assignee, deadline, priority, status
- Milestones with completion percentages
- File uploads: briefs, deliverables, contracts
- Internal notes (client cannot see)
- Team activity log

**Client portal (external view — login-gated):**

- Unique URL per project: `yourdomain.com/client/project-xyz`
- Client logs in via email + password (set on first access)
- No one else can access — JWT-gated, tenant-isolated
- Client sees: project progress, milestones, files to review
- Client can: upload files, raise queries, approve deliverables
- Dual conversation thread: your team ↔ client (separate from internal notes)
- Invoice history: paid, pending, upcoming
- White-labelled: shows your brand, not ECODrIx

---

## 6. Product 2 — ERIX-FLOW

### Position

> n8n but product-native. Connects LAIE + CRM + Connect + AI agents + external APIs in visual no-code canvas.

ERIX-FLOW is the automation backbone. It is what transforms ECODrIx from "good CRM" to "autonomous business OS." Without FLOW, ECODrIx is reactive. With FLOW, it is proactive.

---

### Canvas Architecture

**Node types:**

| Node           | Function                    | Example                                                             |
| -------------- | --------------------------- | ------------------------------------------------------------------- |
| **Trigger**    | Start the flow              | CRM stage change, LAIE export complete, webhook, schedule, manual   |
| **Action**     | Do something                | Send WhatsApp, send email, create contact, update CRM, call API     |
| **AI Agent**   | Claude/Gemini decision node | Qualify lead, generate reply, analyse sentiment, decide next branch |
| **Condition**  | Branch based on data        | If score > 70 → path A, else path B                                 |
| **Loop**       | Iterate over list           | For each lead in LAIE export → execute actions                      |
| **Delay**      | Wait before next node       | Wait 2 hours → send follow-up                                       |
| **Human loop** | Pause + notify user         | Pause flow → send WhatsApp alert → resume when user approves        |
| **Voice Call** | Trigger AI call             | Dial lead number → Gemini agent handles call → transcript to CRM    |
| **Webhook**    | Send/receive HTTP           | Post to Zapier, Slack, custom API                                   |
| **Transform**  | Reshape data                | Extract field, format date, calculate value                         |

---

### Flagship Flow — Full Sales Automation (Zero Human Touch)

```
[TRIGGER] User sets goal: "Find 50 yoga studios in Hyderabad"
    ↓
[ACTION] LAIE: Scrape Google Maps for yoga studios, Hyderabad
    ↓
[ACTION] LAIE L2: Validate emails + phones
    ↓
[ACTION] LAIE L3-L4: Enrich + AI analyse pain points
    ↓
[ACTION] LAIE L5: Generate personalised WhatsApp intro per lead
    ↓
[ACTION] Export 50 leads to ERIX-CRM with tags: "yoga|hyderabad|cold"
    ↓
[LOOP] For each lead:
    ↓
    [ACTION] Send WhatsApp sequence Day 1: personalised intro (AI-generated)
        ↓
    [CONDITION] Replied within 24 hours?
        ↓ YES                           ↓ NO
    [AI AGENT] Qualify: interest level  [DELAY] Wait 3 days
        ↓                               ↓
    [CONDITION] Interested?         [ACTION] Send Day 4 follow-up
        ↓ YES
    [ACTION] CRM: Move to "Interested" stage
        ↓
    [ACTION] Schedule meeting via Google Calendar
        ↓
    [HUMAN LOOP] → Notify user: "Meeting booked with [Name] at [Time]"
        ↓ (User confirms or reschedules)
    [ACTION] Send meeting link to lead via WhatsApp
        ↓
    [AI AGENT] Post-meeting: qualify if deal is real
        ↓
    [ACTION] CRM: Move to "Proposal" stage
        ↓
    [ACTION] Generate proposal via ERIX-Connect template
        ↓
    [ACTION] CRM: Deal moves to "Won"
        ↓
    [ACTION] Create client portal automatically
        ↓
    [ACTION] Razorpay: Create advance payment link
        ↓
    [ACTION] Send payment link via WhatsApp
        ↓
    [WEBHOOK] Razorpay payment confirmed
        ↓
    [ACTION] Generate invoice PDF → send via WhatsApp + email
        ↓
    [ACTION] CRM timeline: log "Advance paid ₹X on [date]"
```

**User touched the system: 1 time.** (Meeting confirmation at human loop node.)  
Everything else: autonomous.

---

### Flow Analytics

- Per-flow: conversion rate at each node (where leads drop off)
- A/B testing: run two flow variants, compare close rates
- Revenue attribution: which flow generated most closed deals
- Error log: failed nodes, retry attempts, manual resolution queue

---

## 7. Product 3 — ERIX-LAIE

### Position

> Apollo.io + Clay + Apify + Hunter.io — unified, Indian-native, AI-enriched, directly feeds CRM.

LAIE is a lead discovery and preparation engine. It is **not** a CRM. Output format is always a structured table. Users export to CRM (internal) or any external CRM via ERIX-Connect.

---

### 5-Layer Intelligence Pipeline

#### Layer 1 — Scrape (Discovery)

**Sources:** Google Maps, JustDial, Sulekha, IndiaMART, Yelp India, web search  
**Method:** Playwright + patchright + Crawlee (anti-detect browser automation)  
**Proxy stack:**

- GCP Squid datacenter proxies (primary — fast, cheap)
- Jio SIM residential proxies (fallback — when datacenter IPs blocked)
- AWS spot burst instances (high-volume sprints)
- Cloudflare Workers routing (distribute traffic, rotate endpoints)

**Output per lead at L1:**

```
Business name, category, address, city, phone (raw), website (if any), Google Maps URL
```

#### Layer 2 — Validate (Clean)

**What runs:**

- Email syntax check + MX record verification + SMTP ping
- Phone: format normalise to E.164, verify active (DND check where possible)
- Domain: check if website resolves, SSL status, not-parked check
- Duplicate: hash phone + email → flag/merge duplicates

**Output:** Clean, bounce-free contact data. Removes ~20–40% of raw scraped data.

#### Layer 3 — Enrich (Intelligence)

**Sources:** Business website, Google reviews, Instagram/Facebook page, news mentions  
**What collected:**

- Full business description (from website About page)
- Owner/founder name (from About, LinkedIn if publicly indexed)
- Google review count + average rating
- Social media presence (IG followers, last post date, content type)
- Website tech stack (Wappalyzer-style detection)
- Number of employees (estimate from website/JustDial)

#### Layer 4 — Analyse (AI Intelligence)

**AI model:** Claude API (primary) + Gemini (GCP credits)  
**Input:** Website text + social content + review sentiment + tech stack  
**Output per lead:**

```json
{
  "digitalMaturityScore": 34, // 0–100
  "painPoints": [
    "No WhatsApp business presence",
    "Website last updated 2022",
    "No online booking system",
    "250 Google reviews — no replies"
  ],
  "growthStage": "established-offline", // micro|growing|established-offline|digital-first
  "estimatedRevenue": "₹20L–₹50L/yr",
  "decisionMaker": "Owner-operated",
  "urgency": "medium",
  "bestChannel": "WhatsApp",
  "bestTime": "10am–12pm weekdays"
}
```

#### Layer 5 — Prepare (Outreach Generation)

**AI generates 3 variants per lead:**

```
Variant A — WhatsApp DM (conversational, 2–3 lines):
"Hi [Name], noticed [Business] doesn't have a WhatsApp business
 account yet. We helped 3 yoga studios in Hyderabad get 40% more
 bookings via WhatsApp. Worth a 10-min chat?"

Variant B — Cold email (professional, 5–6 lines):
Subject: [Business] + WhatsApp bookings — quick idea

Variant C — Instagram DM (casual, 1–2 lines):
"Loved your reel on [topic]! Quick question — are you getting
 enquiries via DM? We have a tool for that 👋"
```

All three ready to send. User reviews, picks best, fires from CRM or FLOW.

---

### LAIE Output Table

| Field          | Description                             |
| -------------- | --------------------------------------- |
| Business Name  | Scraped name                            |
| Owner Name     | Enriched from website/social            |
| Phone          | Validated E.164                         |
| Email          | Validated, deliverable                  |
| Website        | URL, tech stack                         |
| Category       | Business type                           |
| City           | Location                                |
| Digital Score  | 0–100 AI assessment                     |
| Pain Points    | 3–5 bullet points                       |
| Growth Stage   | micro/growing/established/digital-first |
| Outreach A/B/C | Pre-written messages                    |
| Status         | New / Exported / Contacted / Replied    |
| Export Date    | When pushed to CRM                      |

### Legal Note

> ⚠️ **DPDP Act 2023:** LinkedIn scraping carries significant legal risk. ECODrIx does NOT scrape LinkedIn. Primary data sources: Google Maps, JustDial, IndiaMART (all publicly indexed business directories). Apollo.io API used for professional enrichment when needed.

---

## 8. Infrastructure — ERIX-Connect

### What It Is

ERIX-Connect is the **connection and access layer** — it links ECODrIx to all external channels, payment gateways, and third-party services. It does not contain business logic. It connects, authenticates, and routes.

### User Experience (Connect UI)

```
ERIX-Connect Dashboard
├── Card: WhatsApp Business  [Connected ✓]
├── Card: Instagram DM       [Connected ✓]
├── Card: Razorpay           [Connect →] → OAuth → return → Connected
├── Card: Stripe             [Connect →] → OAuth → return → Connected
├── Card: Voice Agent        [Enable →]  → Setup wizard → number + voice
├── Card: Google Calendar    [Connect →] → OAuth → Connected
├── Card: Email (AWS SES)    [Connected ✓]
└── Card: + More coming...
```

Each card: click → feature explanation → pricing → click "Enable" → setup flow → done.

### Integration Details

#### WhatsApp (Live)

- Auth: Embedded Signup (Meta OAuth — Tech Provider)
- Scope: whatsapp_business_messaging, whatsapp_business_management
- App review: in progress (video demo submitted)
- Capacity: unlimited WABAs per tenant

#### Instagram DM (Live)

- Auth: Meta OAuth2
- Scope: instagram_basic, instagram_manage_messages
- Use: DM inbox in CRM, DM automation in FLOW

#### Razorpay (Building)

```
Flow:
1. Click "Connect Razorpay"
2. Redirect → https://auth.razorpay.com/authorize?client_id=X&scope=read_write
3. User grants permission
4. Callback → https://ecodrix.com/connect/razorpay/callback
5. Exchange code → access_token + refresh_token
6. Store in tenant MongoDB: { razorpay: { accountId, accessToken, refreshToken } }
7. Dashboard shows "Connected ✓"

Payment flow:
CRM AI detects: "advance", "payment", "invoice" keyword
→ Create payment link via Razorpay API (₹X, description, expiry)
→ Send via WhatsApp to lead
→ Lead pays
→ Razorpay webhook: POST /webhooks/razorpay/payment.captured
→ Generate PDF invoice
→ Send invoice via WhatsApp + email
→ Log in CRM timeline: "Advance ₹X paid on [date]"
```

#### Stripe (Building)

```
Flow:
1. Click "Connect Stripe"
2. Redirect → https://connect.stripe.com/oauth/authorize (Connect Standard)
3. User logs in, grants permission
4. Callback → code exchange → stripe_account_id stored
5. Connected ✓

Use: International clients, SaaS subscribers paying in USD
```

#### Voice Agent (August 2026) — see Section 11

---

## 9. Infrastructure — ERIX-Storage

### What It Is

CDN-backed media storage for ECODrIx tenants. Stores conversation media (WhatsApp images/videos, voice recordings, client portal uploads) and provides API key access for delivery on client websites.

### Like Cloudinary — But Yours

Clients get:

- Dedicated storage bucket per tenant (R2 bucket on Cloudflare)
- CDN delivery URL: `cdn.ecodrix.com/tenant-id/file-name.jpg`
- API key to embed media on their own website/app
- Usage dashboard: storage used, bandwidth consumed
- Image transforms: resize, compress, format convert (via Cloudflare Images)

### Pricing

| Plan     | Storage | Bandwidth | Price             |
| -------- | ------- | --------- | ----------------- |
| Included | 5GB     | 20GB/mo   | ₹0 (in base plan) |
| Add-on S | 50GB    | 100GB/mo  | ₹499/mo           |
| Add-on M | 200GB   | 500GB/mo  | ₹999/mo           |
| Add-on L | 1TB     | Unlimited | ₹3,999/mo         |

### Voice Recording Storage

All Voice Agent calls stored here. Link in CRM inbox. Playback via audio player. Transcript stored in MongoDB. Recording stored in R2 (compressed, 7-day default, 90-day premium).

---

## 10. Infrastructure — ErixStore

### What It Is

Custom queue engine and in-memory data store. Replaces Redis + BullMQ entirely. Runs on port 6399. SQLite-backed for persistence — survives restarts without data loss.

### Key Design Decisions

- **Not Redis-compatible by design.** ERIX.\* command namespace is proprietary.
- **SQLite persistence.** Every job and state survives restart. Redis loses on restart without AOF/RDB configured.
- **Internal only until revenue justifies external alternative.** Currently not open-sourced.
- **CLI:** `erixcli` — inspect queues, retry dead jobs, purge stale locks, monitor throughput.

### What It Powers

```
LAIE scrape jobs          → job queue, resumable, progress tracking
FLOW execution engine     → step-by-step flow state machine
Email send queue          → SES rate-limited batching
WhatsApp send queue       → Meta API rate limit management
Webhook delivery          → retry with exponential backoff
Session state             → user sessions, active flow runs
Real-time pub/sub         → inbox live updates, flow status push
Rate limiting             → per-tenant API call limiting
```

### ERIX.\* Command Examples

```
ERIX.ENQUEUE flow:jobs "{ flowId, tenantId, trigger }"
ERIX.DEQUEUE flow:jobs
ERIX.STATUS flow:jobs
ERIX.RETRY dead:jobs 3
ERIX.FLUSH session:abc123
ERIX.MONITOR                    // real-time queue dashboard
```

---

## 11. Voice Agent System (August 2026)

### Architecture

```
Lead/CRM trigger
     ↓
voice-orchestrator (Hono, GCP Cloud Run)
     ↓
Asterisk SIP PBX (GCE VM, always-on)
     ↓
Airtel Business SIP Trunk → real +91 number
     ↓
Lead's phone rings
     ↓
LiveKit WebRTC Bridge (Cloud Run)
     ↓
Gemini Live API (audio in → audio out, real-time)
[No separate STT/TTS — Gemini handles both natively]
     ↓
Call ends
     ↓
Transcript extracted → stored in MongoDB
     ↓
AI post-call analysis: intent, sentiment, next action
     ↓
CRM inbox: transcript tab + audio playback icon
     ↓
Contact timeline: "Call — 4min 32sec — Interested in Growth plan"
     ↓
ERIX-FLOW: resume from human-loop or next automation step
```

### Why Gemini Live API

Normal voice AI stack: Audio → STT (Whisper) → LLM (Claude) → TTS (ElevenLabs) → Audio. Three separate API calls. Latency compounds: 800ms + 300ms + 600ms = 1.7 second response lag. Unacceptable for natural conversation.

Gemini Live API: Audio → Gemini 2.0 Flash → Audio. One API call. ~400ms latency. Natural conversation feel. All on GCP credits.

### Own Stack vs Third-Party

| Layer               | Own (GCP)                 | vs Third-Party         |
| ------------------- | ------------------------- | ---------------------- |
| PBX                 | Asterisk on GCE VM        | VAPI.ai ($0.05/min)    |
| WebRTC              | LiveKit self-hosted       | Daily.co ($0.01/min)   |
| AI brain + voice    | Gemini Live (GCP credits) | ElevenLabs ($0.18/min) |
| STT                 | Gemini native             | Deepgram ($0.0059/min) |
| **Cost per minute** | **~₹0.35**                | **~₹15–25/min**        |

At 600 min/mo (Growth Voice plan): Own stack = ₹210. Third-party = ₹9,000–₹15,000. Revenue at ₹5,999/mo. Margin: own = 96%, third-party = breaks even at best.

### Virtual Number Strategy

**Primary:** Airtel Business SIP Trunk

- Documents needed: GST ✓, MSME ✓, PAN ✓ — all ready
- Apply: airtel.in/business/sip-trunk OR call 1800-103-0121
- Timeline: 1–2 weeks approval
- Cost: ₹800–1,500/mo trunk + ₹200–400/mo per DID number + ₹0.40–0.50/min outbound

**Backup:** Servetel SIP trunk (faster onboarding, API-first)

**Not needed:** Twilio, Exotel, VAPI — own stack replaces all.

### Client Onboarding Flow (Voice)

```
1. Client clicks "Enable Voice Agent" in ERIX-Connect
2. ECODrIx provisions virtual number via Airtel API
3. Client sets agent name + personality brief
4. Client uploads script / rules (or uses ECODrIx default)
5. Voice language: English / Telugu / Hindi (or mix)
6. Publish → number active, answerable in 60 seconds
7. Use in ERIX-FLOW: Voice Call node → drag into any flow
8. Use in CRM: "Call this lead now" button on contact profile
```

### CRM Inbox Integration

```
After call:
Voice transcript tab in inbox
├── [Speaker: AI Agent] "Hi, is this [Name]?"
├── [Speaker: Lead] "Yes, who's calling?"
├── [Speaker: AI Agent] "I'm calling from [Business] about..."
├── [Speaker: Lead] "I'm interested, tell me more"
└── [Duration: 4m 32s] [Sentiment: Positive] [Intent: Interested]

Audio playback icon: 🔊 → plays recording in browser
Timeline entry: "Voice call — 4m 32s — Intent: Interested — Aug 15, 2026"
```

---

## 12. Technical Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                       │
│  Next.js 15 (App Router) + Tailwind + shadcn/ui         │
│  @ecodrix/erix-api SDK — ALL server communication       │
└──────────────────────┬──────────────────────────────────┘
                       │ SDK calls only (no direct server)
┌──────────────────────▼──────────────────────────────────┐
│                  API SERVER (GCP Cloud Run)               │
│  Express + Hono + TypeScript + Zod validation           │
│  JWT auth (15min) + httpOnly refresh (30d) + OAuth2     │
└────────────┬─────────────────────────┬───────────────────┘
             │                         │
┌────────────▼────────┐   ┌────────────▼───────────┐
│  Supabase PostgreSQL │   │  MongoDB (per-tenant)   │
│  Drizzle ORM        │   │  ecodrix_${userId}      │
│  Platform + LAIE    │   │  CRM contacts, convo    │
└─────────────────────┘   └────────────────────────┘
             │
┌────────────▼────────┐
│  ErixStore          │
│  Port 6399          │
│  SQLite-backed      │
│  Queues + state     │
└─────────────────────┘
```

### Full Stack Reference

| Layer          | Technology                                                                 | Notes                                     |
| -------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| Frontend       | Next.js 15 App Router + TailwindCSS + shadcn/ui + TanStack Query + Zustand | Console at root, AWS-style no-sidebar hub |
| Backend        | Node.js + TypeScript + Express + Hono                                      | GCP Cloud Run, min-instances=0, 1GB RAM   |
| SDK            | @ecodrix/erix-api (BSL licensed, npm)                                      | Frontend-only interface to server         |
| Platform DB    | Supabase PostgreSQL + Drizzle ORM                                          | Platform data + LAIE data                 |
| CRM DB         | MongoDB per-tenant                                                         | ecodrix\_${userId} — full isolation       |
| Queue          | ErixStore (port 6399, SQLite)                                              | Replaces Redis + BullMQ                   |
| Storage        | Cloudflare R2 via ERIX-Storage                                             | CDN at cdn.ecodrix.com                    |
| Email          | AWS SES (50K/day)                                                          | dhanesh@ecodrix.com domain verified       |
| WhatsApp       | Meta Cloud API (Tech Provider status)                                      | Embedded Signup + Instagram DM            |
| AI — Primary   | Anthropic Claude API                                                       | CRM AI, LAIE L4-L5, FLOW agent nodes      |
| AI — Secondary | Gemini 2.0 Flash (GCP credits)                                             | Voice Agent audio pipeline                |
| Voice PBX      | Asterisk (GCE VM, always-on)                                               | SIP call routing                          |
| Voice WebRTC   | LiveKit (Cloud Run, self-hosted)                                           | Browser-to-SIP bridge                     |
| Auth           | JWT 15min + httpOnly refresh 30d                                           | Client portal: email+password gate        |
| Payments       | Razorpay (INR) + Stripe (USD)                                              | Partner OAuth on both                     |
| Infra primary  | GCP Cloud Run + Vercel + GitHub Actions                                    | Using Activate credits                    |
| Infra burst    | AWS EC2 (spot) + S3                                                        | Backup + LAIE scrape bursts               |
| Domain         | ecodrix.com                                                                | Let's Encrypt SSL, Cloudflare proxy       |

### Repo Structure

```
ecodrix/
├── apps/
│   ├── saas/           # Next.js 15 — platform frontend
│   ├── server/         # Hono/Express API server
│   ├── admin/          # Internal admin dashboard
│   └── erixcli/        # ErixStore CLI tool
├── packages/
│   ├── erix-api/       # @ecodrix/erix-api SDK (npm, BSL)
│   ├── erix-store/     # ErixStore engine
│   ├── erix-storage/   # Storage CDN layer
│   └── shared/         # Types, utils, constants
├── infra/
│   ├── gcp/            # Cloud Run configs, GCE Asterisk
│   ├── aws/            # S3, SES, spot instances
│   └── terraform/      # IaC (Phase 3+)
└── .github/
    └── workflows/      # CI/CD GitHub Actions
```

---

## 13. AI Architecture & Behaviour Rules

### AI Is Assistant. User Is Owner.

This is the most important design decision. ECODrIx AI does not act autonomously. It operates within rules set by the tenant (business owner). It never breaks a client's business model.

### AI Layer Architecture

```
User sets rules (one-time setup):
"If lead asks about pricing → share this link"
"If lead says not interested → log as cold, do not follow up"
"If lead books meeting → notify me on WhatsApp"
"Never promise a discount without my approval"

↓ Rules stored as tenant AI config in MongoDB

↓ Every incoming message → AI checks rules → acts within rules only

↓ If message falls outside rules → escalate to human (notify via WhatsApp + email)
```

### AI Tasks (What AI Does)

| Task                | Trigger           | Output                                                    |
| ------------------- | ----------------- | --------------------------------------------------------- |
| Thread summary      | Inbox opened      | 3-line summary of full conversation                       |
| Next action suggest | After AI summary  | "Send pricing PDF. Lead asked twice."                     |
| Outreach generate   | LAIE L5           | 3 personalised message variants                           |
| Pain point extract  | LAIE L4           | 3–5 specific business pain points                         |
| Sentiment analysis  | Post-call         | Positive / Neutral / Negative + confidence                |
| Intent classify     | Post-call/message | Interested / Not now / Rejected / More info needed        |
| Reply generation    | CRM conversation  | Draft reply within user rules → user approves             |
| Payment detection   | Inbox             | Detect "advance", "payment", "pay" → suggest payment link |
| Invoice generate    | Post-payment      | Auto-fill invoice fields from deal data                   |

### AI Escalation Rules

```
ALWAYS escalate (never AI-decide):
- Pricing commitments ("I can give you 20% off")
- Legal questions ("Is this compliant with XYZ?")
- Custom contracts / scope changes
- Refund requests
- Complaint escalations
- Anything the user's rules don't cover

Escalation method: WhatsApp notification to user + SaaS email
"⚠️ [Lead Name] asked about [topic]. Needs your attention."
```

### Models Used Per Function

```
Claude API (primary):
├── LAIE L4: business analysis (long context, nuanced)
├── LAIE L5: outreach generation (creative, personalised)
├── CRM AI: rule-checking, reply drafting
├── FLOW: agent nodes (reasoning, decision)
└── General: summarisation, classification

Gemini 2.0 Flash (GCP credits, secondary):
├── Voice Agent: full audio pipeline (real-time)
├── LAIE scraping assist: page parsing, data extraction
└── Cost-sensitive batch jobs (when GCP credits available)
```

---

## 14. Pricing Architecture

### Core Principle

> Minimum ₹2,499 entry. No ₹999 tier. Perceived value starts at premium. Annual plan = 2 months free.

### Base Plans

| Tier        | INR/mo   | USD/mo | Contacts  | Channels          | LAIE      | FLOW               | AI Calls  |
| ----------- | -------- | ------ | --------- | ----------------- | --------- | ------------------ | --------- |
| **Solo**    | ₹2,499   | $29    | 500       | WA + Email        | 100/mo    | Basic              | 500/mo    |
| **Starter** | ₹4,999   | $59    | 2,000     | All               | 500/mo    | Full               | 2,000/mo  |
| **Growth**  | ₹9,999   | $119   | 10,000    | All + API         | 2,000/mo  | Full + Analytics   | 10,000/mo |
| **Scale**   | ₹25,000+ | $299+  | Unlimited | All + White-label | Unlimited | Full + Marketplace | Unlimited |

### Annual Pricing

| Tier    | Monthly | Annual    | Saving                 |
| ------- | ------- | --------- | ---------------------- |
| Solo    | ₹2,499  | ₹24,990   | ₹4,998 (2 months free) |
| Starter | ₹4,999  | ₹49,990   | ₹9,998                 |
| Growth  | ₹9,999  | ₹99,990   | ₹19,998                |
| Scale   | ₹25,000 | ₹2,50,000 | ₹50,000                |

### Add-Ons

| Add-On                     | Price                                   | Available From       |
| -------------------------- | --------------------------------------- | -------------------- |
| Voice Starter (200 min/mo) | ₹2,999/mo                               | Starter plan +       |
| Voice Growth (600 min/mo)  | ₹5,999/mo                               | Growth plan +        |
| Voice Scale (unlimited)    | ₹12,999/mo                              | Scale plan only      |
| Voice overage              | ₹1.50/min (Starter), ₹1.20/min (Growth) | Per plan             |
| ERIX-Storage 50GB          | ₹499/mo                                 | All plans            |
| ERIX-Storage 200GB         | ₹999/mo                                 | Starter +            |
| ERIX-Storage 1TB           | ₹3,999/mo                               | Growth +             |
| White-label domain embed   | ₹4,999/mo                               | Growth +             |
| Extra LAIE credits (1,000) | ₹999 one-time                           | All plans            |
| API access tier            | ₹15,000/mo                              | Scale only           |
| Custom FLOW build          | ₹5,000–₹15,000 one-time                 | Professional service |

### Partner Club — Commission Tiers

| Tier      | Commission    | Referral Req/mo | Key Benefit                 |
| --------- | ------------- | --------------- | --------------------------- |
| Associate | 15% recurring | 1+              | Dashboard + tracking        |
| Silver    | 20% recurring | 3+              | Co-marketing support        |
| Gold      | 25% recurring | 8+              | Priority support + training |
| Platinum  | 30% recurring | 15+             | White-label rights          |

---

## 15. Implementation Roadmap

### Phase 1 — Validate Core (June 15 – July 15, 2026)

**Goal:** 10 paying clients · CRM + LAIE solid · Meta App Review approved · OPC filed

| Task                                                 | Product    | Priority | Effort |
| ---------------------------------------------------- | ---------- | -------- | ------ |
| LAIE L4: Claude API pain point extraction            | LAIE       | P0       | M      |
| LAIE L5: 3-variant outreach generator                | LAIE       | P0       | M      |
| CRM inbox: voice transcript tab + audio playback     | CRM        | P0       | S      |
| Client portal: login gate + dual conversation thread | CRM        | P0       | L      |
| Pipeline: close-won → auto-project creation trigger  | CRM        | P1       | M      |
| AI thread summariser per inbox thread                | CRM        | P0       | M      |
| Meta App Review: whatsapp_business_messaging submit  | Connect    | P0       | S      |
| Fortune Future Vibe: complete UI/UX, launch          | Client     | P0       | L      |
| LAIE scrape queue: ErixStore-backed, resumable       | LAIE       | P1       | M      |
| Apply Airtel Business SIP Trunk                      | Voice prep | P1       | S      |
| OPC registration: e-PAN for mother → file            | Legal      | P1       | S      |
| SFP accelerator: interview prep complete             | Business   | P1       | S      |

### Phase 2 — Connect + Payments (July 15 – August 15, 2026)

**Goal:** Razorpay + Stripe live · FLOW templates launched · 25 clients · DPIIT applied

| Task                                                 | Product   | Priority | Effort |
| ---------------------------------------------------- | --------- | -------- | ------ |
| Razorpay Partner OAuth + webhook + auto-invoice      | Connect   | P0       | L      |
| Stripe Connect OAuth + international payment         | Connect   | P0       | L      |
| CRM AI: payment keyword detection → link generation  | CRM + AI  | P0       | M      |
| FLOW: 10 pre-built template flows                    | FLOW      | P1       | L      |
| FLOW canvas: error nodes + retry logic               | FLOW      | P1       | M      |
| FLOW: analytics per flow (node-level conversion)     | FLOW      | P2       | M      |
| LAIE: Apollo.io API for professional enrichment      | LAIE      | P1       | S      |
| Partner Club dashboard: referral + commission        | SaaS      | P2       | M      |
| DPIIT recognition application (post OPC)             | Legal     | P1       | S      |
| Content: Instagram + LinkedIn build-in-public launch | Marketing | P1       | S      |

### Phase 3 — Voice Agent Launch (August 15 – September 30, 2026)

**Goal:** Voice add-on live · 50 clients · ₹3.25L/mo MRR · Voice infra operational

| Task                                                  | Product     | Priority | Effort |
| ----------------------------------------------------- | ----------- | -------- | ------ |
| Asterisk SIP PBX: GCE VM + Airtel trunk connect       | Voice Infra | P0       | L      |
| LiveKit WebRTC: Cloud Run deploy + audio bridge       | Voice Infra | P0       | M      |
| Gemini Live API: real-time audio pipeline             | Voice AI    | P0       | L      |
| Post-call: transcript + sentiment + intent extraction | Voice       | P0       | M      |
| CRM inbox: voice transcript tab + audio playback icon | CRM         | P0       | S      |
| FLOW: voice call node (trigger outbound call)         | FLOW        | P1       | M      |
| Voice add-on: usage metering (mins/tenant)            | SaaS        | P0       | M      |
| ERIX-Connect: voice agent card + enable wizard        | Connect     | P0       | M      |
| Voice billing: Razorpay overage charge automation     | SaaS        | P0       | M      |
| SAMRIDH / SISFS grant applications                    | Funding     | P1       | M      |

### Phase 4 — Scale (October – December 2026)

**Goal:** 100 clients · ₹7.5L/mo · Partner Club active · white-label launched

| Initiative                                  | Goal                             | Effort |
| ------------------------------------------- | -------------------------------- | ------ |
| LAIE standalone tier ₹999/mo                | New revenue stream               | M      |
| FLOW template marketplace                   | Network effect + creator revenue | L      |
| API access tier ₹15,000/mo                  | Enterprise entry                 | M      |
| Pan-India Partner Club: 50 active resellers | Distribution                     | M      |
| White-label tier: agency resell rights      | B2B2B revenue                    | M      |
| International pricing: USD tiers            | Global SAM expansion             | S      |
| Passport (Tatkal)                           | Travel readiness                 | S      |
| WEP / Startup India Seed Fund applications  | Non-dilutive capital             | M      |

### Sprint Cadence

```
Weekly: Monday planning → Friday ship
Daily:  Morning build block (no-negotiation protected time)
        Evening: client communication, follow-ups

Review: Every 2 weeks: metrics check, pivot or persist decision
Deploy: GitHub Actions → GCP Cloud Run (automated, every push to main)
```

---

## 16. MVP Feature Status Matrix

| Feature               | Product | Status      | Enhancement Needed                     |
| --------------------- | ------- | ----------- | -------------------------------------- |
| Lead Management       | CRM     | ✅ Built    | Minor UX polish                        |
| Pipeline Kanban       | CRM     | ✅ Built    | Auto-project trigger on close-won      |
| WhatsApp Sequences    | CRM     | ✅ Built    | Condition branching + template library |
| Email Sequences       | CRM     | ✅ Built    | Open/click tracking events             |
| Unified Inbox         | CRM     | ✅ Built    | Voice transcript tab + audio icon      |
| AI Summariser         | CRM     | 🟡 Partial  | Per-thread summary + action suggest    |
| Client Portal         | CRM     | 🟡 Partial  | Login gate + dual conversation thread  |
| Invoice Auto-send     | CRM     | 🔵 Planned  | Razorpay webhook → PDF → WhatsApp      |
| LAIE L1 Scrape        | LAIE    | ✅ Built    | Add Sulekha + IndiaMART sources        |
| LAIE L2 Validate      | LAIE    | ✅ Built    | Improve phone validation accuracy      |
| LAIE L3 Enrich        | LAIE    | 🟡 Partial  | Add Google reviews + social scrape     |
| LAIE L4 AI Analyse    | LAIE    | 🟠 Building | Claude API pain point extraction       |
| LAIE L5 Outreach      | LAIE    | 🔵 Planned  | 3-variant outreach generator           |
| LAIE Export to CRM    | LAIE    | ✅ Built    | Internal; Connect handles external     |
| LAIE Scrape Queue     | LAIE    | 🔵 Planned  | ErixStore-backed, resumable jobs       |
| FLOW Visual Canvas    | FLOW    | ✅ Built    | Performance: 50+ nodes without lag     |
| FLOW Template Library | FLOW    | 🔵 Planned  | 10 pre-built flows, August             |
| FLOW AI Agent Node    | FLOW    | 🟡 Partial  | Claude decision node in-canvas         |
| FLOW Error Handling   | FLOW    | 🔵 Planned  | Retry + fallback paths                 |
| FLOW Voice Node       | FLOW    | 🔵 Planned  | August — trigger call from flow        |
| FLOW Analytics        | FLOW    | 🔵 Planned  | Node-level conversion tracking         |
| Connect — WhatsApp    | Connect | ✅ Live     | Tech Provider verified                 |
| Connect — Instagram   | Connect | ✅ Live     | Meta OAuth2 active                     |
| Connect — Razorpay    | Connect | 🟠 Building | Partner OAuth + webhook + invoice      |
| Connect — Stripe      | Connect | 🟠 Building | Connect OAuth + international          |
| Connect — Voice Agent | Connect | 🔵 Planned  | August — Asterisk + Gemini Live        |
| ErixStore Engine      | Infra   | ✅ Live     | Port 6399, SQLite-backed               |
| ERIX-Storage CDN      | Infra   | 🟡 Partial  | Metering + client API key delivery     |

**Legend:** ✅ Built · 🟡 Partial · 🟠 Building · 🔵 Planned

---

## 17. Competitive Moat Analysis

### Direct Competitors

| Competitor  | Category           | Price/mo    | LAIE?   | FLOW?                | Voice?       | WhatsApp native? |
| ----------- | ------------------ | ----------- | ------- | -------------------- | ------------ | ---------------- |
| WATI        | WhatsApp CRM       | $49+        | ❌      | Basic                | ❌           | ✅               |
| Interakt    | WhatsApp CRM       | ₹2,499+     | ❌      | Basic                | ❌           | ✅               |
| LeadSquared | CRM                | ₹5,000+     | ❌      | Limited              | Add-on       | ❌               |
| Zoho CRM    | CRM Suite          | ₹1,300+     | ❌      | Zoho Flow (separate) | Add-on $$$   | ❌               |
| Freshsales  | CRM                | ₹1,799+     | ❌      | Limited              | ❌           | ❌               |
| HubSpot     | CRM + Marketing    | ₹4,000+     | ❌      | Limited              | Add-on $$$   | ❌               |
| Apollo.io   | Lead data only     | $49+        | Partial | ❌                   | ❌           | ❌               |
| n8n         | Automation only    | $20+        | ❌      | ✅                   | ❌           | ❌               |
| **ECODrIx** | **Full GTM Stack** | **₹2,499+** | **✅**  | **✅**               | **✅ (Aug)** | **✅**           |

### Why ECODrIx Wins

```
1. ONLY platform with LAIE + CRM + FLOW + Voice + Payments in one
2. WhatsApp-native (built for India, not retrofitted)
3. Client portal inside CRM (no need for Basecamp/Notion)
4. AI stays within business rules (SMB-safe)
5. 10x cheaper than HubSpot equivalent feature set
6. ErixStore = unique IP, not commodity open-source
7. Embedded under client domain = invisible, white-label ready
8. Meta Tech Provider = WhatsApp access competitors can't easily get
```

---

## 18. Risk Register

| Risk                                   | Likelihood | Impact | Mitigation                                                         |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------------------------ |
| Meta App Review rejected/delayed       | Medium     | High   | Resubmit with improved demo. Sandbox mode for dev.                 |
| GCP/AWS credits exhausted pre-revenue  | Low        | High   | Revenue-generating features first. Weekly credit monitoring.       |
| Airtel SIP onboarding delay            | Medium     | Medium | Apply now (6+ weeks lead time). Servetel as backup.                |
| LinkedIn scraping — DPDP Act risk      | High       | High   | Do NOT scrape LinkedIn. Apollo API only. Google Maps primary.      |
| Solo founder bandwidth bottleneck      | High       | High   | ERIX-FLOW automates ops. SHRINK THE START. Ship, not perfect.      |
| Client churn before product stabilises | Medium     | Medium | Client health check weekly. Fortune Future Vibe as case study.     |
| OPC delay blocks DPIIT + grants        | Low        | Medium | CA-assisted filing. e-PAN for mother this week.                    |
| AWS ToS violation (dev account)        | Low        | Medium | Use credits wisely. Don't apply for more Activate on that account. |
| Razorpay Partner OAuth approval delay  | Medium     | Medium | Apply partner program now. Servetel SIP = parallel path.           |
| Voice quality issues at launch         | Medium     | Medium | Extensive testing on GCP credits. Soft launch to 3 pilot clients.  |

---

## 19. Founder Execution Principles

### Identity

> _"I am someone who trains and ships daily."_

Every build commit = proof. Every client reply = proof. Every skip = evidence against.

### The 6 Anchors

| Anchor                        | Application                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| **NEVER MISS TWICE**          | Miss a daily build session? Back next day. No streak broken twice.                              |
| **ACT FIRST FEEL LATER**      | Apply Airtel SIP today. OPC filing this week. Ship before perfect.                              |
| **SHRINK THE START**          | Phase 1 = CRM + LAIE core only. Not Voice. Not Partner Club. Not everything.                    |
| **SAME BRAIN SAME STANDARDS** | Code quality, client communication, product decisions — same standard at 6am and 11pm.          |
| **IDENTITY LOCK**             | Founder who ships. Builder who delivers. Not "trying to build a startup." Already building one. |
| **NO NEGOTIATION**            | Morning build block is sacred. Training is sacred. These are not optional on hard days.         |

### The Critical Milestone

```
50 clients before GCP + AWS credits run out
= compound flywheel starts
= revenue covers infra
= voice agent margin funds next feature
= NEVER going back to zero
```

### Monthly Focus Anchor

```
June:    Ship LAIE L4-L5. Fortune Future Vibe live. 5 clients.
July:    Razorpay + Stripe connected. 10 clients. OPC filed.
August:  Voice Agent soft launch. 25 clients. ₹1L+ MRR.
September: Voice full launch. 40 clients. ₹2L+ MRR.
October: Partner Club live. 50 clients. ₹3.25L MRR. ✓
```

---

_ECODrIx Digital Studio · Tirupati, Andhra Pradesh, India_  
*dhanesh@ecodrix.com · GST: 37GHCPM6574C1Z5 · MSME: UDYAM-AP-23-0027846*  
_Meta Tech Provider · GCP Activate · AWS Activate_

**Document ends. Ship starts.**
