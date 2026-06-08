# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## Technical Requirements Document

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [High-Level Infrastructure Diagram](#high-level-infrastructure-diagram)
3. [Frontend Stack](#frontend-stack)
4. [Backend Stack](#backend-stack)
5. [Database Strategy](#database-strategy)
6. [API Architecture](#api-architecture)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [Queue and Async Infrastructure](#queue-and-async-infrastructure)
9. [Realtime Infrastructure](#realtime-infrastructure)
10. [AI and LLM Infrastructure](#ai-and-llm-infrastructure)
11. [Caching Strategy](#caching-strategy)
12. [Third-Party Integrations](#third-party-integrations)
13. [Security Layers](#security-layers)
14. [Logging and Monitoring](#logging-and-monitoring)
15. [CI and CD Pipeline](#ci-and-cd-pipeline)
16. [Technical Risks](#technical-risks)
17. [Assumptions Made](#assumptions-made)

---

## System Architecture Overview

| Key                   | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Frontend              | Next.js 15 (App Router) + React Flow + TailwindCSS + shadcn/ui + Zustand       |
| Backend               | Express/Hono on GCP Cloud Run (existing ECODrIx server)                        |
| Database (Platform)   | GCP Cloud SQL PostgreSQL (ecodrix-pg, asia-south1) via Drizzle ORM             |
| Database (Tenant CRM) | MongoDB per-tenant for contact/lead storage                                    |
| Queue / Job Engine    | ErixStore (custom in-memory engine, port 6399, SQLite-backed persistence)      |
| Cache                 | ErixStore in-memory cache (replaces Redis)                                     |
| Storage               | Cloudflare R2 via ErixStorage (cdn.ecodrix.com)                                |
| Email Delivery        | AWS SES (50K emails/day) via ErixSender                                        |
| WhatsApp              | Meta Cloud API via @ecodrix/erix-api SDK, per-tenant WABA credentials          |
| AI Enrichment         | Anthropic Claude API (claude-sonnet-4-20250514) for lead pain-point generation |
| Scraping              | ERIX-LAIE internal scraper service (Playwright + patchright stealth)           |
| SDK                   | @ecodrix/erix-api (BSL licensed) — all frontend-to-server calls                |

ERIX-FLOW introduces a workflow execution engine as a new service layer within the ECODrIx backend. The canvas state is stored as JSON in PostgreSQL. When a workflow is triggered, the server reads the node graph, resolves execution order via topological sort, and enqueues nodes as jobs in ErixStore. A dedicated FLOW worker process consumes jobs, calls the relevant module APIs (LAIE, CRM, ErixSender), and writes results back to PostgreSQL. The frontend polls a /run-status SSE endpoint for real-time canvas updates.

---

## High-Level Infrastructure Diagram

User Browser (Next.js) -> ECODrIx API Server (Cloud Run) -> FLOW Execution Engine -> ErixStore Job Queue -> FLOW Worker Pool -> [LAIE Scraper | Claude API | Meta Cloud API | AWS SES | MongoDB CRM | PostgreSQL]

All module calls are internal service-to-service calls on GCP private networking. External calls: Claude API (enrichment), Meta Cloud API (WhatsApp), AWS SES (email), and LAIE proxy pool (scraping).

SSE stream from API server to browser for live run progress. Workflow state checkpointed in PostgreSQL after each node completes.

---

## Frontend Stack

| Key               | Value                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Framework         | Next.js 15 (App Router)                                                                     |
| Canvas Library    | React Flow (@xyflow/react) v12+ — handles node/edge rendering, drag-drop, zoom/pan          |
| State Management  | Zustand for workflow editor state (nodes, edges, selection, run status)                     |
| Server State      | TanStack Query for run history, template list, CRM lookups                                  |
| UI Components     | shadcn/ui + custom FLOW node components in Tailwind                                         |
| Node Config Panel | Custom right-drawer component, per-node-type form schema rendered via react-hook-form + Zod |
| Real-time Updates | EventSource (SSE) for live run progress; updates Zustand node status map                    |
| Primary CTA Color | #6366f1 (purple) — consistent with LAIE and ECODrIx console                                 |

- Canvas route: /console/flow/[workflowId] — full-screen editor with collapsed sidebar
- Workflow list route: /console/flow — grid of workflow cards with last run status
- Run history route: /console/flow/[workflowId]/runs — table + expandable drawer
- Template marketplace route: /console/flow/templates — browse and preview
- All SDK calls via @ecodrix/erix-api — no direct fetch to server from component layer

---

## Backend Stack

| Key              | Value                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime          | Node.js 20 LTS + TypeScript 5.x                                                                            |
| HTTP Framework   | Express/Hono (existing ECODrIx server on Cloud Run)                                                        |
| New Service      | erix-flow-worker: standalone Cloud Run service consuming ErixStore FLOW.\* jobs                            |
| ORM              | Drizzle ORM for PostgreSQL (workflow definitions, run logs, node configs)                                  |
| Validation       | Zod for all API request/response schemas                                                                   |
| Graph Resolution | Custom topological sort for node execution order from workflow JSON                                        |
| Node Executor    | Strategy pattern: each node type has an Executor class implementing execute(context, config) => NodeResult |
| Error Handling   | Per-node retry (max 3 attempts, exponential backoff) via ErixStore ERIX.RETRY command                      |

---

## Database Strategy

Workflow definitions, run history, and node execution logs are stored in GCP Cloud SQL PostgreSQL (platform database). Lead data generated by workflows is written to the tenant's MongoDB instance (per-tenant CRM). ErixStore provides in-flight job state and intermediate node output caching. Workflow canvas state is stored as JSONB in PostgreSQL for schema flexibility.

- PostgreSQL: workflows, workflow_nodes (JSONB canvas), workflow_runs, node_run_logs, workflow_templates
- MongoDB (per-tenant): leads collection extended with enrichment_data, validation fields, outreach_history
- ErixStore: FLOW.JOB.{runId}.{nodeId} keys for in-flight job state; TTL = 24 hours
- No cross-tenant database queries — all queries include tenant_id predicate enforced by Drizzle middleware

---

## API Architecture

| Key            | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| API Style      | REST + SSE (no GraphQL for MVP)                                                     |
| Versioning     | /api/v1/flow/\* — all FLOW endpoints under v1 namespace                             |
| Auth           | JWT (15min access) + httpOnly refresh (30d) — existing ECODrIx auth                 |
| Tenant Scoping | tenantId extracted from JWT sub claim, injected into all service calls              |
| Rate Limiting  | 10 workflow runs/hour per tenant on Starter; 100/hour on Growth (ErixStore counter) |
| SSE Endpoint   | GET /api/v1/flow/runs/:runId/stream — live node status events                       |

| Endpoint                           | Method | Description                          | Auth |
| ---------------------------------- | ------ | ------------------------------------ | ---- |
| /api/v1/flow/workflows             | GET    | List all tenant workflows            | JWT  |
| /api/v1/flow/workflows             | POST   | Create new workflow                  | JWT  |
| /api/v1/flow/workflows/:id         | GET    | Get workflow canvas JSON             | JWT  |
| /api/v1/flow/workflows/:id         | PUT    | Save canvas state                    | JWT  |
| /api/v1/flow/workflows/:id/run     | POST   | Trigger workflow run                 | JWT  |
| /api/v1/flow/runs/:runId           | GET    | Get run summary + node statuses      | JWT  |
| /api/v1/flow/runs/:runId/stream    | GET    | SSE stream for live run updates      | JWT  |
| /api/v1/flow/templates             | GET    | List available templates             | JWT  |
| /api/v1/flow/templates/:id/install | POST   | Clone template into tenant workspace | JWT  |

---

## Authentication and Authorization

- Existing ECODrIx JWT auth extended with flow:read, flow:write, flow:run permission scopes
- Starter plan: flow:read + flow:write + flow:run (limited by run quota)
- Scale plan: flow:read + flow:write + flow:run + flow:api (external trigger via API key)
- Webhook trigger endpoint: HMAC-SHA256 header verification, secret stored encrypted per workflow
- Admin override: ECODrIx super-admin can view any tenant's workflow runs (audit only, no modify)

---

## Queue and Async Infrastructure

ErixStore is the sole queue and async infrastructure for ERIX-FLOW. No BullMQ or Redis. The workflow execution engine enqueues node jobs using ERIX.JOB.PUSH command. The erix-flow-worker service polls ERIX.JOB.DEQUEUE atomically (preventing double execution). Completed jobs trigger ERIX.JOB.ACK. Failed jobs trigger ERIX.JOB.RETRY up to 3 times before marking as FAILED.

| Key                    | Value                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Queue Commands Used    | ERIX.JOB.PUSH, ERIX.JOB.DEQUEUE, ERIX.JOB.ACK, ERIX.JOB.RETRY, ERIX.JOB.FAIL         |
| Job Priority           | P0: outreach nodes (time-sensitive) \| P1: enrichment \| P2: scrape                  |
| Job TTL                | 24 hours — stale jobs auto-expire and marked TIMEOUT                                 |
| Concurrency per tenant | Max 10 parallel node jobs on Growth plan, enforced via ErixStore tenant slot counter |
| Worker scaling         | erix-flow-worker Cloud Run min=1, max=10 instances, scale on job queue depth         |

---

## Realtime Infrastructure

- SSE (Server-Sent Events) used for run progress updates — simpler than WebSockets for one-directional server push
- SSE connection opened when user views a running workflow canvas
- Server pushes node_status events: {nodeId, status, leadsIn, leadsOut, error}
- Frontend Zustand store updates node status map on each SSE event — canvas re-renders node badge
- SSE connection closes when run completes or user navigates away
- Fallback: if SSE disconnects, client polls GET /runs/:runId every 3 seconds

---

## AI and LLM Infrastructure

| Key                 | Value                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Provider            | Anthropic Claude API (claude-sonnet-4-20250514)                                                           |
| Use Case            | Lead enrichment: pain point analysis, offer angle, personalised outreach opener                           |
| Prompt Architecture | System prompt sets Indian business context; user message contains lead JSON                               |
| Output Format       | Structured JSON via XML tag prompting: <pain_points>, <offer_angle>, <opener_wa>, <opener_email>          |
| Rate Limiting       | Max 50 concurrent Claude API calls via ErixStore semaphore (ERIX.SEMAPHORE.ACQUIRE)                       |
| Cost Control        | Max 500 tokens input + 300 tokens output per enrichment call; estimated Rs 0.01 per lead                  |
| Fallback            | If Claude API fails, enrichment node retries 3x then marks lead as enrichment_failed=true, continues flow |

---

## Caching Strategy

- ErixStore caches: workflow canvas JSON (TTL 5 min, invalidated on save), template list (TTL 1 hour)
- Scrape result deduplication: ErixStore key FLOW.SCRAPE.{tenantId}.{queryHash} — prevents re-scraping same query within 24h
- Enrichment caching: FLOW.ENRICH.{tenantId}.{leadHash} — avoids re-enriching same business within 7 days
- Run status cache: FLOW.RUN.{runId}.STATUS — fast reads during SSE polling without DB hit
- No client-side caching of run data — always fresh from server to prevent stale run displays

---

## Third-Party Integrations

| Service              | Purpose                                        | SDK / API                       | Called By               |
| -------------------- | ---------------------------------------------- | ------------------------------- | ----------------------- |
| Anthropic Claude API | Lead pain-point enrichment                     | HTTP REST (fetch)               | erix-flow-worker        |
| Meta Cloud API       | WhatsApp message delivery + phone validation   | @ecodrix/erix-api               | erix-flow-worker        |
| AWS SES              | Email outreach delivery                        | @ecodrix/erix-api (ErixSender)  | erix-flow-worker        |
| Cloudflare R2        | Lead export file storage                       | @ecodrix/erix-api (ErixStorage) | erix-flow-worker        |
| LAIE Scraper Service | Google Maps, JustDial, Sulekha scraping        | Internal HTTP service call      | erix-flow-worker        |
| LAIE-NET Proxy Pool  | Proxy rotation for scraping + email validation | Internal service                | LAIE Scraper            |
| Hunter.io (optional) | Email validation fallback                      | Hunter.io REST API              | erix-flow-worker        |
| Razorpay             | Credit top-up payments                         | Razorpay Node SDK               | ECODrIx billing service |

---

## Security Layers

- Node config sensitive fields (API keys, template IDs, webhook secrets): AES-256-GCM encrypted before PostgreSQL JSONB storage
- Tenant isolation: Drizzle ORM middleware enforces WHERE tenant_id = ? on all FLOW queries
- SSRF prevention: webhook trigger and output nodes whitelist-validate target URLs (no private IP ranges allowed)
- Scraping isolation: each tenant's LAIE scrape jobs use different proxy exit IPs — no IP sharing between tenants
- Run log redaction: phone numbers and emails in node output logs replaced with {PHONE_REDACTED} before storage
- Claude API key stored in GCP Secret Manager, injected as env var — never in source code or DB

---

## Logging and Monitoring

| Key              | Value                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Application Logs | GCP Cloud Logging — structured JSON logs from erix-flow-worker                        |
| Error Tracking   | Sentry (existing ECODrIx integration) — node execution errors with stack traces       |
| Metrics          | Custom metrics in ErixStore: jobs_processed, jobs_failed, credits_consumed per tenant |
| Alerting         | GCP Cloud Monitoring alert if job queue depth > 500 for 5 minutes                     |
| Run Audit Log    | PostgreSQL node_run_logs table — immutable, append-only, queried by admin panel       |

---

## CI and CD Pipeline

- GitHub Actions: on push to main, run tests, build Docker image for erix-flow-worker, push to GCP Artifact Registry
- Cloud Run deploy: gcloud run deploy erix-flow-worker --image ... --region asia-south1 --max-instances 10
- Next.js frontend: Vercel deploy on push to main (existing ECODrIx console CI)
- Database migrations: Drizzle migrate run as GitHub Actions step before Cloud Run deploy
- Feature flags: FLOW_MODULE_ENABLED env var to gate access per tenant tier without deploy

---

## Technical Risks

| Risk                                                             | Likelihood | Impact   | Mitigation                                                                              |
| ---------------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------- |
| ErixStore not ready for concurrent job queue load                | Medium     | High     | Load test with 100 concurrent jobs before FLOW MVP ships; add SQLite WAL mode           |
| Meta Cloud API rate limits hit during bulk WA outreach           | High       | Medium   | Respect 80 msg/sec limit; batch with 1-second delay via ErixStore scheduler             |
| LAIE scraper blocked by target sites mid-workflow                | Medium     | Medium   | Auto-retry with proxy rotation; partial result = partial success, not full failure      |
| Claude API latency spikes slow enrichment node                   | Low        | Medium   | Timeout enrichment after 10s; cache results; async enrichment with CRM update after run |
| React Flow performance degradation on complex canvas (50+ nodes) | Low        | Low      | Virtualize node rendering; limit MVP canvas to 30 nodes max                             |
| Cross-tenant data leak via JSONB workflow config                 | Low        | Critical | Drizzle ORM tenant_id enforcement + integration tests for cross-tenant query attempts   |

---

## Assumptions Made

- ErixStore ERIX.JOB.\* command namespace is implemented and stable before FLOW worker is built
- erix-flow-worker runs as separate Cloud Run service, not merged into existing API server
- LAIE scraper exposes internal HTTP API at http://erix-laie-service/scrape — callable from worker
- ErixSender exposes /send/whatsapp and /send/email endpoints callable via @ecodrix/erix-api SDK
- GCP asia-south1 private VPC networking allows Cloud Run service-to-service calls without public internet
- Anthropic Claude API is accessible from GCP Cloud Run without IP restriction issues

---
