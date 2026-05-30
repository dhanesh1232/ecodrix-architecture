# 04 — App Flow Architecture

> Every user journey, with concrete URLs, services, and tables touched. Two acquisition channels
> (`direct` and `freelance`) lead to identical post-onboarding flows.

## 1. Overview

| Aspect       | Detail                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Direct UI    | `ECOD/saas` (Next.js 15 App Router)                                     |
| Freelance UI | `ECOD/admin` (Next.js)                                                  |
| Embeddable   | `@ecodrix/erix-react` mounted in tenant sites                           |
| Auth         | NextAuth v5 (saas) · Core API key (admin) · API key + client code (SDK) |
| Real-time    | Socket.io + ErixStore Pub/Sub via SDK `ecod.on(event, fn)`              |
| Offline      | ErixStore offline queue (planned for PWA)                               |

## 2. Direct Channel — Public Registration → First Lead

```
1.  User visits ecodrix.com/auth/signup
2.  Submits { email, password, fullName, orgName }
3.  POST /api/auth/register
      → bcrypt password
      → INSERT ecodrix_users
      → INSERT ecodrix_organizations { acquisition_channel: "direct", data_mode: "platform",
                                       client_code, api_key, plan_id: free }
      → INSERT ecodrix_members { role: "owner" }
      → subscriptionService.createFreeSubscription(orgId)
      → SES welcome + email verification link
      → return JWT
4.  Frontend stores session cookie, EcodProvider creates ECODrIxAPI
5.  Redirect to /onboarding (org.onboarding_complete = false)
6.  Wizard:
      - Welcome (confirm org info)
      - Pipeline (accept default 5-stage or customize) → INSERT erix_pipelines + erix_pipeline_stages
      - WhatsApp (Meta Cloud API) → UPDATE org { whatsapp_enabled, whatsapp_phone, whatsapp_status }
      - AI agent (pick prompt) → UPDATE org { ai_agent_prompt, ai_auto_reply, ai_confidence_threshold }
      - Team invite → POST /api/members/invite → SES email + ecodrix_audit_logs entry
      - Mark complete → UPDATE org { onboarding_complete: true } → redirect /
7.  Console renders product cards, infra cards, activity feed, usage meters
8.  User clicks ERIX → /erix/inbox
9.  First inbound WhatsApp arrives:
      - Meta webhook → server receives → tenantResolver via phone_id → orgId
      - Creates erix_conversations + erix_messages
      - emit({ type: "message.received", … })
      - if org.ai_agent_enabled: ai-respond queue → Gemini 2.0 Flash → confidence check
      - Pub/Sub on org:{orgId} → UI updates inbox in real time
10. User responds → ecod.whatsapp.messages.send → meta-out queue → delivered → status updates over Socket.io
```

## 3. Freelance Channel — Admin Onboarding

```
1.  Operator opens ECOD/admin (authenticated by CORE_API_KEY)
2.  Clicks "Add client" → form (name, slug, agency, plan, optional external DB URI)
3.  POST /api/admin/clients (server, x-core-api-key)
      → INSERT legacy mongoose Client (existing infrastructure)
      → if input.provisionMongo: provisionMongoForClient(clientId)
            - Mongo Atlas Admin API: createDatabaseUser + isolated DB
            - return URI
      → INSERT ecodrix_organizations { acquisition_channel: "freelance",
                                       data_mode: "own", external_db_type: "mongodb",
                                       external_db_uri: encrypt(uri),
                                       client_code, api_key, plan_id }
      → subscriptionService.createSubscription(orgId, planId)
      → ecodrix_audit_logs entry
      → return { client, org }
4.  Operator clicks "Configure WhatsApp" → same flow as direct (Meta Cloud API)
5.  Operator can now operate the client from admin (CRM, invoicing, marketing) — every op flows
    through tenantResolver + getErixAdapter(orgId), which routes to MongoAdapter for this org.
6.  First lead: created via admin → MongoAdapter writes to tenant's isolated Mongo;
    entitlement counters still increment on platform Postgres (`ecodrix_usage`).
```

## 4. Authentication Flows

### 4.1 NextAuth credentials (saas)

```
POST /api/auth/login (NextAuth credentials provider proxies to backend)
  → SELECT user by email → bcrypt.compare
  → load ecodrix_members for user → orgId
  → load ecodrix_organizations
  → return user { id, email, name, tenant: { apiKey, clientCode }, role, plan }
JWT issued, cookie set, EcodProvider builds SDK.
```

### 4.2 Forgot password

```
POST /api/auth/forgot { email }
  → INSERT ecodrix_password_resets { user_id, token_hash, expires_at: now+30min }
  → SES with reset link

POST /api/auth/reset { token, newPassword }
  → SELECT password_resets WHERE token_hash AND not used AND not expired
  → bcrypt.hash(newPassword)
  → UPDATE ecodrix_users
  → mark token used
```

### 4.3 SDK auth (every API call)

```
GET /api/crm/leads
  Headers:
    x-api-key: ecod_live_sk_…
    x-client-code: CLINIC_ABC

  → tenantResolver loads org → req.org
  → entitlement check (if metered) → quota or feature gate
  → handler calls getErixAdapter(req.org.id)
  → adapter executes scoped to org
  → response { success, data, meta }
```

## 5. Console Home (`/`)

```
1. Layout (console)/layout.tsx mounts EcodProvider
2. Page calls (in parallel via TanStack Query):
     - ecod.health.check()                      // org stats
     - ecod.platform.entitlements.get()         // remaining quotas
     - ecod.crm.activity.recent({ limit: 20 })  // activity feed
3. Renders:
     - Product cards (ERIX, LAIE, Editor) with quick stats; locked state if disabled
     - Infrastructure cards (Cloud Storage, ErixStore, Email)
     - Activity feed (subscribes to org:{orgId} Pub/Sub for live updates)
     - Usage meters per service+feature with upgrade CTA when > 80%
4. User clicks "Launch ERIX" → /erix/inbox (layout switches to (erix))
5. "← Console" link in product topbar returns to /
```

## 6. ERIX Flows

### 6.1 Inbox

```
/erix/inbox
  ecod.whatsapp.conversations.list() → erix_conversations
  Click thread → ecod.whatsapp.messages.list(convId) → erix_messages
  Real-time: ecod.on("message.received", invalidate)
              ecod.on("message.status_update", patch)
  Composer → ecod.whatsapp.messages.send → quota gate erix.whatsappMessages → erix-store queue
```

### 6.2 Contacts

```
/erix/contacts
  ecod.crm.leads.list({ filters }) → adapter.leads.list
  Add → Sheet form (fields from erix_field_configs) → ecod.crm.leads.create
  Row click → detail Sheet (inline edit, activity timeline, notes)
  Bulk → bulkUpdate
```

### 6.3 Pipeline

```
/erix/pipeline
  ecod.crm.pipelines.list / pipelines.stages
  Drag card → ecod.crm.leads.move(leadId, newStageId)
    → adapter.leads.moveStage → emit({ type: "lead.stage_changed" })
    → triggerWorkflows + per-stage auto_actions fire
    → Activity logged: erix_lead_activities { type: "stage_change" }
```

### 6.4 Invoice

```
/erix/invoices/new
  Pick lead → autofill billTo → add items → tax/discount calculated
  Generate Payment Link → POST /api/saas/invoices
    → quota gate (editor.pdfExport / dependent feature)
    → INSERT erix_invoices { status: "draft", payment_link_id, payment_link_url }
    → INCREMENT erix_invoice_settings.next_number
  Send via WhatsApp → POST /api/saas/invoices/:id/send-whatsapp
    → quota gate erix.whatsappMessages
    → composes message with payment link → enqueues whatsapp-send
    → UPDATE invoice { status: "sent", sent_via: "whatsapp", sent_at }
  Razorpay webhook on payment:
    → POST /api/webhooks/razorpay (HMAC verify)
    → UPDATE invoice { status: "paid", paid_at, paid_amount }
    → emit({ type: "invoice.paid" }) → notification + workflow triggers
```

### 6.5 Visual Workflow

```
/erix/automation/[id]
  Canvas (React Flow). Drag node from palette → drop on canvas → connect → configure properties.
  Save → ecod.workflows.update(id, { nodes, edges, trigger_type })
  Activate → ecod.workflows.update(id, { is_active: true })

Runtime:
  emit({ type: "lead.created" }) → triggerWorkflows finds active workflows by trigger_type
  → ErixStore queue.add("workflow-execute", { workflowId, orgId, triggerData })
  → workflow.worker.ts walks the graph
    - condition node → branch on result (yes / no)
    - action node → execute (send WA, AI respond, move stage, …)
    - wait node → schedule resume via ErixStore queue.delay
  → INSERT erix_workflow_runs { status, node_results, …}
  → SSE / Pub/Sub progress to UI
```

## 7. LAIE Audit Flow

```
/laie/audit
  Form { businessName, city }
  POST /api/laie/audit
    → quota gate laie.auditsPerMonth
    → enqueue laie-audit job (ErixStore)
  SSE / Pub/Sub on `audit:{auditId}:progress`
    → step events: searching → scoring website → checking GBP → reviews → outreach kit
  Worker writes to laie_audits + laie_review_intelligence + laie_outreach_kits
  Result page renders score radials + outreach kit
  "Push to ERIX" → ecod.crm.leads.create({ ..., leadGenData, source: "laie" })
                 → INSERT erix_lead_activities { type: "lead_created", body: "From LAIE audit" }
```

## 8. AI Auto-Respond

```
Inbound message (Meta webhook → tenantResolver via phone_id → orgId)
  → ai-respond worker:
      - check semantic cache (ErixStore)
      - if miss: buildContext → buildPrompt → callGemini(systemInstruction, userMessage)
      - estimateConfidence
      - cache response
      - if conf >= org.ai_confidence_threshold AND org.ai_auto_reply:
            → sendWhatsAppMessage (quota gate)
            → INSERT erix_lead_activities { type: "ai_auto_responded", performedBy: "ai-agent" }
        else:
            → publish ai_suggestion to inbox:{orgId} → UI shows orange suggestion card
```

## 9. Plan Upgrade Flow

```
Hit limit (e.g. erix.whatsappMessages quota exceeded)
  → 429 { error: "QUOTA_EXCEEDED", feature, remaining: 0 }
  → SDK shows <UpgradePrompt feature="erix.whatsappMessages" />
  → user clicks Upgrade → redirect /billing/upgrade?upgrade=erix.whatsappMessages

/billing/upgrade
  - Renders plan comparison from GET /api/platform/plans/public
  - Highlights plan that fixes the gated feature
  - Click Upgrade → POST /api/billing/subscribe { planId } → Razorpay subscription
  - Razorpay webhook fires → UPDATE ecodrix_subscriptions → entitlementService.invalidate(orgId)
                          → Socket.io emit "entitlements:updated" to org room
                          → SDK refreshes entitlements within 60s
```

## 10. Mode Switch (data_mode)

```
/settings/data-source
  Current mode: platform
  Click "Switch to both" → confirms test connection
    → POST /api/data-source/test { type, uri } → opens connection, pings, closes
  If healthy: POST /api/data-source/switch { newMode, type, uri }
    → encrypt(uri) → UPDATE ecodrix_organizations
    → invalidateAdapter(orgId) — next request uses DualAdapter
    → if migration needed (own → both): enqueues backfill job → progress shown
```

## 11. Embeddable SDK Install

```
Tenant gets API key + client code from /settings/developer.

In their app:
  npm i @ecodrix/erix-react @ecodrix/erix-api

  import { ErixProvider, ErixDashboard } from "@ecodrix/erix-react";
  <ErixProvider apiKey={KEY} clientCode={CODE}>
    <ErixDashboard />
  </ErixProvider>

Or per-component:
  import { WhatsAppInbox } from "@ecodrix/erix-react/whatsapp";
  import { KanbanBoard } from "@ecodrix/erix-react/crm";

ErixProvider:
  - Constructs ECODrIxAPI client
  - Fetches entitlements once + subscribes to entitlements:updated
  - Joins Socket.io rooms for org events
  - Wraps everything in ErixContainer (style isolation)
```

## 12. Role-Based Access Control

| Role   | Console | CRM read |     CRM write      | Invoices | Workflows | Settings | Billing |
| ------ | :-----: | :------: | :----------------: | :------: | :-------: | :------: | :-----: |
| Owner  |   ✅    |    ✅    |         ✅         |    ✅    |    ✅     |    ✅    |   ✅    |
| Admin  |   ✅    |    ✅    |         ✅         |    ✅    |    ✅     |    ✅    |   ❌    |
| Agent  |   ✅    |    ✅    | ✅ (assigned only) |    ❌    |    ❌     |    ❌    |   ❌    |
| Viewer |   ✅    |    ✅    |         ❌         |    ❌    |    ❌     |    ❌    |   ❌    |

Roles live in `ecodrix_members.role`. Per-product flags `erix_access`, `laie_access` further gate access.

## 13. Error Handling

| Status | When                   | UI                                          |
| -----: | ---------------------- | ------------------------------------------- |
|    401 | tenant not found       | Redirect `/auth/login`                      |
|    402 | feature not on plan    | `<UpgradePrompt feature />` with upgradeUrl |
|    403 | role lacks permission  | "Access denied" card + contact admin CTA    |
|    404 | resource missing       | Not-found state with back button            |
|    422 | Zod validation failed  | Inline field errors                         |
|    429 | quota exceeded         | UpgradePrompt + retry-after if soft         |
|    503 | adapter / sync failure | Toast + Retry; never crash                  |

WhatsApp-specific errors: rate-limited → exponential backoff in queue; template rejected → flag in
template UI with rejection reason; number not on WA → mark lead, suggest alt channel.

## 14. Assumptions

- Socket.io reconnects automatically.
- React Flow handles ≤200 nodes per workflow.
- Razorpay payment link creation is sync (< 2s).
- Meta WA webhook delivery is reliable (> 99%).
- Onboarding wizard completion target: ≥ 70% in first session.
- AI confidence threshold default 0.85 balances automation vs accuracy.

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/ai-auto-respond/`, `saas/.kiro/specs/visual-automation-builder/`, `saas/.kiro/specs/invoice-module/`.
