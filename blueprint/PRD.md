> ⚠️ **SUPERSEDED (v1).** The canonical product/pricing blueprint is now
> `../new_mvp.md`. This doc is kept for history. See `../blueprint_audit.md` for
> the conflicts and `../server_capability_audit.md` for the as-built reality.

# ECODrIx Platform — Product Requirements Document

**Version:** 2.0 | **Date:** June 2026 | **Author:** Dhanesh Reddy M

---

## 1. Product Overview

| Field         | Detail                                                                           |
| ------------- | -------------------------------------------------------------------------------- |
| Product Name  | ECODrIx Digital Studio Platform                                                  |
| Tagline       | Cosmic Eagle. Driving the Digital Revolution through Intelligence and Execution. |
| Type          | Multi-Product SaaS Platform                                                      |
| Core Products | ERIX (WhatsApp CRM) + LAIE (Lead Intelligence) + ERIX-FLOW (Automation Canvas)   |
| Target Market | Pan-India SMBs — D2C, Real Estate, Coaches, Agencies, Restaurants, EdTech        |
| Founder       | Dhanesh Reddy M — Solo, Bootstrapped, Tirupati, AP                               |
| GSTIN         | 37GHCPM6574C1Z5                                                                  |
| MSME          | UDYAM-AP-23-0027846                                                              |
| Meta Status   | Verified Tech Provider (Jun 10, 2026)                                            |

ECODrIx is an AWS Console-style multi-product SaaS platform built for Indian SMBs who need WhatsApp automation, lead intelligence, social content automation, and CRM — in one affordable, vernacular-friendly platform. Unlike Zoho (enterprise-complex) or global tools (USD-priced, no WhatsApp-first), ECODrIx is built ground-up for ₹1,000–₹10,000/month SMB budgets with Meta API at the core.

---

## 2. Problem Statement

> **Indian SMBs are drowning in disconnected tools.**

- WhatsApp is their #1 business channel — but no CRM is truly WhatsApp-first
- Lead generation is manual — JustDial/Sulekha scraping done by hand
- Competitor intelligence requires expensive global tools (Sprout Social = $249/month)
- Content posting is manual — no affordable AI-powered scheduling for Indian businesses
- Automation requires 3–5 separate tools with no integration
- No single platform connects: lead gen → CRM → WhatsApp → content → analytics

**The result:** SMBs lose leads, miss follow-ups, waste hours on manual content, and pay for tools that don't talk to each other.

---

## 3. Product Vision

Build the operating system for Indian SMB digital marketing — where every lead, conversation, content piece, and automation lives in one platform, connected by intelligence, executed via WhatsApp.

**5-year north star:** ECODrIx runs with minimal founder attention. 10,000+ SMB subscribers. ₹50L+ MRR. Location-independent.

---

## 4. Target Audience & ICP

### Primary ICP

| Attribute     | Profile                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| Business Type | D2C brand, Real Estate Agent, Coach/Trainer, Digital Agency, Restaurant, EdTech |
| Size          | 1–50 employees, ₹10L–₹5Cr annual revenue                                        |
| Location      | Tier 1–3 Indian cities                                                          |
| Tech Savvy    | Medium — uses WhatsApp Business, Instagram, basic Google tools                  |
| Pain          | Manual follow-ups, no lead tracking, no content strategy                        |
| Budget        | ₹1,000–₹10,000/month for tools                                                  |
| Language      | Hindi, Telugu, English (mixed)                                                  |

### Secondary ICP

| Attribute     | Profile                                  |
| ------------- | ---------------------------------------- |
| Business Type | Digital Marketing Agency                 |
| Use Case      | White-label ECODrIx to their own clients |
| Budget        | ₹15,000–₹50,000/month                    |
| Value         | Reseller margin + client retention       |

---

## 5. User Personas

### Persona 1: Rahul — D2C Brand Owner (Mumbai)

- **Age:** 28 | **Business:** Skincare brand, Instagram-first
- **Pain:** Posts content manually, loses Instagram DM leads, no follow-up system
- **Goal:** Auto-capture IG leads, follow up on WhatsApp, track conversion
- **Willing to pay:** ₹3,999/month
- **Key feature:** IG Auto DM + WhatsApp CRM pipeline

### Persona 2: Priya — Real Estate Agent (Hyderabad)

- **Age:** 35 | **Business:** Independent property consultant
- **Pain:** Manually messages 50+ leads/day on WhatsApp, forgets follow-ups
- **Goal:** Automated WhatsApp sequences, lead pipeline, reminder system
- **Willing to pay:** ₹2,999/month
- **Key feature:** ERIX CRM + WhatsApp broadcast + pipeline

### Persona 3: Karthik — Digital Agency Owner (Chennai)

- **Age:** 32 | **Business:** 15-client social media agency
- **Pain:** No competitor intelligence tool at Indian prices, manual reporting
- **Goal:** White-label content automation, competitor tracking for clients
- **Willing to pay:** ₹9,999/month
- **Key feature:** LAIE Social + white-label + multi-client dashboard

### Persona 4: Meena — Online Coach (Bengaluru)

- **Age:** 40 | **Business:** Nutrition/fitness coach, 2K Instagram followers
- **Pain:** Manually DMs every commenter, no lead capture, no content calendar
- **Goal:** Auto DM on comment, 30-day content calendar, WhatsApp nurture
- **Willing to pay:** ₹1,999/month
- **Key feature:** IG Comment DM + content calendar + WhatsApp sequence

---

## 6. Market Positioning

| Platform      | Price/month   | WhatsApp-First | India-Local | AI Content   | Lead Scraping | CRM     | Automation Canvas |
| ------------- | ------------- | -------------- | ----------- | ------------ | ------------- | ------- | ----------------- |
| **ECODrIx**   | ₹999–₹19,999  | ✅ Native      | ✅ ₹-priced | ✅ Claude AI | ✅ LAIE       | ✅ ERIX | ✅ ERIX-FLOW      |
| Zoho CRM      | ₹800–₹2,400   | ❌ Add-on      | ✅          | ❌           | ❌            | ✅      | ❌                |
| Sprout Social | $99–$249      | ❌             | ❌          | Partial      | ❌            | ❌      | ❌                |
| Wati          | ₹2,999–₹9,999 | ✅             | ✅          | ❌           | ❌            | Basic   | ❌                |
| Leadsquared   | ₹1,250–₹5,000 | Partial        | ✅          | ❌           | ❌            | ✅      | ❌                |
| Apify         | $49–$499      | ❌             | ❌          | ❌           | ✅            | ❌      | ❌                |

**ECODrIx is the only platform combining all 6 capabilities at Indian SMB pricing.**

---

## 7. Business Goals

| KPI              | Metric                    | Target    | Timeframe |
| ---------------- | ------------------------- | --------- | --------- |
| MRR              | Monthly Recurring Revenue | ₹1,00,000 | Month 6   |
| MRR              | Monthly Recurring Revenue | ₹5,00,000 | Month 12  |
| Subscribers      | Active paying users       | 100       | Month 6   |
| Subscribers      | Active paying users       | 500       | Month 12  |
| Churn            | Monthly churn rate        | <5%       | Ongoing   |
| NPS              | Net Promoter Score        | >50       | Month 9   |
| CAC              | Customer Acquisition Cost | <₹2,000   | Month 6   |
| LTV              | Lifetime Value            | >₹24,000  | Month 12  |
| Services Revenue | Monthly agency revenue    | ₹1,50,000 | Month 3   |

---

## 8. Core Products — Functional Requirements

### PRODUCT 1: ERIX — WhatsApp-First CRM

| Feature                            | Priority | MVP?  | Notes                        |
| ---------------------------------- | -------- | ----- | ---------------------------- |
| Contact management (import/manual) | P0       | ✅    | CSV + manual + WhatsApp sync |
| WhatsApp conversation inbox        | P0       | ✅    | Multi-agent, per-tenant      |
| Message templates (send/manage)    | P0       | ✅    | Meta-approved templates      |
| Pipeline + deal stages             | P0       | ✅    | Kanban + list view           |
| Broadcast campaigns                | P0       | ✅    | Segment + schedule           |
| ERIX Connect (Embedded Signup)     | P0       | ✅    | 1-click WABA connection      |
| WhatsApp auto-reply (keyword)      | P1       | ✅    | Rule-based                   |
| Contact tags + segments            | P1       | ✅    | Dynamic + manual             |
| WhatsApp chatbot builder           | P1       | Later | Visual flow builder          |
| Team inbox (multi-agent)           | P1       | ✅    | Assign conversations         |
| Analytics dashboard                | P1       | ✅    | Delivery, read, reply rates  |
| Facebook Lead Ads → WhatsApp       | P2       | Later | Auto-trigger on lead form    |
| API webhooks (outbound)            | P2       | Later | For ERIX-FLOW integration    |

### PRODUCT 2: LAIE — Lead AI Intelligence Engine

| Feature                          | Priority | MVP?  | Notes                          |
| -------------------------------- | -------- | ----- | ------------------------------ |
| Google Maps lead scraper         | P0       | ✅    | Business name, phone, category |
| JustDial scraper                 | P0       | ✅    | Category + city targeting      |
| Sulekha scraper                  | P0       | ✅    | Service provider leads         |
| Lead enrichment (phone + email)  | P0       | ✅    | Verify + append data           |
| Export to CSV / push to ERIX CRM | P0       | ✅    | One-click push                 |
| Instagram competitor scraper     | P1       | ✅    | Posts, engagement, hashtags    |
| Content pattern analysis (AI)    | P1       | ✅    | Claude API                     |
| AI caption generator             | P1       | ✅    | Brand voice, 30-day calendar   |
| Instagram auto-post (Meta API)   | P1       | ✅    | Schedule + publish             |
| IG Comment → Auto DM trigger     | P1       | ✅    | Keyword-based                  |
| LinkedIn lead scraper            | P2       | Later | Profile + company data         |
| Competitor content alerts        | P2       | Later | Real-time monitoring           |
| SEO competitor tracking          | P3       | No    | Future: LAIE SEO module        |

### PRODUCT 3: ERIX-FLOW — No-Code Automation Canvas

| Feature                                            | Priority | MVP?  | Notes                |
| -------------------------------------------------- | -------- | ----- | -------------------- |
| Visual drag-and-drop canvas                        | P0       | ✅    | React Flow based     |
| Trigger nodes (WhatsApp, IG, form, webhook)        | P0       | ✅    | Event-driven         |
| Action nodes (send WA, post IG, add to CRM, email) | P0       | ✅    | Multi-channel        |
| Condition/logic nodes (if/else, delay, filter)     | P0       | ✅    | Flow branching       |
| Pre-built templates (10 workflows)                 | P1       | ✅    | Common SMB use cases |
| AI node (Claude — summarize, generate, classify)   | P1       | ✅    | Inline AI action     |
| Webhook in/out                                     | P1       | ✅    | Zapier-alternative   |
| Flow versioning + rollback                         | P2       | Later |                      |
| Flow analytics (run history, errors)               | P2       | Later |                      |
| Multi-tenant flow isolation                        | P0       | ✅    | Critical             |

---

## 9. Non-Functional Requirements

| Category    | Requirement                  | Target Metric                          |
| ----------- | ---------------------------- | -------------------------------------- |
| Performance | API response time            | <200ms p95                             |
| Performance | Dashboard load time          | <1.5s FCP                              |
| Uptime      | Platform availability        | 99.9%                                  |
| Scalability | Concurrent users per tenant  | 50+                                    |
| Security    | Data isolation               | Strict per-tenant (MongoDB per user)   |
| Security    | Auth token expiry            | 15min access / 30d refresh             |
| Compliance  | PDPB (India data protection) | Data stored in India (GCP asia-south1) |
| Mobile      | Responsive dashboard         | Full mobile support                    |
| WhatsApp    | Message delivery rate        | >98%                                   |
| Scraping    | LAIE scrape success rate     | >85%                                   |

---

## 10. Monetization Strategy

### ERIX — WhatsApp CRM

| Tier       | Price/month | Contacts  | WA Messages | Agents    | Features               |
| ---------- | ----------- | --------- | ----------- | --------- | ---------------------- |
| Starter    | ₹999        | 500       | 1,000       | 1         | CRM + basic broadcast  |
| Growth     | ₹2,499      | 2,500     | 5,000       | 3         | + pipeline + templates |
| Scale      | ₹5,999      | 10,000    | 20,000      | 10        | + chatbot + analytics  |
| Enterprise | ₹14,999     | Unlimited | Unlimited   | Unlimited | + white-label + API    |

### LAIE — Lead Intelligence + Social

| Tier    | Price/month | Lead Credits | Competitors Tracked | AI Posts/month          |
| ------- | ----------- | ------------ | ------------------- | ----------------------- |
| Starter | ₹1,499      | 500          | 3                   | 15                      |
| Growth  | ₹3,999      | 2,000        | 10                  | 60                      |
| Scale   | ₹7,999      | 10,000       | 30                  | Unlimited               |
| Agency  | ₹19,999     | Unlimited    | Unlimited           | Unlimited + white-label |

### ERIX-FLOW — Automation Canvas

| Tier    | Price/month | Active Flows | Flow Runs/month | AI Nodes  |
| ------- | ----------- | ------------ | --------------- | --------- |
| Starter | ₹799        | 3            | 1,000           | ❌        |
| Growth  | ₹1,999      | 15           | 10,000          | 5/month   |
| Scale   | ₹4,999      | Unlimited    | 100,000         | Unlimited |

### DFY Services (One-time)

| Package         | Price   | Includes                                                |
| --------------- | ------- | ------------------------------------------------------- |
| ERIX Setup      | ₹5,000  | WABA connect + 5 templates + basic flows                |
| LAIE Setup      | ₹8,000  | Scraper config + 3 competitors + first content calendar |
| Full Onboarding | ₹24,000 | All products + 30-day handholding                       |

---

## 11. Go-To-Market Strategy

### Phase 1: First 50 Customers (Month 1–3)

- **Channel 1:** Cold WhatsApp outreach to Tirupati/AP SMBs (using LAIE itself)
- **Channel 2:** LinkedIn content — Tier 2 India founder positioning
- **Channel 3:** Instagram Reels — "I built this for Indian businesses"
- **Channel 4:** Existing service clients → convert to SaaS subscribers
- **Pricing psychology:** ₹999 Starter = "less than a freelancer's one day fee"
- **Launch hook:** "Meta Verified Tech Provider — official WhatsApp automation"

### Phase 2: 100–500 Customers (Month 4–9)

- **Channel 5:** Agency reseller program (₹15,000–₹50,000/month)
- **Channel 6:** Meta Partner Directory listing
- **Channel 7:** Google Ads — "WhatsApp CRM India", "social media automation India"
- **Channel 8:** YouTube tutorials — SEO-driven organic
- **Referral:** ₹500 credit per referred paying customer

### First 100 Users Acquisition Plan

1. Week 1–2: 500 cold WhatsApp messages to D2C brands (LAIE scrapes leads)
2. Week 3–4: 5 LinkedIn posts/week + 3 Instagram Reels/week
3. Month 2: Free 14-day trial for first 50 signups
4. Month 2: Onboard 5 agency partners at ₹9,999/month
5. Month 3: First case study published (Care & Move as flagship)

---

## 12. User Stories

### ERIX — WhatsApp CRM

**US-001: Contact Import**

> As a business owner, I want to import my existing contacts from CSV so I can start broadcasting without manual data entry.

- Acceptance: CSV upload with column mapping UI
- Acceptance: Duplicate detection + merge
- Acceptance: Shows import summary (success/failed/duplicate counts)

**US-002: ERIX Connect — Embedded Signup**

> As a new user, I want to connect my WhatsApp Business Account in one click so I don't need technical knowledge.

- Acceptance: Meta Embedded Signup flow completes in <2 minutes
- Acceptance: WABA credentials stored at platform level
- Acceptance: Test message sent after successful connection

**US-003: Broadcast Campaign**

> As a coach, I want to send a promotional message to 500 contacts at once so I can announce my new course.

- Acceptance: Segment selection before send
- Acceptance: Approved template required
- Acceptance: Delivery report available within 5 minutes

### LAIE — Lead Intelligence

**US-004: Google Maps Lead Extraction**

> As a digital agency, I want to extract 200 restaurants in Chennai with their phone numbers so I can run a cold outreach campaign.

- Acceptance: City + category input
- Acceptance: Results within 60 seconds for 200 leads
- Acceptance: One-click push to ERIX CRM

**US-005: Competitor Content Analysis**

> As a D2C brand, I want to see what content my top 3 competitors are posting so I can identify gaps in my own strategy.

- Acceptance: Instagram handle input
- Acceptance: Last 30 posts with engagement metrics
- Acceptance: AI summary of top content patterns

**US-006: AI Content Calendar**

> As a coach, I want a 30-day Instagram content calendar generated from my competitor analysis so I don't spend hours planning.

- Acceptance: Calendar generated in <30 seconds
- Acceptance: Captions in specified brand voice
- Acceptance: Hashtag sets included per post

### ERIX-FLOW — Automation

**US-007: IG Comment → WhatsApp DM Flow**

> As a product seller, I want anyone who comments "INFO" on my post to automatically receive my product catalogue on WhatsApp so I never miss a lead.

- Acceptance: Flow triggers within 30 seconds of comment
- Acceptance: Contact auto-added to ERIX CRM
- Acceptance: Follow-up message scheduled 24 hours later

---

## 13. Platform Scope

| Platform               | Included       |
| ---------------------- | -------------- |
| Web App (SaaS Console) | ✅ Next.js 15  |
| Mobile Web             | ✅ Responsive  |
| Native Mobile App      | ❌ Phase 4     |
| Public API             | ✅ Phase 3     |
| Chrome Extension       | ❌ Phase 5     |
| Desktop App            | ❌ Not planned |

---

## 14. Security Requirements

> **CRITICAL:** All tenant data must be strictly isolated. No cross-tenant data access is possible under any circumstance.

- JWT-based auth: 15-minute access tokens, 30-day httpOnly refresh tokens
- Per-tenant MongoDB database: `ecodrix_${userId}` — zero shared collections
- Row-level security on Supabase PostgreSQL for platform data
- All API calls via `@ecodrix/erix-api` SDK — no direct server exposure to frontend
- Meta API credentials encrypted at rest (AES-256)
- WABA tokens stored platform-level, never exposed to frontend
- Rate limiting on all public endpoints (ErixStore-powered)
- Audit log for all billing + admin actions

---

## 15. Compliance Considerations

- India PDPB (Personal Data Protection Bill) — data residency in GCP asia-south1
- Meta Platform Policy — Tech Provider verified, Embedded Signup compliant
- GST compliance — GSTIN 37GHCPM6574C1Z5 on all invoices
- WhatsApp Business Policy — only approved templates for broadcasts
- TRAI DND compliance — opt-out mechanism on all campaigns
- No scraping of private/login-gated data — LAIE only scrapes public data

---

## 16. Scalability Goals

| Dimension            | Current | 6 Months | 12 Months |
| -------------------- | ------- | -------- | --------- |
| Tenants              | <10     | 100      | 500       |
| Contacts per tenant  | <1,000  | 10,000   | 100,000   |
| WA messages/day      | <1,000  | 50,000   | 500,000   |
| LAIE scrape jobs/day | <100    | 5,000    | 50,000    |
| FLOW executions/day  | <1,000  | 100,000  | 1,000,000 |

---

## 17. Future Expansion

1. **ERIX Social** — Full Instagram + Facebook CRM (DMs, comments, stories)
2. **LAIE SEO** — Competitor keyword + backlink intelligence
3. **ERIX Pay** — Payment links via WhatsApp (Razorpay integration)
4. **ERIX Voice** — AI voice calls for lead follow-up
5. **ECODrIx Mobile App** — Native iOS + Android
6. **White-label Platform** — Agencies rebrand ECODrIx as their own
7. **LAIE Data API** — Sell enriched B2B data to other platforms
8. **International Expansion** — SEA (Indonesia, Philippines) — Year 2

---

## 18. Assumptions Made

- Solo founder build — all phases sized for 1 developer + Claude Code
- WhatsApp remains primary business communication in India through 2027
- Meta Tech Provider status maintained with regular activity
- GCP + AWS credits cover infrastructure through 2027
- Services revenue (₹1L+/month) funds SaaS development runway
- LAIE scraping of public data remains legally permissible in India
- ErixStore handles queue + cache needs without external Redis
