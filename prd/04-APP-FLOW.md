# ECODrIx — App Flow Architecture
**Version:** 1.0 | **Date:** May 2026

---

## 1. Application Overview

| Aspect | Detail |
|--------|--------|
| Type | Multi-tenant SaaS platform |
| Primary Interface | Web (desktop + mobile responsive) |
| Auth Model | NextAuth JWT + API key (SDK) |
| Real-time | Socket.io (conversations, notifications) |
| Offline | ErixStore queue (retry on reconnect) |

---

## 2. Authentication Flow

```
1. User visits /auth/login
2. Enters email + password (or clicks "Sign in with Google")
3. NextAuth validates credentials:
   - Credentials: calls server POST /api/auth/login → bcrypt verify
   - Google: OAuth flow → callback → server provisions org if first login
4. JWT issued with: userId, orgId, role, plan, features, tenant{apiKey, clientCode}
5. Session stored in httpOnly cookie (30d refresh)
6. Frontend creates ECODrIxAPI instance with tenant credentials
7. All subsequent requests go through SDK with auto-attached headers
8. Token refresh: silent refresh 5min before expiry
9. Logout: clear cookie + revoke refresh token + SDK.disconnect()
```

---

## 3. Registration Flow

```
1. User visits /auth/register
2. Fills: full name, email, password, company name, industry
3. Frontend validates (Zod) → submits to server
4. Server creates:
   a. ecodrix_users record (password hashed with bcrypt)
   b. ecodrix_organizations record (auto-generate clientCode + apiKey)
   c. ecodrix_members record (role: "owner")
   d. Assign "Free" plan
5. Server returns JWT with full session data
6. Frontend redirects to / (console) with onboarding checklist visible
7. First-time user sees: "Welcome! Complete these 5 steps to get started"
```

---

## 4. Console Home Flow (Logged In)

```
1. User lands on / (console)
2. Frontend fetches via SDK:
   - ecod.health.check() → org stats (contacts, messages, audits)
   - ecod.request("GET", "/api/saas/activity") → recent activity
3. Console renders:
   - Product cards (ERIX, LAIE) with live stats or "locked" state
   - Infrastructure cards (Email, Storage, ErixStore)
   - Quick actions row
   - Activity feed (real-time via Socket.io)
   - Usage meters (plan limits)
4. User clicks "Launch ERIX Console" → navigates to /erix
5. Layout CHANGES: console topbar → ERIX sidebar + product topbar
6. "← Console" link in topbar returns to /
```

---

## 5. ERIX CRM Flows

### 5.1 Inbox Flow
```
1. User navigates to /erix (or /erix/inbox)
2. SDK fetches: ecod.whatsapp.conversations.list()
3. Left pane renders thread list (sorted by lastMessageAt)
4. User clicks a thread → right pane loads messages
5. SDK fetches: ecod.whatsapp.messages.list(conversationId)
6. Messages render as bubbles (inbound left, outbound right)
7. Socket.io subscription: new messages appear in real-time
8. User types in composer → sends via ecod.whatsapp.messages.send()
9. Message appears immediately (optimistic update)
10. Status updates arrive via Socket.io (sent → delivered → read)
```

### 5.2 Contact Management Flow
```
1. User navigates to /erix/contacts
2. SDK fetches: ecod.crm.leads.list({ page: 1, limit: 20 })
3. Table renders with columns from erix_field_configs
4. User clicks "Add Contact" → Sheet slides in with form
5. Form fields are dynamic (based on org's field config)
6. Submit → ecod.crm.leads.create(data) → table refreshes
7. User clicks a row → detail Sheet opens (inline edit)
8. Bulk select → actions dropdown (change stage, assign, export)
```

### 5.3 Pipeline Kanban Flow
```
1. User navigates to /erix/pipeline
2. SDK fetches: ecod.crm.pipelines.list() → get default pipeline
3. For each stage: ecod.crm.leads.byStage(pipelineId, stageId)
4. Kanban renders with cards in columns
5. User drags card from "New" to "Qualified"
6. Drop triggers: ecod.crm.leads.move(leadId, newStageId)
7. Optimistic update: card moves immediately
8. Activity logged: "Stage changed from New to Qualified"
```

### 5.4 Invoice Flow
```
1. User navigates to /erix/invoices → "New Invoice"
2. Select lead (auto-fills billTo from lead data)
3. Add line items (description, qty, rate)
4. System calculates: subtotal + GST (18%) = total
5. User clicks "Generate Payment Link"
6. Server: creates Razorpay payment link → returns URL
7. User clicks "Send via WhatsApp"
8. Server: sends WhatsApp message with payment link to lead's phone
9. Lead clicks link → pays via Razorpay
10. Razorpay webhook fires → server marks invoice as "paid"
11. Notification: "₹33,040 received from Ravi Kumar"
12. Lead activity: "Invoice #ECX-0042 paid"
```

---

## 6. LAIE Audit Flow

```
1. User navigates to /laie (or /laie/audit)
2. Enters business name + city → clicks "Run Audit"
3. Server enqueues: store.queueV2.push("laie-audit", { businessName, city, orgId })
4. Frontend subscribes to progress via Socket.io or SSE
5. Progress steps update in real-time:
   - ✓ Searching business...
   - ✓ Auditing website...
   - ⟳ Checking Google profile...
   - ○ Scanning social media...
   - ○ Generating outreach kit with AI...
6. Worker completes → result saved to laie_audits table
7. Frontend renders result card:
   - Score radials (website, google, social, linkedin, overall)
   - Top 3 weaknesses
   - Outreach kit (WhatsApp hook, email sequence, LinkedIn DM)
8. User clicks "Push to ERIX" → creates lead in erix_leads with audit data
```

---

## 7. AI Auto-Respond Flow

```
1. Inbound WhatsApp message arrives (Meta webhook → server)
2. Server checks: org.aiAgentEnabled && org.aiAutoReply
3. If enabled:
   a. Fetch conversation history (last 20 messages)
   b. Fetch lead profile (if exists)
   c. Call Claude with: system prompt (org.aiAgentPrompt) + history + new message
   d. Claude returns response + confidence score
4. If confidence > org.confidenceThreshold (default 0.85):
   → Auto-send response via WhatsApp
   → Log: "AI auto-responded (confidence: 0.91)"
5. If confidence < threshold:
   → Queue for human review
   → Show in inbox with AI suggestion (orange badge)
   → Agent can: approve (send as-is), edit + send, or dismiss
6. All AI interactions logged for learning
```

---

## 8. Visual Automation Flow

```
1. User navigates to /erix/automation → "New Workflow"
2. Canvas opens (React Flow) with empty state
3. User drags "Message Received" trigger from palette → drops on canvas
4. User drags "AI Qualify" action → connects to trigger
5. User drags "If/Else" condition → connects to AI node
6. Configures condition: "If score > 70"
7. Yes branch: "Move to Qualified stage"
8. No branch: "Wait 24h" → "Send follow-up template"
9. User clicks "Save" → workflow JSON saved to erix_workflows
10. User clicks "Activate" → isActive = true
11. Next time a message is received:
    a. Server checks active workflows for this org
    b. Matches trigger: "message_received"
    c. Enqueues: store.queueV2.push("workflow-execute", { workflowId, triggerData })
    d. Worker walks the node graph, executing each node
    e. Results logged to erix_workflow_runs
```

---

## 9. Role-Based Access Control

| Role | Console | CRM (view) | CRM (edit) | Invoices | Automation | Settings | Billing |
|------|---------|-----------|-----------|----------|-----------|----------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Agent | ✅ | ✅ | ✅ (assigned only) | ❌ | ❌ | ❌ | ❌ |
| Viewer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 10. Error Handling Flow

```
API Error Categories:
  401 UNAUTHORIZED    → Redirect to /auth/login
  403 FORBIDDEN       → Show "Access Denied" with upgrade CTA
  404 NOT_FOUND       → Show "Not Found" with back button
  422 VALIDATION_ERROR → Show inline field errors
  429 RATE_LIMITED    → Show "Too many requests, try again in Xs"
  500 INTERNAL_ERROR  → Show "Something went wrong" + retry button

Network Errors:
  Offline → Queue operation in ErixStore offline queue → retry on reconnect
  Timeout → Show retry button + "Request timed out"

WhatsApp Errors:
  Rate limited → Queue with exponential backoff
  Template rejected → Show rejection reason + edit CTA
  Number not on WhatsApp → Mark lead, suggest alternative channel
```

---

## 11. Assumptions Made

- Socket.io reconnects automatically on network interruption (built-in behavior)
- React Flow handles 50-100 nodes without performance issues
- Razorpay payment link creation is synchronous (<2s response)
- Meta WhatsApp webhook delivery is reliable (99.9%+ delivery rate)
- Users will complete onboarding checklist within first 3 sessions
- AI confidence threshold of 0.85 provides good balance of automation vs accuracy
