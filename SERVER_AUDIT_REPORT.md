# ECODrIx Server Audit Report

> Generated against `SDK_PLATFORM_REDESIGN.md` (source of truth).
> Scope: `ECOD/server/src/` + `ECOD/admin/`. Covers the Connect/ERIX/Flow SDK
> boundary fixes, a full-server gap audit, the admin panel capability inventory,
> and the platform-level notification system.

---

## Part A — SDK & Connect Boundary Fixes (DONE)

The architectural rule is strict:

```
Flow → ERIX SDK → Connect transport      (never Flow → Connect directly)
Connect (webhooks) → ERIX SDK            (track inbox)
Connect transport → ERIX SDK / raw provider (owns credentials)
Connect → NEVER imports from @flow/*
```

### A.1 `erix/sdk/whatsapp.sdk.ts` — NEW phone-addressed sends ✅

Added two methods so callers can address a recipient by phone (Connect external
API, transport layer) while ERIX retains ownership of conversation + history:

| Method                                                               | Behavior                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `sendByPhone(phone, templateName, language?, variables?, metadata?)` | Resolves/creates the CRM conversation for `phone`, then dispatches a Meta template.   |
| `sendTextByPhone(phone, text)`                                       | Resolves/creates the conversation, then sends free text (subject to Meta 24h window). |

Backed by a new service helper `findOrCreateConversationByPhone(clientCode,
phone, name?)` in
`infra/connect/channels/whatsapp/services/whatsapp.service.ts`. It is mode-aware
(reuses the existing `getContext` Conversation proxy → works for both Mongo and
platform-Postgres tenants) and returns a conversation `_id`.

### A.2 `sdk/connect.sdk.ts` — transport now ERIX-first ✅

All `@flow/services/automation/actionExecutor.service` imports removed.

| Transport                            | Before                      | After                                                                                                                                   |
| ------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `whatsapp.sendRaw(phone, payload)`   | `ActionExecutor.execute`    | ERIX `sdk.whatsapp.sendByPhone` (template) / `sendTextByPhone` (text). Reads `payload.{templateName,language,variables,text,metadata}`. |
| `instagram.sendDM(igsid, text)`      | `ActionExecutor.execute`    | Raw Graph API send using Connect-owned Instagram credentials (`getInstagramCredentials`). Transport is legitimately Connect-owned.      |
| `telegram.sendMessage(chatId, text)` | `ActionExecutor.execute`    | Raw Bot API send using Connect-owned `telegram` credentials.                                                                            |
| `email.sendRaw(to, subject, html)`   | direct `createEmailService` | Routed through ERIX `sdk.mail.send` (ERIX owns email business logic).                                                                   |

### A.3 `infra/connect/send/send.routes.ts` — external send API ✅

All `@flow` imports removed. Endpoints now call the ERIX SDK:

| Endpoint                    | Now calls                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `POST /whatsapp` (template) | `sdk.whatsapp.sendByPhone(phone, templateName, language, variables)`                        |
| `POST /whatsapp` (text)     | `sdk.whatsapp.sendTextByPhone(phone, text)`                                                 |
| `POST /email` (templateId)  | `sdk.mail.sendTemplate(to, templateId, variables)` (new MailSDK method)                     |
| `POST /email` (raw)         | `sdk.mail.send({ to, subject, html })`                                                      |
| `POST /telegram`            | `ConnectSDK.transport.telegram.sendMessage(chatId, text)` (Connect owns telegram transport) |
| `POST /` (multi-channel)    | WhatsApp → ERIX SDK; Email → ERIX SDK                                                       |

### A.4 `erix/sdk/mail.sdk.ts` — NEW `sendTemplate` ✅

`sendTemplate(to, templateId, variables?)` wraps the existing
`createEmailService().sendTemplatedEmail`, keeping template resolution inside
ERIX so the Connect route never needs Flow.

### A.5 Verification

- `grep` for `@flow` / `actionExecutor` under `sdk/connect.sdk.ts` and
  `infra/connect/**` → **0 matches**.
- `tsc --noEmit` → the five edited files report **no diagnostics**. (Pre-existing
  unrelated errors remain elsewhere — see Part B.)

---

## Part B — Full-Server Gap Audit (doc vs code)

### B.1 Service map — MATCHES

`server/src/` contains the expected domains: `erix/`, `laie/`, `flow/`,
`infra/` (connect + storage), `platform/`, `sdk/`, `shared/`. Plus legacy
top-level `routes/` and `services/` (back-compat — candidates for consolidation).

### B.2 Confirmed correct (per AUDIT_TODO "Already CORRECT")

- ✅ `meta.webhook.ts` WhatsApp handler calls ERIX SDK `handleIncoming`.
- ✅ `razorpay.webhook.ts`, `telegram.webhook.ts`, `ses.webhook.ts` call EventBus / ERIX tracking.
- ✅ Connect API key system, schemas, services, advanced routes.
- ✅ SDK factory `createPlatformSDK`.

### B.3 Gaps & pre-existing issues found

| #   | Severity | Location                                                | Issue                                                                              | Status                                                                                                                                                                                                     |
| --- | -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Medium   | `infra/connect/webhooks/ses.webhook.ts:80`              | Imported missing `@erix/services/mail/ses-notification.service`.                   | ✅ FIXED — service created (bounce/complaint → suppression).                                                                                                                                               |
| 2   | Medium   | `sdk/flow.sdk.ts:97,106`                                | Called nonexistent `getFlowAdapter` / `getFlowWorkflow`.                           | ✅ FIXED — uses `listFlowDefinitions` / `getFlowDefinition` + mapper.                                                                                                                                      |
| 3   | Medium   | `sdk/infra.sdk.ts:77`                                   | `StorageService.upload` (static) did not exist.                                    | ✅ FIXED — instance `StorageClient` + tenant-prefixed keys; also job typing.                                                                                                                               |
| 4   | Low      | `infra/connect/services/usage.service.ts:136,148`       | `bigint` vs `number` on usage insert.                                              | ✅ FIXED — pass numeric `row.total` (already `::int`) instead of `BigInt()`.                                                                                                                               |
| 5   | Low      | `infra/connect/webhooks/razorpay.webhook.ts:77,121`     | `string \| string[]` header where `string` expected.                               | ✅ FIXED — `const orgId = String(req.params.orgId)`.                                                                                                                                                       |
| 6   | Low      | `erix/lib/erix-adapter/mongo-adapter.ts:3508`           | `CustomEventDef` missing `icon`/`color`.                                           | ✅ FIXED — mapped `icon`/`color` (`?? null`) in `mapMongoCustomEventDef`.                                                                                                                                  |
| 7   | Low      | `erix/services/crm/ruleExecutor.service.ts:265`         | `"internal_notification"` not in `ActivityType`.                                   | ✅ FIXED — use valid `"automation_triggered"` activity type.                                                                                                                                               |
| 8   | Low      | `erix/services/event/eventBus.service.ts:341,347`       | `log` referenced but not defined.                                                  | ✅ FIXED — corrected to `logger` (the file's logger var).                                                                                                                                                  |
| 9   | Low      | `infra/connect/channels/whatsapp/routes/chat.routes.ts` | Type errors; wrong `resolveDataAccess` import surface.                             | ✅ FIXED — coerced `conversationId` to `string`, corrected `resolveDataAccess` import to `@erix/lib/tenant/crm.models`, cast send results, fixed duplicate `id` spread + `toObject`.                       |
| 10  | Low      | `sdk/laie.sdk.ts:119+`                                  | Imports missing `@laie/services/laie/{leadGenerator,export,intelligence}.service`. | ✅ FIXED — campaigns/leads/export wired to real Drizzle tables (`laie_lead_flows`, `laie_lead_jobs`, `laie_leads`); intelligence throws explicit not-implemented. Also fixed `infra.sdk` cache.set typing. |

> **ALL items 1-10 are now FIXED.** The entire server (`ECOD/server/src/`)
> compiles clean — `tsc --noEmit` reports **0 errors**.

### B.4 Webhook architecture clarifications (confirmed, fold into doc)

- There is **no platform-level Meta webhook**. A single endpoint
  `/webhooks/meta/whatsapp` handles **all** orgs, routing internally by
  `phone_number_id`.
- Only **Razorpay** has a platform vs org split:
  - Platform billing: `/api/webhooks/razorpay/*` (stays in `platform/`).
  - Org payment gateway: `/webhooks/razorpay/org/:orgId` (Connect).

### B.5 Instagram/Facebook inbound (RESOLVED)

`infra/connect/channels/social/services/socialInbound.service.ts`
(`ingestInboundSocialMessage`) upserts the lead's social identity and **fires
ERIX EventBus** automations (`instagram_dm`, `facebook_incoming`). The dedicated
`socialWebhook.routes.ts` already routed to it.

The two **placeholder handlers** in `infra/connect/webhooks/meta.webhook.ts`
(`POST /instagram`, `POST /facebook`) previously only logged. They now call a
shared `processSocialWebhook(body, channel)` that resolves the tenant by the
receiving account/page id (`buildSocialAccountMap`) and ingests each DM via
`ingestInboundSocialMessage` → ERIX EventBus. **✅ FIXED.**

### B.6 Outbound chat sends — phone vs conversationId (RESOLVED)

`infra/connect/channels/whatsapp/routes/chat.routes.ts` had two outbound sends
that passed a **phone** into `sdk.whatsapp.send(...)`, whose first argument is a
**conversationId** — a latent runtime bug (the phone would have failed
conversation `findById`). Both now call `sdk.whatsapp.sendTextByPhone(phone,
text)` (Mongo + platform branches), which resolves the conversation by phone
internally. The multi-arg `send(conversationId, …)` call at the `/messages` send
endpoint already used a resolved `targetConvId` and is correct. **✅ FIXED.**

---

## Part C — Platform-Level Notification System

> **Notifications are PLATFORM-level, NOT erix-crm.** Per §2.1 the CRM "does NOT
> own notifications". They live in platform Postgres and work across all db modes.

### C.1 Ownership & storage

- Service: `platform/services/notification.service.ts` (`NotificationService`).
- Helpers: `platform/services/platform-notifications.ts` (typed event fns:
  team, billing, security, product notifications).
- Table: `ecodrix_notifications` (platform Postgres) — **not** per-tenant CRM DBs.
  Works for platform / own-mongo / own-postgres tenants identically (direct
  Drizzle, no adapter).
- Real-time: Socket.IO — emits `platform:notification` and
  `platform:notification_count` to the org room.

### C.2 API surface

`NotificationService`: `send`, `broadcast` (org-wide), `list`, `unreadCount`,
`markRead`, `markAllRead`, `dismiss`, `dismissAll`, `emitToSocket`.

Categories: `crm | billing | team | security | infra | product | automation | system`.
Severities: `info | success | warning | error | critical`.

### C.3 Routes (`platform/routes/notifications.routes.ts`, mounted `/api/notifications`)

| Method | Path                         | Purpose                                             |
| ------ | ---------------------------- | --------------------------------------------------- |
| GET    | `/notifications`             | List (filters: category, unreadOnly, limit, offset) |
| GET    | `/notifications/count`       | Unread count (bell badge)                           |
| PATCH  | `/notifications/:id/read`    | Mark one read                                       |
| PATCH  | `/notifications/read-all`    | Mark all read                                       |
| PATCH  | `/notifications/:id/dismiss` | Dismiss one                                         |
| DELETE | `/notifications/dismiss-all` | Dismiss all                                         |

Auth via `tenantResolver()`. Callers across the platform already use it:
`support.routes.ts`, `billing-user.routes.ts`,
`admin/webhooks/razorpay-subscriptions.routes.ts`.

### C.4 Admin-panel relationship

There is **no dedicated notification-management page** in the admin panel. The
closest control surface is **Announcements + email Broadcast** (`/admin/comms`).
End-user notifications are produced programmatically by platform services, not
authored from the admin panel. (See Part D, row "Platform notifications mgmt".)

---

## Part D — Admin Panel Capability Inventory (`ECOD/admin/`)

Next.js App Router app. Pages are client components calling internal
`/api/admin/*` routes, proxied to the backend (`CORE_API_URL`) with
`x-core-api-key` + staff identity headers (`src/app/api/admin/[...path]/route.ts`).
LAIE relay routes proxy to `/api/laie/v1/relays*` via
`src/app/api/admin/laie/[...path]/route.ts`. No mock data in the admin layer.

| Capability                       | Status                                    | Route / Key files (`ECOD/admin/src`)                                                                                                    |
| -------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Plans + pricing                  | Implemented (edit; no create/delete UI)   | `/admin/plans`, `/admin/plans/[id]` (Monaco JSON + structured editor), `components/admin/PlanPickerDialog.tsx`                          |
| Tenants + subscriptions          | Implemented (full lifecycle)              | `/services/clients` (+ `_actions/clients.ts`), `/services/clients/[clientCode]` (AdminTenantActions), `/admin/tenants/[id]` (deep view) |
| Feature flags                    | Implemented (full CRUD)                   | `/admin/flags`                                                                                                                          |
| WhatsApp — WABA mgmt             | Partial (monitor-only)                    | `/admin/whatsapp` (overview + delivery, read-only)                                                                                      |
| WhatsApp — template approval     | **Absent**                                | only outreach copy at `/templates/whatsapp`                                                                                             |
| LAIE — engine control            | Partial (monitor-only)                    | `/admin/laie` (queue/vault/jobs, read-only)                                                                                             |
| LAIE — relays control            | Implemented (CRUD + tuning)               | `/admin/relays`                                                                                                                         |
| LAIE — actor management          | **Absent**                                | (`x-actor`/`actorId` only in proxy/audit)                                                                                               |
| Revenue                          | Implemented (read-only analytics)         | `/admin/revenue`                                                                                                                        |
| Billing                          | Implemented (trial/grandfather/reconcile) | `/admin/billing`                                                                                                                        |
| Payment ops                      | Implemented (refund/validate/retry)       | `/admin/payments`                                                                                                                       |
| Compliance (DSAR)                | Implemented                               | `/admin/compliance`                                                                                                                     |
| Security audit logs              | Implemented (+ CSV export)                | `/admin/audit`                                                                                                                          |
| Activity logs                    | Implemented                               | `/admin/logs`                                                                                                                           |
| Announcements                    | Implemented (+ email broadcast)           | `/admin/comms`                                                                                                                          |
| Support tickets                  | Implemented (reply)                       | `/admin/tickets`                                                                                                                        |
| Platform notifications mgmt      | **Absent** (partial via Announcements)    | `/admin/comms`                                                                                                                          |
| Connect connections (per-tenant) | Implemented                               | `/services/clients/_actions/clients.ts` (connect/configure/disconnect/reveal/access via `@ecodrix/erix-api`)                            |

Additional admin areas present beyond the requested list: `/admin/agents`,
`/admin/email`, `/admin/partners`, `/admin/templates`, `/admin/analytics`,
`/admin/health`, `/admin/flow`, `/admin/storage`, `/admin/pipelines`,
`/admin/persona-history`, `/admin/waitlist`, plus legacy `/saas/*` and
`/services/*`.

**Caveats:** Admin pages are wired but depend on backend `/api/admin/*` and
`/api/laie/v1/*` endpoints existing. WhatsApp + LAIE-engine pages are dashboards
(read), not control surfaces. No WABA template-approval workflow and no LAIE
actor-management UI exist in `admin/src`.

---

## Part E — Recommended Next Actions (prioritized)

1. ✅ DONE — Fixed broken references (gaps 1-3): `ses-notification.service`,
   `flow.sdk` engine methods, `StorageService.upload` (+ infra.sdk job typing).
2. ✅ DONE — Routed IG/FB inbound webhooks through ERIX EventBus (B.5).
3. ⬜ Decide whether WABA template approval + LAIE actor management belong in the
   admin panel; today they are absent.
4. ✅ DONE — All type errors cleared. `tsc --noEmit` reports **0 errors** across
   the entire server.
5. ⬜ Consolidate legacy top-level `routes/` and `services/` into domain folders.

> **Server typecheck status:** the entire `ECOD/server/src/` tree compiles
> **clean** (0 `tsc` errors). All gap-list items (1-10) resolved.

---

## Part F — Full Architecture Conformance Audit (doc vs code)

Verified `SDK_PLATFORM_REDESIGN.md` claims against `server/src`. Mount registry:
`server/src/routes/index.ts`.

### F.1 Conformance matrix

| Claim                                                 | Status                | Evidence                                                                                    |
| ----------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| erix-crm `/api/saas/*` + `/api/crm/*`                 | ✅ CONFIRMED          | `routes/index.ts` `/api/crm` + many `/api/saas/*` mounts                                    |
| erix-laie `/api/laie/v1/*`, `x-laie-key`              | ✅ CONFIRMED (nuance) | `validateLaieKey` checks **static** `process.env.LAIE_API_KEY`, not per-tenant keys         |
| erix-flow `/api/flow/v1/*`                            | ✅ CONFIRMED          | `createFlowRouter()`                                                                        |
| erix-connect `/api/connect/v1/*` + `/webhooks/*`      | ✅ CONFIRMED          | connect router + webhook mounts                                                             |
| erix-storage `/api/saas/storage` + `/api/saas/images` | ✅ CONFIRMED          | media + storage routers                                                                     |
| Notifications `/api/notifications`                    | ✅ CONFIRMED          | `createNotificationsRouter`                                                                 |
| Connect send `/api/connect/v1/send/*`                 | ✅ CONFIRMED          | `send.routes.ts` (`x-connect-key`)                                                          |
| Webhooks meta/telegram/ses/razorpay-org               | ✅ CONFIRMED          | all four mounted                                                                            |
| Platform Razorpay billing `/api/webhooks/razorpay/*`  | ✅ CONFIRMED          | razorpay + subscriptions routers                                                            |
| PG prefixes ecodrix/erix/flow/laie/connect            | ✅ CONFIRMED (nuance) | `ecodrix_*` lives in `platform/` folder, not `ecodrix/`                                     |
| Connect key format `connect_sk_*`                     | ✅ CONFIRMED          | `apikey.service.ts` `generateKey()`                                                         |
| Domain folders present                                | ✅ CONFIRMED          | erix/laie/flow/infra/connect/infra/storage/platform/sdk all exist                           |
| erix-store port 6399 "hardcoded canonical"            | ⚠️ MISMATCH           | runtime uses `env.ERIX_STORE_URL`; 6399 is default/fallback only — **doc corrected (§3.2)** |
| erix-store SDK methods (queueV2, cache, pubsub)       | ✅ CONFIRMED          | `@ecodrix/erix-client` via `@erix/lib/erix`                                                 |
| Connect creds + tests (wa/ig/email/telegram/razorpay) | ✅ CONFIRMED          | `credentialStore` + `connectionTest` switch                                                 |

### F.2 Findings & resolutions

1. **Razorpay org-webhook provider-id bug — ✅ FIXED.**
   `razorpay.webhook.ts` read `getCredentials(orgId, "razorpay")`, but Razorpay
   creds are canonically stored under provider id **`payments`** (provider
   registry, `getPaymentsCredentials`, `connectionTest`, `paymentLink.service`
   all use `payments`). The handler would 404 for every org and never load the
   webhook secret. Changed to `getPaymentsCredentials(orgId)`.

2. **erix-store port 6399 — ✅ DOC CORRECTED.** Doc claimed hardcoded canonical
   port; runtime resolves via `env.ERIX_STORE_URL`. §3.2 updated to "default,
   overridable". (Repo's own `blueprint_audit.md` already flagged the
   port/TCP-protocol description as fictional.)

3. **LAIE auth — ✅ DOC CLARIFIED.** `x-laie-key` is a single static env key
   today (`LAIE_API_KEY`), not per-tenant. The `laie_api_keys` table exists
   (used by `LaieSDK.apiKeys`) but isn't wired into `validateLaieKey`. §2.2
   updated.

4. **Schema folder↔prefix — ✅ DOC CLARIFIED.** `ecodrix_*` is backed by the
   `platform/` folder. §6.1 mapping note added.

5. **Telegram typed getter — minor.** Telegram creds have a connection test but
   no dedicated typed getter (read via generic `getCredentials(orgId,
"telegram")`). Documented in §3.1; no fix needed (functional).

### F.3 Undocumented capabilities — now documented (§13)

- **ERIX Automation Platform**: a separate **Hono** app bridged into Express at
  `/api/erix/v1` (`services/api-gateway/`).
- **erix-store sidecar** lives at `server/src/infra/store/`.
- **Public client portal** `/api/portal/v1` (own JWT, per project+tenant).
- **Public bearer-token email API** `/api/v1/email`.
- **Dual webhook surfaces**: legacy `/api/saas/whatsapp` + `/api/saas/social`
  run alongside the new `/webhooks/*` for Meta-console back-compat.
- **Legacy top-level folders** `routes/` and `services/` overlap domain folders
  (tracked cleanup).

### F.4 Net result

Doc and code are now reconciled: 1 real code bug fixed (Razorpay provider id),
4 doc inaccuracies corrected (§2.2, §3.1, §3.2, §6.1), and the previously
undocumented surfaces captured in §13. Server still compiles clean
(`tsc --noEmit` → 0 errors).

---

## Part G — Test Suite Run & Fixes (runtime correctness pass)

Moved beyond "compiles" to "tests pass." Ran the full vitest suite
(`vitest run`). Initial state: **1884 passed / 35 failed** across 6 files.
After fixes: **1921+ passed / 0 functional failures** (2 load-flaky tests, see
G.3). `tsc --noEmit` remains 0 errors.

### G.1 Real bug fixed — privilege escalation in `requirePlatformAdmin`

`shared/middleware/requirePlatformAdmin.ts` listed **`"staff"` in
`ALLOWED_ROLES`**, contradicting its own top-of-file JSDoc ("Allowed roles:
superadmin, admin. Anything else (staff included) returns 403") and 4 tests.
Because this middleware guards **every** `/api/admin/*` route (revenue, billing,
payments, compliance, audit, flags, plans, tenants-deep, …), any `staff`-role
user could reach admin-only endpoints. **Removed `staff`** from the role set.
Safe for the admin panel: it authenticates via the `x-core-api-key` path (#1),
which short-circuits before the role check — only the no-core-key session/header
fallback is tightened. (4 onboarding tests → green; full onboarding file 73/73.)

### G.2 Test/code drift fixed (code was correct; tests were stale)

| File                                                        | Drift                                                                                                      | Fix                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `flow/routes/__tests__/flowRoutes.integration.test.ts` (26) | `createFlowRouter()` became `async`; test used it without `await` → "router is not a function"             | `await createFlowRouter()`                                                      |
| `infra/connect/telegramWebhook.test.ts` (2)                 | Code migrated to `getCredentials(orgId,"telegram")`; test still mocked old `@platform/.../secrets.service` | Re-pointed mock to `@infra/connect/credentialStore`                             |
| `erix-adapter/__tests__/portal-token.test.ts` (2)           | `fast-check` v4 removed `fc.hexaString`/`fc.hexa`                                                          | Rewrote as `fc.string({ unit: fc.constantFrom(...hex), minLength, maxLength })` |
| `custom-fields/formula/__tests__/formula.property.test.ts`  | `fast-check` v4 removed `fc.stringOf`                                                                      | Rewrote as `fc.string({ unit, maxLength })`                                     |

### G.3 Test updated to match intentional code change

`persona.routes.test.ts` — `GET /persona/:productId/confidence` was
**intentionally** redesigned to return a zeroed **200** default (not 404) when
no persona exists, so the frontend confidence pill degrades gracefully (the
code carries an explicit comment to this effect). Test updated to assert the
200 zeroed-default contract. (`/timeline` + `/followups` still 404 — unchanged.)

### G.4 Remaining 2 "failures" are load flakiness, not bugs

Both pass cleanly in isolation; they only fail when 1900+ tests saturate the
machine in parallel:

- `personaContextBuilder.bench.test.ts` — a **performance benchmark**
  (p99 < 250ms over 50 iters); inherently timing-dependent. Consider moving it
  out of the default `vitest run` gate into a separate bench command.
- `socialInbound.test.ts > creates a social-only contact …` — parallel resource
  contention; passes alone.

### G.5 Honest status

- **Type-safe:** `tsc --noEmit` + production build = 0 errors.
- **Functionally tested:** all 1921 functional tests pass; 0 logic failures.
- **Not yet done:** no **runtime boot / live smoke test** has been performed
  (the entry validates env via Zod and connects to Supabase PG / Mongo /
  erix-store / R2 — booting hits real infra in `.env`, so it needs an explicit
  go-ahead). The two flaky perf/parallel tests should be de-flaked or gated.

---

## Part H — Runtime Boot + Connect Defaults + SDK Endpoint Sync

The server was booted (`tsx server.ts`) and reached **"Async routes mounted;
server fully ready"** — 14 ERIX workers started, LAIE initialized, erix-store
sidecar connected (`store.ecodrix.com`), ProxyKit relays health-checked. Three
items were addressed from the boot log + the two requested tasks.

### H.1 Boot error fixed — portal rate-limiter IPv6 (`ERR_ERL_KEY_GEN_IPV6`)

`routes/portal/portal.routes.ts` defined a `rateLimit` with a custom
`keyGenerator` reading `req.ip` directly. express-rate-limit **v8** rejects this
at construction (IPv6 clients could bypass the limit), which threw during
`mountAsyncRoutes`. **Fix:** wrap the IP with the library's `ipKeyGenerator`
helper (`import rateLimit, { ipKeyGenerator } from "express-rate-limit"`), which
normalizes IPv6 to a /56 subnet. Login limiter now constructs cleanly.

### H.2 Task 1 — Database connector "connected by default" (platform residency)

**Requirement:** on signup an org defaults to the shared platform DB, so the
Connect UI should show the database as **connected** without any user action.

**Before:** a fresh org had no `connect_connections` row → `buildView` returned
`state: "not-connected"` for the `database` provider.

**Fix (`infra/connect/connectionService.ts` → `buildView`):** when
`provider.id === "database"` and no connection row exists, resolve residency via
`getResidency(clientCode)` and default to `state: "connected"`,
`activeMethod: "platform"` for platform mode (or `own`/`hybrid` connected when a
URI is configured). An explicit row always takes precedence (a deliberate
disconnect or own/hybrid config is never overridden). Read-side only — covers
both new and existing orgs with no backfill. Documented in REDESIGN §3.1.

### H.3 Task 2 — `@ecodrix/erix-api` SDK endpoint sync

Audited the SDK's `Connect` resource (`packages/erix-api/src/resources/connect.ts`)
against the server's `routes/connect/connect.routes.ts`. Two server endpoints
were missing from the SDK; **added**:

| Endpoint                                  | SDK method                           |
| ----------------------------------------- | ------------------------------------ |
| `POST /connections/:providerId/test`      | `connect.test(providerId)`           |
| `POST /connections/payments/payment-link` | `connect.createPaymentLink(payload)` |

The rest of the Connect surface (providers, list, get, connect, configure,
disconnect, reveal, setAccess) already matched. The other 24 SDK resources
(notifications, persona, flow, storage, …) cover their domains.

### H.4 Verification

- Server `tsc --noEmit` → **0 errors** after H.1 + H.2.
- erix-api `Connect` resource → no diagnostics; shippable SDK source compiles
  (pre-existing errors remain only in `__tests__/` + `generated/*-demo.ts`,
  unrelated to this change — stale test drift to clean up separately).

### H.5 Observed-but-not-changed (dev environment)

- `CORS blocked — origin not whitelisted {origin: http://localhost:3000}` — the
  saas dev server origin isn't in the CORS allowlist, so its preflights 404.
  This is a dev-config item (add localhost:3000 to allowed origins for local
  dev), not a code bug. Flagged for the user.
