# SDK Trigger Contract

This document is the contract a client website implements to push events into the ECODrIx automation engine. It applies to the embed pattern Nirvisham uses today and to any tenant we hand the platform off to.

## TL;DR

```ts
import { ErixClient } from "@ecodrix/erix-api";

const erix = new ErixClient({
  apiKey: process.env.ERIX_API_KEY!, // org-scoped, encrypted at rest
  clientCode: process.env.ERIX_CLIENT_CODE!, // ERIX_CLNT_xxxxxx
});

await erix.events.trigger({
  trigger: "appointment_confirmed",
  phone: "919876543210",
  email: "patient@example.com",
  variables: { name: "Asha", doctor_name: "Dr. Mehta", date: "2026-06-04" },
  createLeadIfMissing: true,
});
```

That's it. The platform handles lead resolution, automation matching, action queuing, retries, status webhooks, and notifications.

## Where the credentials come from

When a tenant is provisioned (admin-created or self-signup), the platform mints two values that the client website embeds as environment variables:

| Variable           | Source                              | Format             |
| ------------------ | ----------------------------------- | ------------------ |
| `ERIX_CLIENT_CODE` | `ecodrix_organizations.client_code` | `ERIX_CLNT_XXXXXX` |
| `ERIX_API_KEY`     | `ecodrix_organizations.api_key`     | `erix_<64 hex>`    |

The admin UI surfaces both. The owner can rotate the API key at any time via `POST /api/clients/:code/api-key`. Rotation is a thirty-second hand-off — old key keeps working until the new one is pasted into the client's environment.

## Endpoint

```
POST {API_BASE_URL}/api/saas/workflows/trigger
Headers:
  Content-Type: application/json
  x-api-key: <ERIX_API_KEY>
  x-client-code: <ERIX_CLIENT_CODE>   # optional but recommended
```

The SDK wraps both headers automatically. Manual `fetch` is supported for legacy clients that can't ship the SDK.

## Request body

```jsonc
{
  "trigger": "appointment_confirmed", // required — see "Triggers" below
  "phone": "919876543210", // required — E.164 without the +
  "email": "patient@example.com", // optional but recommended for lead matching

  // String key/value pairs that get substituted into WhatsApp / email templates.
  // Keys are referenced as {{key}} in the template body.
  "variables": {
    "name": "Asha",
    "doctor_name": "Dr. Mehta",
    "date": "2026-06-04",
    "time": "10:30 AM",
  },

  // Free-form payload echoed onto the EventLog row. Use this for anything
  // the automation engine doesn't need to template — order line items,
  // raw external IDs, audit context, etc.
  "data": { "appointmentId": "appt_abc123", "amount": 1500 },

  // Lead-resolution behaviour
  "createLeadIfMissing": true,
  "leadData": {
    "firstName": "Asha",
    "lastName": "Patel",
    "source": "website",
  },

  // Scheduling — pick one
  "delaySeconds": 60,
  "delayMinutes": 5,
  "runAt": "2026-06-04T10:25:00Z",

  // Optional ack callback
  "callbackUrl": "https://yourapp.com/webhooks/erix-ack",
  "callbackMetadata": { "internal_ref": "..." },

  // Idempotency — if the same key appears twice within 24h, the second
  // call is a no-op. Use the order id, payment id, etc.
  "idempotencyKey": "order:abc123",
}
```

## Response

Success (`200`):

```json
{
  "success": true,
  "data": {
    "eventLogId": "65fa…",
    "trigger": "appointment_confirmed",
    "leadId": "65fb…",
    "rulesMatched": 2
  }
}
```

`rulesMatched: 0` is not an error — it means the trigger was ingested but no active automation rule covers it. Use the dashboard to bind a rule, then re-fire.

Errors:

| Code               | HTTP | Cause                             | Action                                |
| ------------------ | ---- | --------------------------------- | ------------------------------------- |
| `MISSING_REQUIRED` | 400  | `trigger` or `phone` missing      | Fix payload                           |
| `INVALID_TRIGGER`  | 400  | trigger has spaces or is too long | Use snake_case, ≤ 100 chars           |
| `INVALID_PHONE`    | 400  | not E.164, < 10 digits            | Strip non-digits, prefix country code |
| `Unauthorized`     | 401  | missing / wrong `x-api-key`       | Check env vars                        |
| `quota_exceeded`   | 429  | plan workflow runs/month exceeded | Upgrade plan or wait for reset        |
| `INTERNAL_ERROR`   | 500  | tenant DB not configured, etc.    | Contact ECODrIx support               |

The SDK throws on any non-2xx and exposes `err.response?.data` so client code can branch on `code`.

## Triggers

Built-in system triggers always available without any setup:

| Trigger                 | When to fire                                         |
| ----------------------- | ---------------------------------------------------- |
| `lead_created`          | New form submission, new visitor sign-up             |
| `stage_enter`           | Lead moved into a CRM stage (system-fired)           |
| `whatsapp_incoming`     | Customer sent an unsolicited WhatsApp (system-fired) |
| `appointment_confirmed` | Booking confirmed — Google Meet or offline           |
| `appointment_reminder`  | Pre-meeting reminder window (system-fired)           |
| `tag_added`             | Tag attached to a lead (system-fired)                |

Custom triggers can be registered per tenant via the dashboard or `POST /api/saas/events/assign`. Nirvisham, for example, defines `service_enrollment`, `product_purchased`, and `payment_failed` to wire up its e-commerce flow. Once registered, fire them the same way:

```ts
await erix.events.trigger({
  trigger: "product_purchased",
  phone: customer.phone,
  variables: { product: item.name, amount: String(order.total) },
});
```

Naming rules: `snake_case`, no spaces, ≤ 100 chars, no leading underscore.

## Variables and templates

Template variables are pure string substitution. Whatever the WhatsApp / email template references as `{{name}}`, send `variables.name`. The engine stringifies booleans and numbers — but it's safer to format on the client side so the wire shape stays predictable.

A few conventions worth following because the templates Nirvisham ships use them, and we copy that pattern into the default templates we hand to new tenants:

- `name` — recipient first name
- `phone`, `email` — also written in via `phone`/`email` top-level fields, but mirror them into `variables` if your template needs them inline
- `date`, `time` — IST-formatted; the platform doesn't reformat
- `amount`, `total_price` — string of major-currency-units (`"1500"`, not paise)
- `order_id`, `appointment_id`, `enrollment_id` — short human-readable IDs (the e-commerce equivalent of `Id` rather than `_id`)
- `meet_link`, `meet_code` — for appointment templates with a Google Meet button
- `source_event` — always `"crm"` from the SDK; reserved for the ingestion layer

## Idempotency

`idempotencyKey` is the only safe way to make this endpoint replay-safe. The engine deduplicates on `(clientCode, idempotencyKey)` for 24h. Use it on every payment/order/booking confirmation flow — webhooks retry, networks blip, deploys race.

```ts
await erix.events.trigger({
  trigger: "order_paid",
  phone:    customer.phone,
  idempotencyKey: `payment:${razorpayPaymentId}`,
  variables: { ... },
});
```

Without it, a Razorpay webhook retry will fire the trigger twice and Meta will deliver two WhatsApp messages.

## Worked example: Razorpay payment success

The reference implementation lives at:

```
projects/nirvisham/src/lib/server/payments/payment-success-handler.ts
```

The shape every flow follows:

1. Verify the payment server-side
2. Update local DB to `paid`
3. Sanitize phone to digits-only
4. Call `fireCrmEvent(trigger, phone, variables, options)` — a thin wrapper around `erix.events.trigger`
5. Optionally send a transactional email directly (the automation engine can also send email, but doing it inline guarantees ordering)

```ts
const sanitizedPhone = order.phone.replace(/\D/g, "");
await fireCrmEvent(
  "product_purchased",
  sanitizedPhone,
  {
    name: order.customerName,
    product: firstItem.name,
    item_count: String(order.items.length),
    total_price: String(order.total),
    amount: String(order.total),
    order_id: order.publicId,
    orderId: order._id.toString(),
    source_event: "crm",
  },
  {
    createLeadIfMissing: true,
    email: order.customerEmail,
    idempotencyKey: `order:${order._id}`,
  },
);
```

That single call:

- creates a lead if the phone is unknown
- matches every active automation rule keyed on `product_purchased`
- enqueues each action (WhatsApp, email, tag, internal notification)
- the worker dispatches each action to its provider
- Meta delivers the message and the platform records the status webhook
- the dashboard shows the EventLog row, the rule that fired, every action's status

## Verifying end-to-end

Two scripts on the platform side prove the path:

```bash
# Confirm the SDK auth path is healthy for a tenant
pnpm test:onboarding --backend=https://api.ecodrix.com \
  --mongo-uri=mongodb+srv://...   # required for the trigger stage

# Confirm a tenant's automation rules will actually deliver
pnpm wa:readiness --client=ERIX_CLNT_XXXXXX
```

`wa:readiness` walks every active rule, looks up its template's category and approval status, and reports `✅ ready` / `❌ throttled` / `⚠️ misconfigured` per flow. Run it before flipping the switch on a new tenant.

## Limits and gotchas

- **Plan quota** — every successful `trigger` increments a workflow-run counter. The Free plan caps at 100 runs/month. The middleware returns 429 with `code: "quota_exceeded"` once the cap is hit.
- **Phone format** — strip everything except digits. `+91 98765-43210` won't match a lead saved as `919876543210`.
- **Trigger casing** — `Order_Paid` and `order_paid` are different triggers. Pick one and stick to it.
- **Variables type** — strings only. Numbers/booleans get coerced; nested objects get dropped.
- **Lead matching** — by phone first, then email. If both are wrong, `createLeadIfMissing: false` returns `leadId: null` and `rulesMatched: 0`.
- **Webhook latency** — Meta's status webhook lands ~1–3 seconds after `sent`. Don't poll the dashboard from the client and expect synchronous delivery confirmation. Use `callbackUrl` for that.
- **Template categories** — MARKETING templates throttle on quality drops. Use UTILITY for transactional flows. See `docs/events/event-triggers.md` for the full breakdown.

## Reference

- SDK source: `ECOD/packages/erix-api/src/resources/events.ts`
- Trigger route: `ECOD/server/src/routes/erix/workflows/trigger.routes.ts`
- Auth middleware: `ECOD/server/src/middleware/saasAuth.ts`
- Action executor: `ECOD/server/src/services/saas/automation/actionExecutor.service.ts`
- Worker: `ECOD/server/src/jobs/saas/crmWorker.ts`
- Reference impl: `projects/nirvisham/src/lib/server/payments/payment-success-handler.ts`
- End-to-end test: `ECOD/server/scripts/test-onboarding-e2e.ts`
- Readiness check: `ECOD/server/scripts/check-automation-readiness.ts`
