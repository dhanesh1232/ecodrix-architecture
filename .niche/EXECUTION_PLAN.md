# ECODrIx — Niche & Advanced Capabilities Execution Plan

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Active Execution Plan  
**Source docs:** `NICHE_PERSONALIZATION_PROPOSAL.md`, `ADVANCED_CAPABILITIES_PROPOSAL.md`

---

## Execution Philosophy

- Build in 2-week sprints
- Each sprint ships something USABLE (not half-finished)
- Every feature must work end-to-end before moving to the next
- Validate with real users after every sprint
- No sprint starts new work until previous sprint is deployed + tested

---

## Sprint Calendar (16 Weeks / 4 Months)

```
Sprint 1  (Week 1-2)   → Niche Foundation + Smart Follow-Up Engine
Sprint 2  (Week 3-4)   → Morning Briefing + Niche Templates
Sprint 3  (Week 5-6)   → Revenue Intelligence + Business Health Score
Sprint 4  (Week 7-8)   → Review Engine + Payment Intelligence
Sprint 5  (Week 9-10)  → Niche Workflow Packs + WhatsApp Template Library
Sprint 6  (Week 11-12) → Customer Retention + Document Intelligence
Sprint 7  (Week 13-14) → Team Performance + Revenue Forecasting
Sprint 8  (Week 15-16) → Multi-Channel Retargeting + Smart Scheduling
```

---

## Sprint 1: Niche Foundation + Smart Follow-Up Engine (Week 1-2)

### Goal

Platform transforms on niche selection. Leads get followed up automatically without user config.

### Tasks

| #    | Task                                                                                          | File/Location                                                | Day     |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| 1.1  | Create `niche-packs.ts` — all 7 niche definitions (pipeline stages, modules, labels, widgets) | `server/src/shared/config/niche-packs.ts`                    | Day 1   |
| 1.2  | Modify `POST /onboarding/complete` — stamp `serviceConfig.workspace.niche` + modules map      | `server/src/platform/routes/onboarding.routes.ts`            | Day 2   |
| 1.3  | Modify workspace materialization — create niche pipeline on first enable                      | `server/src/platform/services/workspace-materialization.ts`  | Day 2   |
| 1.4  | Create `useNicheConfig()` hook — reads modules/niche from `/api/me`                           | `saas/src/hooks/platform/useNicheConfig.ts`                  | Day 3   |
| 1.5  | Implement nav filtering — hide items by `moduleKey` using modules map                         | `saas/src/lib/nav/unified.ts`                                | Day 3-4 |
| 1.6  | Implement label overrides — swap nav labels from modules map                                  | `saas/src/lib/nav/unified.ts`                                | Day 4   |
| 1.7  | Seed niche form template on workspace creation                                                | `server/src/platform/services/workspace-materialization.ts`  | Day 5   |
| 1.8  | Build Smart Follow-Up service — auto-follow-up for silent leads (3-day rule)                  | `server/src/product/erix/services/smart-followup.service.ts` | Day 6-7 |
| 1.9  | Follow-up worker — queue job that fires daily, checks inactive leads, sends nudge             | `server/src/product/erix/jobs/smart-followup.worker.ts`      | Day 8   |
| 1.10 | Stop-on-response logic — cancel pending follow-ups when lead replies                          | `server/src/product/erix/services/smart-followup.service.ts` | Day 9   |
| 1.11 | Dead lead detection — 3 failed follow-ups → move to "Cold"                                    | `server/src/product/erix/services/smart-followup.service.ts` | Day 9   |
| 1.12 | Smart Follow-Up toggle in CRM settings UI                                                     | `saas/src/app/[slug]/(product)/product/erix/configure/`      | Day 10  |

### Deliverables

- [x] User selects niche at signup → platform shows filtered nav + correct labels
- [x] Pipeline auto-created with industry stages
- [x] Intake form auto-created per niche
- [x] Leads auto-followed-up without ANY user configuration
- [x] Follow-ups stop when lead replies

### Definition of Done

- Fresh signup → select "Healthcare" → nav shows "Patients", pipeline has "Inquiry → Booked → Visited → Follow-up → Retained"
- Lead goes silent 3 days → WhatsApp nudge sent automatically
- Lead replies → pending follow-ups cancelled

---

## Sprint 2: Morning Briefing + Niche Templates (Week 3-4)

### Goal

Owner gets daily WhatsApp briefing. Automation templates sorted by niche with "Recommended" badge.

### Tasks

| #    | Task                                                                                         | File/Location                                                   | Day     |
| ---- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 2.1  | Build Morning Briefing service — aggregate daily metrics per org                             | `server/src/product/erix/services/morning-briefing.service.ts`  | Day 1-2 |
| 2.2  | Morning Briefing cron job — runs 8am IST daily for all active orgs                           | `server/src/product/erix/jobs/morning-briefing.worker.ts`       | Day 3   |
| 2.3  | WhatsApp template for briefing — submit to Meta (utility category)                           | Manual Meta submission                                          | Day 3   |
| 2.4  | Briefing content: appointments today, deals pending, overdue invoices, new leads, top action | Service logic                                                   | Day 4   |
| 2.5  | Send briefing to org owner's phone via Connect WhatsApp                                      | Integration with connect send API                               | Day 4   |
| 2.6  | Briefing settings — enable/disable, time preference, custom metrics                          | `server/src/platform/routes/settings/`                          | Day 5   |
| 2.7  | Create 35 automation templates (5 per niche × 7 niches)                                      | `server/src/shared/config/automation-templates.ts`              | Day 6-7 |
| 2.8  | Add `niches: string[]` field to automation template schema                                   | `server/src/shared/db/schema/erix/automation.ts`                | Day 8   |
| 2.9  | Template sort logic — niche-matching first, then generic                                     | `server/src/product/erix/services/automation/`                  | Day 8   |
| 2.10 | Frontend: "Recommended for your business" badge component                                    | `saas/src/components/erix/automation/NicheRecommendedBadge.tsx` | Day 9   |
| 2.11 | Frontend: sort templates by niche match in automation templates list                         | `saas/src/components/erix/automation/`                          | Day 9   |
| 2.12 | Niche dashboard widgets — show niche-relevant metrics on overview                            | `saas/src/components/console/`                                  | Day 10  |

### Deliverables

- [x] Owner receives WhatsApp at 8am: "3 appointments today, ₹1.2L overdue, top action: follow up Raj"
- [x] Automation page shows niche templates first with "Recommended" badge
- [x] Dashboard shows niche-relevant KPIs (not generic)

### Definition of Done

- Healthcare owner gets: "4 appointments today, 2 follow-ups pending, 0 no-shows yesterday"
- Education owner sees "Auto-reply with fee structure" as first automation template
- Dashboard shows "Appointments Today" for healthcare, "Inquiries This Week" for education

---

## Sprint 3: Revenue Intelligence + Business Health Score (Week 5-6)

### Goal

Owner sees where revenue comes from and gets a single "business health" number.

### Tasks

| #    | Task                                                                                            | File/Location                                                                | Day     |
| ---- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| 3.1  | Revenue Attribution service — join leads (source) → deals (value) → invoices (paid)             | `server/src/product/erix/services/analytics/revenue-intelligence.service.ts` | Day 1-2 |
| 3.2  | API: `GET /product/erix/crm/analytics/revenue` — revenue by source, by month, by pipeline stage | `server/src/product/erix/routes/crm/analytics.routes.ts`                     | Day 3   |
| 3.3  | Deal velocity calculation — average days per stage, bottleneck detection                        | Service logic                                                                | Day 3   |
| 3.4  | Lost deal analysis — aggregate loss reasons, frequency                                          | Service logic                                                                | Day 4   |
| 3.5  | Cohort revenue — group leads by creation month, sum lifetime revenue                            | Service logic                                                                | Day 4   |
| 3.6  | Build Revenue Intelligence dashboard page                                                       | `saas/src/app/[slug]/(product)/product/erix/overview/revenue/`               | Day 5-6 |
| 3.7  | Charts: revenue by source (bar), deal velocity (funnel), monthly trend (line)                   | Frontend components                                                          | Day 6-7 |
| 3.8  | Business Health Score service — weighted composite of 5 sub-scores                              | `server/src/product/erix/services/analytics/health-score.service.ts`         | Day 8   |
| 3.9  | Sub-scores: pipeline health, revenue velocity, engagement, growth, retention                    | Service logic                                                                | Day 8-9 |
| 3.10 | API: `GET /product/erix/crm/analytics/health` — score + breakdown + top actions                 | Route handler                                                                | Day 9   |
| 3.11 | Health Score widget on console dashboard                                                        | `saas/src/components/console/HealthScore.tsx`                                | Day 10  |
| 3.12 | Include health score in morning briefing                                                        | Update briefing service                                                      | Day 10  |

### Deliverables

- [x] Revenue Intelligence page: source attribution, velocity, lost analysis, cohorts
- [x] Business Health Score (0-100) on dashboard with breakdown
- [x] "Top 3 Actions Today" generated from health analysis
- [x] Health score included in morning WhatsApp briefing

---

## Sprint 4: Review Engine + Payment Intelligence (Week 7-8)

### Goal

Auto-collect Google reviews. Smart payment reminders based on client behavior.

### Tasks

| #    | Task                                                                                          | File/Location                                                      | Day     |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 4.1  | Review Engine service — trigger review request after positive events                          | `server/src/product/erix/services/review-engine.service.ts`        | Day 1-2 |
| 4.2  | Review request automation rule — fires on: deal_won, appointment_completed, project_delivered | Automation integration                                             | Day 2   |
| 4.3  | Rating capture flow — WhatsApp quick reply (1-5 stars)                                        | Template + webhook handling                                        | Day 3   |
| 4.4  | Negative intercept — < 4 stars routes to private feedback, NOT Google                         | Service logic                                                      | Day 3   |
| 4.5  | Google review redirect — 4-5 stars → sends Google Maps review deep-link                       | Service logic                                                      | Day 4   |
| 4.6  | Review tracking dashboard — count, avg rating, pending requests                               | `saas/src/components/erix/reviews/`                                | Day 4-5 |
| 4.7  | NPS survey automation — quarterly WhatsApp survey                                             | Service logic                                                      | Day 5   |
| 4.8  | Payment Behavior Scoring — reliability score per client based on payment history              | `server/src/product/erix/services/payment-intelligence.service.ts` | Day 6-7 |
| 4.9  | Smart reminder timing — early reminders for late payers, on-time for reliable                 | Service logic                                                      | Day 7   |
| 4.10 | Payment escalation path — Day 1: WA → Day 3: WA + Email → Day 7: owner notification           | Service logic                                                      | Day 8   |
| 4.11 | Cash flow calendar API — expected payments by date based on due invoices + behavior           | Route handler                                                      | Day 9   |
| 4.12 | Cash flow calendar UI — visual timeline of expected incoming payments                         | `saas/src/components/erix/invoices/CashFlowCalendar.tsx`           | Day 10  |

### Deliverables

- [x] After deal won → client gets "How was your experience?" on WhatsApp
- [x] 4-5 stars → Google review link. < 4 → private feedback.
- [x] Late payers get reminders 5 days early. Reliable payers get reminded on due date.
- [x] Cash flow calendar shows expected payments per week

---

## Sprint 5: Niche Workflow Packs + WhatsApp Template Library (Week 9-10)

### Goal

One-click activate entire niche automation lifecycle. Pre-written WhatsApp templates for Meta approval.

### Tasks

| #    | Task                                                                                    | File/Location                                               | Day     |
| ---- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------- |
| 5.1  | Define workflow pack schema — multi-step flows stored as Flow engine definitions        | `server/src/shared/config/workflow-packs.ts`                | Day 1   |
| 5.2  | Healthcare pack: 5 flows (confirm → remind → follow-up → recall → report notification)  | Pack definition                                             | Day 2   |
| 5.3  | Education pack: 5 flows (brochure → demo → enrollment → fee → birthday)                 | Pack definition                                             | Day 2   |
| 5.4  | Real Estate pack: 5 flows (details → visit → follow-up → invoice → thank you)           | Pack definition                                             | Day 3   |
| 5.5  | Freelancer pack: 5 flows (proposal → follow-up → invoice → reminder → thank you)        | Pack definition                                             | Day 3   |
| 5.6  | D2C pack: 5 flows (cart recovery → order → review → replenishment → win-back)           | Pack definition                                             | Day 4   |
| 5.7  | Agency + Pro Services packs                                                             | Pack definition                                             | Day 4   |
| 5.8  | "Activate pack" API — clones all flows into tenant's workspace, sets to active          | `server/src/product/flow/services/workflow-pack.service.ts` | Day 5-6 |
| 5.9  | Frontend: Workflow Packs page — "Activate Healthcare Pack" button                       | `saas/src/components/flow/WorkflowPacks.tsx`                | Day 7   |
| 5.10 | WhatsApp Template Library — pre-written templates per niche (35 total)                  | `server/src/shared/config/whatsapp-template-library.ts`     | Day 8   |
| 5.11 | Template suggestion UI — "These templates are ready for your business. Submit to Meta?" | `saas/src/components/connect/TemplateSuggestions.tsx`       | Day 9   |
| 5.12 | One-click Meta submission — batch submit suggested templates for approval               | Connect template CRUD integration                           | Day 10  |

### Deliverables

- [x] Healthcare user clicks "Activate Pack" → 5 complete automation flows live
- [x] WhatsApp templates page shows "Suggested for your business" with one-click submit

---

## Sprint 6: Customer Retention + Document Intelligence (Week 11-12)

### Goal

Predict churn and auto-engage. Smart document collection via WhatsApp.

### Tasks

| #    | Task                                                                                                | File/Location                                                         | Day     |
| ---- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 6.1  | Churn risk scoring model — engagement frequency drop, last contact age, response rate decline       | `server/src/product/erix/services/retention/churn-scoring.service.ts` | Day 1-2 |
| 6.2  | Daily churn score refresh (cron) — recalculate for all active leads                                 | Worker job                                                            | Day 3   |
| 6.3  | Auto re-engagement — high churn risk → trigger "We miss you" automation                             | Automation rule integration                                           | Day 3   |
| 6.4  | Inactivity alerts — notify owner when key customers go dark                                         | Notification service                                                  | Day 4   |
| 6.5  | Win-back campaign UI — one-click campaign targeting all "churned" leads                             | Frontend component                                                    | Day 5   |
| 6.6  | Anniversary/birthday automation — auto-wish on stored dates                                         | Cron + automation                                                     | Day 5   |
| 6.7  | Document checklist schema — per-deal list of required documents                                     | `server/src/shared/db/schema/erix/documents.ts` (extend existing)     | Day 6   |
| 6.8  | Document checklist API — create/read/update checklist per deal                                      | `server/src/product/erix/routes/crm/document-checklist.routes.ts`     | Day 6-7 |
| 6.9  | WhatsApp document collection — client sends PDF → auto-attach to project → mark checklist item done | Inbox webhook handler extension                                       | Day 8-9 |
| 6.10 | Missing document reminders — auto-send list of pending documents                                    | Automation rule                                                       | Day 9   |
| 6.11 | Document checklist UI — visual checklist per deal in lead detail                                    | `saas/src/components/erix/contacts/DocumentChecklist.tsx`             | Day 10  |
| 6.12 | Expiry alerts — flag documents nearing expiry date                                                  | Service logic                                                         | Day 10  |

### Deliverables

- [x] Leads get churn risk score. High-risk → auto "We miss you" message.
- [x] Deal has document checklist. Client sends PDF on WhatsApp → auto-checked.
- [x] Owner gets "Missing documents" reminder to send to client.

---

## Sprint 7: Team Performance + Revenue Forecasting (Week 13-14)

### Goal

Managers see team leaderboard. Pipeline predicts future revenue.

### Tasks

| #    | Task                                                                                        | File/Location                                                            | Day     |
| ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| 7.1  | Team Performance service — aggregate per-agent: deals closed, response time, activity count | `server/src/product/erix/services/analytics/team-performance.service.ts` | Day 1-2 |
| 7.2  | API: `GET /product/erix/crm/analytics/team` — leaderboard + per-agent metrics               | Route handler                                                            | Day 3   |
| 7.3  | Idle lead detection — flag agents with leads > 5 days no activity                           | Service logic                                                            | Day 3   |
| 7.4  | Capacity planning — count active leads per agent, flag overloaded                           | Service logic                                                            | Day 4   |
| 7.5  | Commission calculator — configurable % per deal stage, auto-compute                         | Service logic                                                            | Day 4   |
| 7.6  | Team Performance page — leaderboard, response time chart, activity feed                     | `saas/src/app/[slug]/(product)/product/erix/team/`                       | Day 5-6 |
| 7.7  | Revenue Forecasting service — pipeline value × historical win rate × stage probability      | `server/src/product/erix/services/analytics/revenue-forecast.service.ts` | Day 7-8 |
| 7.8  | 30/60/90 day forecast API                                                                   | Route handler                                                            | Day 8   |
| 7.9  | Seasonal pattern detection — compare current month to same month last year                  | Service logic                                                            | Day 9   |
| 7.10 | Revenue goal tracker — user sets monthly target, track progress                             | Settings + UI                                                            | Day 9   |
| 7.11 | Invoice aging report — outstanding amounts by 30/60/90 day buckets                          | Service logic                                                            | Day 10  |
| 7.12 | Forecast + aging UI on revenue dashboard                                                    | Frontend extension                                                       | Day 10  |

### Deliverables

- [x] Team leaderboard: "Ravi: 5 deals, ₹3.2L. Priya: 3 deals, ₹1.8L."
- [x] Revenue forecast: "Next 30 days: ₹4.2L expected (₹2.8L confirmed)"
- [x] Invoice aging: "₹2.3L > 30 days overdue"

---

## Sprint 8: Multi-Channel Retargeting + Smart Scheduling (Week 15-16)

### Goal

Coordinated re-engagement across channels. AI-optimized appointments.

### Tasks

| #    | Task                                                                            | File/Location                                                            | Day      |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| 8.1  | Channel preference learning — track which channel each lead responds on         | `server/src/product/erix/services/channel-preference.service.ts`         | Day 1-2  |
| 8.2  | Waterfall messaging — try WA → if unread 4hrs → email → if no click 24hrs → SMS | Flow engine: new `waterfall` node type                                   | Day 2-3  |
| 8.3  | Cross-channel journey timeline — unified activity view regardless of channel    | Frontend: lead detail timeline                                           | Day 4    |
| 8.4  | Opt-out respect — channel preference in unsubscribe management                  | Connect unsubscribe extension                                            | Day 5    |
| 8.5  | Smart slot suggestion — AI picks 3 optimal slots from existing calendar         | `server/src/infra/connect/channels/meet/services/smart-slots.service.ts` | Day 6-7  |
| 8.6  | Buffer time configuration — auto-add gap between appointments                   | Appointment settings                                                     | Day 7    |
| 8.7  | Capacity limits — max appointments/day, auto-block after limit                  | Appointment booking logic                                                | Day 8    |
| 8.8  | No-show prediction — flag appointments likely to no-show                        | ML-lite: based on lead's past behavior                                   | Day 8-9  |
| 8.9  | Reschedule via WhatsApp — reply "RESCHEDULE" → get new slots → pick → confirmed | Chatbot flow                                                             | Day 9-10 |
| 8.10 | Queue position (walk-in) — estimate wait time, send via WhatsApp                | Service logic                                                            | Day 10   |

### Deliverables

- [x] Lead not responding on WhatsApp → auto-try email after 4hrs
- [x] Appointment booking suggests 3 AI-optimized slots
- [x] Customer replies "RESCHEDULE" → gets new slots immediately

---

## Post-Sprint Roadmap (Month 5+)

| Sprint    | Focus                                                      | Effort  |
| --------- | ---------------------------------------------------------- | ------- |
| Sprint 9  | WhatsApp Commerce (catalog + checkout in chat)             | 3 weeks |
| Sprint 10 | Referral Growth Engine (links + rewards + leaderboard)     | 2 weeks |
| Sprint 11 | WhatsApp Storefront (mini-store for SMBs without websites) | 3 weeks |
| Sprint 12 | Multi-Location Support (branches + central dashboard)      | 4 weeks |
| Sprint 13 | Smart Nudges system (proactive owner notifications)        | 2 weeks |
| Sprint 14 | Niche Chatbot Flows (pre-built per vertical)               | 3 weeks |
| Sprint 15 | Niche Client Portal customization                          | 2 weeks |
| Sprint 16 | Niche Scoring Profiles                                     | 1 week  |

---

## Success Metrics Per Sprint

| Sprint | Key Metric                                   | Target                                   |
| ------ | -------------------------------------------- | ---------------------------------------- |
| 1      | Time to first value (signup → configured)    | < 3 minutes                              |
| 1      | Follow-up auto-sent (no user action)         | 100% of silent leads get nudged          |
| 2      | Morning briefing delivery rate               | > 95% of active orgs                     |
| 2      | Template activation rate (niche-recommended) | > 40% within 7 days                      |
| 3      | Revenue page engagement                      | > 60% of paid users visit weekly         |
| 3      | Health score awareness                       | > 80% of owners know their score         |
| 4      | Google reviews collected via platform        | 5+ per org per month                     |
| 4      | Payment collection improvement               | -3 days average collection time          |
| 5      | Workflow pack activation                     | > 50% of users activate their niche pack |
| 5      | WhatsApp template submission rate            | > 70% submit at least 3 templates        |
| 6      | Churn prediction accuracy                    | > 60% of flagged accounts actually churn |
| 6      | Document collection via WhatsApp adoption    | > 30% of pro-services orgs use it        |
| 7      | Team page usage (multi-agent orgs)           | > 80% of 3+ agent orgs visit weekly      |
| 8      | Channel waterfall effectiveness              | 15% more responses vs single-channel     |

---

## Resource Requirements

| Sprint | Solo founder? | Notes                                                      |
| ------ | :-----------: | ---------------------------------------------------------- |
| 1-4    |    ✅ Yes     | All server-side services + basic UI                        |
| 5-6    |    ✅ Yes     | Template authoring is time-intensive but not complex       |
| 7-8    | ⚠️ Stretching | Consider part-time frontend help                           |
| 9+     |    ❌ Hire    | WhatsApp Commerce + multi-location need dedicated dev time |

**Recommendation:** Hire first developer when MRR > ₹3L (around Sprint 5-6 timeline).

---

## Dependencies & Risks

| Risk                                                     | Impact                           | Mitigation                                                  |
| -------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| Meta template approval delays (2-7 days)                 | Blocks WhatsApp template library | Submit templates in Sprint 4, use in Sprint 5               |
| Morning briefing message limits (Meta utility category)  | Cost per org/day                 | Use utility template (₹0.12/msg) — ₹3.6/org/month           |
| Smart follow-up compliance (DPDP opt-in)                 | Legal risk                       | Only follow up leads who messaged first (implied consent)   |
| Churn model cold-start (no historical data for new orgs) | Inaccurate predictions early     | Use rule-based scoring for first 3 months, ML after         |
| Revenue forecasting accuracy                             | User loses trust if wrong        | Show confidence levels: "₹4.2L ± ₹1L (moderate confidence)" |

---

## Daily Execution Cadence

```
Morning:  Review yesterday's shipped task. Run diagnostics. Fix any breaks.
10am-1pm: Build (server-side service/route)
2pm-5pm:  Build (frontend component/page)
5pm-6pm:  Test end-to-end. Deploy to staging.
Evening:  Write tomorrow's task spec (what exactly to build).
```

**Rule:** No task takes more than 1 day. If it does, split it.

---

## Document Governance

| Version | Date     | Change                 |
| ------- | -------- | ---------------------- |
| 1.0     | Aug 2026 | Initial execution plan |

**Cross-references:**

- Niche definitions: `NICHE_PERSONALIZATION_PROPOSAL.md`
- Advanced capabilities: `ADVANCED_CAPABILITIES_PROPOSAL.md`
- Market context: `../.mark-research/MARKET_RESEARCH.md`
- Product spec: `../PRODUCT_SPECIFICATION.md`
