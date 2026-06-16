Two things to address: (1) confirm the WhatsApp failure is what we suspected, then (2) walk through the trigger→job→execution flow with concrete file references.

## 1. Confirmed: Meta error 131049 — "ecosystem engagement"

Both failed messages return:

```json
{
  "code": 131049,
  "title": "This message was not delivered to maintain healthy ecosystem engagement.",
  "error_data": {
    "details": "In order to maintain a healthy ecosystem engagement, the message failed to be delivered."
  }
}
```

The diagnostic earlier returned empty `meta: {}` because Meta wraps the error in an **array** (`[{...}]`), and the parser was looking at `parsed.error` not `parsed[0]`. Easy fix; let me patch:

Re-run to confirm:

```bash
pnpm wa:diagnose --client=ERIX_CLNT_JPFDJS --since=14d
```

Now it'll properly tag both as `131049 → throttle` and print the recommended fix.

## 2. The trigger → execution flow

Looking at the actual `statusHistory` of both failed messages tells the full story:

```
queued (14:54:50) → sent (14:54:53) → failed (14:54:54)   # 4 seconds
queued (14:54:55) → sent (14:54:57) → failed (14:54:58)   # 3 seconds
```

The messages **were accepted by Meta** (status `sent` written) and then Meta sent a webhook back ~1 second later marking them failed with 131049. So your stack worked end-to-end — Meta accepted the API call, then refused to actually deliver. Here's the full path with file references:

### Flow diagram with file references

```
┌─────────────────────────────────────────────────────────────────┐
│  Nirvisham client app (e-commerce checkout / form / button)     │
│  projects/nirvisham/**                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP POST with x-api-key header
                     │ erix.workflows.trigger({ trigger: "order_paid", phone, ... })
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/packages/erix-api  — typed SDK                            │
│  Wraps every call with x-api-key + clientCode header            │
└────────────────────┬────────────────────────────────────────────┘
                     │ POST /api/saas/workflows/trigger
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/server/src/middleware/saasAuth.ts                         │
│  validateClientKey → reads ecodrix_organizations.api_key        │
│  Sets req.clientCode + req.org + req.orgId                      │
└────────────────────┬────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/server/src/routes/erix/workflows/trigger.routes.ts        │
│  1. Create EventLog { status: "received" } in tenant Mongo      │
│  2. Look up / create Lead by phone                              │
│  3. Count matching AutomationRule (clientCode + trigger)        │
│  4. EventBus.emit(clientCode, trigger, ctx)                     │
└────────────────────┬────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/server/src/services/saas/event/eventBus.service.ts        │
│  Decides: immediate vs scheduled                                │
│  - Immediate: calls runAutomations() in-process                 │
│  - Scheduled: enqueues to ErixStore with delay                  │
└────────────────────┬────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/server/src/services/saas/crm/automation.service.ts        │
│  runAutomations() —                                             │
│  1. Find AutomationRule with isActive + matching trigger        │
│  2. Apply condition checks against lead fields                  │
│  3. For each matching rule:                                     │
│     - if isSequence: enroll in multi-step                       │
│     - else: executeRule() → enqueueDelayedAction() per action   │
└────────────────────┬────────────────────────────────────────────┘
                     │  Enqueue: {type: "send_whatsapp", payload}
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/erix-store (sidecar)                                      │
│  - Persists job (Postgres-backed WAL + snapshot)                │
│  - Honors `runAt` for delayed jobs                              │
│  - Survives server restart                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ when runAt ≤ NOW(): pop and dispatch
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECOD/server/src/jobs/saas/crmWorker.ts                         │
│  Single worker process polling erix-store                       │
│  Dispatches by job.type:                                        │
│    crm.send_whatsapp → ActionExecutor.sendWhatsApp()            │
│    crm.send_email    → email.service.sendEmail()                │
│    crm.send_broadcast_msg → whatsapp.service.sendOutboundMessage│
│    crm.google_meet   → google.meet.service.createMeeting()      │
└────────────────────┬────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  services/saas/automation/actionExecutor.service.ts             │
│  → services/saas/whatsapp/whatsapp.service.ts                   │
│    sendOutboundMessage()                                        │
│    1. Resolve template + variables                              │
│    2. Save Message {status: "queued"}                           │
│    3. POST to graph.facebook.com/v21.0/{phoneId}/messages       │
│    4. On 200: update Message {status: "sent"} ← reached here    │
│    5. On 4xx/5xx: update Message {status: "failed"}             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │  Meta accepts the call → returns wamid
                     │  ~1s later: Meta sends webhook
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  routes/erix/whatsapp/webhook.routes.ts                         │
│  Receives Meta status update                                    │
│  → handleStatusUpdate() in whatsapp.service.ts                  │
│  Updates Message.status = "failed"                              │
│  Stores Message.error = "[{code: 131049, ...}]"  ← what we saw  │
│  Calls notifyFailure() → creates Notification card              │
└─────────────────────────────────────────────────────────────────┘
```

### Where the failure actually came from

The path that ran successfully:

- ✅ Trigger received
- ✅ Lead resolved
- ✅ Automation rule matched
- ✅ Job enqueued to ErixStore
- ✅ Worker picked it up
- ✅ Template variables resolved
- ✅ Meta API call accepted (Message.status = "sent")
- ❌ Meta status webhook arrived 1 second later: "ecosystem engagement"

**Your stack is healthy.** The single point of failure is **Meta's anti-spam policy**. Both failed messages were marketing-style templates (`order_purchase_confirmation` and `nv_service_enrol`) sent to your own test phone (`918143963821`). Meta noticed and started throttling.

### Why this happens specifically

Meta error 131049 fires when:

1. **Marketing-category templates** sent to a recipient who has been receiving low-engagement marketing messages from any business
2. **Same WABA repeatedly hits the same phone** with marketing content (your test loop)
3. **WhatsApp quality rating is `MEDIUM` or `LOW`** for the sender phone number

### Three things to do

**1. Re-categorize the templates as UTILITY**

`order_purchase_confirmation` is a textbook UTILITY template — it confirms a transaction. Same for `nv_service_enrol` (a service enrollment confirmation). Marketing throttling **does not apply to utility templates**.

In Meta WhatsApp Manager:

- Templates → `order_purchase_confirmation` → Edit → Category → switch from MARKETING to UTILITY → Resubmit for approval
- Same for `nv_service_enrol`

**2. Test with a phone that hasn't been spammed**

Your own test phone has received N test messages from this WABA over weeks. Meta has flagged it. Use a fresh number (a teammate's, a sandbox account) to validate the automation flow actually works.

**3. Check Nirvisham's WhatsApp quality rating**

Meta Business Manager → WhatsApp Manager → Phone Numbers → Quality Rating. If it's `MEDIUM` or `LOW`, you'll need to send some healthy traffic before quality recovers.

### What I'd do right now

Re-run `pnpm wa:diagnose` with the fixed parser to confirm the diagnosis, then:

```bash
# Confirm the diagnostic now properly identifies 131049
pnpm wa:diagnose --client=ERIX_CLNT_JPFDJS --since=14d
```

You should see:

```
🔧 most common failure — fix recommendation
  dominantCode: 131049
  kind: throttle
  cause: Meta throttled the send to maintain healthy ecosystem engagement (anti-spam policy).
  fix: Check WhatsApp Business Manager → quality rating. Use UTILITY templates for transactional flows (they bypass marketing throttling). If sending to a test phone repeatedly, switch to a fresh number.
```

Then go fix the template categories in WhatsApp Manager and the automations will start delivering. **No code changes needed — your platform is doing exactly what it should.**
