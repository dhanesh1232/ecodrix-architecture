# ECODrIx — Visual Architecture & System Diagrams
**Version:** 1.0 | **Date:** May 2026

---

## 1. PLATFORM OVERVIEW — Bird's Eye View

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                              ECODrIx PLATFORM ECOSYSTEM                                 │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           USER TOUCHPOINTS                                      │    │
│  │                                                                                 │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │    │
│  │   │   ECOD/saas │    │ ECOD/admin  │    │ erix-react  │    │  Mobile PWA │      │    │
│  │   │   ───────── │    │  ─────────  │    │  ─────────  │    │  ─────────  │      │    │
│  │   │  Direct User│    │  Agency/You │    │  Embedded   │    │  Field Sales│      │    │
│  │   │  Self-Serve │    │  Manage For │    │  In Client  │    │  Offline    │      │    │
│  │   │  Console    │    │  Clients    │    │  Websites   │    │  First      │      │    │
│  │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │    │
│  │          │                    │                   │                  │          │    │
│  └──────────┼────────────────────┼───────────────────┼──────────────────┼──────────┘    │
│             │                    │                   │                  │               │
│             └────────────────────┼───────────────────┼──────────────────┘               │
│                                  │                   │                                  │
│                                  ▼                   ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        @ecodrix/erix-api (SDK Layer)                            │    │
│  │                                                                                 │    │
│  │   Isomorphic TypeScript SDK — works in Browser + Node.js + React Native         │    │
│  │   Auto-retry (3x) │ Rate limit handling │ Socket.io real-time │ Type-safe       │    │
│  │                                                                                 │    │
│  │   Namespaces: .crm │ .whatsapp │ .email │ .meet │ .storage │ .agency │          │    │
│  │               .marketing │ .queue │ .checkout │ .settings │ .health             │    │
│  │                                                                                 │    │
│  └──────────────────────────────────────┬──────────────────────────────────────────┘    │
│                                         │                                               │
│                                         │ HTTP + WebSocket (auto-negotiated)            │
│                                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         ECOD/server (Backend Engine)                            │    │
│  │                                                                                 │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │   │   Auth   │  │   CRM    │  │   AI     │  │  Queue   │  │  Real-   │          │    │
│  │   │  Layer   │  │  Engine  │  │  Engine  │  │  Engine  │  │  time    │          │    │
│  │   │          │  │          │  │          │  │          │  │  Engine  │          │    │
│  │   │ saasAuth │  │ Leads    │  │ Claude   │  │ ErixStore│  │ Socket   │          │    │
│  │   │ coreAuth │  │ Pipeline │  │ Haiku    │  │ Workers  │  │ Pub/Sub  │          │    │
│  │   │ laieAuth │  │ Messages │  │ Embedding│  │ Scheduler│  │ SSE      │          │    │
│  │   │ JWT+Key  │  │ Invoice  │  │ Scoring  │  │ Retry    │  │ Rooms    │          │    │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │    │
│  │        │              │              │              │              │            │    │
│  └────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────────┘    │
│           │              │              │              │              │                 │
│           ▼              ▼              ▼              ▼              ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          DATA & INFRASTRUCTURE LAYER                            │    │
│  │                                                                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │  PostgreSQL  │  │  ErixStore   │  │  External    │  │  Cloud       │         │    │
│  │  │  (Supabase)  │  │  (port 6399) │  │  APIs        │  │  Services    │         │    │
│  │  │              │  │              │  │              │  │              │         │    │
│  │  │  Platform    │  │  Cache       │  │  WhatsApp    │  │  AWS SES     │         │    │
│  │  │  CRM (erix_*)│  │  Queue       │  │  Claude AI   │  │  Cloudflare  │         │    │
│  │  │  LAIE        │  │  Locks       │  │  Razorpay    │  │  R2          │         │    │
│  │  │  Audit Logs  │  │  Pub/Sub     │  │  Google Meet │  │  Render      │         │    │
│  │  │              │  │  Rate Limit  │  │  Google Maps │  │  Vercel      │         │    │
│  │  │              │  │  Semantic $  │  │              │  │              │         │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │    │
│  │                                                                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. REQUEST LIFECYCLE — How a Single API Call Flows

```
┌──────────┐     ┌──────────┐     ┌──────────────────────────────────────────────────┐
│  Client  │     │   SDK    │     │                  ECOD/server                     │
│  (React) │     │ erix-api │     │                                                  │
└────┬─────┘     └────┬─────┘     └────┬─────────────────────────────────────────────┘
     │                 │                │
     │  useContacts()  │                │
     │────────────────>│                │
     │                 │                │
     │                 │  GET /api/crm/leads                │
     │                 │  Headers:                          │
     │                 │    x-api-key: ecod_live_sk_...     │
     │                 │    x-client-code: CLINIC_ABC       │
     │                 │───────────────────────────────────>│
     │                 │                                    │
     │                 │                ┌───────────────────┤
     │                 │                │  saasAuth.ts      │
     │                 │                │  ─────────────    │
     │                 │                │  1. Extract key   │
     │                 │                │  2. Lookup org    │
     │                 │                │     in PostgreSQL │
     │                 │                │  3. Verify key    │
     │                 │                │  4. Attach orgId  │
     │                 │                │     to request    │
     │                 │                └───────────────────┤
     │                 │                                    │
     │                 │                ┌───────────────────┤
     │                 │                │  Route Handler    │
     │                 │                │  ─────────────    │
     │                 │                │  1. Check cache   │
     │                 │                │     (ErixStore)   │
     │                 │                │  2. If miss:      │
     │                 │                │     query PG with │
     │                 │                │     WHERE org_id  │
     │                 │                │  3. Set cache     │
     │                 │                │  4. Return data   │
     │                 │                └───────────────────┤
     │                 │                                    │
     │                 │  { success: true, data: [...] }    │
     │                 │<───────────────────────────────────│
     │                 │                                    │
     │  leads[]        │                                    │
     │<────────────────│                                    │
     │                 │                                    │
     │  Render table   │                                    │
     │                 │                                    │
```

---

## 3. MULTI-TENANT DATA ISOLATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT ISOLATION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─── MODE: "platform" (DEFAULT) ──────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   PostgreSQL (Supabase) — Single Database, Row-Level Isolation          │    │
│  │                                                                         │    │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │    │
│  │   │  erix_leads                                                     │   │    │
│  │   │  ┌──────────┬──────────────┬───────────┬─────────────────────┐  │   │    │
│  │   │  │ id       │ org_id       │ firstName │ phone               │  │   │    │
│  │   │  ├──────────┼──────────────┼───────────┼─────────────────────┤  │   │    │
│  │   │  │ uuid-1   │ ORG_CLINIC   │ Ravi      │ +91 98765...        │  │   │    │
│  │   │  │ uuid-2   │ ORG_CLINIC   │ Priya     │ +91 87654...        │  │   │    │
│  │   │  │ uuid-3   │ ORG_REALTY   │ Amit      │ +91 76543...        │  │   │    │
│  │   │  │ uuid-4   │ ORG_REALTY   │ Neha      │ +91 65432...        │  │   │    │
│  │   │  └──────────┴──────────────┴───────────┴─────────────────────┘  │   │    │
│  │   │                                                                 │   │    │
│  │   │  Query: SELECT * FROM erix_leads WHERE org_id = 'ORG_CLINIC'    │   │    │
│  │   │  Result: Only Ravi + Priya (CLINIC's data)                      │   │    │
│  │   │  ORG_REALTY can NEVER see CLINIC's data                         │   │    │
│  │   │                                                                 │   │    │
│  │   └─────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─── MODE: "own" (User's External DB) ────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   User provides their own MongoDB or PostgreSQL URI                     │    │
│  │   We connect on-demand, use OUR schema, store in THEIR database         │    │
│  │                                                                         │    │
│  │   ┌──────────────┐         ┌──────────────────────────────────────┐     │    │
│  │   │  ECODrIx     │ ──────> │  User's Database                     │     │    │
│  │   │  Server      │ connect │  (mongodb://their-server.com/crm)    │     │    │
│  │   │              │         │                                      │     │    │
│  │   │  Uses OUR    │         │  Collections: leads, messages,       │     │    │
│  │   │  schema defs │         │  templates, broadcasts, pipelines    │     │    │
│  │   │              │         │  (same structure, their storage)     │     │    │
│  │   └──────────────┘         └──────────────────────────────────────┘     │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─── MODE: "both" (Hybrid) ───────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   ┌──────────────┐    Write    ┌──────────────┐                         │    │
│  │   │  Our Supabase│ <─────────  │  Server      │                         │    │
│  │   │  (Primary)   │             │              │                         │    │
│  │   └──────────────┘             │              │                         │    │
│  │                                │              │                         │    │
│  │   ┌──────────────┐  Async Sync │              │                         │    │
│  │   │  Their DB    │ <─────────  │  ErixStore   │                         │    │
│  │   │  (Secondary) │   Queue     │  Worker      │                         │    │ 
│  │   └──────────────┘             └──────────────┘                         │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. AI ENGINE — How AI Operates Across the Platform

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI ENGINE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TRIGGERS (Events that activate AI):                                    │
│                                                                         │
│  WhatsApp msg ──┐                                                       │
│  Lead created ──┤                                                       │
│  Stage change ──┼──> AI BRAIN ──> ACTIONS                               │
│  No reply 3d ───┤       │                                               │
│  Deal won ──────┤       │                                               │
│  Scheduled ─────┘       ▼                                               │
│                                                                         │
│  ┌─── AI BRAIN (per org) ──────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │    │
│  │  │  CONTEXT   │  │   MODEL    │  │  MEMORY    │                 │    │
│  │  │            │  │            │  │            │                 │    │
│  │  │ Org prompt │  │ Sonnet 4   │  │ Semantic $ │                 │    │
│  │  │ Lead data  │  │ (complex)  │  │ (ErixStore)│                 │    │
│  │  │ History    │  │            │  │            │                 │    │
│  │  │ Industry   │  │ Haiku      │  │ Learning   │                 │    │
│  │  │ Custom     │  │ (fast/cheap│  │ Store      │                 │    │
│  │  │ rules      │  │  classify) │  │            │                 │    │
│  │  └────────────┘  └────────────┘  └────────────┘                 │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ACTIONS (What AI produces):                                            │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Auto-Respond │  │ Qualify Lead │  │ Score Lead   │                   │
│  │ (WhatsApp)   │  │ (ask Qs)     │  │ (0-100)      │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Follow-up    │  │ Summarize    │  │ Morning      │                   │
│  │ (generate)   │  │ (compress)   │  │ Briefing     │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Smart Reply  │  │ Predict      │  │ Coach        │                   │
│  │ (3 options)  │  │ (forecast)   │  │ (feedback)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. ERIXSTORE — Infrastructure Engine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ErixStore (port 6399)                                │
│                    Single-threaded in-memory engine                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── SERVICES ─────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │  Cache  │ │  Queue  │ │  Locks  │ │ Pub/Sub │ │  Rate   │     │   │
│  │  │  LRU    │ │  V2     │ │  Dist.  │ │  Event  │ │  Limit  │     │   │
│  │  │  512MB  │ │Priority │ │  Mutex  │ │  Bus    │ │ Sliding │     │   │
│  │  │  Tags   │ │  DLQ    │ │  R/W    │ │  SSE    │ │ Window  │     │   │
│  │  │  SWR    │ │  Retry  │ │  Sema   │ │         │ │         │     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  │                                                                  │   │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐               │   │
│  │  │Semantic  │ │ Anomaly │ │  Usage   │ │  Data   │               │   │
│  │  │ Cache    │ │Detector │ │  Meter   │ │  Store  │               │   │
│  │  │  AI      │ │ Z-score │ │Per-tenant│ │ KV/Hash │               │   │
│  │  │Embeddings│ │ Alerts  │ │ Metrics  │ │List/Set │               │   │
│  │  └──────────┘ └─────────┘ └──────────┘ └─────────┘               │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── PERSISTENCE (PostgreSQL) ─────────────────────────────────────┐   │
│  │  store_job_wal      → Zero job loss on crash (WAL replay)        │   │
│  │  store_snapshots    → Full state dump every 5 min (keep last 5)  │   │
│  │  store_usage_events → Per-tenant metering data                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── TRANSPORT ────────────────────────────────────────────────────┐   │
│  │  HTTP (Express)     → Standard REST API                          │   │
│  │  WebSocket (ws)     → Binary MessagePack (lowest latency)        │   │
│  │  Auto-negotiation   → Client SDK picks best available            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. INVOICE FLOW — End-to-End

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Deal   │    │ Invoice │    │ Payment │    │WhatsApp │    │  Lead   │
│  Won    │───>│ Created │───>│  Link   │───>│  Sent   │───>│  Pays   │
│         │    │         │    │ (Razorpay)   │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                  │
                                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Webhook │    │ Invoice │    │Activity │    │  Notify │    │ Revenue │
│ Fires   │───>│ Marked  │───>│ Logged  │───>│  Owner  │───>│Dashboard│
│(Razorpay)    │  PAID   │    │         │    │         │    │ Updated │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 7. AUTOMATION EXECUTION — Workflow Engine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW EXECUTION ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EVENT OCCURS                                                           │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Check Active    │  "Any workflows match this trigger?"               │
│  │ Workflows       │                                                    │
│  └────────┬────────┘                                                    │
│           │ Yes                                                         │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ Enqueue Job     │  store.queueV2.push("workflow-execute", {...})     │
│  │ (ErixStore)     │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ Worker Claims   │  ErixWorker polls queue, claims job                │
│  │ Job             │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    NODE GRAPH WALKER                             │   │
│  │                                                                  │   │
│  │  [Trigger] ──> [Condition] ──> [Action] ──> [Wait] ──> [Action]  │   │
│  │                     │                                            │   │
│  │                     │ (else branch)                              │   │
│  │                     └──> [Action] ──> [End]                      │   │
│  │                                                                  │   │
│  │  Each node:                                                      │   │
│  │    1. Execute logic (send msg, call AI, check condition)         │   │
│  │    2. Log result to erix_workflow_runs.nodeResults               │   │
│  │    3. Update progress: store.queueV2.updateProgress(jobId, %)    │   │
│  │    4. Resolve next node(s) based on edges + result               │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ Mark Complete   │  Update workflow_runs.status = "completed"         │
│  │ + Notify        │  Publish event via Socket.io                       │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. CLIENT ACQUISITION — Two Paths, One Destination

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  PATH A: SERVICE (You manage)          PATH B: DIRECT (Self-serve)      │
│                                                                         │
│  ┌─────────────┐                       ┌─────────────┐                  │
│  │ Client pays │                       │ User visits │                  │
│  │ setup fee   │                       │ ecodrix.com │                  │
│  └──────┬──────┘                       └──────┬──────┘                  │
│         │                                     │                         │
│         ▼                                     ▼                         │
│  ┌─────────────┐                       ┌─────────────┐                  │
│  │ You create  │                       │ User clicks │                  │
│  │ from Admin  │                       │ "Register"  │                  │
│  │ panel       │                       │             │                  │
│  └──────┬──────┘                       └──────┬──────┘                  │
│         │                                      │                        │
│         ▼                                      ▼                        │
│  ┌─────────────┐                       ┌──────────────┐                 │
│  │ POST /api/  │                       │ POST /api/   │                 │
│  │ clients     │                       │ auth/register│                 │
│  │ (core key)  │                       │ (public)     │                 │
│  └──────┬──────┘                       └──────┬───────┘                 │
│         │                                     │                         │
│         └──────────────────┬──────────────────┘                         │
│                            │                                            │
│                            ▼                                            │
│              ┌──────────────────────────┐                               │
│              │  SAME RESULT:            │                               │
│              │                          │                               │
│              │  • Organization record   │                               │
│              │  • API key generated     │                               │
│              │  • Client code assigned  │                               │
│              │  • Plan attached         │                               │
│              │  • Data isolated         │                               │
│              │  • SDK access ready      │                               │
│              │                          │                               │
│              └──────────────────────────┘                               │
│                            │                                            │
│              ┌─────────────┼─────────────┐                              │
│              │             │             │                              │
│              ▼             ▼             ▼                              │
│       ┌───────────┐ ┌───────────┐ ┌───────────┐                         │
│       │  CRM      │ │ WhatsApp  │ │ Invoicing │                         │
│       │  Active   │ │  Active   │ │  Active   │                         │
│       └───────────┘ └───────────┘ └───────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. EMBEDDABLE SDK — How @ecodrix/erix-react Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  CLIENT'S WEBSITE (e.g. myclinic.com)                                  │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  Their React App                                                  │ │
│  │                                                                   │ │
│  │  ┌─── ErixProvider (apiKey + clientCode) ──────────────────────┐  │ │
│  │  │                                                             │  │ │
│  │  │  ┌─── ErixContainer (style isolation) ──────────────────┐   │  │ │
│  │  │  │                                                      │   │  │ │
│  │  │  │  ┌──────────────────────────────────────────────────┐│   │  │ │
│  │  │  │  │         ErixDashboard                            ││   │  │ │
│  │  │  │  │                                                  ││   │  │ │
│  │  │  │  │  ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐    ││   │  │ │
│  │  │  │  │  │  CRM   │ │WhatsApp│ │Analytics│ │ Editor │    ││   │  │ │
│  │  │  │  │  │ Module │ │ Module │ │ Module  │ │ Module │    ││   │  │ │
│  │  │  │  │  └────────┘ └────────┘ └─────────┘ └────────┘    ││   │  │ │
│  │  │  │  │                                                  ││   │  │ │
│  │  │  │  └──────────────────────────────────────────────────┘│   │  │ │
│  │  │  │                                                      │   │  │ │
│  │  │  └──────────────────────────────────────────────────────┘   │  │ │
│  │  │                                                             │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  HOW IT WORKS:                                                         │
│  1. Client installs: pnpm add @ecodrix/erix-react @ecodrix/erix-api    │
│  2. Wraps with ErixProvider (passes apiKey + clientCode)               │
│  3. Components render — SDK handles all API calls internally           │
│  4. Backend validates: does this org's plan allow this feature?        │
│  5. Style isolation: ErixContainer prevents CSS conflicts              │
│  6. Real-time: Socket.io connects automatically                        │
│  7. Offline: operations queue locally, sync on reconnect               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. DEPLOYMENT TOPOLOGY

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── VERCEL ───────────────────────────────────────────────────────┐   │
│  │  ECOD/saas    → console.ecodrix.com                              │   │
│  │  ECOD/admin   → admin.ecodrix.com (internal)                     │   │
│  │  Edge Functions → Middleware (auth redirect, feature gates)      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── RENDER ───────────────────────────────────────────────────────┐   │
│  │  ECOD/server     → api.ecodrix.com (Web Service, $25/mo)         │   │
│  │  ECOD/erix-store → internal:6399 (Private Service, $7/mo)        │   │
│  │  Worker process  → Background Worker ($7/mo)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── SUPABASE ─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15   → db.[project].supabase.co                      │   │
│  │  PgBouncer       → Connection pooling (400 connections)          │   │
│  │  Auto-backups    → Daily, point-in-time recovery                 │   │
│  │  Dashboard       → SQL editor, table viewer, logs                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── CLOUDFLARE ───────────────────────────────────────────────────┐   │
│  │  R2 Storage      → cdn.ecodrix.com (media, PDFs, uploads)        │   │
│  │  DNS             → ecodrix.com routing                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── AWS ──────────────────────────────────────────────────────────┐   │
│  │  SES (ap-south-1) → Email delivery (50K/day)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Monthly Cost: ~$130 (supports 500+ orgs)                               │
│  Revenue at 500 orgs: ~$2,400/mo → 18x margin                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. COMPETITIVE MOAT — Visual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  WHAT COMPETITORS HAVE:          WHAT ECODrIx HAS:                      │
│                                                                         │
│  Interakt:                       ECODrIx:                               │
│  ┌──────────┐                    ┌──────────┐                           │
│  │ WhatsApp │                    │ WhatsApp │                           │
│  │ Messages │                    │ + CRM    │                           │
│  └──────────┘                    │ + AI     │                           │
│                                  │ + Invoice│                           │
│  Zoho:                           │ + LAIE   │                           │
│  ┌──────────┐                    │ + Auto   │                           │
│  │ CRM      │                    │ + SDK    │                           │
│  │ (email)  │                    │ + Store  │                           │
│  │ Complex  │                    └──────────┘                           │
│  │ Expensive│                                                           │
│  └──────────┘                    ALL IN ONE. ₹2-12k/mo.                 │
│                                  WhatsApp-first. AI-native.             │
│  Zapier:                         Built for India.                       │
│  ┌───────────┐                                                          │
│  │ Automation│                                                          │
│  │ (generic) │                                                          │
│  │ Separate  │                                                          │
│  │ tool      │                                                          │
│  └───────────┘                                                          │
│                                                                         │
│  6 MOATS:                                                               │
│  ━━━━━━━━                                                               │
│  1. ErixStore (own infra — no Redis bills)                              │
│  2. @ecodrix/erix-react (embeddable — network effect)                   │
│  3. LAIE (AI intelligence — unique data)                                │
│  4. WhatsApp+CRM+Invoice (one flow — integration depth)                 │
│  5. Visual automation (sticky — users invest time)                      │
│  6. Service channel (training data — AI gets smarter)                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. REVENUE ENGINE — How Money Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─── SERVICE CHANNEL ──────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Client pays ₹10k setup ──> You configure everything             │   │
│  │  Client pays ₹3k/month ──> Recurring revenue                     │   │
│  │  50 clients × ₹3k = ₹1.5L/month                                  │   │
│  │                                                                  │   │
│  │  BONUS: Every client = training data for AI                      │   │
│  │  After 50 clients: AI knows 20 industries                        │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── DIRECT CHANNEL ──────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  User signs up ──> Free plan (lead magnet)                      │    │
│  │  User upgrades ──> ₹2.4-12.3k/month                             │    │
│  │  500 users × ₹4k ARPU = ₹20L/month                              │    │
│  │                                                                 │    │
│  │  BONUS: Self-serve = zero marginal cost per user                │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─── SDK CHANNEL ─────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  Developer installs @ecodrix/erix-react                         │    │
│  │  Their users use ECODrIx features                               │    │
│  │  Usage-based billing (per message, per contact)                 │    │
│  │                                                                 │    │
│  │  BONUS: Network effect — more devs = more users = more data     │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  YEAR 1 TARGET:                                                         │
│  Service: ₹1.5L/mo + ₹5L setup = ₹23L/year                              │
│  Direct:  ₹20L/mo = ₹2.4Cr/year                                         │
│  TOTAL:   ~₹2.6 Crore ARR                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
