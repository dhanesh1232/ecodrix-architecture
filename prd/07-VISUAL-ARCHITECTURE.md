# 07 — Visual Architecture & System Diagrams

> Text-mode ASCII diagrams. Six core flows: platform overview, request lifecycle, adapter selection,
> dual-mode sync, workflow execution, entitlement check, and two-channel onboarding.

## 1. Platform Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          ECODrIx Platform Surfaces                       │
│                                                                          │
│  Direct user             Freelance team        Tenant client website      │
│  ┌────────────────┐      ┌────────────────┐   ┌────────────────────────┐  │
│  │ ECOD/saas      │      │ ECOD/admin     │   │ <ErixProvider>         │  │
│  │ Next.js 15     │      │ Next.js        │   │  @ecodrix/erix-react   │  │
│  └───────┬────────┘      └───────┬────────┘   └───────────┬────────────┘  │
│          │ NextAuth              │ CORE_API_KEY           │ apiKey/code   │
│          └──────────────┬────────┴────────────┬───────────┘               │
│                         │                     │                           │
│                         ▼                     ▼                           │
│              ┌──────────────────────────────────────────┐                 │
│              │  @ecodrix/erix-api  (TS SDK)             │                 │
│              │  Browser + Node + React Native           │                 │
│              │  Auto-retry, rate-limit, Socket.io,      │                 │
│              │  type-safe, .request() escape hatch      │                 │
│              └────────────────┬─────────────────────────┘                 │
│                               │ HTTP + WebSocket                          │
│                               ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │                ECOD/server  (Express 5 + Hono)                   │     │
│  │                                                                  │     │
│  │  middleware:  tenantResolver  →  entitlement gate  →  handler    │     │
│  │  service:     getErixAdapter(orgId) → CRM ops                    │     │
│  │  workers:     whatsapp · broadcast · ai-respond · workflow ·     │     │
│  │               webhook · sync · invoice · email · subscription    │     │
│  │  ai:          Gemini 2.0 Flash (inbox) · Claude 4.5 (LAIE kits)  │     │
│  └──┬───────────┬──────────────────┬────────────────────┬──────────┘     │
│     │           │                  │                    │                │
│     ▼           ▼                  ▼                    ▼                │
│  ┌────────┐ ┌──────────┐  ┌────────────────┐  ┌──────────────────┐        │
│  │Supabase│ │ ErixStore│  │ Tenant Mongo / │  │ External APIs    │        │
│  │ PG     │ │ port 6399│  │ Tenant PG      │  │ Meta WA · Vertex │        │
│  │ecodrix_│ │ Cache    │  │ (data_mode=    │  │ AWS SES · R2     │        │
│  │erix_   │ │ Queue    │  │  own / both)   │  │ Razorpay · Maps  │        │
│  │laie_   │ │ Locks    │  │                │  │                  │        │
│  │store_  │ │ PubSub   │  │                │  │                  │        │
│  └────────┘ └──────────┘  └────────────────┘  └──────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. Request Lifecycle

```
Client (React)             SDK (@ecodrix/erix-api)              ECOD/server
─────────────              ────────────────────────              ───────────

useLeads(filters) ────► ecod.crm.leads.list(filters)
                            │
                            │   GET /api/crm/leads?status=new
                            │   x-api-key: ecod_live_sk_…
                            │   x-client-code: CLINIC_ABC
                            ▼
                                                       ┌──── tenantResolver ─────┐
                                                       │ load ecodrix_organizations
                                                       │ by (apiKey, clientCode)
                                                       │ attach req.org
                                                       └────────────┬────────────┘
                                                                    ▼
                                                       ┌──── entitlement gate ───┐
                                                       │ (none for read; quota   │
                                                       │  on writes)             │
                                                       └────────────┬────────────┘
                                                                    ▼
                                                       ┌──── handler ────────────┐
                                                       │ adapter = getErixAdapter│
                                                       │ const items = await     │
                                                       │   adapter.leads.list(   │
                                                       │     req.org.id, filters)│
                                                       │ return { success, data }│
                                                       └────────────┬────────────┘
                                                                    ▼
                                              ┌── PG read scoped by org_id ──┐
                                              │ SELECT … WHERE org_id = $1   │
                                              └──────────────────────────────┘

useQuery cache ◄──── Lead[] ◄──── { success, data: [...] }
```

## 3. Adapter Selection (Multi-Source Data Layer)

```
                  getErixAdapter(orgId)
                          │
                          ▼
                  load ecodrix_organizations
                          │
            ┌──────┬──────┴──────┬──────┐
            │      │             │      │
   data_mode=     data_mode=    data_mode=  data_mode=
   "platform"    "own"         "own"        "both"
                + mongodb     + postgresql
            │      │             │           │
            ▼      ▼             ▼           ▼
  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ ┌──────────────────┐
  │ Postgres     │ │ MongoAdapter │ │ Postgres        │ │ DualAdapter       │
  │ Adapter      │ │ wraps        │ │ Adapter         │ │ Postgres primary  │
  │ (default     │ │ getCrmModels │ │ (per-tenant     │ │ + queue erix-sync │
  │  pool)       │ │ (clientCode) │ │  pool)          │ │ to mirror to ext  │
  └──────────────┘ └──────────────┘ └─────────────────┘ └──────────────────┘
            │              │                │                    │
            ▼              ▼                ▼                    ▼
       Supabase PG   Tenant Mongo    Tenant PG (BYO)       Supabase PG  ─┐
       erix_*        (legacy +       erix_* schema         +(tenant DB   │
                     freelance)      our codebase          via worker)   │
                                                                          │
       (factory caches adapter per orgId for 60s; invalidate on change)   │
                                                                          ▼
                                                      Tenant DB (eventual consistency)
```

## 4. Dual-Mode Sync (data_mode = "both")

```
   API request (write)
           │
           ▼
   ┌──────────────────────────────┐
   │ DualAdapter.leads.create     │
   │   await pg.leads.create(...) │  ◄─── canonical write
   │   if (success) {              │
   │     erixStore.queue.add(      │
   │       "erix-sync",            │
   │       {                       │
   │         orgId,                │
   │         operation: "lead.create",
   │         payload: createdLead, │
   │         externalDbType,       │
   │         externalDbUri,        │
   │       },                      │
   │       { attempts: 5,          │
   │         backoff: exp(2000) }  │
   │     )                         │
   │   }                           │
   └─────────────┬────────────────┘
                 │
                 ▼
        ┌────────────────────┐                ┌─────────────────────┐
        │ erix-sync queue    │ ─── claim ──►  │ sync.worker.ts       │
        │ (ErixStore)        │                │ - getExternalConn    │
        └────────────────────┘                │ - mirror op          │
                                              │ - on fail: retry/DLQ │
                                              │ - emit metrics       │
                                              └──────────┬──────────┘
                                                         ▼
                                              Tenant external DB write
                                                         │
                                                         ▼
                                              ErixStore Pub/Sub:
                                              channel: erix-sync-alerts
                                              (divergence alerts)
```

## 5. Visual Workflow Execution

```
DOMAIN EVENT EMITTED  (e.g. lead.created from CRM service)
        │
        ▼
emit({ type, orgId, ... }) ─►  EventBus
        │                           │
        │                           ├─►  in-process listeners
        │                           │   (notifications, scoring update)
        │                           │
        │                           ├─►  triggerWorkflows
        │                           │   SELECT erix_workflows
        │                           │     WHERE org_id, is_active, trigger_type
        │                           │   for each match:
        │                           │     erixStore.queue.add(
        │                           │       "workflow-execute",
        │                           │       { workflowId, orgId, triggerData }
        │                           │     )
        │                           │
        │                           ├─►  dispatchWebhooks
        │                           │   (when erix_webhooks ships)
        │                           │
        │                           └─►  pubsub.publish(`org:${orgId}`, event)
        │                                (UI receives via Socket.io)
        ▼
workflow.worker.ts
   ├── load erix_workflows row
   ├── walk graph from trigger node
   ├── per node:
   │     - condition → branch (yes/no edge)
   │     - action    → execute (send WA, AI respond, move stage, ...)
   │     - wait      → schedule resume via queue.delay
   │     - ai        → call Gemini, branch on result
   ├── append to erix_workflow_runs.node_results
   └── on completion: status="completed", emit progress event
```

## 6. Entitlement Check

```
                  POST /api/whatsapp/send  { to, text }
                          │
                          ▼
            ┌── tenantResolver ──────────────────────────────┐
            │ req.org = ecodrix_organizations row            │
            └────────────────────┬───────────────────────────┘
                                 ▼
            ┌── createQuotaMiddleware({                       │
            │     service: "erix",                            │
            │     feature: "whatsappMessages",                │
            │     countFn: (req) => req.body.recipients?.length ?? 1
            │   })                                            │
            │                                                 │
            │   const ent = entitlementService.get(orgId)     │
            │   const used = SELECT count FROM ecodrix_usage  │
            │     WHERE org_id, service, feature, periodStart │
            │   const remaining = limit - used                │
            │                                                 │
            │   if (remaining < count) {                      │
            │     return 429 {                                │
            │       error: "QUOTA_EXCEEDED",                  │
            │       feature: "erix.whatsappMessages",         │
            │       remaining: 0, upgradeUrl                  │
            │     }                                           │
            │   }                                             │
            │                                                 │
            │   res.locals.consumeQuota = () =>               │
            │     incrementUsage(...)                         │
            └────────────────────┬───────────────────────────┘
                                 ▼
                 handler runs operation
                 if successful:
                   await res.locals.consumeQuota()
                   (atomic INSERT … ON CONFLICT … DO UPDATE)
```

For boolean gates (`requireFeature("erix.broadcasts")`):

```
   features = mergedPlanFeatures(plan, addOns)
   enabled = path.split(".").reduce((o,k)=>o?.[k], features)
   if (!enabled) return 402 { error: "FEATURE_NOT_AVAILABLE", upgradeUrl }
```

## 7. Two-Channel Onboarding

```
  PATH A — DIRECT (self-serve)         PATH B — FREELANCE (managed)
  ─────────────────────────────         ────────────────────────────

  user visits ecodrix.com               operator opens ECOD/admin
        │                                       │
        ▼                                       ▼
  /auth/signup form                       "Add client" form (with optional
        │                                  Provision Mongo toggle, plan picker)
        ▼                                       │
  POST /api/auth/register                       ▼
  (public, public registration spec)      POST /api/admin/clients
        │                                  (CORE_API_KEY)
        ▼                                       │
  bcrypt password                               ▼
  INSERT ecodrix_users                    INSERT legacy mongoose Client
  INSERT ecodrix_organizations            (existing infrastructure)
    {                                           │
      acquisition_channel: "direct",            ▼
      data_mode: "platform",            if provisionMongo:
      client_code, api_key,               provisionMongoForClient(clientId)
      plan_id: free                       returns Atlas connection string
    }                                           │
  INSERT ecodrix_members owner                  ▼
  subscriptionService.createFreeSubscription
                                          INSERT ecodrix_organizations
                                            {
                                              acquisition_channel: "freelance",
                                              data_mode: "own",
                                              external_db_type: "mongodb",
                                              external_db_uri: encrypt(uri),
                                              client_code = client.clientCode,
                                              api_key     = client.apiKey,
                                              plan_id     = chosen
                                            }
        │                                       │
        └─────────────┬──────────────────────────┘
                      │
                      ▼
            ┌──────────────────────────────┐
            │ SAME RESULT FROM HERE ON     │
            │  - org row + isolated data   │
            │  - SDK keys ready            │
            │  - plan + entitlements live  │
            │  - audit log entry           │
            │  - WhatsApp/AI configurable  │
            │  - getErixAdapter routes     │
            │    queries to right backend  │
            └──────────────────────────────┘
                      │
                      ▼
                 onboarding wizard
                 (different defaults per channel —
                  freelance pre-fills more from
                  admin's input)
```

## 8. AI Auto-Respond Path

```
Inbound WhatsApp message (Meta webhook)
        │
        ▼
  /api/whatsapp/webhook
  ├─ verify Meta signature
  ├─ resolve org via phone_id → tenantResolver
  ├─ INSERT erix_messages, erix_conversations.upsert
  ├─ emit({ type: "message.received", ... })
  └─ if org.ai_agent_enabled && org.ai_auto_reply:
        erixStore.queue.add("ai-respond", { orgId, conversationId, messageFrom, body })

ai.worker.ts
   ├─ semantic cache check (ErixStore semantic.search at 0.92)
   │     hit?  return cached text, conf=0.95, source=cache
   ├─ build context (history, lead profile, org config)
   ├─ build system prompt + user message
   ├─ callGemini(model="gemini-2.0-flash", maxOutput=300)
   │     [retry once on DEADLINE_EXCEEDED]
   ├─ estimateConfidence(text, body, historyDepth)
   ├─ semantic.set for future cache hits (TTL 24h)
   ├─ if conf >= org.ai_confidence_threshold:
   │     send via WhatsApp (quota gate erix.whatsappMessages)
   │     INSERT erix_lead_activities { type: "ai_auto_responded",
   │                                    metadata: { confidence, model } }
   └─ else:
         erixStore.pubsub.publish(`inbox:${orgId}`,
            { type: "ai_suggestion", conversationId, suggestion, confidence })
         UI shows orange suggestion card; user can Use / Edit & Send / Dismiss
```

## 9. Embeddable SDK in Tenant Site

```
tenant-site.com (built by agency)
└── React app
    └── <ErixProvider apiKey clientCode>
        │     // builds ECODrIxAPI, fetches entitlements,
        │     // joins Socket.io rooms
        ▼
        <ErixContainer density="compact">
        │     // CSS-variable scoped, no body class
        ▼
        <ErixDashboard />     // full module router
        ├── /erix/inbox       (WhatsAppInbox)
        ├── /erix/contacts    (ContactsTable + Sheet)
        ├── /erix/pipeline    (KanbanBoard)
        ├── /erix/automation  (WorkflowCanvas — gated by plan)
        └── /erix/editor      (RichTextEditor pro features — gated)
                                 └── plan check via useEntitlements()
                                     - editor.collaboration -> Growth+
                                     - editor.comments      -> Starter+
                                     - editor.aiCalls       -> quota
```

The provider shows `<UpgradePrompt feature="path" />` inline when a feature is gated.

## 10. ErixStore Internals

```
┌────────────────────────────────────────────────────────────────────────┐
│                  ErixStore (port 6399, single-threaded engine)         │
│                                                                        │
│  Services (all in-memory, persisted to PG)                             │
│   Cache (LRU 512MB · tags · stale-while-revalidate)                    │
│   Queue v2 (priority · DLQ · retry · heartbeat · tenant fairness)      │
│   Locks (mutex · R/W · semaphore · deadlock detection)                 │
│   Pub/Sub (event bus · SSE · room-based)                               │
│   Rate Limit (sliding window per key)                                  │
│   Anomaly Detector (Z-score alerts → erix-alerts channel)              │
│   Semantic Cache (Google embeddings · 0.92 threshold)                  │
│   Usage Meter (per-tenant counters → flushed to ecodrix_usage)         │
│   Pipeline batching (multi-op atomic)                                  │
│                                                                        │
│  Persistence                                                           │
│   store_job_wal       — write-ahead log, replayed on boot              │
│   store_snapshots     — full state, every 5 min, last 5 retained       │
│   store_usage_events  — flushed pre-aggregation                         │
│                                                                        │
│  Transport                                                             │
│   HTTP (Express)         — REST API                                    │
│   WebSocket (binary MessagePack) — lowest-latency                      │
│   Auto-negotiated by client SDK                                        │
└────────────────────────────────────────────────────────────────────────┘
```

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/visual-automation-builder/`, `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/ai-auto-respond/`, `saas/.kiro/specs/platform-pricing-entitlements/`.
