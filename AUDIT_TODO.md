# SDK & Connect Redesign — Audit & Fix List

> **STATUS: ✅ COMPLETE.** All fixes applied, full audit done, both docs
> reconciled. The entire server compiles clean (`tsc --noEmit` → 0 errors).
> Full report: `.Architecture/SERVER_AUDIT_REPORT.md`. This file is kept as the
> historical record of the redesign + its resolution.

## Mental Model (CORRECT)

```
┌──────────────────────────────────────────────┐
│  FLOW (Automation Engine)                    │
│  Uses: ERIX SDK for all actions              │
│  Never called BY: Connect                    │
└──────────────┬───────────────────────────────┘
               │ calls
               ▼
┌──────────────────────────────────────────────┐
│  ERIX (Core Business Layer)                  │
│  Owns: Conversations, Templates, Messages,   │
│        Broadcasts, Leads, Pipelines          │
│  Uses: Connect for raw transport             │
│  Called BY: Flow, Connect (webhooks→SDK)     │
└──────────────┬───────────────────────────────┘
               │ calls for raw send
               ▼
┌──────────────────────────────────────────────┐
│  CONNECT (Transport Layer)                   │
│  Owns: Credentials, Webhook receivers,       │
│        API keys, Provider connections        │
│  Uses: ERIX SDK (to track conversations)     │
│  Never uses: Flow directly                   │
└──────────────────────────────────────────────┘
```

**Rules:**

- Connect → CAN call ERIX SDK (for tracking/inbox)
- Connect → NEVER calls Flow/ActionExecutor
- Flow → calls ERIX SDK (which internally calls Connect transport)
- ERIX → calls Connect transport (WhatsappService, EmailService)
- External API (via connect key) → Connect route → ERIX SDK → Connect transport

---

## Files That Need Fixing — ✅ ALL RESOLVED

### 1. `sdk/connect.sdk.ts` — transport.whatsapp.sendRaw — ✅ DONE

**Was**: Imported `ActionExecutor` from `@flow/services/automation/`
**Now**: Calls ERIX `WhatsAppSDK.sendByPhone()` (template) / `sendTextByPhone()`
(free text). A new `findOrCreateConversationByPhone()` helper on
`whatsapp.service.ts` resolves/creates the conversation (mode-aware: Mongo +
platform-Postgres), then `sendOutboundMessage` dispatches. No `@flow` import.

### 2. `sdk/connect.sdk.ts` — transport.instagram.sendDM / transport.telegram — ✅ DONE

**Was**: Used `ActionExecutor` from flow.
**Now**: Raw provider sends performed inside Connect using Connect-owned
credentials (Instagram Graph API, Telegram Bot API) — transport is legitimately
Connect's responsibility. No `@flow` import.

### 3. `infra/connect/send/send.routes.ts` — ✅ DONE

**Was**: Used `ActionExecutor` for WhatsApp/email sends.
**Now**: WhatsApp/email route through ERIX SDK (`sendByPhone` / `sendTextByPhone`
/ `mail.sendTemplate` / `mail.send`); Telegram routes through
`ConnectSDK.transport.telegram`. No `@flow` import.

### 4. `infra/connect/webhooks/meta.webhook.ts` — ✅ CORRECT (WA) + IG/FB FIXED

**WhatsApp handler**: Already correct — calls `sdk.whatsapp.handleIncoming()`.
**IG/FB handlers**: Previously placeholder loggers; now call a shared
`processSocialWebhook(body, channel)` → `ingestInboundSocialMessage` → ERIX
EventBus (resolves tenant via `buildSocialAccountMap`).

### 5. Instagram/Facebook webhook handlers — ✅ DONE

Wired to `ingestInboundSocialMessage` which upserts the lead's social identity
and fires ERIX EventBus automations (`instagram_dm`, `facebook_incoming`).

---

## Design Doc Updates Needed — ✅ APPLIED (to SDK_PLATFORM_REDESIGN.md)

> Webhook clarification → §12. Transport architecture → §3.1 + connect.sdk.ts.
> Credential flow retained below as reference.

### Webhook Clarification

- There is NO platform-level Meta webhook
- ALL Meta webhooks are org-level (routed by phoneNumberId)
- The single endpoint `/webhooks/meta/whatsapp` handles ALL orgs — routing internally
- Only Razorpay has a true platform vs org split:
  - Platform: `/api/webhooks/razorpay/*` (ECODrIx billing, stays in platform/)
  - Org: `/webhooks/razorpay/org/:orgId` (user-connected payment gateway)

### Connect Credential Flow (WhatsApp)

1. User clicks "Connect WhatsApp" in dashboard
2. Two methods:
   a. **Embedded Signup** — Meta OAuth flow, auto-provisions credentials
   b. **Manual** — User pastes: WABA Access Token + Phone Number ID + WABA ID
3. Connect generates a webhook `verify_token` for this org
4. Connect shows the user: "Paste this webhook URL and verify token into developers.facebook.com"
5. User pastes, clicks verify → Meta calls our GET endpoint → we verify → user sees "Success" in UI
6. All credentials stored in `connect_credentials` table (encrypted)

### connect.sdk.ts transport — Correct Architecture

```typescript
transport.whatsapp.sendRaw → should call erix/sdk/whatsapp (needs new sendByPhone method)
transport.email.sendRaw → should call erix/sdk/mail.send({ to, subject, html })  ← this is already correct!
transport.instagram.sendDM → needs ERIX-level method (like WhatsApp's sendByPhone)
transport.telegram.sendMessage → needs ERIX-level method
```

---

## Priority Order

1. ✅ DONE — Added `sendByPhone` + `sendTextByPhone` to `erix/sdk/whatsapp.sdk.ts` (backed by new `findOrCreateConversationByPhone` service helper). Also added `sendTemplate` to `erix/sdk/mail.sdk.ts`.
2. ✅ DONE — `connect.sdk.ts` transport now calls ERIX SDK (WhatsApp/email) + raw Connect-owned provider sends (IG/Telegram). No `@flow` imports.
3. ✅ DONE — `send.routes.ts` calls ERIX SDK (WhatsApp/email) + ConnectSDK telegram transport. No `@flow` imports.
4. ✅ DONE — IG/FB webhook handlers in `meta.webhook.ts` now call `ingestInboundSocialMessage` → ERIX EventBus (was placeholder logging). See SERVER_AUDIT_REPORT.md B.5.
5. ✅ DONE — Design doc updated with webhook architecture (§12), notifications (§10), admin panel (§11).
6. ✅ DONE — Verified: 0 `@flow`/`actionExecutor` matches in `sdk/connect.sdk.ts` + `infra/connect/**`.

> Full audit + admin inventory + notification docs: `.Architecture/SERVER_AUDIT_REPORT.md`

---

## What's Already CORRECT

- ✅ `meta.webhook.ts` WhatsApp handler (calls ERIX SDK)
- ✅ `razorpay.webhook.ts` (org-level only, calls EventBus)
- ✅ `telegram.webhook.ts` (calls EventBus)
- ✅ `ses.webhook.ts` (calls ERIX email tracking)
- ✅ API key system (schema, service, middleware, routes)
- ✅ All Connect schemas (9 tables in connect.schema.ts)
- ✅ Services (webhookLog, delivery, batch, usage, oauth)
- ✅ Advanced routes (all mounted correctly)
- ✅ SDK factory (createPlatformSDK)
- ✅ Email transport in connect.sdk.ts (now routes through ERIX `mail.send` SDK — CORRECT)

---

## Full Audit — ✅ COMPLETED

All items below are done. See `.Architecture/SERVER_AUDIT_REPORT.md` for the
full gap report, admin-panel inventory, and notification documentation.

1. ✅ Read `SDK_PLATFORM_REDESIGN.md` (source of truth).
2. ✅ Audited the server (`ECOD/server/src/`) against the doc — gap report in
   SERVER_AUDIT_REPORT.md Part B.
3. ✅ Fixed `connect.sdk.ts` — all `@flow` imports removed, uses ERIX SDK
   (`sendByPhone` added to WhatsAppSDK).
4. ✅ Fixed `send.routes.ts` — calls ERIX SDK instead of ActionExecutor.
5. ✅ Documented the platform-level notification system — SDK_PLATFORM_REDESIGN.md
   §10 + SERVER_AUDIT_REPORT.md Part C (`platform/services/notification.service.ts`,
   `platform/routes/notifications.routes.ts`).
6. ✅ Audited the admin panel (`ECOD/admin/`) — SDK_PLATFORM_REDESIGN.md §11 +
   SERVER_AUDIT_REPORT.md Part D. Gaps: WhatsApp template approval and LAIE actor
   management are **absent**; WhatsApp/LAIE-engine pages are monitor-only.
7. ✅ Prepared audit report — `.Architecture/SERVER_AUDIT_REPORT.md`.
8. ✅ Updated doc with admin panel + notifications + webhook architecture
   (SDK_PLATFORM_REDESIGN.md §§10-12).

### Bonus cleanup completed (beyond original scope)

- ✅ Fixed all 10 pre-existing type errors found during the audit
  (`ses-notification.service`, `flow.sdk`, `infra.sdk`, `laie.sdk`,
  `usage.service`, `razorpay.webhook`, `mongo-adapter`, `ruleExecutor`,
  `eventBus.service`, `chat.routes`). The entire server now compiles clean —
  `tsc --noEmit` reports **0 errors**.
- ✅ Corrected a latent phone-vs-conversationId bug in `chat.routes.ts` outbound
  sends (now use `sendTextByPhone`). See SERVER_AUDIT_REPORT.md B.6.

### Still open (product decisions, not code blockers)

- ⬜ Decide whether WhatsApp template approval + LAIE actor management belong in
  the admin panel (currently absent).
- ⬜ Optional: consolidate legacy top-level `routes/` and `services/` into domain
  folders.

### Key principles (unchanged)

- **Notifications = PLATFORM** (not erix-crm)
- **Connect NEVER imports from @flow** — only from ERIX SDK
- **ERIX is core** — connect calls ERIX SDK for everything business-related
- **Admin panel** controls platform-level config (plans, flags, billing, compliance)
