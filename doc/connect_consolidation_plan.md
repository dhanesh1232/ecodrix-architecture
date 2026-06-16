# ERIX-Connect — Channel Consolidation Audit & Plan

**Date:** June 2026 · **Goal:** All channel webhook ingestion, message services,
and tenant routing live UNDER `infra/connect/channels/*` — nowhere else. One
webhook endpoint per provider, one tenant-resolution path, all secrets from the
Connect provider registry (not `.env`).

---

## 1. Current state (where things live)

### What's ALREADY under Connect (good)

| Channel            | Webhook                                                        | Services                                                          | Status                      |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------- |
| WhatsApp           | `infra/connect/channels/whatsapp/routes/webhook.routes.ts`     | `whatsapp.service.ts`, `template.service.ts`, `cache.ts`          | ✅ Fully inside Connect     |
| Instagram DM       | `infra/connect/channels/social/routes/socialWebhook.routes.ts` | `socialInbound.service.ts`                                        | ✅ Inside Connect           |
| Facebook Messenger | Same social webhook route                                      | Same social inbound service                                       | ✅ Inside Connect           |
| Telegram           | `infra/connect/telegramWebhook.ts`                             | Same social inbound service                                       | ✅ Inside Connect           |
| Email (send)       | —                                                              | `infra/connect/providers/email/*` (ses, smtp, gmail, mail.client) | ✅ Providers inside Connect |
| Payments           | `routes/connect/payments-webhook.routes.ts`                    | `infra/connect/providers/payments/paymentLink.service.ts`         | ✅ Just shipped             |

### What's SCATTERED outside Connect (needs consolidation)

| File                                                   | What it does                           | Should live at                                                |
| ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| `erix/services/email/email.service.ts`                 | Send email (CRM sequences)             | Should call `infra/connect/providers/email/mail.client.ts`    |
| `erix/services/mail/email.service.ts`                  | Another email send service (marketing) | Duplicate — merge into connect email provider                 |
| `erix/services/mail/emailTemplate.service.ts`          | Template management                    | Move to `infra/connect/providers/email/`                      |
| `erix/services/mail/emailSuppression.service.ts`       | Unsubscribe/suppression                | Move to `infra/connect/providers/email/`                      |
| `erix/services/invoice/whatsapp.service.ts`            | Invoice delivery via WA                | Should call the WA client from Connect                        |
| `erix/sdk/whatsapp.sdk.ts`                             | WA SDK wrapper                         | Should import from Connect's `whatsapp.client.ts`             |
| `erix/jobs/saas/handlers/email.handler.ts`             | Email queue handler                    | Should import from Connect email provider                     |
| `erix/jobs/saas/handlers/whatsappBroadcast.handler.ts` | Broadcast sends                        | Should call Connect WA service                                |
| `platform/routes/saas/email.routes.ts`                 | Email config routes (SaaS)             | Move to `infra/connect/providers/email/`                      |
| `platform/routes/settings/email-config.routes.ts`      | Email settings                         | Already delegates to Connect's `email-config.service.ts` — ok |

### Webhook verification — `.env` vs Connect secrets

| Channel             | Current                                                                                         | Issue                                                                                                                         | Target           |
| ------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| WhatsApp            | `findOrgByWhatsappVerifyToken(token)` — searches ALL tenant secrets for a matching verify token | ✅ Already per-tenant from secrets store, not `.env`                                                                          | No change needed |
| Meta Social (IG/FB) | `META_APP_SECRET` from `.env` for HMAC verification                                             | This is the **platform App Secret** (one per FB app), NOT a per-tenant secret — it SHOULD stay in `.env` (it's platform-wide) | ✅ Correct as-is |
| Telegram            | Bot token from per-tenant Connect secrets                                                       | ✅ Already per-tenant                                                                                                         | No change        |
| Payments            | Per-tenant `webhookSecret` from Connect custom secrets                                          | ✅ Just shipped correctly                                                                                                     | No change        |

**Key finding:** Webhook validation is actually already correct — it uses the
platform App Secret (`.env`, shared) for Meta HMAC and per-tenant secrets (from
the Connect secrets store) for tenant resolution. The `.env` webhook token is NOT
being used for routing; it's only the Meta app-level HMAC — which is correct (one
Facebook App = one secret). No change needed here.

---

## 2. What needs to happen (consolidation moves)

### Priority 1 — Repoint email sends to the Connect email provider

**The biggest scatter:** There are 3 different email-send paths:

- `erix/services/email/email.service.ts` (CRM sequences)
- `erix/services/mail/email.service.ts` (marketing/campaigns)
- `infra/connect/providers/email/mail.client.ts` (the canonical Connect one)

**Action:** Make both CRM + marketing callers import and use the Connect email
provider (`infra/connect/providers/email/mail.client.ts`). This ensures:

- Per-tenant email provider selection (SMTP/Gmail/SES) from Connect config
- Email health tracking via Connect's `email-health.service.ts`
- One suppression list (from Connect)
- One send path (auditable, metered)

### Priority 2 — Repoint WA sends to the Connect WA client

`erix/sdk/whatsapp.sdk.ts` and `erix/services/invoice/whatsapp.service.ts`
call Meta's WA API directly. They should import from
`infra/connect/providers/whatsapp/whatsapp.client.ts` (which already resolves
the per-tenant WABA credentials from Connect secrets).

### Priority 3 — Move email template + suppression into Connect

`erix/services/mail/emailTemplate.service.ts` and
`emailSuppression.service.ts` are email-specific services that belong under
`infra/connect/providers/email/`.

### Priority 4 — Consolidate the two email services into one

`erix/services/email/email.service.ts` and `erix/services/mail/email.service.ts`
are essentially the same service (compose + send via SES/SMTP) with slightly
different interfaces. Merge into one under Connect.

---

## 3. What does NOT need to change (already correct)

- WhatsApp webhook routing — already in Connect, verifies per-tenant
- Social (IG/FB/Telegram) webhook routing — already in Connect
- Payment webhook routing — just shipped, per-tenant HMAC
- Meta `META_APP_SECRET` in `.env` — correct (platform-wide app secret)
- Connect provider registry + connection service + secrets facade — solid

---

## 4. Recommended implementation order

1. **Create a Connect email facade** — a thin `sendEmail(orgId, opts)` that
   resolves the tenant's email provider from Connect, sends via the right
   provider, and returns delivery status. Then repoint the two CRM/marketing
   email services to call this facade.
2. **Create a Connect WA facade** — `sendWhatsApp(orgId, opts)` that resolves
   the tenant's WABA from Connect and sends. Repoint `whatsapp.sdk.ts` +
   `invoice/whatsapp.service.ts`.
3. **Move email templates + suppression** under `infra/connect/providers/email/`.
4. **Delete the duplicate services** once all callers use the facades.

This turns Connect into the TRUE channel abstraction: every outbound message
(email/WA/IG/FB/Telegram/SMS) goes through `infra/connect/channels/*` or
`infra/connect/providers/*`, and every inbound webhook arrives at
`infra/connect/channels/*/routes/webhook.routes.ts`.
