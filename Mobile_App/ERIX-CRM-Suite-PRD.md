# ERIX CRM Suite — Product Requirements Document
**Version 1.0 | ECODrIx Technologies**

---

## 1. Product Overview

| Field | Detail |
|---|---|
| Product Name | ERIX CRM Suite |
| Tagline | One inbox, one pipeline, one place to run your business — powered by WhatsApp |
| Parent Platform | ECODrIx (erix-crm module, integrated via erix-connect) |
| Target Market | Pan-India SMBs (not AP/TG limited) |
| Core Value | Unifies CRM, deal pipelines, project delivery, and WhatsApp/IG/Email inbox into one WhatsApp-native workspace |

ERIX CRM Suite is the flagship SaaS product inside ECODrIx. It replaces the disconnected stack most Indian SMBs run today — WhatsApp on a phone, leads in Excel, projects in someone's head — with one system.

---

## 2. Problem Statement

Indian SMBs run their entire sales and delivery process on personal WhatsApp. Leads get lost in chat threads. No one owns the pipeline. Projects slip because there's no shared task view. Existing CRMs (Zoho, Salesforce) are built for enterprise sales teams with email-first workflows — not for a solo founder or 3-person team living inside WhatsApp all day.

> **Critical pain point:** When the person managing WhatsApp is unavailable, the business has no record of what was promised to which customer.

---

## 3. Product Vision

Become the default operating system for India's WhatsApp-first SMBs — where every lead, conversation, deal, and delivery task lives in one connected system, accessible from a phone as easily as a desktop.

---

## 4. Target Audience and ICP

- Solo founders and 2-10 person teams running service or product businesses
- Already doing sales/support over WhatsApp Business
- No formal CRM today, or have abandoned one because it didn't fit WhatsApp workflow
- Agencies, coaches, D2C sellers, real estate, education, healthcare clinics, local service providers

| Attribute | Value |
|---|---|
| Team size | 1–15 |
| Monthly leads | 20–500 |
| Current tools | WhatsApp Business App + Excel/Notion |
| Budget sensitivity | High — needs INR pricing, no forced annual contracts |
| Tech comfort | Medium — needs zero-setup onboarding |

---

## 5. User Personas

### Persona 1: Solo Founder Sandeep
Runs a digital services agency alone. Lead source: Instagram DMs + WhatsApp referrals.

| Attribute | Detail |
|---|---|
| Goal | Never lose a lead, close faster |
| Frustration | Switching between WhatsApp, Notion, and email |
| Success Metric | Time from lead-in to first reply < 5 min |

- Needs mobile-first — works from phone 80% of the time
- Wants pipeline visibility without opening a laptop
- Values WhatsApp-native approval flows over email

### Persona 2: Ops Manager Ramya
Manages a 6-person team at a real estate brokerage. Owns pipeline hygiene and task assignment.

| Attribute | Detail |
|---|---|
| Goal | See every rep's pipeline in one dashboard |
| Frustration | No visibility into what reps promise clients over WhatsApp |
| Success Metric | Zero missed follow-ups per week |

---

## 6. Market Positioning

| Competitor | Strength | Weakness vs ERIX |
|---|---|---|
| Zoho CRM | Feature depth, brand trust | Email-first, WhatsApp bolted on, complex setup |
| Salesforce | Enterprise power | Priced out of SMB reach, steep learning curve |
| Kylas | India-focused, decent pricing | No unified inbox, weak WhatsApp automation |
| WATI / AiSensy | Strong WhatsApp broadcast | No real CRM, no pipeline, no project management |
| Plain WhatsApp Business App | Zero cost, familiar | No pipeline, no team visibility, no history |

ERIX's wedge: the only product combining WhatsApp-native inbox + visual pipeline + lightweight project delivery in one INR-priced SaaS.

---

## 7. Business Goals

1. Convert 5 existing agency clients to paying SaaS users within 6 weeks
2. Reach ₹50K MRR within Phase 2 (per ECODrIx roadmap)
3. Establish unified inbox as the category-defining feature for WhatsApp-first CRM in India

| KPI | Metric | Target | Timeframe | Owner |
|---|---|---|---|---|
| Activation | Signup → first pipeline created | 70% | Week 1 | Product |
| Retention | 30-day active tenant rate | 80% | Ongoing | Product |
| MRR | Monthly recurring revenue | ₹50K | 90 days | Founder |
| Inbox adoption | Tenants connecting WhatsApp | 90% of paid tenants | 30 days | Growth |

---

## 8. Functional Requirements

| Feature | Priority | MVP? | Notes |
|---|---|---|---|
| Unified Inbox (WhatsApp + IG + Email) | P0 | Y | Core differentiator, via erix-connect |
| Contact & Lead Management | P0 | Y | Custom fields, tags, source tracking |
| Visual Pipeline / Deal Board | P0 | Y | Drag-drop stages, WIP limits |
| Automation Rules Engine | P0 | Y | If-this-then-that on stage/tag/inbox events |
| Project & Task Management | P0 | Y | Board per project, linked to deals |
| Team Roles & Permissions | P0 | Y | Owner, Admin, Agent, Viewer |
| WhatsApp Templates & Broadcasts | P1 | Y | Meta-approved template sending |
| Mobile PWA | P0 | Y | Installable, push notifications |
| Native Mobile App (React Native) | P1 | N | Phase 2, post user-count threshold |
| Reporting Dashboard | P1 | Partial | Pipeline velocity, response time SLA |
| E-Signature (ERIX-SIGN) | P2 | N | Scoped separately, later integration |
| API / Webhooks for external tools | P2 | N | Post-MVP |

---

## 9. Non-Functional Requirements

| Category | Requirement | Target Metric |
|---|---|---|
| Performance | Inbox message render latency | < 300ms |
| Availability | Platform uptime | 99.5% |
| Scalability | Concurrent tenants on shared infra | 500+ without re-architecture |
| Security | Data isolation between tenants | Row-level tenant_id scoping, verified |
| Compliance | WhatsApp Business Policy adherence | 100% template compliance |
| Mobile | PWA Lighthouse performance score | > 85 |

---

## 10. Core Features

### 10.1 Unified Inbox
Merges WhatsApp, Instagram DM, and Email (via AWS SES) into a single threaded view per contact. Replies route back through erix-connect to the correct channel automatically.

- Channel badge on every thread (WA / IG / Email)
- Assign conversation to team member
- Internal notes not visible to customer
- Quick-reply macros and WhatsApp template picker

### 10.2 Pipelines
Kanban-style deal board with custom stages per pipeline. Deals link to contacts and can spin off a project on close-won.

- Multiple pipelines per tenant (Sales, Renewals, etc.)
- Stage-based automation triggers
- Deal value roll-up per stage for revenue forecasting

### 10.3 Projects
Lightweight project management triggered from closed deals or created standalone.

- Task boards (To Do / In Progress / Done)
- Due dates, assignees, checklists
- Linked back to originating contact/deal for full context

---

## 11. Secondary Features

- Saved inbox filters (unread, unassigned, by channel)
- Contact merge/dedupe tool
- Bulk tagging and CSV import
- Deal aging alerts (stuck > X days)
- Customer-facing status page per project (future)

---

## 12. Monetization Strategy

| Tier | Price/mo | Features | Limits |
|---|---|---|---|
| Free | ₹0 | 1 pipeline, 50 contacts, inbox (1 channel) | No automation |
| Solo | ₹2,499 | Full inbox, 3 pipelines, projects, automation | 1,000 contacts, 1 user |
| Small Team | ₹4,999 | Everything in Solo + roles, reporting | 5,000 contacts, 5 users |
| Growth | ₹9,999 | Advanced automation, broadcast, API access | 20,000 contacts, 15 users |
| Scale | ₹14,999 | Priority support, custom limits | Unlimited contacts |

Existing agency clients get first access at locked-in early pricing per the ₹999 hidden early-access tier already scoped platform-wide.

---

## 13. Go-To-Market Strategy

**Channels:** Existing ECODrIx agency client base (upsell path), LinkedIn/Instagram founder-brand content, WhatsApp referral loop from activated tenants.

**Launch Week Sequence:**
1. Day 1-2: Migrate 2 existing agency clients as design partners
2. Day 3-4: Collect feedback, fix activation blockers
3. Day 5-7: Open waitlist gate, invite remaining agency clients
4. Week 2: Public LinkedIn announcement with "built in public" narrative

**Pricing Psychology:** Anchor against Zoho/Salesforce sticker shock — INR pricing, no annual lock-in, WhatsApp-native positioning as the headline differentiator.

**First 100 Users:** Sourced from existing service client relationships + LAIE-sourced leads + organic LinkedIn content targeting Tier 2 India founders.

---

## 14. User Stories

**US-1:** As a founder, I want all WhatsApp/IG/Email messages in one inbox, so I never miss a customer message regardless of channel.
- Given a new WhatsApp message arrives, it appears in the unified inbox within 5 seconds
- Given I reply from the inbox, it sends via the correct channel automatically
- Given a conversation is unassigned, it shows in the "Unassigned" filter

**US-2:** As an ops manager, I want to see every rep's pipeline stage counts, so I can spot bottlenecks.
- Given multiple agents own deals, the pipeline board shows owner avatars per card
- Given a deal is stuck > 7 days in a stage, it's visually flagged
- Given I filter by agent, only their deals display

**US-3:** As a founder, I want a deal that closes to auto-create a project, so delivery starts immediately.
- Given a deal moves to "Closed Won," a project is created linked to that contact
- Given the project is created, the assigned agent gets a notification
- Given the deal had custom fields, relevant ones copy into the project

**US-4:** As an agent, I want automation rules on pipeline stage change, so manual follow-up work is reduced.
- Given a deal enters "Proposal Sent," a WhatsApp template auto-sends after 2 days if no reply
- Given the rule fires, it logs an activity entry on the deal
- Given the customer replies, the rule cancels further auto-sends

**US-5:** As a mobile-first founder, I want a PWA I can install on my phone, so I can manage the inbox without a laptop.
- Given I visit the app on mobile Chrome, an install prompt appears
- Given the app is installed, push notifications work for new inbox messages
- Given I'm offline, previously loaded threads remain viewable (read-only)

---

## 15. Use Cases

**Flow: New Lead to Closed Deal**
1. Lead messages on WhatsApp → erix-connect webhook creates contact + inbox thread
2. Agent replies from inbox, manually or via automation, moves deal to pipeline
3. Deal progresses through stages with automation nudges
4. Deal closes → project auto-created → task board populated
5. Delivery tracked; customer updates sent via WhatsApp template from project milestones

---

## 16. Platform Scope

| Surface | In Scope | Notes |
|---|---|---|
| Web app | Y | Primary desktop surface |
| PWA (mobile) | Y | Phase 1 mobile strategy |
| Native app (iOS/Android) | Phase 2 | React Native, triggered by user-count threshold |
| Admin console | Y | Tenant management, billing, usage |
| Public API | Phase 2 | Post-MVP |

---

## 17. Security Requirements

- Tenant data isolation enforced at query layer (tenant_id on every row)
- API keys hashed (SHA-256) per existing erix-connect pattern
- Webhook payloads HMAC-signed
- Role-based access control on all inbox and pipeline actions

> **Critical:** WhatsApp Business API credentials per tenant must never be exposed client-side — all Meta Cloud API calls route through erix-connect server-side only.

---

## 18. Compliance Considerations

- WhatsApp Business Messaging Policy — 24-hour session window enforcement
- Template message pre-approval required before automation can use them
- GST-compliant invoicing for Indian billing (existing ECODrIx GST setup: 37GHCPM6574C1Z5)
- MSME registration already covers ECODrIx (UDYAM-AP-23-0027846)

---

## 19. Scalability Goals

Support growth from 5 pilot tenants to 500+ tenants without re-architecting core services, by relying on existing ErixStore (replacing Redis+BullMQ) and GCP Cloud Run auto-scaling already proven in production.

| Metric | Current Capacity | Target |
|---|---|---|
| Tenants on shared infra | ~10 (pilot) | 500+ |
| Inbox messages/day | Low | 50,000+ |
| Concurrent pipeline users | Low | 1,000+ |

---

## 20. Future Expansion

1. ERIX-SIGN e-signature integrated directly into project close-out
2. AI-suggested next-best-action on deals (outcome-based AI suggestions)
3. Voice agent (Sarvam AI) answering inbox calls when no agent available
4. Public API for third-party integrations (Zapier-style)
5. Marketplace of automation templates by industry vertical

---

## Assumptions Made

- Scope excludes erix-laie (lead sourcing) and erix-flow (long-running automation) — those remain separate modules integrated later
- MongoDB is not part of the data layer; all CRM and project data lives on Supabase PostgreSQL via Drizzle
- Existing agency clients (Sriha/Fortune Future Vibe, Care & Move, Nirvisham) are the first design partners for pilot
- Native mobile app build is gated behind a user-count trigger, not built at MVP
- Pricing tiers reuse the already-locked ECODrIx platform pricing ladder
