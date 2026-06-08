# LAIE Dashboard — Advanced UI/UX Design Prompt
### Consolidated with ECODrIx Console v2.0 Design System

---

## 1. Context & Role

You are building the **LAIE (Lead AI Intelligence Engine)** product UI as a **module inside the ECODrIx Console v2.0** — a multi-tenant SaaS platform. LAIE is not standalone; it inherits the Console's design system, navigation chrome, billing context, and tenant isolation model.

**User persona**: Tier 2 Indian founder or SMB sales operator — technically semi-literate, wants results fast, trusts data over copy.

---

## 2. Console v2.0 Integration Rules

LAIE lives under `/product/laie/*`. The Console hub (root) has **no sidebar** — it's an AWS-style card grid. Once inside a product (LAIE), the product sidebar appears.

```
ECODrIx Console Hub  /console
  └── LAIE            /product/laie          ← product root (this prompt)
        ├── Leads      /product/laie/leads
        ├── Runs       /product/laie/runs
        ├── Proxy      /product/laie/proxy
        ├── Enrichment /product/laie/enrich
        ├── SEO        /product/laie/seo
        ├── Pipeline   /product/laie/pipeline    ← NEW
        ├── Campaigns  /product/laie/campaigns   ← NEW
        ├── Scheduler  /product/laie/scheduler   ← NEW
        ├── Webhooks   /product/laie/webhooks    ← NEW
        ├── Data Ops   /product/laie/dataops     ← NEW
        └── Settings   /product/laie/settings    ← NEW
```

### Console Top Bar (shared, inherited)
- Height: `56px`
- Left: `← Console` breadcrumb → `LAIE`
- Center: Product name `LAIE` + environment badge `LIVE`
- Right: Credit balance chip · Tenant switcher · User avatar menu

### Console Sidebar (LAIE-specific)
- Width: `220px`
- Background: `#0A1628`
- Border-right: `1px solid rgba(30,122,255,0.12)`
- Active item: left border `2px solid #1E7AFF` + bg `rgba(30,122,255,0.12)`

---

## 3. Brand & Design Tokens

### Core Palette
```css
/* ECODrIx Platform */
--navy:         #0A1628;   /* surfaces, sidebar */
--bg-base:      #060d1a;   /* page background */
--electric:     #1E7AFF;   /* primary — CTA, active, links */
--orange:       #FF6B1A;   /* hot leads, alerts, warnings */
--success:      #10b981;   /* completed, healthy, positive delta */
--danger:       #ef4444;   /* errors, failures, circuit-open */
--purple:       #a78bfa;   /* AI/Gemini features */
--muted:        #64748b;   /* labels, secondary text */
--border:       rgba(255,255,255,0.06);
--border-blue:  rgba(30,122,255,0.15);

/* Source brand colors */
--gm:   #1E7AFF;   /* Google Maps */
--jd:   #FF6B1A;   /* JustDial */
--sl:   #10b981;   /* Sulekha */
--li:   #0077b5;   /* LinkedIn */
--ig:   #e1306c;   /* Instagram */
```

### Typography
```css
--font-ui:    'Outfit', sans-serif;     /* all UI text */
--font-data:  'JetBrains Mono', monospace; /* scores, IDs, counts, code */
--font-hero:  'DM Serif Display', serif;   /* large headings only */
```

### Spacing Scale (4px base)
```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64px
```

### Border Radius
```
4px  — pills, badges, tiny chips
8px  — buttons, inputs, small cards
12px — main cards, panels
14px — modals, drawers
```

### Elevation
```css
--shadow-card:  0 1px 3px rgba(0,0,0,0.4);
--shadow-modal: 0 20px 60px rgba(0,0,0,0.6);
--glow-blue:    0 0 12px rgba(30,122,255,0.3);
--glow-orange:  0 0 12px rgba(255,107,26,0.3);
```

---

## 4. Shared Component Library

All components below are reused across every LAIE tab.

### 4.1 Stat Card
```
┌──────────────────────────────┐
│  Label (11px muted caps)     │
│  Value (24px mono, colored)  │
│  Delta (11px ↑/↓ green/red)  │
│                   [icon 28px]│
└──────────────────────────────┘
bg: --navy · border: --border · radius: 12px · padding: 16px
```

### 4.2 Status Badge
```
COMPLETED  → success bg10% + border20%
RUNNING    → electric bg10% + glow pulse
QUEUED     → muted bg8%
FAILED     → danger bg10%
HOT        → orange bg15%
WARM       → electric bg12%
COLD       → muted bg8%
ACTIVE     → success
DEGRADED   → orange
CIRCUIT-OPEN → danger + shake animation
```

### 4.3 Source Pill
```
[icon] [Source] — colored bg10% border20% per source brand color
Font: JetBrains Mono 10px · padding: 2px 6px · radius: 4px
```

### 4.4 Score Bar
```
[████░░░░] 76
Width: 48px · height: 5px · radius: 3px
Color: green >80 · blue >60 · orange >40 · red ≤40
```

### 4.5 Health Arc (SVG)
```
r=28 · cx=36 · cy=36 · strokeWidth=6
Track: rgba(255,255,255,0.06)
Fill:  green >80% · orange >40% · red ≤40%
Label: value% centered in JetBrains Mono 13px bold
Animation: stroke-dasharray transition 0.6s ease
```

### 4.6 Toggle Switch
```
Width: 40px · height: 22px · radius: 11px
On:  --electric background · knob right
Off: rgba(255,255,255,0.1) · knob left
Transition: 0.2s ease
```

### 4.7 Bulk Action Bar (NEW)
```
Appears when ≥1 row selected. Slides up from bottom.
┌─────────────────────────────────────────────────────┐
│  ☑ 12 leads selected    [WA Campaign] [Enrich] [Export] [Delete] [✕]  │
└─────────────────────────────────────────────────────┘
bg: #0A1628 · border-top: 1px solid --border-blue
shadow: --shadow-modal · z-index: 100
Animate: translateY(0) on mount, translateY(100%) on dismiss
```

### 4.8 Command Palette (NEW)
```
Trigger: Cmd+K or search icon
Full-width modal overlay · dark frosted glass
Input with ⌘K hint · results list with keyboard nav
Categories: Navigate · Actions · Scraper Run · Enrich · Export
```

### 4.9 Empty State
```
Icon (40px) + Heading (14px semibold) + Subtext (12px muted) + CTA button
Background: subtle dashed border card
```

### 4.10 Confirmation Modal
```
Title · Body (warning text) · [Cancel] [Confirm action — danger variant]
Width: 420px · backdrop: black/60
```

---

## 5. Tab Specifications

---

### TAB 1 — Lead Table `/leads`

#### Reference: Clay (table) + Apify (source tags)

#### Top Controls
```
[Filter: ALL | HOT | WARM | COLD]    [Source: ALL | GM | JD | SL | LI | IG]
[Niche dropdown]  [City search]  [Score range slider]        [⬇ Export]
```

#### Stat Bar (4 cards)
| Card | Value | Color |
|------|-------|-------|
| Total Leads | count | electric |
| Hot Leads | count + % | orange |
| AI Enriched | count + % | success |
| Avg Score | decimal | purple |

#### Table Columns
| # | Column | Detail |
|---|--------|--------|
| 1 | ☐ | Checkbox |
| 2 | Business | Name bold · phone mono below |
| 3 | City / State | muted |
| 4 | Niche | purple pill |
| 5 | Sources | waterfall source pills (max 3 visible, +N overflow) |
| 6 | AI Score | bar + number + `✦` if enriched |
| 7 | SEO Score | `XX/100` colored |
| 8 | Pipeline Stage | dropdown pill (NEW — see Pipeline tab) |
| 9 | Last Action | relative time + action type (NEW) |
| 10 | Status | HOT/WARM/COLD pill |
| 11 | ⋮ | row action menu |

#### Row Action Menu (⋮)
```
- View Full Profile       → /leads/:id
- Add to WA Campaign
- Run AI Enrichment
- Run SEO Audit
- Move to Pipeline Stage
- Tag as Duplicate
- Export Row
- Delete
```

#### Lead Detail Drawer (NEW)
Slides in from right (width: 480px) on row click.
```
┌─ Lead: Balaji Pharma ─────────────── [✕] ─┐
│  [Business card header with score ring]    │
│  ─── Contact Info ───────────────────────  │
│  Phone · Email · Website · Address         │
│  ─── Sources ────────────────────────────  │
│  [GM] [JD] scraped at ... · View raw data  │
│  ─── AI Enrichment ──────────────────────  │
│  Fields table: field · value · confidence  │
│  ─── SEO Audit ──────────────────────────  │
│  Score ring + top 3 issues                 │
│  ─── Activity Log ───────────────────────  │
│  Timeline: scraped → enriched → contacted  │
│  ─── Actions ────────────────────────────  │
│  [Add to Campaign] [Run Enrichment] [SEO]  │
└─────────────────────────────────────────────┘
```

---

### TAB 2 — Scraper Runs `/runs`

#### Reference: Apify actor runs

#### Controls
```
[Source filter pills]   [Status filter]   [Date range]   [+ New Run]
```

#### Run Card
```
┌──────────────────────────────────────────────────────────────────────┐
│  ● run-001   COMPLETED        Google Maps · "pharmacies Tirupati"    │
│              ──────────────────────────────────────────────────────  │
│  Leads: 47   Duration: 1m24s   Proxies: 3   Dedup removed: 5 (NEW)   │
│                              2m ago  [View Results →]                │
└──────────────────────────────────────────────────────────────────────┘
```

#### Run Detail Expansion (NEW)
Click row → inline expand:
```
┌── Run Logs ──────────────────────────────────────────────────────────┐
│  [JetBrains Mono log stream]                                         │
│  12:04:01  INFO   Proxy px-04 selected (Chennai, health 99%)         │
│  12:04:02  INFO   Request batch 1/5 dispatched                       │
│  12:04:08  INFO   47 results parsed                                  │
│  12:04:09  INFO   Dedup engine removed 5 existing records            │
│  12:04:09  SUCCESS  42 new leads written to tenant store             │
└──────────────────────────────────────────────────────────────────────┘
[Copy Logs]  [Download JSON]  [Re-run with same config]
```

---

### TAB 3 — Proxy Network `/proxy`

#### Reference: LAIE-unique (no direct competitor analog)

#### Layout
Top stats (3 cards) → Proxy node grid (5 columns) → Strategy + Health log

#### Circuit Breaker Panel (NEW)
```
When a proxy hits circuit-open state, a warning banner appears:
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠  px-05 (Hyderabad) circuit breaker OPEN · 12% health             │
│    Auto-recovery in 14m · Requests rerouted to px-01, px-04         │
│                                              [Force Reset] [Ignore] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Health History Chart (NEW)
Line chart per proxy — 24h health % trend.
Rendered as SVG sparklines inside each proxy card.
```
[───╮   ╭──] px-01  98% now
[──╮╰───╯──] px-03  76% now  ← degraded visible in dip
```

#### Geo Map (NEW)
India outline SVG with dot per active proxy region.
Dot size = RPS · Dot color = health status color.

---

### TAB 4 — AI Enrichment `/enrich`

#### Reference: Clay waterfall columns

#### Pipeline Header
```
✦ Gemini 1.5 Flash — Waterfall Enrichment
[Run on Selected: 12 leads]  [Run on All Unenriched: 891]  [Schedule]
```

#### Waterfall Column Manager
Drag-and-drop reorder. Each row:
```
[≡ drag] [01] Field Name        via Model     [confidence bar 97%] [312 records] [●○ toggle]
```

#### Add Custom Enrichment Column (NEW)
```
[+ Add Column] → drawer:
  Field Label: ___________
  Source: [Gemini Prompt | Regex | External API | Manual]
  Prompt template (if Gemini): ___________
  Fallback: ___________
  [Save Column]
```

#### Enrichment Queue Status (NEW)
```
┌─────────────────────────────────────────────────────┐
│  Queue: 891 leads · ETA: ~12 min                    │
│  [████████░░░░░░░░░░░░░░░░] 38% complete            │
│  Rate: 74/min · Gemini tokens used: 12,400 today    │
└─────────────────────────────────────────────────────┘
```

---

### TAB 5 — SEO Audit `/seo`

#### URL Input + Bulk Audit (NEW)
```
Single: [URL input] [◎ Run Audit]
Bulk:   [Upload CSV of domains] [◎ Audit All]
```

#### Audit Queue (NEW)
```
Domain              Status      Score   Time
balajiph.com        COMPLETED   34/100  2h ago   [View] [Export PDF]
kalyani-sarees.in   RUNNING     —       live     [Cancel]
techhub.co.in       QUEUED      —       —        [Remove]
```

#### Audit Result Card
All existing fields + NEW additions:

**Technical Checks** (9 items in 3×3 grid):
Title Tag · Meta Description · H1 Tags · Page Speed · Mobile Ready · Schema Markup · Backlinks · Image Alt Tags · HTTPS

**Content Analysis (NEW)**:
```
Word count · Keyword density · Readability score · Content freshness
```

**Competitor Gap (NEW)**:
```
[Enter competitor URL] → Side-by-side score comparison table
```

**Gemini AI Summary**:
- 4-sentence synthesis
- Top 3 priority fixes (numbered)
- ECODrIx upsell line (soft)

**Export**:
```
[Download PDF Report]  [Add to Lead Profile]  [Share Link]
```

---

### TAB 6 — Pipeline `/pipeline` *(NEW)*

#### Reference: Clay CRM stages + Notion kanban

A visual kanban board showing leads across sales stages.

#### Stages (configurable)
```
NEW LEAD → CONTACTED → DEMO SCHEDULED → PROPOSAL SENT → WON ✓ · LOST ✗
```

#### Kanban Column
```
┌──── CONTACTED (12) ──────────────────┐
│                                      │
│  ┌── Lead Card ──────────────────┐   │
│  │  Balaji Pharma  [HOT]         │   │
│  │  Tirupati · Healthcare        │   │
│  │  Score: 92  SEO: 34           │   │
│  │  Last: WA sent 2h ago         │   │
│  │  [Move →]  [⋮]                │   │
│  └───────────────────────────────┘   │
│                                      │
│  [+ Add Lead]                        │
└──────────────────────────────────────┘
```

#### Stage Automation Rules (NEW)
```
When lead enters CONTACTED:
  → Auto-send WA template "intro_msg_01"
  → Schedule follow-up reminder in 3 days

When lead enters PROPOSAL SENT:
  → Notify via Slack (webhook)
  → Tag in ERIX CRM
```

#### Pipeline Analytics (NEW)
Bar chart — conversion rate per stage.
```
NEW → CONTACTED:    68%
CONTACTED → DEMO:   34%
DEMO → PROPOSAL:    71%
PROPOSAL → WON:     48%
Overall CVR:        11.1%
```

---

### TAB 7 — Campaigns `/campaigns` *(NEW)*

#### Reference: Apify task scheduler + WhatsApp broadcast

Manage multi-step outreach campaigns linked to LAIE leads.

#### Campaign List
```
┌──────────────────────────────────────────────────────────────────────┐
│  Pharma Tirupati June      WA · 47 leads   Sent: 38  Replied: 12     │
│  Status: ACTIVE   Started: 4 Jun           [View] [Pause] [Report]   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Campaign Builder (NEW)
Step-by-step modal:
```
Step 1 — Audience
  Select from: [Saved Segment] [Lead Table Filter] [Run Output]
  Preview: 47 leads match

Step 2 — Channel
  [WhatsApp]  [Email]  [WhatsApp + Email sequence]

Step 3 — Message Sequence
  Day 0:  Template "intro_01"      [Preview]
  Day 3:  Template "followup_01"   [Preview]
  Day 7:  Template "lastchance_01" [Preview]
  [+ Add Step]

Step 4 — Schedule
  Send immediately · Schedule for: [date/time]
  Rate limit: [50] messages/hour

Step 5 — Review & Launch
  [Audience: 47] [Steps: 3] [Channel: WA] [Start date: now]
  [Launch Campaign ▶]
```

#### Campaign Report (NEW)
```
Sent: 47   Delivered: 44 (93.6%)   Read: 31 (65.9%)
Replied: 12 (25.5%)   Opted out: 2   Converted: 3

[Reply list with lead names + reply text + timestamp]
[Mark as Converted] [Move to Pipeline] [Follow up]
```

---

### TAB 8 — Scheduler `/scheduler` *(NEW)*

#### Reference: Apify schedules + cron UI

Schedule recurring scraper runs, enrichments, and audits.

#### Schedule List
```
┌──────────────────────────────────────────────────────────────────────┐
│  [●] GM Tirupati Pharma        Every Monday 9AM    Next: Mon 9:00    │
│      Google Maps · 50 leads/run                   [Edit] [Pause] [▶]│
└──────────────────────────────────────────────────────────────────────┘
```

#### Create Schedule Drawer (NEW)
```
Task Type:    [Scraper Run | Enrichment Batch | SEO Audit | Campaign]
Source:       [Google Maps ▾]
Query:        ___________
Frequency:    [Daily | Weekly | Monthly | Custom cron]
Cron input:   [0 9 * * 1]    Human: "Every Monday at 9AM"
Max leads:    [50]
Auto-enrich:  [●○ toggle]
Notify on:    [Email | Slack webhook]
[Save Schedule]
```

#### Run History (per schedule)
Mini timeline of last 10 runs with status dots.

---

### TAB 9 — Data Ops `/dataops` *(NEW)*

Advanced data quality and management. LAIE-unique.

#### 9.1 Deduplication Engine
```
┌──────────────────────────────────────────────────────────────────────┐
│  Duplicate Detection                                                 │
│  ─────────────────────────────────────────────────────────────────   │
│  Match Strategy: [Phone] [Business Name + City] [Website URL]        │
│  Sensitivity:    [●────○] Strict ←→ Fuzzy                            │
│                                                                      │
│  Found: 43 duplicate groups (127 records)                            │
│  [Preview Duplicates]  [Merge All]  [Review Manually]                │
└──────────────────────────────────────────────────────────────────────┘
```

Duplicate review table:
```
Group  |  Records  |  Keep         |  Merge Fields   |  Action
  1    |  2        |  GM version   |  Phone from JD  |  [Merge] [Skip]
  2    |  3        |  Highest score|  Auto           |  [Merge] [Skip]
```

#### 9.2 Data Quality Report
```
Field Coverage heatmap:
Phone         ████████████████████ 98%
Business Name ████████████████████ 100%
Email         ████████░░░░░░░░░░░░ 43%
Website       ██████████████░░░░░░ 69%
Instagram     ████████░░░░░░░░░░░░ 41%
SEO Score     ███████░░░░░░░░░░░░░ 34%

Overall quality score: 74/100
[Run Enrichment to fill gaps]
```

#### 9.3 Import Manager (NEW)
```
Supported: CSV · Excel · Google Sheets URL · Manual paste
Field mapper: drag source column → LAIE field
Dedup check: before import · reject duplicates or merge
Preview: first 5 rows · validation errors highlighted
[Import 312 leads]
```

#### 9.4 Export Manager (NEW)
```
Format:  [CSV] [Excel] [JSON]
Fields:  [All] [Custom select]
Filter:  [Apply current table filter | All leads | Segment]
Include: [✓ AI scores] [✓ SEO scores] [○ Raw scrape data]
Delivery:[Download] [Email to me] [Webhook POST]
[Export]
```

---

### TAB 10 — Webhooks & API `/webhooks` *(NEW)*

#### Reference: Apify integrations panel

#### Webhook List
```
┌──────────────────────────────────────────────────────────────────────┐
│  Slack — New Hot Lead         POST  api.slack.com   [●] Active      │
│  Events: lead.score_hot       Last triggered: 4m ago  [Edit] [Test] │
└──────────────────────────────────────────────────────────────────────┘
```

#### Create Webhook Drawer
```
Name:         ___________
URL:          https://___________
Events:
  ☑ lead.created        ☑ lead.score_hot
  ☑ run.completed       ○ run.failed
  ○ enrichment.done     ☑ campaign.reply_received
Headers:      [+ Add header]
Secret:       [Generate]
[Save & Test]
```

#### API Keys (NEW)
```
Key Name           Scopes              Created       Last used
laie-prod-001      read, write         2 Jun 2026    4m ago      [Revoke]
laie-readonly      read                1 Jun 2026    2h ago      [Revoke]

[+ Generate New Key]
```

---

### TAB 11 — Settings `/settings` *(NEW)*

#### Sections

**General**
```
Workspace name · Default city/region · Default niche
Auto-enrich on scrape: [●○]
Auto-dedup on import:  [●○]
```

**Scraper Config**
```
Global rate limit: [100] req/min
Retry on fail:     [3] attempts
Proxy strategy:    [ROUND_ROBIN ▾]
User-agent rotation: [●○]
```

**Enrichment Config**
```
Gemini model:     [gemini-1.5-flash ▾]
Max tokens/run:   [50,000]
Confidence threshold: [70%] — below this, mark as unverified
```

**Notifications**
```
Email on:   [run.completed] [run.failed] [lead.score_hot]
Slack URL:  https://hooks.slack.com/___________
```

**Billing / Credits** *(links to Console billing)*
```
Plan: ECODrIx LAIE Pro
Credits remaining: 4,108
Usage this month:  8,892 / 13,000
[View Billing →]  [Buy Credits →]
```

**Tenant / Multi-workspace**
```
Current workspace: [Dhanesh — ECODrIx ▾]
[Switch Workspace]  [Invite Team Member]
```

**Danger Zone**
```
[Clear All Leads]   [Reset Enrichments]   [Delete Workspace]
```

---

## 6. Advanced Feature Specs

### 6.1 Global Search + Cmd+K
```
⌘K → overlay modal
Input: search leads, runs, campaigns, settings...
Results grouped: Leads · Runs · Pages · Actions
Keyboard nav: ↑↓ arrows · Enter to select · Esc to close
```

### 6.2 Notification Center (top bar bell icon)
```
Unread badge count · Slide-down panel (width: 380px)
Types:
  ✓ run.completed   — "GM Tirupati run finished — 47 leads"
  ⚠ proxy.degraded  — "px-03 health dropped to 76%"
  🔥 lead.hot       — "Sunrise Diagnostics scored 88 — hot lead"
  ↩ campaign.reply  — "Balaji Pharma replied to your WA message"
[Mark all read]  [Settings]
```

### 6.3 Usage Bar (sidebar bottom widget)
```
Credits today:
  Leads scraped:    1,204  [████████████░░░░] 1.2K/day limit
  AI enrichments:   891    [███████████░░░░░] 891/1K limit
  SEO audits:       23     [████░░░░░░░░░░░░] 23/50 limit
  Credits left:     4,108

[Buy Credits]
```

### 6.4 Bulk Action Bar
Appears when ≥1 checkbox selected. Pinned to bottom viewport.
```
☑ 12 selected
[▶ WA Campaign]  [✦ Enrich]  [◎ SEO Audit]  [→ Move Stage]  [⬇ Export]  [🗑 Delete]  [✕ Clear]
```

### 6.5 AI Insight Banner (NEW — LAIE-unique)
Appears on lead table when AI detects actionable pattern:
```
┌────────────────────────────────────────────────────────────────────┐
│  ✦  Gemini Insight: 12 Healthcare leads in Tirupati have SEO       │
│     scores below 40 — high conversion opportunity.                 │
│     [View These Leads →]                           [Dismiss]       │
└────────────────────────────────────────────────────────────────────┘
bg: rgba(167,139,250,0.08) · border: rgba(167,139,250,0.2)
```

---

## 7. Animation & Motion

| Element | Spec |
|---------|------|
| Tab switch | `opacity 0→1 · translateY 8px→0 · 200ms ease` |
| Running run dot | `box-shadow pulse 1.2s infinite` |
| Live badge dot | `opacity 1↔0.3 · 1.2s` |
| Circuit-open card | `border-color shake 0.4s` |
| Bulk action bar | `translateY(80px)→0 · 250ms spring` |
| Health arc | `stroke-dasharray · 0.6s ease` |
| Toggle | `left 0.2s ease` |
| Drawer (right) | `translateX(480px)→0 · 300ms ease` |
| Kanban drag | `scale(1.02) · box-shadow --glow-blue` |
| Insight banner | `height 0→auto · 300ms` |
| Row hover | `background 0.1s` |
| Modal | `scale 0.96→1 · opacity 0→1 · 200ms` |

---

## 8. Responsive Behavior

| Breakpoint | Sidebar | Table | Cards |
|------------|---------|-------|-------|
| `≥1280px` | 220px fixed | all columns | 4-col grid |
| `1024–1279px` | 220px fixed | hide SEO col | 3-col grid |
| `768–1023px` | icon-only 56px | hide Sources, SEO | 2-col grid |
| `<768px` | drawer via hamburger | card list view | 1-col grid |

---

## 9. Tech Stack

```
React 18 · TypeScript
Next.js 15 (App Router) — pages under /console/laie/*
Tailwind CSS — utility only, no arbitrary values unless necessary
Framer Motion — animations and drag-and-drop (kanban)
Recharts — pipeline conversion bar chart, health trends
Lucide React — icons
@ecodrix/erix-api SDK — all server calls go through SDK only
  (NO direct fetch to backend from frontend)
JetBrains Mono + Outfit + DM Serif Display — Google Fonts
```

---

## 10. State Management

```
Zustand stores:
  laieLeadStore     — leads[], filters, selectedIds, pagination
  laieRunStore      — runs[], activeRunId, logs
  laieProxyStore    — proxies[], strategy, alerts
  laieEnrichStore   — queue, enrichments[], progress
  laiePipelineStore — stages[], cards{}, automations[]
  laieCampaignStore — campaigns[], activeId, stats
  uiStore           — activeTab, drawerOpen, notifications[]
```

---

## 11. File Structure

```
src/
  app/
    product/
      laie/
        page.tsx              ← redirect to /leads
        layout.tsx            ← sidebar + top bar shell
        leads/page.tsx
        runs/page.tsx
        proxy/page.tsx
        enrich/page.tsx
        seo/page.tsx
        pipeline/page.tsx
        campaigns/page.tsx
        scheduler/page.tsx
        dataops/page.tsx
        webhooks/page.tsx
        settings/page.tsx
  components/
    laie/
      shared/
        StatCard.tsx
        StatusBadge.tsx
        SourcePill.tsx
        ScoreBar.tsx
        HealthArc.tsx
        BulkActionBar.tsx
        LeadDrawer.tsx
        CommandPalette.tsx
        AIInsightBanner.tsx
      leads/
        LeadTable.tsx
        LeadFilters.tsx
        LeadRow.tsx
      runs/
        RunCard.tsx
        RunLogs.tsx
      proxy/
        ProxyCard.tsx
        GeoMap.tsx
        CircuitBreakerBanner.tsx
      enrich/
        WaterfallColumn.tsx
        EnrichQueue.tsx
        AddColumnDrawer.tsx
      pipeline/
        KanbanBoard.tsx
        LeadCard.tsx
        StageAutomation.tsx
      campaigns/
        CampaignBuilder.tsx
        CampaignReport.tsx
      scheduler/
        ScheduleList.tsx
        CreateScheduleDrawer.tsx
      dataops/
        DedupEngine.tsx
        QualityHeatmap.tsx
        ImportManager.tsx
        ExportManager.tsx
  stores/
    laie.ts
  types/
    laie.ts
```

---

## 12. Do Not

- No white or light backgrounds — always dark
- No Inter, Roboto, Arial, system fonts
- No generic purple gradient hero sections
- No hardcoded hex — use CSS variables only
- No direct API calls from frontend — always use `@ecodrix/erix-api` SDK
- No component without loading + error + empty state
- No sidebar at Console hub root — LAIE sidebar appears only inside LAIE
- No more than 3 source pills visible inline (use `+N` overflow chip)
- No mock data in production components — all from SDK
- No `any` type in TypeScript