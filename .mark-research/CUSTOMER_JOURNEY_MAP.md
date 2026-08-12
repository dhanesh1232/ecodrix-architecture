# ECODrIx — Customer Journey Map

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Active — maps every step from discovery to retained customer, per vertical.  
**Depends on:** `MARKET_RESEARCH.md`, `PRODUCT_SPECIFICATION.md`

---

## Table of Contents

1. [Generic Customer Journey (All Verticals)](#1-generic-customer-journey)
2. [Vertical: Real Estate Broker](#2-vertical-real-estate-broker)
3. [Vertical: Education / Coaching Institute](#3-vertical-education--coaching-institute)
4. [Vertical: Healthcare / Clinic](#4-vertical-healthcare--clinic)
5. [Vertical: D2C / E-commerce Brand](#5-vertical-d2c--e-commerce-brand)
6. [Vertical: Professional Services (CA/Consultant)](#6-vertical-professional-services)
7. [Vertical: Digital Agency (Reseller)](#7-vertical-digital-agency)
8. [Onboarding Flow (Technical)](#8-onboarding-flow)
9. [Activation Milestones](#9-activation-milestones)
10. [Churn Risk Indicators](#10-churn-risk-indicators)

---

## 1. Generic Customer Journey

### 1.1 Awareness → Trial → Activation → Retention → Expansion

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│AWARENESS │──▶│  TRIAL   │──▶│ACTIVATION│──▶│RETENTION │──▶│EXPANSION │
│          │   │          │   │          │   │          │   │          │
│ "I need  │   │ Sign up  │   │ First    │   │ Weekly   │   │ Upgrade  │
│  a better│   │ free     │   │ value    │   │ active   │   │ plan,    │
│  way"    │   │ account  │   │ moment   │   │ usage    │   │ add team │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │
     │              │              │              │              │
  Channels:      Day 0          Day 1-3        Month 1+        Month 3+
  - Google       - 2min         - Connect WA   - Pipeline      - LAIE
  - WhatsApp     - Onboarding   - First lead   - Automation    - More
  - Referral     - wizard       - First reply   - Campaigns      channels
  - Agency                                     - Invoicing     - White-label
```

### 1.2 Key Moments of Truth

| #   | Moment                                    | Target time                | If we miss it            |
| --- | ----------------------------------------- | -------------------------- | ------------------------ |
| 1   | **Sign up → Dashboard**                   | < 2 minutes                | They leave, never return |
| 2   | **Connect WhatsApp**                      | < 5 minutes from signup    | Can't use core product   |
| 3   | **First inbound message appears as lead** | < 24 hours                 | Don't see value          |
| 4   | **First reply sent from platform**        | < 10 minutes of first lead | "Aha moment"             |
| 5   | **First deal moved in pipeline**          | < 3 days                   | Don't adopt CRM mindset  |
| 6   | **First automation fires**                | < 7 days                   | Missing the "magic"      |
| 7   | **First payment collected via platform**  | < 30 days                  | Revenue loop not closed  |

### 1.3 Emotional Journey

```
Excitement    ★ ★ ★ ★ ★                                    ★ ★ ★ ★ ★
              │          ↘                                ↗
              │            ★ ★ ★                      ★ ★
Neutral       │                  ↘                  ↗
              │                    ★ ★            ★
Frustration   │                        ↘        ↗
              │                          ★ ★ ★ ★
              └────────────────────────────────────────────────────
              Sign  Connect  Wait for  Learn   First    Automation  Payment
              up    WA       leads     CRM     win      working     collected

              "Easy!"  "That  "Where   "Lot    "This    "Wow it    "Money in
                       was    are my   of      works!"  does it     my bank!"
                       fast!" leads?"  tabs..."         for me!"
```

**The dip** (days 2-7) is where most users churn. They've connected WhatsApp but:

- Haven't received enough leads to see value
- CRM feels like "more work" (data entry)
- Don't know what automation to set up

**Mitigation:** Guided onboarding that pre-configures automation rules for their vertical.

---

## 2. Vertical: Real Estate Broker

### Persona: Raj (solo broker, Hyderabad, 200 leads/month from 99acres + MagicBricks)

#### Current Workflow (Before ECODrIx)

```
Day 1: 99acres inquiry → WhatsApp notification → reply from personal phone
Day 2: 3 more inquiries → save numbers in contacts → "I'll follow up later"
Day 5: Forgot about Day 1 leads → they already bought from another broker
Day 10: Excel sheet has 50 names, no idea who's hot, who's cold
Day 30: "I spend on ads but deals aren't closing" → blames the portal
```

#### ECODrIx Journey

| Stage                 | Action                         | Feature used               | Outcome                                                                      |
| --------------------- | ------------------------------ | -------------------------- | ---------------------------------------------------------------------------- |
| **Setup (Day 0)**     | Sign up, connect WhatsApp      | Embedded Signup            | WA API active in 3 min                                                       |
| **Configure (Day 0)** | Choose "Real Estate" template  | Vertical template          | Pre-built pipeline: Inquiry → Site Visit → Negotiation → Booked → Registered |
| **Day 1**             | First inquiry comes in         | Lead auto-capture          | Lead appears in pipeline, auto-assigned                                      |
| **Day 1**             | Reply with property details    | Quick reply template       | Professional response in 10 sec                                              |
| **Day 1**             | Auto follow-up scheduled       | Sequence enrollment        | "Hi [name], would you like to schedule a site visit?" goes out in 24hrs      |
| **Day 3**             | Lead replies "Yes"             | Conversation + appointment | Site visit booked, Google Calendar synced                                    |
| **Day 3**             | Reminder sent morning of visit | Automation rule            | "Reminder: Your site visit is today at 4pm"                                  |
| **Day 7**             | Deal moves to "Negotiation"    | Pipeline drag-and-drop     | Raj sees his funnel filling up                                               |
| **Day 14**            | Deal won — "Booked"            | Pipeline → Project         | Auto-creates project with registration tasks                                 |
| **Day 14**            | Send booking amount invoice    | Commerce → Invoice         | ₹5L advance invoice with Razorpay link on WhatsApp                           |
| **Day 14**            | Payment received               | Webhook                    | Auto-marked paid, receipt sent, "Thank you" message                          |
| **Day 30**            | Reviews pipeline analytics     | Dashboard                  | "I closed 8 deals this month vs 3 last month"                                |

#### Key Automations for Real Estate

| Trigger                    | Action                                                       | Impact       |
| -------------------------- | ------------------------------------------------------------ | ------------ |
| New lead (source: 99acres) | Auto-tag "99acres", assign to available agent, send greeting | No lead lost |
| Lead inactive 3 days       | Send "Still looking for a property?" template                | Re-engage    |
| Site visit completed       | Move to "Negotiation" stage, send thank-you + next steps     | Progress     |
| Deal won                   | Create project, send booking invoice                         | Revenue      |
| Payment overdue 7 days     | Send reminder on WhatsApp                                    | Cash flow    |

#### Entry Point (Marketing Message)

> "Stop losing 99acres leads. Auto-capture every inquiry, follow up on WhatsApp automatically, and close 2x more deals. Setup in 5 minutes."

---

## 3. Vertical: Education / Coaching Institute

### Persona: Priya (owns NEET coaching institute, Vijayawada, 5 faculty, 300 inquiries/month)

#### Current Workflow (Before ECODrIx)

```
Parent calls/WhatsApps about NEET coaching
→ Receptionist notes in register
→ Sends fee structure PDF manually
→ Parent says "I'll think about it"
→ No follow-up (receptionist forgot)
→ Parent enrolls at competitor who called back
→ End of admission season: 60% seats unfilled
```

#### ECODrIx Journey

| Stage        | Action                                   | Feature                         | Outcome                                                                                          |
| ------------ | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Setup**    | Connect WA + choose "Education" template | Template                        | Pipeline: Inquiry → Demo Class → Fee Discussion → Enrolled → Dropped                             |
| **Day 1**    | Parent sends "NEET coaching fees?" on WA | Auto-reply                      | Instant: course brochure + fee structure + demo class booking link                               |
| **Day 1**    | Parent books demo class                  | Appointment                     | Confirmation + reminder setup                                                                    |
| **Day 3**    | Demo class attended                      | Manual move to "Fee Discussion" | Triggers follow-up sequence                                                                      |
| **Day 3**    | Auto-sequence starts                     | Sequence                        | Day 1: "How was the demo?" / Day 3: "Limited seats, early bird ₹5K off" / Day 7: "Last 10 seats" |
| **Day 7**    | Parent says "Ready to enroll"            | Pipeline move                   | "Enrolled" stage                                                                                 |
| **Day 7**    | Invoice sent                             | Commerce                        | ₹1.2L course fee, payment link on WhatsApp                                                       |
| **Day 7**    | Payment received                         | Webhook                         | Auto-enrolled, welcome message + batch details sent                                              |
| **Monthly**  | Fee reminder for EMI plans               | Automation                      | "Your monthly installment of ₹10,000 is due"                                                     |
| **Exam day** | Bulk results on WhatsApp                 | Campaign                        | Personalized: "Hi [parent], [student] scored 580/720 in mock test #3"                            |

#### Key Automations for Education

| Trigger                                | Action                                     | Impact                  |
| -------------------------------------- | ------------------------------------------ | ----------------------- |
| New inquiry                            | Send course brochure + demo booking link   | Instant engagement      |
| Demo attended, no enrollment in 5 days | Send urgency message (seat count)          | Conversion pressure     |
| Enrolled                               | Welcome kit + batch details + fee schedule | Professional onboarding |
| Fee due date approaching               | Reminder 3 days before                     | Reduce defaults         |
| Student birthday                       | Automated wish (builds relationship)       | Retention               |

#### Entry Point

> "Convert admission inquiries into enrolled students — automatically. No more forgetting follow-ups."

---

## 4. Vertical: Healthcare / Clinic

### Persona: Dr. Sharma (multi-speciality clinic, Tirupati, 2 doctors + receptionist, 40 appointments/day)

#### Current Workflow

```
Patient calls to book appointment
→ Receptionist checks paper diary
→ "Come at 4pm tomorrow"
→ Patient forgets → No-show (30% no-show rate)
→ Doctor's slot wasted
→ Reports ready → patient has to visit again to collect
→ Follow-up never happens (doctor too busy)
```

#### ECODrIx Journey

| Stage          | Action                                         | Feature     | Outcome                                                         |
| -------------- | ---------------------------------------------- | ----------- | --------------------------------------------------------------- |
| **Setup**      | Connect WA + "Healthcare" template             | Template    | Pipeline: Inquiry → Booked → Visited → Follow-up → Retained     |
| **Day 1**      | Patient WhatsApps "Appointment for Dr. Sharma" | Auto-reply  | "Choose a slot: [booking link]" with available times            |
| **Day 1**      | Patient selects slot                           | Appointment | Confirmation + "Please bring Aadhaar + previous reports"        |
| **Day before** | Automated reminder                             | Automation  | "Reminder: Your appointment with Dr. Sharma is tomorrow at 4pm" |
| **Visit day**  | Patient visits, receptionist marks "Visited"   | Pipeline    | Triggers post-visit flow                                        |
| **Day 2**      | Post-visit follow-up                           | Automation  | "How are you feeling after the visit? Any concerns?"            |
| **Day 3**      | Lab reports ready                              | File share  | Report PDF sent on WhatsApp (via erix-storage)                  |
| **Day 30**     | Monthly check-up reminder                      | Sequence    | "It's been 30 days. Time for your follow-up. Book here: [link]" |
| **Day 90**     | Vaccination/preventive reminder                | Automation  | "Your annual health checkup is due"                             |

#### Key Automations for Healthcare

| Trigger                  | Action                                  | Impact                 |
| ------------------------ | --------------------------------------- | ---------------------- |
| Appointment booked       | Confirmation + preparation instructions | Professional           |
| 24hrs before appointment | WhatsApp reminder                       | -60% no-shows          |
| Visit completed          | Post-visit care instructions            | Patient satisfaction   |
| Reports ready            | Auto-send on WhatsApp                   | No return visit needed |
| 30/60/90 day mark        | Follow-up reminder                      | Repeat visits          |
| Birthday                 | Health wishes + annual checkup offer    | Retention              |

#### Entry Point

> "Reduce no-shows by 60%. Send appointment reminders, lab reports, and follow-ups on WhatsApp — automatically."

---

## 5. Vertical: D2C / E-commerce Brand

### Persona: Vikram (men's grooming brand, Bangalore, 10-person team, 500 orders/day, ₹2Cr/month)

#### Current Workflow

```
Customer orders on website
→ Confirmation via email (20% open rate)
→ Customer WhatsApps "Where's my order?"
→ Support team checks Shopify manually
→ Abandoned cart → no recovery (email ignored)
→ Return customer → starts from scratch (no history)
→ Review collection → manual emails (5% response)
```

#### ECODrIx Journey

| Stage              | Action                            | Feature          | Outcome                                                                       |
| ------------------ | --------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| **Setup**          | Connect WA + Shopify webhook      | Connect          | Order events flow into ECODrIx                                                |
| **Order placed**   | Auto WhatsApp confirmation        | Automation       | "Order #1234 confirmed! Track: [link]" (98% read rate vs 20% email)           |
| **Shipping**       | Status update on WhatsApp         | Event trigger    | "Your order shipped! Delivery by [date]"                                      |
| **Delivered**      | Review request                    | Sequence (Day 2) | "How's your Beard Oil? Rate us: ⭐⭐⭐⭐⭐"                                   |
| **Abandoned cart** | Recovery message                  | Automation (1hr) | "You left [product] in cart. Complete order: [link]" — 15% recovery rate      |
| **Day 30**         | Replenishment reminder            | Automation       | "Time to restock? Your Beard Oil lasts ~30 days. Reorder: [link]"             |
| **Support**        | Customer asks "Where's my order?" | Inbox + AI       | AI auto-responds with tracking info from Shopify data                         |
| **COD → Prepaid**  | Confirm COD order                 | Automation       | "Confirm your COD order to avoid cancellation. Or prepay for 10% off: [link]" |

#### Key Automations for D2C

| Trigger                  | Action                                        | Impact                  |
| ------------------------ | --------------------------------------------- | ----------------------- |
| Cart abandoned (1 hr)    | WhatsApp nudge with product + link            | 10-15% recovery         |
| Order placed             | WhatsApp confirmation (replaces email)        | 5x read rate            |
| Delivered + 2 days       | Review request                                | 3x review rate vs email |
| 30 days since last order | Replenishment nudge                           | Increase LTV            |
| COD order placed         | Prepaid conversion offer (10% off)            | Reduce RTO              |
| Support query            | AI auto-response + human escalation if needed | Faster resolution       |

#### Entry Point

> "Your customers are on WhatsApp. Send order updates, recover abandoned carts, and collect reviews where they actually read messages."

---

## 6. Vertical: Professional Services

### Persona: Meera's CA Firm (Chartered Accountant, Chennai, 3 CAs + 5 staff, 150 clients)

#### Current Workflow

```
Client calls for ITR filing
→ Staff notes on Excel
→ Document collection via email (lost in inbox)
→ Filing done → email confirmation (client didn't see)
→ Invoice sent via Tally → manual payment chase
→ Deadline day: 20 clients calling "Is my ITR filed?"
→ Staff overwhelmed answering same questions
```

#### ECODrIx Journey

| Stage                   | Action                                         | Feature               | Outcome                                                                       |
| ----------------------- | ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| **Setup**               | Connect WA + "Professional Services" template  | Template              | Pipeline: Onboarding → Docs Pending → In Progress → Filed → Invoiced → Paid   |
| **Client request**      | "I need ITR filing" on WhatsApp                | Lead capture          | New project created, document checklist sent                                  |
| **Document collection** | Auto-message: "Please share these 5 documents" | Template + Portal     | Client uploads via portal, CA gets notified                                   |
| **In progress**         | CA starts working                              | Pipeline move         | Client gets "Work started" notification                                       |
| **Filing complete**     | Mark as "Filed"                                | Pipeline + Automation | "Your ITR is filed! Acknowledgement: [link]. Invoice attached."               |
| **Invoice**             | Auto-generated invoice                         | Commerce              | ₹5,000 fee + GST, payment link on WhatsApp                                    |
| **Bulk deadlines**      | July 31 ITR deadline approaching               | Campaign              | Bulk message: "ITR deadline in 7 days. Share documents NOW to avoid penalty." |
| **Recurring**           | Monthly GST return reminder                    | Automation            | "Your GSTR-3B for July is due by Aug 20. Share sales data: [portal link]"     |

#### Key Automations for Professional Services

| Trigger                | Action                               | Impact            |
| ---------------------- | ------------------------------------ | ----------------- |
| New client onboarded   | Send document checklist via WhatsApp | Faster collection |
| All documents received | Move to "In Progress", notify CA     | No idle time      |
| Work completed         | Auto-notify client + send invoice    | Immediate billing |
| Payment overdue 5 days | Reminder with payment link           | Cash flow         |
| Deadline -15 days      | Bulk reminder to all pending clients | Compliance        |
| Monthly recurring      | GST/TDS return reminders             | Client retention  |

#### Entry Point

> "Manage 150 clients without chaos. Automate document collection, status updates, and invoicing — all on WhatsApp."

---

## 7. Vertical: Digital Agency

### Persona: Arjun (digital marketing agency, Pune, 8 clients, 4-person team)

#### Their Need (Different from SMB)

Agencies don't just USE ECODrIx — they can RESELL it. Two modes:

1. **Internal use** — manage their own clients, projects, invoicing
2. **Client setup** — set up ECODrIx for their SMB clients (reseller/white-label)

#### Agency Internal Journey

| Stage                 | Action                    | Feature        | Outcome                                             |
| --------------------- | ------------------------- | -------------- | --------------------------------------------------- |
| **Client onboarding** | New project in pipeline   | CRM + Projects | Track: Proposal → Contract → Kickoff → Delivery     |
| **Proposals**         | Create and send proposal  | Commerce       | Professional proposal with scope + pricing          |
| **Project tracking**  | Task list per client      | Projects       | Team sees workload, client sees progress            |
| **Client updates**    | Monthly report + update   | Portal         | Client portal with all deliverables                 |
| **Invoicing**         | Monthly retainer invoices | Commerce       | Auto-generated, sent on WhatsApp, paid via Razorpay |
| **Upsell**            | Track client requests     | CRM activity   | "Client asked about SEO — send proposal"            |

#### Agency Reseller Journey

| Stage                      | Action                                          | Revenue                    |
| -------------------------- | ----------------------------------------------- | -------------------------- |
| **Sign up as partner**     | Agency partner application                      | —                          |
| **Get white-label access** | Their branding on client dashboards             | —                          |
| **Set up first client**    | Configure CRM + WA for client's business        | ₹5-10K setup fee           |
| **Ongoing management**     | Manage client's campaigns, automations          | ₹3-5K/mo retainer          |
| **Platform fee**           | ECODrIx charges agency ₹999-2,499/mo per client | Their margin: ₹1-3K/client |

#### Entry Point

> "Give your clients a WhatsApp CRM under your brand. Earn ₹3-5K/month per client, recurring. We handle the tech."

---

## 8. Onboarding Flow (Technical)

### 8.1 Sign-up to First Value (Target: < 10 minutes)

```
Step 1: Sign Up (1 min)
├── Email + password
├── Business name
└── Phone number (for WhatsApp)

Step 2: Business Context (1 min)
├── Select vertical (Real Estate / Education / Healthcare / D2C / Services / Other)
├── Team size (Solo / 2-5 / 6-20 / 20+)
└── Monthly leads estimate (< 50 / 50-200 / 200-1000 / 1000+)

Step 3: Connect WhatsApp (2-3 min)
├── Embedded Signup (Meta)
├── Auto-provisions WhatsApp Business API
└── Success: "Your WhatsApp Business is connected! ✅"

Step 4: Vertical Template Applied (auto, 0 min)
├── Pipeline stages pre-configured
├── 3-5 automation rules pre-built
├── Quick reply templates loaded
└── Welcome sequence ready

Step 5: First Test (2 min)
├── Send yourself a test message
├── See it appear in inbox
├── Reply from inbox
└── "You're ready! Share your business number to start receiving leads."

Step 6: Import Existing Contacts (optional, 2 min)
├── Upload CSV/Excel
├── Map columns
└── Leads appear in pipeline
```

### 8.2 Progressive Feature Unlock

| Week    | Features unlocked                     | Nudge                                                         |
| ------- | ------------------------------------- | ------------------------------------------------------------- |
| Week 1  | Inbox, leads, pipeline, quick replies | "Reply to your first lead!"                                   |
| Week 2  | Automation rules, sequences           | "Set up auto-follow-up for leads you don't reply to in 24hrs" |
| Week 3  | Campaigns, templates                  | "Send your first broadcast to re-engage old leads"            |
| Week 4  | Invoicing, payments                   | "Create your first invoice and get paid on WhatsApp"          |
| Month 2 | Flow builder, LAIE, advanced          | "Ready for advanced automation? Try the visual builder"       |

---

## 9. Activation Milestones

### Definition of "Activated" User

A user is considered activated when they've completed **3 of these 5 actions** within 7 days:

| #   | Action                    | Why it matters        |
| --- | ------------------------- | --------------------- |
| 1   | Connected WhatsApp        | Core channel working  |
| 2   | Received/created 5+ leads | Data in the system    |
| 3   | Sent a reply from inbox   | Using as work tool    |
| 4   | Moved a lead in pipeline  | Adopting CRM workflow |
| 5   | Set up 1 automation rule  | Seeing "magic"        |

### Activation Rate Targets

| Milestone              | Target           | Intervention if missed                           |
| ---------------------- | ---------------- | ------------------------------------------------ |
| WA connected (Day 0)   | > 80% of signups | Live chat support offer                          |
| First lead (Day 1)     | > 60%            | "Share your number on website/ads to get leads"  |
| First reply (Day 1)    | > 50%            | Push notification: "New lead waiting for reply!" |
| Pipeline used (Day 3)  | > 40%            | In-app guide: "Drag leads to track progress"     |
| Automation set (Day 7) | > 30%            | Email: "Set up auto-follow-up in 2 clicks"       |

---

## 10. Churn Risk Indicators

### Early Warning Signals

| Signal                            | Timeframe | Risk level  | Action                                  |
| --------------------------------- | --------- | ----------- | --------------------------------------- |
| Never connected WhatsApp          | Day 0-3   | 🔴 Critical | Personal outreach, offer help           |
| 0 leads after 5 days              | Day 5     | 🔴 Critical | "Here's how to get leads flowing" guide |
| No login in 7 days                | Week 1    | 🟡 High     | Re-engagement email + WhatsApp          |
| < 5 messages sent/week            | Ongoing   | 🟡 Medium   | Feature discovery nudge                 |
| Never used pipeline               | Week 2+   | 🟡 Medium   | "Your leads need organization" nudge    |
| Never sent invoice                | Month 1+  | 🟡 Low      | "Close the loop — get paid on WhatsApp" |
| Support ticket unresolved > 48hrs | Any       | 🔴 Critical | Escalate, personal response             |

### Retention Levers

| Lever                     | How it works                                 | Expected impact               |
| ------------------------- | -------------------------------------------- | ----------------------------- |
| **Data lock-in**          | More leads/conversations = harder to leave   | Naturally increases over time |
| **Automation dependency** | Auto-rules running = they rely on us         | Strongest retention signal    |
| **Payment integration**   | Revenue flowing through platform             | "Can't turn it off"           |
| **Team usage**            | Multiple people using = organizational habit | 3+ users = very low churn     |
| **Contact ownership**     | WhatsApp API number tied to platform         | Technical switching cost      |

---

## Document Governance

| Version | Date     | Change                       |
| ------- | -------- | ---------------------------- |
| 1.0     | Aug 2026 | Initial customer journey map |

**Cross-references:**

- Market context: `MARKET_RESEARCH.md`
- Feature details: `PRODUCT_SPECIFICATION.md`
- Pricing: `PRICING_MODEL.md`
- Execution: `GTM_PLAYBOOK.md`
