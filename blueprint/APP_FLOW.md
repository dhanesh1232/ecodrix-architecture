> ⚠️ **SUPERSEDED (v1).** Canonical blueprint is `../new_mvp.md`. Flows here are
> UX intent; the as-built mechanics differ (Postgres CRM, HTTP/WS ErixStore,
> multi-engine automation being consolidated). See `../server_capability_audit.md`.

# ECODrIx Platform — App Flow Architecture

**Version:** 2.0 | **Date:** June 2026

---

## 1. Platform Entry Flows

### 1.1 New User Onboarding Flow

```
STEP 1: Signup
  → Enter name, email, password, business name, phone
  → Email verification via AWS SES
  → Organization created in PostgreSQL
  → MongoDB tenant DB provisioned: ecodrix_${userId}

STEP 2: Choose Your Path (onboarding wizard)
  → Option A: "I want to manage WhatsApp leads" → ERIX setup
  → Option B: "I want to find new leads" → LAIE setup
  → Option C: "I want to automate my marketing" → ERIX-FLOW setup
  → Option D: "Show me everything" → Full tour

STEP 3: ERIX Connect (if Option A or D)
  → Click "Connect WhatsApp Business"
  → Meta Embedded Signup popup
  → Select WABA → grant permissions
  → Platform stores credentials
  → Test message sent → confirm success

STEP 4: First value moment
  → ERIX: "You're connected. Send your first broadcast?"
  → LAIE: "Find 100 leads now. Enter your city + business type."
  → FLOW: "Set up your first automation in 2 minutes."

STEP 5: Billing prompt (Day 7 trial expiry)
  → Trial ends → choose plan
  → Razorpay checkout
  → Subscription activated
```

### 1.2 Returning User Login

```
  → Enter email + password
  → Server validates → issues JWT (15min) + refreshToken (30d cookie)
  → SDK stores accessToken in memory
  → Redirect to /console (AWS-style hub)
  → Last active product auto-highlighted
```

---

## 2. ECODrIx Console — Root Hub

```
Console Layout (AWS-style, no sidebar):
┌─────────────────────────────────────────────────┐
│  ECODrIx Console          [Bell] [User] [Plan]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Good morning, Dhanesh 👋                        │
│  Today: 12 leads waiting • 3 flows paused        │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │    ERIX     │  │    LAIE     │  │  FLOW    │ │
│  │ WhatsApp CRM│  │  Lead Intel │  │ Automate │ │
│  │  245 contacts│  │  12 new leads│  │ 4 active│ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  Analytics  │  │  Settings   │               │
│  │  This month │  │  Billing    │               │
│  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────┘
```

---

## 3. ERIX — WhatsApp CRM Flows

### 3.1 Contact Management Flow

```
Import Contacts:
  → Upload CSV → map columns (name, phone, email, tags)
  → Duplicate check → merge/skip/replace
  → Preview 10 rows → confirm import
  → Import runs async (ErixStore queue)
  → Toast notification: "243 contacts imported. 12 duplicates merged."

Add Single Contact:
  → Fill form: name, phone (+91 prefix enforced), email, tags, notes
  → Save → appears in contacts list + MongoDB

Contact Detail View:
  → Contact header: name, phone, tags, last contact date
  → Timeline: all WA messages, calls, notes, deal changes
  → Quick actions: Send WA, Add to campaign, Assign to pipeline
  → Custom fields: configurable per tenant
```

### 3.2 WhatsApp Inbox Flow

```
Inbox (real-time WebSocket):
  → Left panel: conversation list (sorted by latest)
  → Badge: unread count per conversation
  → Right panel: message thread
  → Agent assignment: dropdown → ERIX.SET conv:${id}:agent

Sending Messages:
  → Service window (24h): free-form text allowed
  → Outside window: must use approved template
  → Template picker: search + preview → send
  → Media: image/doc/video → Cloudflare R2 upload → send URL

Incoming Message Processing:
  Meta Webhook → POST /webhooks/meta
    → Extract WABA ID → resolve tenantId
    → Save to MongoDB: conversations + messages collections
    → ERIX.PUBLISH erix:${tenantId}:messages → WebSocket push
    → If ERIX-FLOW trigger active: push to flow:trigger:queue
```

### 3.3 Broadcast Campaign Flow

```
Create Campaign:
  STEP 1: Name + objective (promotional / transactional / announcement)
  STEP 2: Select template (approved templates only)
  STEP 3: Audience segment
    → All contacts
    → Tag-based filter
    → Custom query (field conditions)
  STEP 4: Variable mapping ({{1}}, {{2}} → contact fields)
  STEP 5: Schedule (now / specific date-time)
  STEP 6: Preview → estimated reach count
  STEP 7: Launch

Execution:
  → Jobs queued in ErixStore: 1 job per 100 contacts
  → Rate limited: 80 messages/second (Meta limit)
  → Status tracked: pending → sent → delivered → read → failed
  → Live delivery report in campaign detail page

Post-Campaign:
  → Summary: sent/delivered/read/failed counts
  → Replied: list of contacts who replied (auto-tagged "campaign_replied")
  → Export report to CSV
```

### 3.4 Pipeline Flow

```
Pipeline View (Kanban):
  Stages: New Lead → Contacted → Qualified → Proposal → Won → Lost

Move Deal:
  → Drag card across columns
  → Or: click card → "Move to next stage"
  → Activity log updated automatically

Add Deal:
  → From contact: "Create deal" button
  → Fill: deal name, value, expected close date, assigned agent
  → Appears in "New Lead" column

Won/Lost:
  → Won → trigger ERIX-FLOW "on_deal_won" event
  → Lost → mark reason (required) → archive
```

---

## 4. LAIE — Lead Intelligence Flows

### 4.1 Lead Scraping Flow

```
New Scrape Job:
  STEP 1: Source selection
    → Google Maps | JustDial | Sulekha
  STEP 2: Query params
    → Business category (e.g., "dental clinics")
    → City (dropdown: 500+ Indian cities)
    → Limit (50 / 100 / 500 / 1000)
  STEP 3: Enrichment options
    → Phone verification: on/off
    → Email append: on/off
    → AI scoring: on/off
  STEP 4: Launch

Execution:
  → Job ID created → saved to laie_jobs table
  → ErixStore queue: ERIX.PUSH laie:scrape:queue <job>
  → LAIE worker (GCP Cloud Run) processes job
  → Proxy selection: Jio SIM for Instagram/JustDial, GCP Squid for Maps
  → Results stream to laie_leads table
  → Progress: real-time % via WebSocket

Results:
  → Table: name, phone, email, address, rating, category
  → Filters: by score, by enrichment status
  → Bulk actions: export CSV, push to ERIX CRM, add tags
  → Push to CRM: one-click → creates contacts in ecodrix_${userId} MongoDB
```

### 4.2 Competitor Social Intelligence Flow

```
Add Competitor:
  → Enter Instagram handle
  → Platform fetches: profile data + last 30 posts
  → Stores in laie_competitors table

Analysis Dashboard:
  → Post frequency chart (posts/week by month)
  → Engagement rate trends
  → Content type breakdown: image/reel/carousel percentages
  → Top 5 performing posts (by engagement rate)
  → Hashtag cloud (most used by competitor)
  → Best posting times (heatmap by day/hour)

AI Content Analysis:
  → Click "Analyze with AI"
  → Claude processes all 30 posts
  → Output:
    - Content themes (what topics they cover)
    - Hook patterns (how they start captions)
    - CTA patterns (how they convert)
    - Gaps (what they're NOT posting that works in niche)
  → Summary card saved to laie_competitors.ai_analysis
```

### 4.3 AI Content Calendar Flow

```
Generate Calendar:
  STEP 1: Select competitors to reference (1–5)
  STEP 2: Configure brand voice
    → Tone: professional / casual / motivational / educational
    → Language: English / Hindi / Telugu / Mix
    → Niche: auto-detected from competitor analysis
  STEP 3: Set calendar period (30 days default)
  STEP 4: Generate

Claude API call:
  → Input: competitor analysis summary + brand voice config
  → Output: 30 post objects with:
    - Date + time
    - Caption (brand voice)
    - Hashtags (30 total: 10 niche + 10 broad + 10 trending)
    - Content type (image / reel / carousel)
    - Hook line (first sentence)
    - CTA line (last sentence)

Calendar View:
  → Month grid view
  → Click any day → see post details
  → Edit caption inline
  → Toggle: "Auto-post" on/off per post
  → Status: Draft / Scheduled / Posted / Failed

Auto-Post Execution:
  → ErixStore scheduler: ERIX.PUSH ig:post:queue <post> at scheduled_time
  → Meta Content Publishing API: upload media → publish post
  → Status updated to "Posted"
  → Engagement tracked 24h after posting
```

---

## 5. ERIX-FLOW — Automation Canvas Flows

### 5.1 Canvas Navigation

```
Flow List (home):
  → Cards: flow name, status (active/paused/draft), last run, run count
  → Create new flow → blank canvas
  → Use template → 10 pre-built templates

Canvas:
  → Left panel: node library (triggers, actions, conditions, AI)
  → Center: infinite canvas (React Flow)
  → Right panel: selected node config
  → Top bar: name, save, activate/pause, run history

Node Types:
  TRIGGERS:
    → When: WA message received
    → When: IG comment with keyword
    → When: Form submitted
    → When: Deal stage changes
    → When: Scheduled (cron)
    → When: Webhook received

  ACTIONS:
    → Send WhatsApp (template / free-form)
    → Post to Instagram
    → Add/update CRM contact
    → Send Email (AWS SES)
    → Create deal in pipeline
    → Add tag to contact
    → HTTP request (webhook out)

  CONDITIONS:
    → If/else branch
    → Wait/delay (minutes/hours/days)
    → Filter (contact has tag / field equals)
    → Split (A/B, random %)

  AI NODES:
    → Generate text (Claude API)
    → Classify intent (Claude API)
    → Summarize conversation
    → Extract data from message
```

### 5.2 Flow Execution Engine Flow

```
Trigger fires (e.g., IG comment received):
  → Webhook event arrives at server
  → Server checks: any active flows for tenantId with this trigger type?
  → Resolve matching flow definitions
  → For each match: ERIX.PUSH flow:run:queue <flowId, triggerData>

Worker processes run:
  → ERIX.POP flow:run:queue
  → Load flow definition from PostgreSQL
  → Create flow_run record (status: running)
  → Execute nodes in DAG order:
    → For each node: call appropriate service
    → Capture output
    → Pass to next node via edge mapping
  → Delay nodes: ERIX.PUSH flow:resume:queue <runId> at delay_time
  → On complete: flow_run status → completed
  → On error: retry (3x), then status → failed, notify user
```

### 5.3 Pre-Built Templates

```
Template 1: "New Lead Nurture"
  Trigger: Contact added to CRM
  → Delay 5min → Send WA welcome message
  → Delay 1 day → Send product info template
  → Delay 3 days → If no reply → Send follow-up
  → Delay 7 days → If no reply → Tag "cold_lead"

Template 2: "IG Comment → Lead"
  Trigger: IG comment with keyword "INFO"
  → Send IG DM with product info
  → Add contact to ERIX CRM
  → Delay 1 day → Send WA follow-up

Template 3: "Deal Won Celebration"
  Trigger: Deal moved to "Won"
  → Send WA congratulations + onboarding guide
  → Create follow-up task (Day 7 check-in)
  → Send thank you email

Template 4: "Broadcast Reply Handler"
  Trigger: Contact replies to any campaign
  → Tag contact "replied_${campaign_name}"
  → Assign to sales agent
  → Send personalized WA follow-up

Template 5: "Weekly Content Auto-Post"
  Trigger: Schedule (every Monday 10 AM)
  → Pull next 7 posts from LAIE content calendar
  → Post each to Instagram at scheduled times
  → Track engagement → update LAIE analytics
```

---

## 6. Billing + Plan Management Flow

```
Plan Selection:
  → /billing → shows current plan + upgrade options
  → Select new plan → Razorpay checkout (subscription mode)
  → Payment success → webhook → update subscriptions table
  → Feature limits updated in ErixStore cache immediately

Feature Gating:
  → Every API endpoint checks: await checkPlanLimit(tenantId, 'contacts', count)
  → If over limit: 402 response with upgrade prompt
  → Grace period: 3 days over limit before hard block

Invoice:
  → Generated on each billing cycle
  → PDF with GSTIN + company details
  → Stored in Cloudflare R2
  → Emailed via AWS SES

DFY Onboarding:
  → One-time Razorpay payment order (not subscription)
  → Creates onboarding_session record
  → Founder manually completes setup + hands over
```

---

## 7. Admin Panel Flows

```
/admin (ECODrIx founder access only):
  → All tenants list: plan, MRR, last active, health score
  → Tenant drill-down: contacts count, message volume, flow runs
  → Manual plan override (for trials, discounts)
  → System health: ErixStore queue depths, scrape job status
  → Billing events: recent payments, failed charges, churned users
  → LAIE proxy health: success rates per proxy tier
  → Broadcast logs: platform-level send volume + error rates
```

---

## 8. Assumptions Made

- React Flow is suitable for ERIX-FLOW canvas at MVP scale
- Meta webhook latency <2 seconds for inbox real-time experience
- ErixStore delay scheduler accurate to ±30 seconds for flow delays
- MongoDB Atlas free tier handles first 100 tenants
- LAIE scraper jobs complete within 60–120 seconds for 200-lead batches
- Instagram auto-post via Content Publishing API works for all media types
- Razorpay subscription webhooks are reliable for plan state management
