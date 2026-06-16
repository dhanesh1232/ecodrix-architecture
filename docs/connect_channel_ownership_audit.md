# ERIX-Connect — Channel Ownership Audit

**Date:** June 2026
**Question:** What channel code (WhatsApp/Email/IG/FB/Telegram/SMS) lives where, what SHOULD be in Connect vs elsewhere, and what needs to move?

---

## 1. The rule (your stated principle)

> Channel configurations, webhooks, credentials, provider clients, and
> message send/receive infrastructure SHALL live in `infra/connect/**`.
> Product code (CRM, FLOW) consumes channels via Connect's interfaces —
> it does NOT own channel clients, webhook endpoints, or credential
> resolution directly.

---

## 2. What's correctly in `infra/connect/` today ✅

| Component                      | Path                                                  | Role                                   |
| ------------------------------ | ----------------------------------------------------- | -------------------------------------- |
| WA webhook intake              | `channels/whatsapp/routes/webhook.routes.ts`          | Meta webhook → tenant route            |
| WA chat (inbox send/receive)   | `channels/whatsapp/routes/chat.routes.ts`             | Inbox operations                       |
| WA templates CRUD              | `channels/whatsapp/routes/templates.routes.ts`        | Template management                    |
| WA service (core send/receive) | `channels/whatsapp/services/whatsapp.service.ts`      | The actual Meta API client             |
| WA template resolution         | `channels/whatsapp/services/template.service.ts`      | Variable resolution                    |
| WA provider client             | `providers/whatsapp/whatsapp.client.ts`               | Low-level Meta API                     |
| WA send facade                 | `channels/whatsapp/sendWhatsApp.ts`                   | Simple send entry point                |
| IG/FB/Telegram webhooks        | `channels/social/routes/socialWebhook.routes.ts`      | Meta + Telegram ingest                 |
| IG/FB/Telegram inbound         | `channels/social/services/socialInbound.service.ts`   | Message processing                     |
| Telegram webhook register      | `telegramWebhook.ts`                                  | Bot API webhook setup                  |
| Email providers (SES/SMTP)     | `providers/email/ses.provider.ts`, `smtp.provider.ts` | Send transports                        |
| Email config                   | `providers/email/email-config.service.ts`             | Per-tenant provider config             |
| Email health                   | `providers/email/email-health.service.ts`             | Delivery health tracking               |
| Email client (unified)         | `providers/email/mail.client.ts`                      | THE email send client                  |
| Email send facade              | `channels/email/sendEmail.ts`                         | Simple send entry point                |
| SMS provider                   | `providers/sms/sms.provider.ts`                       | SMS delivery                           |
| Payments provider              | `providers/payments/paymentLink.service.ts`           | Payment links                          |
| Payments webhook               | `routes/connect/payments-webhook.routes.ts`           | Payment capture                        |
| Provider registry              | `providerRegistry.ts`                                 | All provider definitions               |
| Connection service             | `connectionService.ts`                                | Connect/configure/disconnect lifecycle |
| Secrets facade                 | `secretsFacade.ts`                                    | Credential encryption                  |
| Capability sync                | `capabilitySync.ts`                                   | Service config flags                   |
| Embedded Signup                | `metaEmbeddedSignup.ts`                               | WA/IG OAuth flow                       |
| Connect routes (API)           | `routes/connect/connect.routes.ts`                    | CRUD endpoint                          |

---

## 3. What's IN ERIX/CRM/Flow/Platform that should MOVE to Connect 🔴

| File                                                       | What it does                              | Why it's wrong                                                                                       | Where it should go                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `erix/model/saas/whatsapp/conversation.model.ts`           | Mongo Conversation schema                 | **Channel data model** — should be owned by Connect (or shared schema), not erix directly            | `infra/connect/channels/whatsapp/models/` or `shared/db/schema/erix/conversations.ts` (already exists in PG — the Mongo one is legacy) |
| `erix/model/saas/whatsapp/message.model.ts`                | Mongo Message schema                      | Same — channel data model                                                                            | Same (PG version already exists as `erix_messages`)                                                                                    |
| `erix/model/saas/whatsapp/template.model.ts`               | Mongo WA Template schema                  | Channel config model                                                                                 | Connect already has `template.service.ts` — this is the legacy Mongo backing                                                           |
| `erix/model/saas/whatsapp/broadcast.model.ts`              | Mongo Broadcast schema                    | Marketing/campaign — this one is borderline (it's CRM-domain, uses WA as transport)                  | Could stay; the send path already goes through Connect's WA service                                                                    |
| `erix/model/saas/email/emailTemplate.model.ts`             | Mongo email template schema               | Channel template config                                                                              | `infra/connect/providers/email/`                                                                                                       |
| `erix/model/saas/crm/emailCampaign.model.ts`               | Email campaign schema                     | Marketing domain using email as transport                                                            | Borderline — transport goes through Connect mail client already                                                                        |
| `erix/model/saas/crm/emailEvent.model.ts`                  | Email delivery events (open/click/bounce) | **Channel delivery tracking** — should be in Connect email                                           | `infra/connect/providers/email/`                                                                                                       |
| `erix/services/mail/emailTemplate.service.ts`              | Email template CRUD + resolution          | **Channel template management**                                                                      | `infra/connect/providers/email/templates/`                                                                                             |
| `erix/services/mail/emailSuppression.service.ts`           | Email unsubscribe/suppression             | **Channel delivery config**                                                                          | `infra/connect/providers/email/suppression.ts`                                                                                         |
| `erix/routes/mail/email-templates.routes.ts`               | Email template API routes                 | **Channel config routes**                                                                            | `infra/connect/providers/email/routes/`                                                                                                |
| `shared/lib/mail/mail.client.ts`                           | Old per-client SMTP MailClient class      | **Duplicate of Connect's `mail.client.ts`** — this is the legacy pre-Connect version                 | DELETE (Connect's `mail.client.ts` replaced it)                                                                                        |
| `shared/config/emailProviders.ts`                          | Email provider config constants           | Channel config                                                                                       | `infra/connect/providers/email/`                                                                                                       |
| `flow/services/automation/node-executors/send-email.ts`    | Legacy System B send-email executor       | **Should import from Connect** (currently imports ActionExecutor which already delegates to Connect) | DELETE — replaced by G3 shared action library `flow/engine/actions/`                                                                   |
| `flow/services/automation/node-executors/send-whatsapp.ts` | Legacy System B send-WA executor          | Same                                                                                                 | DELETE — replaced by G3 shared action library                                                                                          |
| `erix/sdk/whatsapp.sdk.ts`                                 | WA SDK class                              | Already imports from Connect's WA service — **this is a thin CRM-domain facade, OK to keep**         | Keep (it correctly delegates)                                                                                                          |
| `erix/sdk/mail.sdk.ts`                                     | Email SDK class                           | Should delegate to Connect email                                                                     | Verify it uses Connect's mail client                                                                                                   |

---

## 4. What's correctly in ERIX/CRM (should NOT move) ✅

| File                                                   | Why it stays                                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `erix/services/mail/email.service.ts`                  | Application layer: tracking injection + lead attribution. TRANSPORT goes through Connect's `mail.client.ts` already. |
| `erix/services/invoice/whatsapp.service.ts`            | Application layer: invoice delivery logic. Send goes through Connect WA.                                             |
| `erix/services/crm/conversations.adapter.ts`           | CRM domain: conversation management via ErixAdapter (residency-aware).                                               |
| `erix/jobs/saas/handlers/whatsappBroadcast.handler.ts` | CRM domain: broadcast campaign orchestration (batching, rate limiting). Transport → Connect.                         |
| `erix/jobs/saas/handlers/email.handler.ts`             | CRM domain: email campaign orchestration. Transport → Connect.                                                       |
| `shared/db/schema/erix/conversations.ts`               | Data schema (PG) — this is the canonical conversation model for the CRM. Data schemas can stay.                      |
| `shared/db/schema/erix/templates.ts`                   | Data schema (PG) — WA template records are CRM data.                                                                 |
| `platform/routes/settings/email-config.routes.ts`      | Already imports from Connect's `email-config.service.ts`. Just a route mount.                                        |

---

## 5. What's correctly in LAIE (should NOT move)

| File                                     | Why it stays                                           |
| ---------------------------------------- | ------------------------------------------------------ |
| `laie/lib/emailDiscovery.ts`             | LAIE lead enrichment — finds emails, doesn't send them |
| `laie/lib/scrap/emailExtractor.ts`       | Scraping, not channel infra                            |
| `laie/jobs/workers/emailFinderWorker.ts` | Enrichment worker                                      |
| `laie/lib/webhookDispatch.ts`            | LAIE's own outbound webhooks to external systems       |

---

## 6. Summary: what to do (prioritized)

### Must move (channel infra wrongly in erix) 🔴

1. **Email templates** — `erix/services/mail/emailTemplate.service.ts` + `erix/routes/mail/email-templates.routes.ts` → `infra/connect/providers/email/templates/`
2. **Email suppression** — `erix/services/mail/emailSuppression.service.ts` → `infra/connect/providers/email/suppression.ts`
3. **Email events model** — `erix/model/saas/crm/emailEvent.model.ts` → `infra/connect/providers/email/`
4. **Email provider config** — `shared/config/emailProviders.ts` → `infra/connect/providers/email/`

### Should delete (superseded by Connect or G3)

5. **Legacy MailClient** — `shared/lib/mail/mail.client.ts` → DELETE (Connect's `mail.client.ts` replaced it; verify zero importers first)
6. **Legacy node-executors** — `flow/services/automation/node-executors/send-email.ts` + `send-whatsapp.ts` → DELETE (replaced by `flow/engine/actions/` shared library in G3)

### Legacy Mongo models (deprecate as residency migrates)

7. **WA Mongo models** — `erix/model/saas/whatsapp/*.model.ts` → these are the legacy Mongo backing; the PG schema (`erix_conversations`, `erix_messages`, `erix_whatsapp_templates`) is canonical. Mark as `@deprecated` with a pointer to the PG schema; DELETE once Mongo residency is fully retired.
8. **Email Mongo models** — `erix/model/saas/email/emailTemplate.model.ts` + `erix/model/saas/crm/emailCampaign.model.ts` → same: mark deprecated, PG is canonical.

### Keep as-is (correctly layered)

- `erix/services/mail/email.service.ts` — application logic (tracking + attribution) over Connect transport
- `erix/sdk/whatsapp.sdk.ts` — thin CRM facade over Connect WA service
- All `erix/jobs/saas/handlers/*` — CRM orchestration, transport → Connect
- `erix/services/crm/conversations.adapter.ts` — CRM domain via residency adapter
- `platform/routes/settings/email-config.routes.ts` — already delegates to Connect

---

## 7. After the moves, the clean architecture looks like

```
infra/connect/
├── channels/
│   ├── whatsapp/
│   │   ├── routes/          webhook.routes, chat.routes, templates.routes
│   │   ├── services/        whatsapp.service, template.service, cache
│   │   └── sendWhatsApp.ts  simple send facade
│   ├── email/
│   │   ├── routes/          email-templates.routes (MOVED from erix)
│   │   ├── services/        template.service (MOVED), suppression (MOVED)
│   │   └── sendEmail.ts     simple send facade
│   ├── social/
│   │   ├── routes/          socialWebhook.routes (IG/FB/Telegram)
│   │   └── services/        socialInbound.service
│   └── sms/
│       └── send.ts
├── providers/
│   ├── email/               ses, smtp, gmail, mail.client, config, health
│   ├── whatsapp/            whatsapp.client, utils
│   ├── payments/            razorpay, stripe, paymentLink
│   ├── google/              meet, calendar
│   └── sms/                 provider, truecaller
├── providerRegistry.ts
├── connectionService.ts
├── secretsFacade.ts
└── capabilitySync.ts

erix/ (CRM — ONLY application logic, NO channel infra)
├── services/crm/           lead, pipeline, activity, conversations.adapter
├── services/mail/          email.service (tracking + attribution wrapper OVER Connect)
├── services/invoice/       invoice generation (sends via Connect facades)
├── jobs/saas/              campaign orchestration (broadcasts, sequences)
└── sdk/                    thin domain facades (whatsapp.sdk → Connect, mail.sdk → Connect)

flow/ (automation — ONLY orchestration, NO channel infra)
├── engine/                 unified engine, shared actions (actions/* call Connect)
└── workers/                queue consumers
```

**One sentence:** Connect owns channels (config + credentials + webhook + send/receive + templates + health); CRM/FLOW own domain logic (campaigns, tracking, conversations, pipelines) and consume channels by importing from Connect.
