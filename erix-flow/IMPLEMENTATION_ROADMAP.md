# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## Implementation Roadmap

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [Product Development Strategy](#product-development-strategy)
2. [MVP Scope](#mvp-scope)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Core Automation Pipeline](#phase-2-core-automation-pipeline)
5. [Phase 3: Monetization and Templates](#phase-3-monetization-and-templates)
6. [Phase 4: AI Agents and External API](#phase-4-ai-agents-and-external-api)
7. [Phase 5: Scale and Polish](#phase-5-scale-and-polish)
8. [Sprint Structure](#sprint-structure)
9. [Risk Register](#risk-register)
10. [Complexity and Timeline Estimate](#complexity-and-timeline-estimate)
11. [Assumptions Made](#assumptions-made)

---

## Product Development Strategy

ERIX-FLOW is built as a focused 5-phase delivery. Dhanesh is the solo full-stack engineer. Each phase delivers a shippable, testable increment. Phase 1 establishes the canvas infrastructure and data layer. Phase 2 ships the core lead-gen-to-outreach loop (the full value proposition). Phase 3 adds monetization hardening and template marketplace. Phase 4 adds AI agents and API access. Phase 5 polishes performance, observability, and mobile experience.

The philosophy: ship Phase 2 to 3 real users (beta cohort) before building Phase 3. User feedback shapes Phase 3 priority. No phase is built in isolation — each ends with at least 2 real users testing the new capability.

---

## MVP Scope

| Feature                                   | In MVP? | Rationale                                          | Effort |
| ----------------------------------------- | ------- | -------------------------------------------------- | ------ |
| Drag-drop canvas (React Flow)             | Yes     | Core product surface — cannot ship without it      | L      |
| Manual trigger node                       | Yes     | Simplest trigger, needed for all testing           | S      |
| Scheduled trigger node                    | Yes     | Key use case for automated daily scraping          | M      |
| LAIE scrape node (Google Maps + JustDial) | Yes     | Primary lead source for ICP                        | M      |
| AI enrichment node (Claude API)           | Yes     | Core differentiator vs simple scrapers             | M      |
| Email validation node                     | Yes     | Reduces wasted outreach credits                    | S      |
| WhatsApp validation node                  | Yes     | Critical before any WA outreach                    | S      |
| WhatsApp outreach node (ErixSender)       | Yes     | Core value delivery                                | M      |
| Email outreach node (ErixSender + SES)    | Yes     | Core value delivery                                | M      |
| CRM push node                             | Yes     | Closes the loop into ERIX-CRM                      | S      |
| Condition/branch node                     | Yes     | Needed for WA-valid vs email-only routing          | M      |
| Delay node                                | Yes     | Needed for follow-up sequences                     | S      |
| Run history + node log viewer             | Yes     | Required for user trust and debugging              | M      |
| SSE live run progress                     | Yes     | Critical UX — users need to see pipeline working   | M      |
| Credit cost estimation before run         | Yes     | Prevents surprise credit exhaustion                | S      |
| Template marketplace                      | No      | Phase 3 — need 3+ workflows to seed marketplace    | L      |
| AI agent node (multi-step)                | No      | Phase 4 — complex, ErixStore must be battle-tested | L      |
| Workflow versioning                       | No      | Phase 4 — nice-to-have, not blocking revenue       | M      |
| External API trigger                      | No      | Phase 4 — Scale plan feature                       | M      |
| Storage node (ErixStorage)                | No      | Phase 2 — useful but not core outreach loop        | S      |

---

## Phase 1: Foundation

### Phase 1: Canvas Infrastructure and Data Layer

**Duration:** Weeks 1-3

**Goals:**

- React Flow canvas renders and saves workflow state
- PostgreSQL FLOW schema tables created and migrated
- ErixStore ERIX.JOB.\* commands implemented and tested
- erix-flow-worker scaffolded and deployable to Cloud Run
- FLOW module appears in ECODrIx Console Hub navigation

**Tasks:**

| Task                                                                                                | Owner   | Priority |
| --------------------------------------------------------------------------------------------------- | ------- | -------- |
| Install @xyflow/react, scaffold canvas editor route /console/flow/[id]                              | Dhanesh | P0       |
| Implement custom node components: base node anatomy, category colors, status badges                 | Dhanesh | P0       |
| Create Drizzle schema: workflows, workflow_runs, node_run_logs, workflow_templates, credit_ledger   | Dhanesh | P0       |
| Run drizzle-kit migration on ecodrix-pg (flow schema namespace)                                     | Dhanesh | P0       |
| Implement ErixStore ERIX.JOB.PUSH, ERIX.JOB.DEQUEUE (atomic), ERIX.JOB.ACK, ERIX.JOB.RETRY commands | Dhanesh | P0       |
| Scaffold erix-flow-worker Cloud Run service: Dockerfile, env config, GCP deploy script              | Dhanesh | P0       |
| Implement canvas auto-save (PUT /api/v1/flow/workflows/:id) with debounce                           | Dhanesh | P1       |
| Add ERIX-FLOW tile to ECODrIx Console Hub with plan-gate check                                      | Dhanesh | P1       |

---

## Phase 2: Core Automation Pipeline

### Phase 2: Lead Gen to Outreach: Full Value Loop

**Duration:** Weeks 4-8

**Goals:**

- All MVP node types implemented and executable
- Full pipeline works end-to-end: scrape > enrich > validate > outreach > CRM
- SSE live progress visible on canvas during run
- Run history with node-level logs working
- 3 beta users running real campaigns

**Tasks:**

| Task                                                                                      | Owner   | Priority |
| ----------------------------------------------------------------------------------------- | ------- | -------- |
| Implement LAIE scrape node executor (calls internal LAIE scraper HTTP API)                | Dhanesh | P0       |
| Implement AI enrichment node executor (Claude API call, JSON output parsing)              | Dhanesh | P0       |
| Implement email validation node executor (MX lookup + LAIE-NET check)                     | Dhanesh | P0       |
| Implement WhatsApp validation node executor (Meta Cloud API phone check)                  | Dhanesh | P0       |
| Implement WhatsApp outreach node executor (ErixSender /send/whatsapp API)                 | Dhanesh | P0       |
| Implement email outreach node executor (ErixSender /send/email API)                       | Dhanesh | P0       |
| Implement CRM push node executor (MongoDB upsert via @ecodrix/erix-api)                   | Dhanesh | P0       |
| Implement condition/branch node: evaluate lead field boolean, route to correct downstream | Dhanesh | P0       |
| Implement delay node: ErixStore TTL-based resume after N minutes                          | Dhanesh | P1       |
| Build SSE endpoint GET /api/v1/flow/runs/:id/stream and wire to canvas Zustand store      | Dhanesh | P0       |
| Build run history UI: table + node log drawer + re-run from node button                   | Dhanesh | P1       |
| Build credit cost estimator (pre-run modal with breakdown per node type)                  | Dhanesh | P1       |
| Onboard 3 beta users, collect run logs, fix top 5 issues                                  | Dhanesh | P0       |

---

## Phase 3: Monetization and Templates

### Phase 3: Credit Billing, Template Marketplace, Scheduled Triggers

**Duration:** Weeks 9-12

**Goals:**

- Credit deduction and top-up flow live on Razorpay
- Plan-based run quotas enforced (Starter: 20/month, Growth: 100/month)
- 5 official workflow templates published in marketplace
- Scheduled trigger (cron) working for automated daily runs
- Webhook trigger live and tested with Razorpay payment webhook

**Tasks:**

| Task                                                                                                                        | Owner   | Priority |
| --------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| Implement credit_ledger debit on node execution in worker                                                                   | Dhanesh | P0       |
| Implement Razorpay top-up flow: payment intent > credit_ledger credit entry                                                 | Dhanesh | P0       |
| Build quota enforcement: run rejected if credits < estimated_cost or runs_this_month >= plan_limit                          | Dhanesh | P0       |
| Implement scheduled trigger node: cron expression stored in workflows, ErixStore cron job fires run                         | Dhanesh | P1       |
| Implement webhook trigger node: HMAC verification endpoint, enqueue run on valid POST                                       | Dhanesh | P1       |
| Build template marketplace UI: browse, preview canvas, install flow                                                         | Dhanesh | P1       |
| Publish 5 official templates: Real Estate Lead Gen, EdTech Trial Nurture, Agency B2B, Clinic Re-engage, E-commerce Recovery | Dhanesh | P1       |
| Storage node executor: upload lead export CSV to ErixStorage R2                                                             | Dhanesh | P2       |

---

## Phase 4: AI Agents and External API

### Phase 4: Agentic Loops, API Access, Workflow Versioning

**Duration:** Weeks 13-18

**Goals:**

- AI agent node: multi-step Claude reasoning loop within workflow
- External API trigger for Scale plan tenants
- Workflow versioning: named snapshots, rollback
- Sub-workflow node: call another saved flow as a step

**Tasks:**

| Task                                                                                  | Owner   | Priority |
| ------------------------------------------------------------------------------------- | ------- | -------- |
| Design AI agent node: multi-turn Claude conversation with CRM tool access             | Dhanesh | P1       |
| Implement AI agent executor: tool-use pattern, max 10 turns, ErixStore step tracking  | Dhanesh | P1       |
| Implement external API trigger: POST /api/v1/flow/workflows/:id/run with API key auth | Dhanesh | P1       |
| Build API key management UI in FLOW settings (Scale plan gate)                        | Dhanesh | P1       |
| Implement workflow versioning: save named snapshot, list versions, restore            | Dhanesh | P2       |
| Implement sub-workflow node: lookup workflow by ID, pass input data, await completion | Dhanesh | P2       |
| Webhook output node: POST enriched lead data to external URL (SSRF protection)        | Dhanesh | P2       |

---

## Phase 5: Scale and Polish

### Phase 5: Observability, Performance, Mobile View, Community Templates

**Duration:** Weeks 19-24

**Goals:**

- GCP monitoring dashboards for FLOW worker health and job queue depth
- Canvas performance optimised for 50+ node workflows
- Mobile run history view polished
- Community template submissions open
- ERIX-FLOW self-run case study published (ECODrIx uses FLOW to acquire its own customers)

**Tasks:**

| Task                                                                                    | Owner   | Priority |
| --------------------------------------------------------------------------------------- | ------- | -------- |
| GCP Cloud Monitoring: job queue depth dashboard, worker error rate alert                | Dhanesh | P1       |
| React Flow virtualisation: node culling on canvas for 50+ node workflows                | Dhanesh | P1       |
| ErixStore load test: 200 concurrent FLOW jobs, verify no queue corruption               | Dhanesh | P0       |
| Mobile run history view: responsive table with expandable node log cards                | Dhanesh | P2       |
| Community template submission: submit workflow as template, admin review queue          | Dhanesh | P2       |
| Weekly run digest email: build ErixSender template, hook into Sunday cron job           | Dhanesh | P2       |
| Publish ERIX-FLOW self-use case study: how ECODrIx uses FLOW to acquire its own clients | Dhanesh | P1       |

---

## Sprint Structure

| Sprint | Duration   | Focus                                     | Key Deliverable                                          |
| ------ | ---------- | ----------------------------------------- | -------------------------------------------------------- |
| S1     | Week 1-2   | Canvas scaffold + DB schema               | React Flow canvas loads, workflows save to PostgreSQL    |
| S2     | Week 3     | ErixStore JOB commands + worker scaffold  | Worker dequeues and ACKs test jobs from ErixStore        |
| S3     | Week 4-5   | Scrape + enrichment node executors        | LAIE scrape → Claude enrichment pipeline runs end-to-end |
| S4     | Week 6     | Validation + CRM push nodes               | Leads validated and pushed to ERIX-CRM MongoDB           |
| S5     | Week 7     | Outreach nodes (WA + email)               | WhatsApp + email sent via ErixSender from workflow       |
| S6     | Week 8     | SSE progress + run history UI + beta      | 3 beta users run real campaigns end-to-end               |
| S7     | Week 9-10  | Credit billing + quota enforcement        | Razorpay top-up live, credits deducted per node          |
| S8     | Week 11-12 | Templates + scheduled/webhook triggers    | 5 official templates published and installable           |
| S9     | Week 13-15 | AI agent node + API trigger               | Scale plan API trigger and agentic loop working          |
| S10    | Week 16-18 | Versioning + sub-workflow + webhook out   | Phase 4 complete, GA ready                               |
| S11    | Week 19-21 | Observability + canvas perf               | Monitoring dashboards live, 50-node canvas smooth        |
| S12    | Week 22-24 | Community templates + case study + polish | ERIX-FLOW GA with full Phase 5 features                  |

---

## Risk Register

| Risk                                                   | Likelihood | Impact   | Owner   | Mitigation                                                                                                         |
| ------------------------------------------------------ | ---------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| ErixStore ERIX.JOB.\* not stable under concurrent load | Medium     | Critical | Dhanesh | Load test 200 concurrent jobs in Week 3; implement SQLite WAL mode before Phase 2                                  |
| LAIE scraper service not callable as internal HTTP API | Medium     | High     | Dhanesh | Expose internal HTTP endpoint in LAIE service in Week 3; mock with static fixture for canvas testing               |
| Meta Cloud API blocks bulk WA validation calls         | High       | Medium   | Dhanesh | Rate limit to 10 validations/sec; cache validation results for 7 days per number in ErixStore                      |
| React Flow node performance issues on complex canvas   | Low        | Low      | Dhanesh | Cap MVP canvas at 30 nodes; add virtualisation in Phase 5                                                          |
| Beta users churn before completing first workflow run  | Medium     | High     | Dhanesh | Onboard first 3 users on live video call; pre-configure a sample workflow for them to run in under 5 minutes       |
| Solo dev bandwidth: 24-week timeline too aggressive    | Medium     | Medium   | Dhanesh | Phase 2 (Week 8) is the revenue-critical milestone; Phase 3-5 can slip without blocking GTM; prioritise ruthlessly |

---

## Complexity and Timeline Estimate

| Phase   | Scope                                                   | Complexity (1-10) | Weeks |
| ------- | ------------------------------------------------------- | ----------------- | ----- |
| Phase 1 | Canvas + DB + ErixStore JOB commands + worker scaffold  | 7                 | 3     |
| Phase 2 | All MVP node executors + SSE + run history + beta       | 9                 | 5     |
| Phase 3 | Credit billing + quotas + templates + scheduled trigger | 7                 | 4     |
| Phase 4 | AI agents + API access + versioning + sub-workflow      | 8                 | 6     |
| Phase 5 | Observability + perf + mobile + community templates     | 5                 | 6     |
| Total   | Full ERIX-FLOW GA                                       | 9/10 overall      | 24    |

---

## Assumptions Made

- Dhanesh is the sole engineer — no additional hires for Phase 1-3; Phases 4-5 may require one contract frontend dev
- ErixStore ERIX.JOB.\* commands are the highest-risk dependency; if not stable by Week 3, Phase 2 timeline shifts 2 weeks
- LAIE scraper internal HTTP endpoint will be implemented as part of Phase 1 (not a separate project)
- Kiro (AWS AI IDE) is the primary development environment — spec-driven development reduces boilerplate time
- ECODrIx Console Next.js frontend already has React Flow installed and shadcn/ui components available
- Existing ECODrIx billing infrastructure (Razorpay) is extended for FLOW credit top-ups — no new payment provider

---
