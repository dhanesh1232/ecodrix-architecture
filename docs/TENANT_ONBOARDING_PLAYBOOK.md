# Tenant Onboarding Playbook

End-to-end runbook for onboarding a new client onto the ECODrIx platform. Follow top-to-bottom for any new tenant. Should take ~10 minutes per client when the prerequisites are in hand.

## Audience

Whoever is provisioning the tenant — you, an ops contractor, or a future support engineer. Assumes shell access to the `ECOD/server` workspace and a deployed API at `https://api.ecodrix.com` (or local at `http://localhost:4000`).

## Prerequisites checklist

Before starting, gather from the client:

- [ ] Business name (used for org name)
- [ ] Owner email + full name
- [ ] Industry (clinic / e-commerce / services / education / other)
- [ ] Public website URL (drives CORS allowlist)
- [ ] WhatsApp Business Account ID + phone number ID + permanent token
- [ ] WhatsApp webhook verification token (any random string they pick)
- [ ] Optional: their own MongoDB cluster URI if they want isolated tenant data; otherwise the platform mints one on the shared cluster

## Stage 1 — Provision the tenant

The admin UI at `app.ecodrix.com` (or your dev `admin` workspace) wires this whole stage into a single dialog. Use it whenever possible — the `curl` snippets below are the underlying API contract for scripted onboarding or troubleshooting.

### 1a. Via the admin UI (preferred)

1. Open `Services → Clients → Provision Client`
2. Fill in business name, industry, tier
3. Fill in **Owner Login → Email** (full name optional)
4. Click `Initialize Tenant`
5. The next screen shows **Client Code, Owner Email, Temp Password, API Key**. Copy them and hand off to the tenant via Signal/password-manager. They are not retrievable later.

The dialog calls the same API the CLI does — UI and scripted onboarding stay in sync.

### 1b. Via API (scripted / CI)

#### Generate a unique client code

```bash
curl -X GET https://api.ecodrix.com/api/clients/count \
  -H "Authorization: Bearer $CORE_TOKEN"
```

Returns `{ count, code: "ERIX_CLNT_XXXXXX" }`. The `code` is freshly minted and unused. Keep it for the next step.

#### Create the org + owner atomically

```bash
curl -X POST https://api.ecodrix.com/api/clients \
  -H "Authorization: Bearer $CORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Clinic",
    "clientCode": "ERIX_CLNT_XXXXXX",
    "business": {
      "industry": "clinic",
      "website": "https://acmeclinic.com",
      "email":   "hello@acmeclinic.com",
      "phone":   "+919876543210"
    },
    "plan": { "name": "default" },
    "owner": {
      "email":    "owner@acmeclinic.com",
      "fullName": "Dr. Acme"
    }
  }'
```

The response carries everything you'll need to hand off:

```json
{
  "success": true,
  "data": {
    "id": "<orgId>",
    "clientCode": "ERIX_CLNT_XXXXXX",
    "apiKey": "erix_..."
  },
  "platformOrg": { "orgId": "...", "created": true, "apiKey": "erix_..." },
  "owner": {
    "userId": "...",
    "userCreated": true,
    "memberCreated": true,
    "generatedPassword": "Tmp_a8sd9fJK2lmN"
  }
}
```

The `generatedPassword` is shown **once**. Capture it — the platform never stores plaintext after this response. Hand it to the owner via a side channel (Signal/email) and tell them to change it on first login.

### 1c. Verify the row was created cleanly

```bash
pnpm db:inspect:tenants --code=ERIX_CLNT_XXXXXX
pnpm db:inspect:memberships --email=owner@acmeclinic.com
```

You want to see:

- `status: pending` (will flip to `active` when the owner verifies email)
- `apiKey: erix_...`
- `hasSecrets: false` (we add them next)
- exactly one membership row, role `owner`, matching the org

If `db:inspect:memberships` shows `❌ user has no membership`, the owner block in step 1b failed silently. Re-run with `pnpm tsx scripts/inspect-tenants.ts --code=ERIX_CLNT_XXXXXX` to see the org and re-attach the owner via the dedicated `ensureOrgOwner` helper:

```bash
pnpm tsx -e "
import 'dotenv/config';
import { ensureOrgOwner } from '@/services/admin/memberships.service';
import { getClient } from '@/services/admin/clients.service';
const c = await getClient('ERIX_CLNT_XXXXXX');
const r = await ensureOrgOwner(c.id, { email: 'owner@acmeclinic.com', fullName: 'Dr. Acme' });
console.log(r);
"
```

## Stage 2 — Configure secrets

### 2a. WhatsApp credentials

```bash
curl -X PATCH https://api.ecodrix.com/api/clients/ERIX_CLNT_XXXXXX/secrets \
  -H "Authorization: Bearer $CORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappToken":         "EAAxxxx...",
    "whatsappBusinessId":    "1234567890",
    "whatsappPhoneNumberId": "987654321",
    "whatsappWebhookToken":  "client-chosen-string"
  }'
```

The platform encrypts all of these at rest using AES-256-CBC IV-prefixed format (see `lib/crypto.ts`).

### 2b. SMTP / email — optional

If the client wants outbound email through their own SMTP rather than the platform's SES:

```bash
curl -X PATCH https://api.ecodrix.com/api/clients/ERIX_CLNT_XXXXXX/secrets \
  -H "Authorization: Bearer $CORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtpHost": "smtp.zoho.in",
    "smtpPort": 587,
    "smtpUser": "support@acmeclinic.com",
    "smtpPass": "<app-password>",
    "smtpFromEmail": "support@acmeclinic.com",
    "smtpFromName":  "Acme Clinic",
    "smtpSecure": false
  }'
```

Skip this section if they're fine with the platform default.

### 2c. Tenant Mongo (data store)

Two options.

**Option A — shared cluster, isolated DB.** Default. Don't run this step. The platform writes tenant data to the shared cluster, in a database named after the client code. Cheaper, faster onboarding.

**Option B — client-supplied cluster.** If the client insists on owning their data:

```bash
curl -X POST https://api.ecodrix.com/api/clients/ERIX_CLNT_XXXXXX/datasource \
  -H "Authorization: Bearer $CORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dbUri":  "mongodb+srv://user:pass@cluster.mongodb.net/acme",
    "dbType": "mongodb"
  }'
```

The platform encrypts the URI and reads it on every tenant DB connection. If a name collision is detected, the database name auto-suffixes with `_<clientcode>` to enforce isolation. Confirm via:

```bash
pnpm db:inspect:tenants --code=ERIX_CLNT_XXXXXX
```

## Stage 3 — Smoke test the platform path

### 3a. Synthetic end-to-end

```bash
pnpm test:onboarding --backend=https://api.ecodrix.com
```

Expected: 5/5 stages green. Confirms the platform onboarding pipeline is healthy. Stage 6 reports a clean skip — that's expected for synthetic tenants (they have no Mongo).

### 3b. Real-tenant trigger probe

Pick the client code you just provisioned and fire a no-op event with their actual API key:

```bash
API_KEY=$(curl -s https://api.ecodrix.com/api/clients/ERIX_CLNT_XXXXXX/api-key \
  -H "Authorization: Bearer $CORE_TOKEN" | jq -r '.apiKey')

curl -X POST https://api.ecodrix.com/api/saas/workflows/trigger \
  -H "x-api-key: $API_KEY" \
  -H "x-client-code: ERIX_CLNT_XXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "lead_created",
    "phone":   "919999900000",
    "createLeadIfMissing": true,
    "leadData": { "firstName": "Smoke", "lastName": "Test", "source": "onboarding" }
  }'
```

Expected: `200` with `{ success: true, data: { eventLogId, leadId, rulesMatched: 0 } }`. `rulesMatched: 0` is fine — no rules are bound yet.

### 3c. Login flow

Have the owner log in to the saas dashboard at `https://app.ecodrix.com/auth/login` using:

- email: the value passed in `owner.email`
- password: the `generatedPassword` from step 1b

They should land on the dashboard with their org name in the header. If the dashboard says "no organization," `db:inspect:memberships --email=…` will tell you why.

## Stage 4 — WhatsApp template setup

Templates are the client's responsibility long-term, but for the first onboarding you usually configure 2–3 to demonstrate the flow.

### 4a. Submit transactional templates as UTILITY

In the client's WhatsApp Business Manager (Meta):

1. Templates → Create → choose category **UTILITY** for any transactional flow (order confirmation, appointment confirmation, enrollment confirmation)
2. Body should not include emojis, "Welcome", "Thank you for your purchase," or any promotional language — Meta auto-flips those to MARKETING and starts throttling
3. Submit and wait for Meta approval (~1 hour typical)

The platform syncs template state daily via `templateSyncJob`. Force a sync now with:

```bash
pnpm tsx scripts/inspect-templates.ts --client=ERIX_CLNT_XXXXXX --refresh
```

### 4b. Verify approval status

```bash
pnpm wa:templates --client=ERIX_CLNT_XXXXXX
```

Confirms which templates are `APPROVED` + `UTILITY`. Anything still `MARKETING` will throttle on Meta error 131049 — see `docs/events/event-triggers.md` for the full breakdown.

## Stage 5 — Bind automation rules

In the saas dashboard:

1. Automations → New Rule
2. Trigger: pick from `lead_created`, `appointment_confirmed`, `tag_added`, or any custom trigger registered for this client
3. Actions: send WhatsApp template, send email, add tag, create note, schedule meet
4. Save → toggle Active

Smoke check the resulting state with:

```bash
pnpm wa:readiness --client=ERIX_CLNT_XXXXXX
```

You want every customer-facing flow at `✅ ready`. Anything `❌ throttled` means the bound template is MARKETING — go back to step 4a.

## Stage 6 — Hand off the SDK

The client developer now needs:

| What               | Where                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `ERIX_CLIENT_CODE` | `ERIX_CLNT_XXXXXX` (from step 1)                                        |
| `ERIX_API_KEY`     | `erix_...` (from step 1)                                                |
| API base URL       | `https://api.ecodrix.com`                                               |
| SDK package        | `@ecodrix/erix-api` from npm                                            |
| Integration guide  | `docs/events/sdk-trigger-contract.md`                                   |
| Worked example     | `projects/nirvisham/src/lib/server/payments/payment-success-handler.ts` |

Send them the contract doc and the example file. They install the SDK, set the two env vars, and call `erix.events.trigger(...)` from their backend payment handler. Done.

### Confirm the SDK works from the client side

After they push to staging, ask them to fire one trigger from their actual application code (not a curl test). Then:

```bash
pnpm wa:dump-failed --client=ERIX_CLNT_XXXXXX --since=1h
```

If the dump shows nothing, deliveries are working. If anything is in `failed`, run `pnpm wa:diagnose --client=ERIX_CLNT_XXXXXX --since=1h` for the Meta error breakdown.

## Stage 7 — Activate the org

Final step. Move the org from `pending` → `active`:

```bash
curl -X PATCH https://api.ecodrix.com/api/clients/ERIX_CLNT_XXXXXX/identity \
  -H "Authorization: Bearer $CORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "active" }'
```

Onboarding complete. The owner can use the dashboard, the SDK fires triggers, automations deliver, and the platform tracks everything in `ecodrix_audit_logs`.

---

## Troubleshooting

### "Client not found" from saas frontend after login

The owner has no `ecodrix_members` row. Run:

```bash
pnpm db:inspect:memberships --email=owner@acmeclinic.com
```

If the user has zero memberships, re-attach via the inline tsx command in step 1c.

### "External DB URI not configured" on trigger calls

The tenant needs Mongo wired up. Either:

- Default to the shared cluster (no action needed — the platform connection-resolver picks it up)
- Run step 2c with the client-supplied URI

### Meta error 131049 on every WhatsApp send

The template is MARKETING. Re-categorize to UTILITY in WhatsApp Manager. See `docs/events/event-triggers.md`.

### `pnpm test:onboarding` cleanup leaves orphans

Network blip or DB constraint hit. The leftover org has a known UUID — purge with the inline tsx pattern:

```bash
pnpm tsx -e "
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getLaieDb } from '@/lib/laie/postgres';
import { deleteClientStorage } from '@/services/admin/client-storage.service';
import { deleteClient } from '@/services/admin/clients.service';
import {
  ecodrix_audit_logs, ecodrix_members, ecodrix_subscriptions,
  ecodrix_usage, ecodrix_users, ecodrix_password_resets,
} from '@/shared/db/schema/platform';

const code = 'ERIX_TEST_XXXXXX';
const orgId = '<uuid>';
const userIds = ['<uuid>'];
const db = getLaieDb();
await db.delete(ecodrix_members).where(eq(ecodrix_members.orgId, orgId));
await db.delete(ecodrix_audit_logs).where(eq(ecodrix_audit_logs.orgId, orgId));
await db.delete(ecodrix_subscriptions).where(eq(ecodrix_subscriptions.orgId, orgId));
await db.delete(ecodrix_usage).where(eq(ecodrix_usage.orgId, orgId));
for (const uid of userIds) {
  await db.delete(ecodrix_password_resets).where(eq(ecodrix_password_resets.userId, uid));
  await db.delete(ecodrix_users).where(eq(ecodrix_users.id, uid));
}
await deleteClientStorage(code);
await deleteClient(code);
console.log('purged', code);
"
```

### Owner forgot the temp password

```bash
# Trigger forgot-password flow (owner gets reset link in email)
curl -X POST https://api.ecodrix.com/api/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{ "email": "owner@acmeclinic.com" }'
```

In dev/non-production environments the response includes `_devToken` so you can construct the reset URL manually: `https://app.ecodrix.com/auth/reset?token=<token>`.

---

## Reference

- **SDK contract:** `docs/events/sdk-trigger-contract.md`
- **Trigger flow + Meta error guide:** `docs/events/event-triggers.md`
- **Architecture:** `ARCHITECTURE.md`
- **Platform vs tenant data boundary:** `.Architecture/PLATFORM_DATA_BOUNDARIES.md`
- **End-to-end test:** `scripts/test-onboarding-e2e.ts`
- **Inspectors:** `scripts/inspect-tenants.ts`, `scripts/inspect-memberships.ts`, `scripts/inspect-templates.ts`
- **Diagnostics:** `scripts/diagnose-whatsapp-failures.ts`, `scripts/check-automation-readiness.ts`
- **Backfill (one-time):** `scripts/backfill-platform-mongo.ts`
- **Reference impl:** `projects/nirvisham/src/lib/server/payments/payment-success-handler.ts`
