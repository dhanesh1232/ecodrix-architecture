# ECODrIx — Niche Personalization & Platform Upgrades Proposal

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Proposal — defines what to build to make ECODrIx the only niche-adaptive WhatsApp CRM platform in India.  
**Depends on:** `MARKET_RESEARCH.md`, `PRODUCT_SPECIFICATION.md`, `CUSTOMER_JOURNEY_MAP.md`

---

## Executive Summary

No competitor (Interakt, WATI, AiSensy, Gallabox, HubSpot, Zoho, Freshsales) offers a **niche-adaptive platform** that reshapes itself based on the user's industry. Every CRM today gives you the same generic pipeline, the same nav, and leaves you to figure out how to adapt it.

ECODrIx will be the first platform where selecting "I'm a coaching institute" or "I'm a real estate broker" at signup **immediately transforms** the entire product — pipeline stages, navigation labels, automation templates, forms, WhatsApp templates, and suggested workflows — into something purpose-built for that business.

This is not "templates you apply manually." This is **the platform becoming your tool on first login.**

---

## Table of Contents

1. [What No One Else Offers (Competitive Gap)](#1-what-no-one-else-offers)
2. [Niche Personalization System](#2-niche-personalization-system)
3. [Doable Upgrades (Built With Existing Code)](#3-doable-upgrades)
4. [Required Upgrades (New Build, High Impact)](#4-required-upgrades)
5. [Niche Pack Definitions](#5-niche-pack-definitions)
6. [Technical Architecture](#6-technical-architecture)
7. [Competitive Comparison](#7-competitive-comparison)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Revenue Impact](#9-revenue-impact)

---

## 1. What No One Else Offers

### The Competitive Gap (No Single Platform Does All This)

| Capability                            | WATI | Interakt | AiSensy | Zoho CRM             | HubSpot            | **ECODrIx**         |
| ------------------------------------- | ---- | -------- | ------- | -------------------- | ------------------ | ------------------- |
| Niche-adaptive nav/labels             | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |
| Auto-pipeline per industry            | ❌   | ❌       | ❌      | Templates (manual)   | Templates (manual) | **Auto on signup**  |
| Niche automation recipes              | ❌   | ❌       | ❌      | Marketplace (paid)   | Marketplace (paid) | **Pre-loaded free** |
| WhatsApp + CRM + Invoicing + Portal   | ❌   | ❌       | ❌      | Partial (addon hell) | $$$                | **One platform**    |
| Industry-specific form templates      | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |
| Contextual onboarding per vertical    | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |
| Lead → Payment complete loop          | ❌   | ❌       | ❌      | Partial              | $$$                | ✅                  |
| AI persona that adapts to your niche  | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |
| Per-tenant payment gateway            | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |
| Visual automation + LAIE intelligence | ❌   | ❌       | ❌      | ❌                   | ❌                 | ✅                  |

**The pitch:** "ECODrIx isn't a generic CRM you spend weeks configuring. It's a platform that becomes YOUR tool the moment you tell it what business you're in."

---

## 2. Niche Personalization System

### 2.1 What Happens at Signup

```
Step 1: Sign up (name, email, phone)
Step 2: "What does your business do?" → Select niche
Step 3: Connect WhatsApp
Step 4: Done → Platform is ALREADY configured

What happened behind the scenes:
├── Pipeline created with niche-specific stages
├── Nav items filtered (irrelevant features hidden)
├── Labels renamed (Contacts → Patients/Students/Buyers)
├── 3-5 automation templates pre-loaded (niche-first)
├── WhatsApp template suggestions seeded
├── Intake form template created
├── AI persona calibrated for the vertical
└── Dashboard widgets configured for what matters
```

### 2.2 Supported Niches (Launch)

| #   | Niche                     | Target user                    | Key workflow                                        |
| --- | ------------------------- | ------------------------------ | --------------------------------------------------- |
| 1   | **Freelancer**            | Solo designer/developer/writer | Lead → Proposal → Project → Invoice → Paid          |
| 2   | **Agency**                | Digital marketing / web agency | Client onboarding → Project → Monthly retainer      |
| 3   | **Healthcare**            | Clinic / doctor / lab          | Patient inquiry → Appointment → Visit → Follow-up   |
| 4   | **Education**             | Coaching / tuition / training  | Inquiry → Demo → Enrollment → Fee collection        |
| 5   | **Real Estate**           | Broker / builder / agent       | Lead → Site visit → Negotiation → Booking → Payment |
| 6   | **D2C / E-commerce**      | Online brand / store           | Customer → Cart → Purchase → Review → Repeat        |
| 7   | **Professional Services** | CA / Lawyer / Consultant       | Client → Docs collection → Work → Filing → Invoice  |

### 2.3 What Each Niche Gets

#### Per-Niche Configuration

| Element                | How it adapts                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Pipeline stages**    | Pre-created with industry-correct stage names and order                                               |
| **Navigation**         | Irrelevant items hidden (not locked — user can enable anytime)                                        |
| **Labels**             | "Contacts" → "Patients" / "Students" / "Buyers" etc.                                                  |
| **Automation recipes** | Top 3-5 industry-specific recipes shown first, badged "Recommended"                                   |
| **Forms**              | Industry intake form pre-created (appointment booking / admission inquiry / project brief)            |
| **WhatsApp templates** | 3-5 suggested templates for Meta approval (follow-up, reminder, invoice)                              |
| **Dashboard widgets**  | Show metrics that matter (appointments today / enrollments this month / deals in pipeline)            |
| **AI persona**         | Business context seeded (AI knows "you're a CA firm with 150 clients")                                |
| **Scoring weights**    | Lead scoring calibrated (real estate: site visit attendance matters; D2C: purchase frequency matters) |

---

## 3. Doable Upgrades (Built With Existing Code)

These upgrades use **code that already exists** — just needs wiring/configuration.

### 3.1 Niche Nav Filtering

| What                                | How                                                                                                                                                                        | Effort     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Hide irrelevant nav items per niche | `moduleKey` already on nav items. Read `service_config.workspace.modules` from `/api/me` and filter. The `applyModulesToGroup` function is referenced but not implemented. | **2 days** |
| Label overrides per niche           | Same modules map carries `label` overrides. Nav renderer swaps label if present.                                                                                           | **1 day**  |

### 3.2 Default Pipeline Per Niche

| What                                              | How                                                                                                                                      | Effort    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Create niche-appropriate pipeline on first enable | `workspace-materialization.ts` already creates a default pipeline. Change from generic "New → Contacted → Won" to niche-specific stages. | **1 day** |

### 3.3 Automation Template Priority

| What                                       | How                                                                                         | Effort     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ---------- |
| Tag templates with niche, sort niche-first | Templates already exist. Add `niche: string[]` field to template schema. UI sorts by match. | **2 days** |
| Badge "Recommended for your business"      | Frontend component change — read niche from context, highlight matching.                    | **1 day**  |

### 3.4 AI Persona Niche Seeding

| What                               | How                                                                                                                                                                      | Effort    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Seed persona with industry context | Onboarding already bootstraps persona. Add niche-specific initial beliefs (e.g. "This business is a CA firm in Tirupati with ~150 clients, main service is ITR filing"). | **1 day** |

### 3.5 Dashboard Widget Configuration

| What                                    | How                                                                                            | Effort     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| Show niche-relevant metrics on overview | Console analytics already has multiple widget options. Show subset based on `workspace.niche`. | **2 days** |

### 3.6 Form Template Seeding

| What                                                   | How                                                                                                                                                 | Effort     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Create one intake form per niche on workspace creation | Forms builder already works. Seed with niche-specific fields (appointment: name/phone/preferred-time; admission: student-name/parent-phone/course). | **2 days** |

**Total doable upgrades effort: ~12 days**

---

## 4. Required Upgrades (New Build, High Impact)

These don't exist yet but would make ECODrIx **genuinely unique** in the market.

### 4.1 Niche Workflow Packs (Pre-Built Complete Flows)

**What:** Not just templates — entire ready-to-activate automation flows that cover the business's complete lifecycle.

| Niche           | Pack includes                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **Healthcare**  | Appointment booked → confirmation → 24hr reminder → post-visit follow-up → 30-day recall               |
| **Education**   | Inquiry received → brochure sent → demo booked → enrollment follow-up → fee reminder                   |
| **Real Estate** | Lead captured → property details sent → site visit scheduled → negotiation follow-up → booking invoice |
| **Freelancer**  | Inquiry → scope call booked → proposal sent → contract signed → project kickoff → invoice on delivery  |

**Effort:** 2-3 weeks (build 7 packs × 3-5 flows each)  
**Impact:** Massive — user activates one button, entire automation is live.

### 4.2 Niche WhatsApp Template Library

**What:** Pre-written, industry-specific WhatsApp templates ready for Meta approval.

| Niche           | Templates                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Healthcare**  | appointment_confirmation, appointment_reminder, post_visit_followup, report_ready, checkup_due              |
| **Education**   | fee_structure, demo_confirmation, seat_urgency, enrollment_welcome, fee_reminder, exam_results              |
| **Real Estate** | property_details, site_visit_confirmation, site_visit_reminder, booking_confirmation, payment_milestone     |
| **D2C**         | order_confirmation, shipping_update, delivery_confirmation, review_request, cart_recovery, restock_reminder |

**Effort:** 1 week (write templates + UI to submit them to Meta in one click)  
**Impact:** Saves users 1-2 weeks of writing + submitting templates manually.

### 4.3 Niche Onboarding Wizard (Contextual)

**What:** After niche selection, show a vertical-specific onboarding flow:

- Healthcare: "Let's set up your appointment system"
- Education: "Let's configure your admission pipeline"
- Real Estate: "Let's connect your lead sources"

Each guides the user through the 3-4 steps that matter MOST for their business.

**Effort:** 2 weeks  
**Impact:** Dramatically improves activation (user sees value in 5 min, not 5 days).

### 4.4 Niche Analytics Dashboard

**What:** Per-niche dashboard that shows the KPIs that actually matter:

| Niche       | Primary metrics                                                                  |
| ----------- | -------------------------------------------------------------------------------- |
| Healthcare  | Appointments today, No-show rate, Patients this month, Follow-ups pending        |
| Education   | Inquiries this week, Demo conversion rate, Enrollments this month, Fee collected |
| Real Estate | Active leads, Site visits scheduled, Deals in negotiation, Bookings this month   |
| D2C         | Carts recovered, Orders today, Review rate, Repeat purchase rate                 |
| Freelancer  | Active projects, Proposals pending, Revenue this month, Overdue invoices         |

**Effort:** 1 week  
**Impact:** User opens dashboard and immediately sees "how my business is doing" — not generic CRM metrics.

### 4.5 Niche Scoring Profiles

**What:** Lead scoring weights that make sense for the industry:

| Niche       | High-weight signals                                     | Low-weight signals             |
| ----------- | ------------------------------------------------------- | ------------------------------ |
| Healthcare  | Appointment booked, Visited, Report viewed              | Email opened (less relevant)   |
| Education   | Demo attended, Fee structure viewed, Parent called back | Social media engagement        |
| Real Estate | Site visit attended, Budget confirmed, Docs submitted   | Email clicks                   |
| D2C         | Purchase made, Cart value, Review left, Referral sent   | WhatsApp read (everyone reads) |

**Effort:** 1 week  
**Impact:** Lead scores become meaningful instead of generic.

### 4.6 Client Portal Per Niche

**What:** The client portal experience adapts based on what the tenant's business is:

| Niche             | Portal shows                                               |
| ----------------- | ---------------------------------------------------------- |
| Healthcare        | "My Appointments" + "My Reports" + "Pay bills"             |
| Education         | "My Classes" + "Fee payment" + "Exam results"              |
| Freelancer/Agency | "Project progress" + "Deliverables" + "Pay invoice"        |
| Real Estate       | "My property shortlist" + "Documents" + "Payment schedule" |

**Effort:** 2 weeks  
**Impact:** Professional client-facing experience that builds trust for the tenant's brand.

### 4.7 Niche-Specific WhatsApp Chatbot Flows

**What:** Pre-built chatbot conversation flows for common inbound queries:

| Niche       | Chatbot handles                                                 |
| ----------- | --------------------------------------------------------------- |
| Healthcare  | "Book appointment" → show available slots → confirm             |
| Education   | "Course fees?" → send brochure → "Book demo?" → schedule        |
| Real Estate | "Show properties in [area]" → send listings → "Schedule visit?" |
| D2C         | "Where's my order?" → lookup → send tracking                    |

**Effort:** 3 weeks  
**Impact:** SMBs get an "AI receptionist" out of the box — zero configuration.

### 4.8 Multi-Location Support (Per Niche)

**What:** For businesses with branches (clinic chains, coaching franchises, multi-branch agencies):

- Each location has its own pipeline/team/number
- Central dashboard sees all locations
- Leads auto-routed to nearest location
- Performance comparison across branches

**Effort:** 4 weeks  
**Impact:** Unlocks franchise/chain accounts (10+ seats per deal).

---

## 5. Niche Pack Definitions

### 5.1 Freelancer Pack

```yaml
niche: freelancer
label_overrides:
  contacts: "Clients"
  pipelines: "Deal Pipeline"
  projects: "Active Projects"
  invoices: "Invoices"

pipeline_stages:
  - { name: "New Lead", color: "#6366f1" }
  - { name: "Discovery Call", color: "#8b5cf6" }
  - { name: "Proposal Sent", color: "#a855f7" }
  - { name: "Negotiation", color: "#d946ef" }
  - { name: "Won", color: "#22c55e" }
  - { name: "Lost", color: "#ef4444" }

modules_enabled:
  - contacts
  - pipelines
  - projects
  - proposals
  - invoices
  - forms
  - automations

modules_hidden:
  - memberships
  - referrals
  - scoring
  - feedback

automation_templates:
  - "Send proposal when deal moves to 'Proposal Sent'"
  - "Follow up if no response in 3 days"
  - "Generate invoice when project marked delivered"
  - "Payment reminder if invoice overdue 7 days"
  - "Thank you message on payment received"

form_template:
  name: "Project Inquiry"
  fields:
    - { label: "Name", type: "text", required: true }
    - { label: "Email", type: "email", required: true }
    - {
        label: "Project type",
        type: "select",
        options: ["Website", "App", "Design", "Other"],
      }
    - {
        label: "Budget range",
        type: "select",
        options: ["< ₹50K", "₹50K-2L", "₹2L-5L", "> ₹5L"],
      }
    - {
        label: "Timeline",
        type: "select",
        options: ["Urgent (< 2 weeks)", "1-2 months", "3+ months"],
      }
    - { label: "Brief", type: "textarea" }

whatsapp_templates:
  - {
      name: "proposal_sent",
      body: "Hi {{1}}, I've sent your proposal for {{2}}. Please review and let me know if you have questions. Reply here or call me.",
    }
  - {
      name: "project_update",
      body: "Hi {{1}}, quick update on {{2}}: {{3}}. Let me know if you'd like to discuss.",
    }
  - {
      name: "invoice_sent",
      body: "Hi {{1}}, invoice #{{2}} for ₹{{3}} is ready. Pay here: {{4}}",
    }
  - {
      name: "payment_thank_you",
      body: "Hi {{1}}, payment received! Thank you. I'll keep you updated on {{2}}.",
    }

dashboard_widgets:
  - active_projects_count
  - proposals_pending
  - revenue_this_month
  - overdue_invoices
  - pipeline_deals_value
```

### 5.2 Healthcare Pack

```yaml
niche: healthcare
label_overrides:
  contacts: "Patients"
  pipelines: "Patient Journey"
  appointments: "Appointments"
  forms: "Intake Forms"
  feedback: "Patient Feedback"

pipeline_stages:
  - { name: "Inquiry", color: "#6366f1" }
  - { name: "Appointment Booked", color: "#8b5cf6" }
  - { name: "Visited", color: "#22c55e" }
  - { name: "Follow-up Due", color: "#f59e0b" }
  - { name: "Retained", color: "#10b981" }
  - { name: "Inactive", color: "#6b7280" }

modules_enabled:
  - contacts
  - pipelines
  - appointments
  - forms
  - feedback
  - automations
  - invoices

modules_hidden:
  - projects
  - proposals
  - referrals
  - memberships
  - scoring

automation_templates:
  - "Auto-confirm appointment on booking"
  - "Send reminder 24 hours before appointment"
  - "Post-visit: 'How are you feeling?' (Day 2)"
  - "30-day follow-up checkup reminder"
  - "Report ready notification on WhatsApp"

form_template:
  name: "Appointment Booking"
  fields:
    - { label: "Patient Name", type: "text", required: true }
    - { label: "Phone", type: "phone", required: true }
    - {
        label: "Doctor",
        type: "select",
        options: ["Dr. General", "Dr. Specialist"],
      }
    - { label: "Preferred Date", type: "date", required: true }
    - {
        label: "Preferred Time",
        type: "select",
        options: ["Morning", "Afternoon", "Evening"],
      }
    - { label: "Symptoms/Reason", type: "textarea" }

whatsapp_templates:
  - {
      name: "appointment_confirmation",
      body: "Hi {{1}}, your appointment with {{2}} is confirmed for {{3}} at {{4}}. Please carry your ID and previous reports.",
    }
  - {
      name: "appointment_reminder",
      body: "Hi {{1}}, reminder: your appointment is tomorrow at {{2}}. Reply 'YES' to confirm or 'RESCHEDULE' to change.",
    }
  - {
      name: "post_visit_followup",
      body: "Hi {{1}}, how are you feeling after your visit? If you need anything, reply here.",
    }
  - {
      name: "report_ready",
      body: "Hi {{1}}, your {{2}} report is ready. Download here: {{3}}",
    }
  - {
      name: "checkup_reminder",
      body: "Hi {{1}}, it's been {{2}} days since your last visit. Time for a follow-up? Book here: {{3}}",
    }

dashboard_widgets:
  - appointments_today
  - patients_this_month
  - no_show_rate
  - followups_pending
  - revenue_collected
```

### 5.3 Education Pack

```yaml
niche: education
label_overrides:
  contacts: "Students / Parents"
  pipelines: "Admission Funnel"
  memberships: "Batches"
  forms: "Inquiry Forms"
  referrals: "Student Referrals"

pipeline_stages:
  - { name: "Inquiry", color: "#6366f1" }
  - { name: "Demo Scheduled", color: "#8b5cf6" }
  - { name: "Demo Attended", color: "#a855f7" }
  - { name: "Fee Discussion", color: "#f59e0b" }
  - { name: "Enrolled", color: "#22c55e" }
  - { name: "Dropped", color: "#ef4444" }

modules_enabled:
  - contacts
  - pipelines
  - forms
  - memberships
  - referrals
  - automations
  - invoices

modules_hidden:
  - projects
  - proposals
  - appointments
  - feedback
  - scoring

automation_templates:
  - "Auto-reply with course brochure + fee structure"
  - "Demo reminder 24hrs before"
  - "Follow up after demo: 'Ready to enroll?'"
  - "Seat urgency: 'Only X seats left' (Day 5)"
  - "Monthly fee reminder (3 days before due)"
  - "Student birthday wish"

form_template:
  name: "Admission Inquiry"
  fields:
    - { label: "Student Name", type: "text", required: true }
    - { label: "Parent Name", type: "text", required: true }
    - { label: "Phone (WhatsApp)", type: "phone", required: true }
    - { label: "Course Interested", type: "select", options: [] }
    - { label: "Current Class/Year", type: "text" }
    - {
        label: "How did you hear about us?",
        type: "select",
        options: ["Google", "Referral", "Walk-in", "Social Media", "Other"],
      }

whatsapp_templates:
  - {
      name: "course_brochure",
      body: "Hi {{1}}, thank you for your interest in {{2}}! Here's our course brochure and fee structure: {{3}}. Book a free demo: {{4}}",
    }
  - {
      name: "demo_reminder",
      body: "Hi {{1}}, reminder: {{2}}'s demo class is tomorrow at {{3}}. Looking forward to seeing them!",
    }
  - {
      name: "enrollment_followup",
      body: "Hi {{1}}, {{2}} attended the demo class. Ready to secure a seat? Only {{3}} seats remaining. Enroll: {{4}}",
    }
  - {
      name: "fee_reminder",
      body: "Hi {{1}}, {{2}}'s monthly fee of ₹{{3}} is due on {{4}}. Pay here: {{5}}",
    }
  - {
      name: "enrollment_welcome",
      body: "Hi {{1}}, welcome to {{2}}! {{3}} is enrolled in {{4}} batch. Classes start {{5}}. Here's the schedule: {{6}}",
    }

dashboard_widgets:
  - inquiries_this_week
  - demo_conversion_rate
  - enrollments_this_month
  - fee_collected
  - upcoming_demos
```

### 5.4 Real Estate Pack

```yaml
niche: real_estate
label_overrides:
  contacts: "Buyers / Leads"
  pipelines: "Deal Pipeline"
  appointments: "Site Visits"
  forms: "Inquiry Forms"

pipeline_stages:
  - { name: "New Inquiry", color: "#6366f1" }
  - { name: "Contacted", color: "#8b5cf6" }
  - { name: "Site Visit Scheduled", color: "#a855f7" }
  - { name: "Site Visit Done", color: "#d946ef" }
  - { name: "Negotiation", color: "#f59e0b" }
  - { name: "Booked", color: "#22c55e" }
  - { name: "Registered", color: "#10b981" }
  - { name: "Lost", color: "#ef4444" }

modules_enabled:
  - contacts
  - pipelines
  - appointments
  - forms
  - automations
  - invoices

modules_hidden:
  - projects
  - proposals
  - memberships
  - referrals
  - scoring
  - feedback

automation_templates:
  - "Auto-reply with property details on new inquiry"
  - "Site visit reminder (morning of visit)"
  - "Follow up inactive lead (no response in 3 days)"
  - "Move to 'Negotiation' when budget confirmed"
  - "Send booking invoice on deal won"

dashboard_widgets:
  - active_leads
  - site_visits_scheduled
  - deals_in_negotiation
  - bookings_this_month
  - pipeline_value
```

### 5.5 D2C / E-commerce Pack

```yaml
niche: d2c
label_overrides:
  contacts: "Customers"
  pipelines: "Customer Journey"
  forms: "Feedback Forms"
  referrals: "Referral Program"

pipeline_stages:
  - { name: "New Customer", color: "#6366f1" }
  - { name: "Engaged", color: "#8b5cf6" }
  - { name: "Purchased", color: "#22c55e" }
  - { name: "Repeat Buyer", color: "#10b981" }
  - { name: "VIP", color: "#f59e0b" }
  - { name: "Churned", color: "#ef4444" }

modules_enabled:
  - contacts
  - pipelines
  - automations
  - forms
  - feedback
  - referrals

modules_hidden:
  - projects
  - proposals
  - appointments
  - memberships
  - scoring
  - invoices

automation_templates:
  - "Abandoned cart recovery (1hr after cart created)"
  - "Order confirmation on WhatsApp"
  - "Review request 2 days after delivery"
  - "COD confirmation: 'Confirm or prepay for 10% off'"
  - "Replenishment reminder (30 days after purchase)"
  - "Win-back: 'We miss you' (60 days inactive)"

dashboard_widgets:
  - orders_today
  - carts_recovered
  - review_rate
  - repeat_purchase_rate
  - referral_signups
```

### 5.6 Agency Pack

```yaml
niche: agency
label_overrides:
  contacts: "Clients"
  pipelines: "Client Pipeline"
  projects: "Client Projects"
  proposals: "Proposals"

pipeline_stages:
  - { name: "Lead", color: "#6366f1" }
  - { name: "Discovery", color: "#8b5cf6" }
  - { name: "Proposal Sent", color: "#a855f7" }
  - { name: "Contract Signed", color: "#d946ef" }
  - { name: "Active Client", color: "#22c55e" }
  - { name: "Churned", color: "#ef4444" }

modules_enabled:
  - contacts
  - pipelines
  - projects
  - proposals
  - invoices
  - forms
  - automations
  - memberships

modules_hidden:
  - referrals
  - scoring
  - feedback
  - appointments

automation_templates:
  - "Welcome sequence: onboarding checklist for new client"
  - "Monthly invoice auto-generate (1st of month)"
  - "Project deadline approaching (3 days before)"
  - "Proposal follow-up if no response (5 days)"
  - "Client anniversary: 'It's been 1 year working together!'"

dashboard_widgets:
  - active_clients
  - proposals_pending
  - mrr_this_month
  - projects_in_progress
  - overdue_invoices
```

### 5.7 Professional Services Pack

```yaml
niche: professional_services
label_overrides:
  contacts: "Clients"
  pipelines: "Engagement Pipeline"
  projects: "Engagements"
  forms: "Document Collection"

pipeline_stages:
  - { name: "New Client", color: "#6366f1" }
  - { name: "Documents Pending", color: "#f59e0b" }
  - { name: "In Progress", color: "#8b5cf6" }
  - { name: "Under Review", color: "#a855f7" }
  - { name: "Filed / Delivered", color: "#22c55e" }
  - { name: "Invoiced", color: "#10b981" }
  - { name: "Paid", color: "#059669" }

modules_enabled:
  - contacts
  - pipelines
  - projects
  - proposals
  - invoices
  - forms
  - automations

modules_hidden:
  - memberships
  - referrals
  - scoring
  - feedback
  - appointments

automation_templates:
  - "Send document checklist on new client onboarding"
  - "Notify when all documents received"
  - "Work completed: auto-notify client + generate invoice"
  - "Payment reminder if overdue 5 days"
  - "Compliance deadline reminder (15 days before)"
  - "Quarterly GST return reminder (bulk to all clients)"

dashboard_widgets:
  - engagements_in_progress
  - documents_pending
  - invoices_unpaid
  - revenue_this_quarter
  - upcoming_deadlines
```

---

## 6. Technical Architecture

### 6.1 Niche Registry (Server)

```
server/src/shared/config/niche-packs.ts
├── NICHE_REGISTRY: Record<NicheId, NichePack>
├── NichePack {
│   id, label, description,
│   pipelineStages[],
│   modulesEnabled[], modulesHidden[], labelOverrides,
│   automationTemplateIds[],
│   formTemplate, whatsappTemplates[],
│   dashboardWidgets[], scoringWeights
│   }
└── Helper functions: getNichePack(id), listNiches()
```

### 6.2 Workspace Materialization (On Onboarding Complete)

```
POST /onboarding/complete { niche: "healthcare", ... }
    │
    ├── 1. Write serviceConfig.workspace.niche = "healthcare"
    ├── 2. Write serviceConfig.workspace.modules = pack.modulesMap
    ├── 3. Create default pipeline with pack.pipelineStages
    ├── 4. Seed automation templates (mark as "niche_suggested")
    ├── 5. Create form from pack.formTemplate
    ├── 6. Seed WhatsApp template suggestions
    └── 7. Calibrate AI persona with niche context
```

### 6.3 Frontend Module Filtering

```typescript
// useNicheConfig() hook — reads from /api/me
const { niche, modules } = useNicheConfig();

// Nav filtering in unified.ts
items
  .filter((item) => {
    if (!item.moduleKey) return true;
    return modules[item.moduleKey]?.enabled !== false;
  })
  .map((item) => ({
    ...item,
    label: modules[item.moduleKey]?.label ?? item.label,
  }));
```

### 6.4 Niche-Aware Template Sorting

```typescript
// In automation templates list component
const sortedTemplates = [...templates].sort((a, b) => {
  const aMatch = a.niches?.includes(currentNiche) ? 0 : 1;
  const bMatch = b.niches?.includes(currentNiche) ? 0 : 1;
  return aMatch - bMatch;
});
// Niche-matching templates get a "Recommended for your business" badge
```

---

## 7. Competitive Comparison

### What This Means vs Competitors

| Scenario                              | Competitor experience                                                 | ECODrIx experience                                                                  |
| ------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CA signs up for CRM                   | Generic pipeline "New → Contacted → Won". Spends 2 hours configuring. | Pipeline: "Client → Docs Pending → In Progress → Filed → Invoiced". Ready in 2 min. |
| Coaching institute wants auto-replies | Search marketplace, buy chatbot addon, configure from scratch.        | "Auto-reply with fee structure" template pre-loaded, one-click activate.            |
| Broker wants site visit reminders     | Build entire automation manually.                                     | "Site visit reminder" rule pre-built, just turn on.                                 |
| D2C brand wants cart recovery         | Integrate Shopify + buy WhatsApp tool + set up flows.                 | "Abandoned cart recovery" flow ready, connect Shopify webhook, done.                |
| Clinic wants appointment system       | Buy separate booking tool + integrate with CRM.                       | Appointment booking form + pipeline + reminders — all built in, niche-configured.   |

**The moat:** Once a user activates 3-5 niche automations, they're sticky. Their business runs on these flows. Switching means rebuilding everything.

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| #   | Task                                                          | Effort |
| --- | ------------------------------------------------------------- | ------ |
| 1   | Create `niche-packs.ts` registry with all 7 niche definitions | 2 days |
| 2   | Modify onboarding complete to stamp niche + modules map       | 1 day  |
| 3   | Implement nav filtering using modules map                     | 2 days |
| 4   | Implement label overrides in nav renderer                     | 1 day  |
| 5   | Default pipeline creation uses niche stages                   | 1 day  |
| 6   | Seed niche form template on workspace create                  | 1 day  |

### Phase 2: Templates & Recipes (Week 3-4)

| #   | Task                                                           | Effort |
| --- | -------------------------------------------------------------- | ------ |
| 7   | Create 3-5 automation templates per niche (35 total)           | 3 days |
| 8   | Tag templates with niche, implement priority sort in UI        | 2 days |
| 9   | "Recommended" badge component                                  | 1 day  |
| 10  | WhatsApp template suggestions per niche (UI to submit to Meta) | 3 days |
| 11  | Niche-specific dashboard widgets                               | 2 days |

### Phase 3: Advanced (Week 5-8)

| #   | Task                                                     | Effort  |
| --- | -------------------------------------------------------- | ------- |
| 12  | Complete workflow packs (3-5 multi-step flows per niche) | 2 weeks |
| 13  | Niche scoring profiles                                   | 1 week  |
| 14  | Niche client portal customization                        | 1 week  |

### Phase 4: Scale Features (Month 3+)

| #   | Task                               | Effort  |
| --- | ---------------------------------- | ------- |
| 15  | Pre-built chatbot flows per niche  | 3 weeks |
| 16  | Multi-location support             | 4 weeks |
| 17  | Niche-specific reporting templates | 2 weeks |

---

## 9. Revenue Impact

### Why This Drives Revenue

| Impact                | Mechanism                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Higher activation** | User sees value in 2 minutes, not 2 days (everything pre-configured)                 |
| **Lower churn**       | Niche automations running = business depends on ECODrIx                              |
| **Higher ARPA**       | Niche-specific add-ons (healthcare: patient portal, education: results broadcasting) |
| **Faster sales**      | Demo shows THEIR workflow, not generic features                                      |
| **Referrals**         | "It's built for coaching institutes" → word-of-mouth within niche                    |
| **Premium pricing**   | "CRM for real estate" commands higher WTP than "generic CRM"                         |

### Pricing Opportunity

| Niche add-on                                    | Price                 | What                                        |
| ----------------------------------------------- | --------------------- | ------------------------------------------- |
| Niche Workflow Pack (all automations activated) | ₹499/mo add-on        | Complete automation suite for your industry |
| Industry Template Library                       | Included in Growth+   | All WhatsApp templates pre-written          |
| Multi-location                                  | ₹999/location/mo      | Branch management for chains                |
| Niche Analytics                                 | Included in Business+ | Industry-specific KPI dashboard             |

---

## Summary

**What makes this unique (no competitor offers it):**

1. Platform transforms itself on niche selection — not manual configuration
2. Pipeline stages match YOUR industry workflow — pre-built
3. Automation templates are YOUR business patterns — one-click activate
4. Navigation shows only what YOU need — no feature overwhelm
5. Labels speak YOUR language — "Patients" not "Contacts"
6. AI understands YOUR business context — from Day 1
7. Complete lead-to-payment loop — configured for YOUR workflow

**The one-line pitch:**

> "Tell us your business. We'll give you a platform that already knows how you work."

---

## Document Governance

| Version | Date     | Change                                 |
| ------- | -------- | -------------------------------------- |
| 1.0     | Aug 2026 | Initial niche personalization proposal |

**Cross-references:**

- Market context: `MARKET_RESEARCH.md`
- Feature specs: `PRODUCT_SPECIFICATION.md`
- Customer journeys: `CUSTOMER_JOURNEY_MAP.md`
- Pricing: `PRICING_MODEL.md`
- GTM: `GTM_PLAYBOOK.md`
