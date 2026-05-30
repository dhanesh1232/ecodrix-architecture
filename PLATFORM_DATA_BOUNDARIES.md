# Platform Data Boundaries — MongoDB vs PostgreSQL

> **Last updated:** May 30, 2026
> **Status:** In progress — Phase 0 + 2 shipped; Phases 4–13 pending
> **Driver:** Architectural directive that MongoDB is exclusively for
> tenant-isolated databases. Platform metadata moves to PostgreSQL with
> `ecodrix_*` prefixed tables.

## Architecture rule

```
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Supabase / RDS / local)        ← PLATFORM METADATA  │
│  ───────────────────────────────────                             │
│   ecodrix_organizations, ecodrix_users, ecodrix_members,         │
│   ecodrix_plans, ecodrix_subscriptions, ecodrix_usage,           │
│   ecodrix_audit_logs, ecodrix_cloud_storage,                     │
│   ecodrix_password_resets, ecodrix_waitlist,                     │
│   ecodrix_api_tokens, ecodrix_org_secrets (Phase 9),             │
│   ecodrix_cloud_storage + ecodrix_storage_events (Phase 10),     │
│   ecodrix_organizations.{tags,labels,business_email,...}         │
│       (Phase 11), ecodrix_blogs (Phase 12),                      │
│   ecodrix_corporate_leads (Phase 13),                            │
│   ecodrix_blueprints (Phase 3)                                   │
│                                                                  │
│  All `ecodrix_*` tables.                                         │
│  All admin / control-plane reads & writes go here.               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Platform MongoDB (legacy `services` connection)                 │
│  ─────────────────────────────────────────────                   │
│   * NOT used after migration completes.                          │
│   * Will be retired once all 13 phases land.                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Per-tenant MongoDB Atlas (one database per freelance client)    │
│  ─────────────────────────────────────────────────────────────   │
│   leads, conversations, messages, automation_rules,              │
│   sequence_enrollments, workflow_runs, meetings, templates,      │
│   broadcasts, email_campaigns, …                                 │
│                                                                  │
│  All tenant CRM data (the `model/saas/**` schemas).              │
│  Provisioned via `mongo-provisioner.ts`.                         │
│  Routed to via `MongoAdapter` when `data_mode = "own"`.          │
└──────────────────────────────────────────────────────────────────┘
```

**Why this separation?**

1. **Isolation.** Freelance clients pay for full data isolation. A noisy neighbour in one tenant can't degrade another. Per-tenant Mongo also makes data residency a real conversation with enterprise prospects.
2. **Scalability.** Platform metadata is small, low-write, schema-stable, relational. PostgreSQL with proper indexes serves this beautifully. CRM data per tenant is high-write, schema-flexible — Mongo's strengths.
3. **Operations.** A single Postgres instance powers the platform. Hundreds of small Mongo databases serve tenants independently. Two backup strategies, two failover stories, but each one is simple.

## Migration phases

### ✅ Phase 0 — Pure deletes (shipped)

Three orphaned LAIE Mongo models deleted with zero callers. The Postgres equivalents (`laie_research_reports`, etc.) have been the source of truth for months.

**Deleted:**

- `src/model/laie/FraudDetectionLog.model.ts`
- `src/model/laie/IntegrationConfig.model.ts`
- `src/model/laie/ResearchReport.model.ts`

The `model/laie/` directory is now empty.

### ✅ Phase 2 — Drop Mongo cache fallback (shipped)

The `lib/cache.ts` previously used `MongoCache` as the fallback when `ERIX_STORE_URL` was unset. erix-store is the canonical platform cache; in-memory is fine for local dev.

**Changes:**

- Removed `MongoCache` class from `lib/cache.ts`.
- Removed `dbCache` named export.
- Default `cache` singleton now resolves: `erix-store (if URL set) → in-memory`.
- Deleted `src/model/common/cache.model.ts`.

The `model/common/` directory is now empty.

**⚠️ Production note:** if your deployment relies on cache state being shared across multiple backend instances, **`ERIX_STORE_URL` must be set**. Without it, each instance has its own in-memory cache.

### ⏸ Phase 1 — Retire `Job` mongoose model (deferred)

The Mongoose `Job` model at `src/model/queue/job.model.ts` is marked `@deprecated` but still has 5 active callers:

- `routes/infra/health.routes.ts` × 3 (`countDocuments`, `findById`)
- `routes/erix/queue.routes.ts` × 4 (`find`, `aggregate`, `findOneAndUpdate`, `findByIdAndDelete`)
- `services/saas/meet/meeting.service.ts` × 1 (`deleteMany` filtered by `data.payload.meetingId`)

**Why deferred:** erix-store's `queueV2` exposes per-job operations (`get`, `push`, `claim`, `complete`, `fail`) but **does not expose** the queue admin surface that the Mongo Job model supports — bulk filter-by-payload deletes, count-by-status aggregations, retry-failed-job-by-id. The clean swap requires erix-store API additions or a shim service. Tracked under "Phase 1" in the migration plan.

### Phase 3 — Confirm + delete agency-template features

`Blueprint` (agency template engine) and `Staff` (agency staff) appear unused outside of `routes/platform/admin/agency.routes.ts`. **Open question:** are these live product features or shelf-ware? If shelf-ware, delete the routes too. If live, they need new tables.

### Phase 4 — `CorsOrigin` → `ecodrix_cors_origins` (✅ shipped)

Smallest end-to-end migration. Replaces the Mongo `corsorigins` collection with a Postgres-canonical allowlist.

**Changes:**

- New pgTable: `ecodrix_cors_origins` (id / url / name / is_active / allowed_headers[] / allowed_methods[] / timestamps), unique index on `url`.
- New migration: `src/shared/db/migrations/platform/0004_cors_origins.sql` + `pnpm db:migrate:cors-origins` script.
- Rewrote admin CRUD route (`routes/platform/admin/cors.routes.ts`) on Drizzle. Surfaces the same shape externally — admin UI doesn't need changes.
- Rewrote the cache loader in `model/cors-origins.ts`. Reads admin allowlist from Postgres; client websites still come from Mongo `Client` (Phase 11 will move that).
- Cache invalidation (`refreshOriginsCache()`) on every mutation is preserved.
- Deleted: `src/model/cors-origin.model.ts`.

**To deploy:**

```bash
# 1. Apply the migration
pnpm db:migrate:cors-origins

# 2. Backfill from the Mongo collection. Run in mongosh or via the
#    template at the bottom of 0004_cors_origins.sql:
#      db.corsorigins.find({}).forEach(d => print(`('${d.url}', ...)`))
#    then INSERT … ON CONFLICT (url) DO UPDATE.

# 3. Verify: GET /api/saas/cors with x-core-api-key should return the
#    same set of origins as before.
```

**Backfill not strictly required** if the Mongo collection only contained origins already in `BASE_DEFAULTS_URLS` or covered by active client websites — those remain allowed. But run it for any custom-added origins.

### Phase 5 — `AuditLog` → `ecodrix_audit_logs` (✅ shipped)

Single-caller migration. `ecodrix_audit_logs` already existed; this phase brought it to feature parity with the Mongo model and rewrote the service.

**Changes:**

- New migration: `0005_audit_log_extensions.sql` + `pnpm db:migrate:audit-extensions` script.
  - Relaxed `org_id` to nullable (legacy Mongo allowed missing tenant context for global events).
  - Added `severity` column (`info | warn | error | critical`, default `info`, CHECK-constrained).
  - Added `user_agent` column.
  - Added query indexes mirroring the Mongo dashboard surface: `(org_id, action, resource_type, created_at DESC)`, `(resource_type, resource_id, created_at DESC)`, `(actor_id, created_at DESC)`.
- Rewrote `services/global/audit.service.ts` on Drizzle. Same external surface — `AuditService.log({ ... })`, `getClientLogs`, `getResourceHistory`. Two callers (`middleware/withSDK`, `services/global/orchestrator`) keep working unchanged.
- `clientCode → orgId` resolution via `getOrgIdFromClientCode` (existing helper). When the lookup fails (legacy / unbridged tenant), `orgId` stays null and the original `clientCode` is preserved in `metadata.clientCode`.
- `performedBy` (free-form string in Mongo) splits cleanly: real UUIDs go into `actor_id`, textual labels (`"system"`, `"core_admin"`, `"client_api"`) go into `metadata.actorLabel`.
- Deleted: `src/model/clients/auditLog.ts`.

**To deploy:**

```bash
pnpm db:migrate:audit-extensions
pnpm type
```

**No backfill required** — audit logs are append-only and the Mongo collection had a 90-day TTL; legacy rows can be left in Mongo until they expire naturally (or migrated with a one-shot script if historical analytics need them).

### Phase 6 — `ClientUsage` → `ecodrix_usage` (✅ shipped)

Replaced the legacy Mongo-backed `UsageService` with a thin compatibility shim that delegates to the Postgres-backed `usageService` (already canonical for the entitlement layer). No new SQL needed — `ecodrix_usage` already exists.

**Changes:**

- Rewrote `services/global/usage.service.ts` as a shim. Same exports (`UsageService.consume`, `addCredits`, `getUsage`) so the four legacy callers keep working unchanged.
- Legacy enum mapped to canonical `(service, feature)` pairs:
  - `whatsapp_msg` → `erix.whatsappMessages`
  - `email_msg` → `erix.emailMessages`
  - `ai_token` → `editor.aiCalls`
  - `automation_run` → `workflows.runsPerMonth`
- `consume` resolves clientCode → orgId, reads the entitlement-defined limit, and delegates to `pgUsage.checkAndIncrement`. Fail-open on any error path (org not found, no entitlement, DB hiccup) — matches the legacy posture.
- `addCredits` is now a logged no-op. The new model gets credits from plans/add-ons in `ecodrix_plans` / `ecodrix_addons`, not runtime injection. Marked `@deprecated` so callers can be migrated organically.
- `getUsage` returns the same array shape (`{ type, usedCredits, totalCredits, status }`) the old callers expected, sourced from the four mapped pairs.
- Deleted: `src/model/clients/usage.model.ts`.

**Behavioural difference worth knowing:** the legacy `consume` upserted a 1000-credit default for unknown orgs. The shim now reads the limit from entitlements; orgs without an entitlement entry pass through the meter without enforcement (fail-open). Once all callers migrate to the canonical `createQuotaMiddleware("erix","whatsappMessages")` style, this shim can be deleted entirely.

**To deploy:**

```bash
pnpm type   # no migration needed
```

**No backfill required** — the legacy Mongo `ClientUsage` documents were per-month counters that reset; existing month-to-date counts are not preserved. If the cutover lands mid-month, the new period starts at zero. Acceptable because quotas are advisory in the legacy `consume` path.

### Phase 7 — `ClientServiceConfig` → `ecodrix_organizations.service_config` (✅ shipped)

Folded a small Mongo collection into a JSONB column on the org row. The shape is preserved verbatim so backfill is a one-line UPDATE per row.

**Changes:**

- New migration: `0006_org_service_config.sql` + `pnpm db:migrate:service-config` script. Adds `service_config jsonb default '{}' not null` to `ecodrix_organizations`.
- Schema kept in sync: `shared/db/schema/platform/organizations.ts`.
- New helper: `services/admin/service-config.service.ts` with three operations:
  - `getServiceConfig(clientCode)` — fetch
  - `replaceServiceConfig(clientCode, blob)` — full top-level replace
  - `mutateServiceConfig(clientCode, mutator)` — read-modify-write (used by template cleanup)
- Rewrote 4 admin endpoints in `routes/platform/admin/clients.routes.ts` (`GET/PATCH /clients/:code/config`, removed the auto-create-on-create-client and the cascading delete/update — both unnecessary now that the data lives on the org row).
- Rewrote `services/saas/whatsapp/template.service.ts` template-cleanup using `mutateServiceConfig`. Same logic, race-safe.
- Deleted: `src/model/clients/config.ts`.

**To deploy:**

```bash
pnpm db:migrate:service-config
pnpm type
```

**Backfill** is required if the Mongo collection has data. Template at the bottom of `0006_org_service_config.sql`:

```sql
-- Per-org one-line update from Mongo doc:
UPDATE ecodrix_organizations
   SET service_config = $$<json blob from clientservicconfigs.find()>$$::jsonb
 WHERE client_code = '<UPPERCASE_CLIENT_CODE>';
```

### Phase 8 — `ClientDataSource` → `ecodrix_organizations.external_db_*` (✅ shipped)

The columns already existed (`external_db_uri`, `external_db_type`, `data_mode`). This phase rewired every reader and writer to Postgres and dropped the Mongo source-of-truth.

**Changes:**

- New helper: `services/admin/data-source.service.ts` with four operations:
  - `getDataSource(clientCode)` — full record with decrypted URI + sanitised view
  - `getTenantUri(clientCode)` — hot-path variant that returns just the URI
  - `replaceDataSource(clientCode, { uri, type })` — encrypt + persist, or clear with `uri: null`
  - `listOtherDataSourceUris(excludeClientCode)` — for the URI uniqueness check
- Encryption helper unchanged (`lib/crypto.ts`, AES-256, IV-prefixed format) so existing encrypted blobs back-fill verbatim.
- Rewrote `lib/connectionManager.ts` `TenantConnectionManager.get` to call `getTenantUri`. Distributed cache key/TTL preserved (`CacheKey.clientDataSource`, 1h).
- Rewrote `lib/tenant/connection.ts` `GetURI` (one-line delegation to `getTenantUri`).
- Rewrote 2 admin endpoints in `routes/platform/admin/clients.routes.ts` (`GET/POST /clients/:code/datasource`). URI uniqueness check still runs across every other org's URI; auto-rewrite of DB name suffix preserved.
- Dropped the legacy Mongo write inside `POST /clients/:code/provision-mongo`. Postgres is now the only canonical store. Response keeps `legacyUpdated: false` for backward compat.
- Removed `ClientDataSource` from the cascading-delete and cascading-update blocks (data lives on the org row).
- Updated `smoke.test.ts` to query `Client` instead of `ClientDataSource`.
- Deleted: `src/model/clients/dataSource.ts`.

**To deploy:**

```bash
pnpm type   # no migration needed — columns already existed
```

**Backfill** is required if Mongo `clientdatasources` has live rows. The encryption format is identical, so you can copy `dbUri` straight into `external_db_uri`:

```sql
-- Per-org, run after dumping each Mongo doc to a JSON file:
UPDATE ecodrix_organizations
   SET external_db_uri  = '<mongo dbUri ciphertext, verbatim>',
       external_db_type = '<mongodb|postgresql|mysql>',
       updated_at       = NOW()
 WHERE client_code = '<UPPERCASE_CLIENT_CODE>';
```

Or write a backfill script that reads from Mongo and upserts via the helper:

```typescript
import { ClientDataSourceModel } from "<dump file>";
import { replaceDataSource } from "@/services/admin/data-source.service";

for await (const doc of legacyDump) {
  await replaceDataSource(doc.clientCode, {
    uri: doc.getUri(), // already decrypts
    type: doc.dbType,
  });
}
```

### Phase 9 — `ClientSecrets` → `ecodrix_org_secrets` (✅ shipped)

Largest blast radius (~16 callers across mail / WhatsApp / Google / SES). Cut over in a single migration rather than the planned dual-write window because:

- Encryption format is identical (IV-prefixed AES-256-CBC via `lib/crypto.ts`), so existing Mongo blobs back-fill verbatim into the `*_enc` columns.
- The new `OrgSecretsRecord` returned by `services/admin/secrets.service.ts` exposes the same `getDecrypted(field)` method + plain props as the legacy Mongoose doc, so all `MetaWhatsAppClient.fromSecrets` / `GoogleMeetClient.fromSecrets` / `MailClient.fromSecrets` factories work unchanged.
- The `findOne({ clientCode })`-creates-on-demand pattern is mirrored: `getOrgSecrets(clientCode)` returns an empty record when the row is missing, and `upsertOrgSecrets` lazy-creates on first write.

**Schema** — `shared/db/schema/platform/org-secrets.ts`:

- One column per known secret. Encrypted fields use the `_enc` suffix and store the same IV-prefixed ciphertext.
- `customSecrets` is a `jsonb` map (key → encrypted string).
- `email_stats`, `ses_dns_records` are `jsonb` (mirror the legacy Mongo sub-document shapes 1:1).
- `org_id` is the primary lookup; `clientCode` is resolved through `ecodrix_organizations` so a rename of `clientCode` no longer needs a cascade.

**Migration** — `shared/db/migrations/platform/0007_org_secrets.sql`:

```bash
pnpm db:migrate:org-secrets   # apply the table
pnpm type                      # verify clean
```

**Callers swapped** (every live `import { ClientSecrets }` removed):

- `lib/callbackSender.ts` — webhook HMAC signing
- `routes/auth/google.routes.ts` — OAuth callback persistence
- `routes/erix/mail/ses-notification.routes.ts` — SNS bounce/complaint dispatch (uses `findOrgByVerifiedSesDomain`)
- `routes/erix/whatsapp/webhook.routes.ts` — verify-token reverse lookup (uses `findOrgByWhatsappVerifyToken`) + inbound dispatch (uses `listAllOrgSecretsForWebhook`)
- `routes/erix/whatsapp/templates.routes.ts` — Meta template sync + create/update/delete
- `routes/infra/health.routes.ts` — integration audit
- `routes/platform/admin/clients.routes.ts` — admin GET / POST / PUT / PATCH `/clients/:code/secrets` + Google reauth + cascading delete
- `services/mail/MailClient.ts`, `services/mail/EmailHealthService.ts`, `services/mail/EmailConfigService.ts` — provider switching, SES verification, daily-throttle counters
- `services/saas/whatsapp/whatsapp.service.ts`, `services/saas/invoice/whatsapp.service.ts`, `services/saas/ai/auto-responder.ts` — outbound WhatsApp sends
- `services/saas/meet/google.meet.service.ts`, `sdk/meet.sdk.ts` — Google Meet client factory
- `services/saas/crm/crmHooks.ts` — meeting-callback URL lookup
- `jobs/saas/templateSyncJob.ts` — daily Meta template walk

**Helper API** (`services/admin/secrets.service.ts`):

- `getOrgSecrets(clientCodeOrId)` — drop-in for `ClientSecrets.findOne` (returns the record OR `null` only when the org itself is missing)
- `getOrgSecretsOrThrow(clientCodeOrId)` — for hot-path factories that already expect a populated context
- `upsertOrgSecrets(clientCodeOrId, patch)` — encrypts on write, drops unknown keys (`strict:true` parity), bumps `googleRefreshTokenUpdatedAt` on token rotation
- `setCustomSecret(clientCodeOrId, key, value)` — single-key custom-secrets write
- `patchOrgSecrets` — alias of `upsertOrgSecrets` for clarity at health/config call sites
- `appendSesDnsRecords(clientCodeOrId, records)` — DNS issuance + DMARC fix-up
- `bumpDailyCount(clientCodeOrId, { newDay })` — atomic daily-send counter
- `deleteOrgSecrets(clientCodeOrId)` — admin-side cascading delete
- `findOrgByVerifiedSesDomain(domain)` — SNS bounce/complaint reverse lookup
- `findOrgByWhatsappVerifyToken(token)` — Meta webhook handshake
- `listAllOrgSecretsForWebhook()` — returns every tenant for inbound dispatch

**Removed**:

- `model/clients/secrets.ts` (entire file deleted)
- `IClientSecrets` interface in `types/global.d.ts` (was already unused)
- All `await dbConnect("services")` calls in the migrated files where Mongo was the only reason to connect

**Backfill** (one-shot) — copy each existing Mongo `client_secrets` document into the corresponding org row. Encryption is preserved verbatim; the only mapping needed is `clientCode → orgId`. Recommended approach:

```ts
// scripts/backfill-org-secrets.ts (run once, then delete)
const docs = await mongoose.connection
  .collection("client_secrets")
  .find({})
  .toArray();
for (const doc of docs) {
  await upsertOrgSecrets(doc.clientCode, {
    ...doc /* ciphertext copies as-is */,
  });
}
```

If you ran any admin "rotate" actions through the new endpoints **before** backfilling, those rotations are already in Postgres — backfill will only fill in the untouched fields because `upsertOrgSecrets` uses ON CONFLICT DO UPDATE with `set: <patch>` (omitted keys aren't overwritten).

### Phase 10 — `ClientStorage` + `StorageEvent` → Postgres (✅ shipped)

Both Mongo collections folded into existing `ecodrix_cloud_storage` (reshaped from per-file metadata to per-org quota state) and a new `ecodrix_storage_events` audit table.

**Why reuse `ecodrix_cloud_storage`** — the original per-file shape from migration 0001 was never wired up to a live caller. There is exactly one R2 bucket per org, so the table name slot was repurposed for the per-org quota row instead of standing up a parallel `ecodrix_client_storage`. Cleaner semantics, one less table.

**Schema** — `shared/db/schema/platform/cloud-storage.ts`:

- `ecodrix_cloud_storage` — one row per org (unique on `org_id`). Columns mirror the legacy Mongoose schema 1:1:
  - `bucket`, `root_prefix`, `quota_bytes`, `used_bytes`
  - `is_provisioned`, `provisioned_at`, `is_suspended`
  - `last_synced_at`
  - `folders` JSONB array of `ClientStorageFolder` (the legacy embedded sub-doc shape)
  - `client_code` denormalised from `ecodrix_organizations.client_code` for fast read-path lookup; helper service keeps it in sync on rename
- `ecodrix_storage_events` — append-only audit log. Postgres has no TTL index, so 90-day retention is enforced by `cleanupOldStorageEvents()` running from the nightly cron.

**Migration** — `shared/db/migrations/platform/0008_cloud_storage.sql`:

- `DROP TABLE IF EXISTS ecodrix_cloud_storage CASCADE` (zero live consumers)
- Recreate with the per-org quota shape
- Create `ecodrix_storage_events`
- `updated_at` trigger on the quota row

```bash
pnpm db:migrate:cloud-storage
pnpm type
```

**Helper API** (`services/admin/client-storage.service.ts`):

- `getClientStorage(clientCodeOrId)` — drop-in for `ClientStorage.findOne`, returns Mongo-shaped record with `usagePercent` getter + `isOverQuota()` method
- `listProvisionedClientStorage()` — for the nightly cron
- `createClientStorage({...})` — provisioning entry point. Idempotent via ON CONFLICT DO NOTHING
- `updateClientStorage(clientCodeOrId, patch)` — generic field updates
- `incrementUsage(clientCodeOrId, folderName, byteDelta, fileDelta)` — atomic global counter + folder JSONB update
- `pushFolder` / `replaceFolders` — folder array mutations
- `commitSyncResult` — used at the end of `StorageService.syncUsage`
- `deleteClientStorage` — admin cascading delete
- `recordStorageEvent` — audit append
- `cleanupOldStorageEvents(retentionDays = 90)` — TTL replacement
- `listRecentStorageEvents` — admin storage panel

**Callers swapped**:

- `services/StorageService.ts` — every Mongoose call replaced with helper imports. External surface (every public method) is unchanged.
- `routes/platform/admin/clients.routes.ts` — `ClientStorage.create` → `createClientStorage`; `ClientStorage.deleteOne` → `deleteClientStorage`
- `jobs/cron.ts` — `ClientStorage.find({isProvisioned:true}).lean()` → `listProvisionedClientStorage()`. Same cron tick now also invokes `cleanupOldStorageEvents()` for the 90-day audit retention.

**Removed**:

- `model/clients/ClientStorage.ts` (entire file)
- `model/clients/StorageEvent.ts` (entire file)
- `IStorageEvent` interface in `types/global.d.ts`

**Backfill** (one-shot) — for tenants with existing Mongo storage state:

```ts
// scripts/backfill-client-storage.ts (run once, then delete)
const docs = await mongoose.connection
  .collection("client_storages")
  .find({})
  .toArray();
for (const doc of docs) {
  await createClientStorage({
    clientCode: doc.clientCode,
    quotaBytes: doc.quotaBytes,
    bucket: doc.bucket,
    rootPrefix: doc.rootPrefix,
    isProvisioned: doc.isProvisioned,
    folders: (doc.folders ?? []).map((f) => ({
      name: f.name,
      prefix: f.prefix,
      isSystem: f.isSystem,
      dateShard: f.dateShard,
      fileCount: f.fileCount ?? 0,
      sizeBytes: f.sizeBytes ?? 0,
      createdAt: (f.createdAt ?? new Date()).toISOString(),
    })),
  });
  await updateClientStorage(doc.clientCode, {
    usedBytes: doc.usedBytes ?? 0,
    isSuspended: doc.isSuspended ?? false,
    lastSyncedAt: doc.lastSyncedAt ?? null,
    provisionedAt: doc.provisionedAt ?? null,
  });
}
```

`storage_events` are short-lived (90-day TTL), so a backfill there is optional — the next nightly sync emits a fresh `sync` event anyway.

### Phase 11 — `Client` → `ecodrix_organizations` (✅ shipped)

13 callers across middleware / services / routes / smoke test. `ecodrix_organizations` already had 80% of the columns. Cut over in a single migration plus a Mongo-shaped helper service.

**Schema additions** — migration `0009_org_client_columns.sql`:

- `business_email`, `business_phone` (top-level mirror of legacy `Client.business`)
- `plan_billing_cycle`, `plan_start_date`, `plan_end_date` (legacy `Client.plan`)
- `whatsapp_connected_at`, `whatsapp_disconnected_at`
- `tags TEXT[]`, `agency_code TEXT`, `labels JSONB`
- Indexes on `agency_code` (partial) and `status`

```bash
pnpm db:migrate:org-client-columns
pnpm type
```

**Helper service** — `services/admin/clients.service.ts`:

- `ClientRecord` type — Mongo-shaped (`_id` alias, nested `business`, `plan`, `whatsapp` sub-objects). Drop-in for the legacy `IClient` document.
- Read API: `getClient(clientCodeOrId)`, `getClientByApiKey(apiKey)`, `listClients({ status, agencyCode, order, limit })`, `listActiveClientWebsites()`, `countClients(status?)`, `clientExists(clientCode)`
- Write API: `createClient({...})`, `updateClient(clientCodeOrId, patch)`, `rotateApiKey(clientCodeOrId, apiKey)`, `deleteClient(clientCodeOrId)`
- Every helper resolves either `clientCode` (case-insensitive) or a UUID — same dual-id pattern as the secrets / storage helpers.

**Callers swapped** (every live `import { Client }` removed):

- `middleware/saasAuth.ts` — both `clientCode + apiKey` and `apiKey-only` flows now hit `ecodrix_organizations` directly
- `services/saas/editorValidation.service.ts` — `findOne({ apiKey })` → `getClientByApiKey`. Plan-tier check now exclusively reads `ErixTenantService` (Postgres canonical) since `client.plan.name` no longer lives on the org row
- `lib/tenant/crm.models.ts` — `getClientConfig` is now a thin wrapper around `getClient`
- `services/global/{health,portfolio}.service.ts` — `Client.find({ agencyCode })` → `listClients({ agencyCode })`
- `model/cors-origins.ts` — Mongo allowlist read replaced with `listActiveClientWebsites()`
- `routes/auth/google.routes.ts` — Google OAuth callback name lookup uses `getClient`
- `routes/erix/marketing.routes.ts` — same
- `routes/erix/sdk.routes.ts` — SDK validation uses `getClientByApiKey`
- `routes/platform/admin/clients.routes.ts` — every handler refactored:
  - Listing / count / single get / API key get + rotate
  - Create now writes the org row directly via `createClient` and inlines the subscription attach + audit log that the deleted `org-bridge` service used to perform
  - Identity update / delete refactored against the helpers; rename cascade collapses to nothing because every Phase-7-through-10 table is keyed on `org_id` (not `client_code`)
- `controllers/saas/checkout/SessionController.ts` — `client._id.toString()` → `client.id`
- `jobs/cron.ts` — nightly score-refresh now reads from `listClients({ status: "active" })`
- `jobs/saas/handlers/storageProvision.handler.ts` — verification step uses `getClient`
- `smoke.test.ts` — replaced legacy `Client.countDocuments()` heartbeat with a generic `db.admin().ping()` since the smoke test only needs to verify the services connection is alive

**Removed**:

- `model/clients/client.ts` (entire file)
- `services/admin/org-bridge.service.ts` (entire file — its only consumer was the create handler which now writes directly)
- `IClient` ambient interface in `types/global.d.ts`

**Backfill** — for any existing Mongo `Client` docs:

```ts
// scripts/backfill-clients.ts (run once, then delete)
const docs = await mongoose.connection.collection("clients").find({}).toArray();
for (const doc of docs) {
  if (await clientExists(doc.clientCode)) {
    await updateClient(doc.clientCode, {
      name: doc.name,
      apiKey: doc.apiKey ?? null,
      status: doc.status,
      business: doc.business ?? null,
      plan: doc.plan ?? null,
      tags: doc.tags ?? [],
      agencyId: doc.agencyId ?? null,
      agencyCode: doc.agencyCode ?? null,
      labels: doc.labels ? Object.fromEntries(doc.labels) : {},
      whatsapp: doc.whatsapp ?? null,
    });
  } else {
    await createClient({
      name: doc.name,
      clientCode: doc.clientCode,
      apiKey: doc.apiKey ?? null,
      status: doc.status,
      business: doc.business ?? null,
      plan: doc.plan ?? null,
      tags: doc.tags ?? [],
      agencyId: doc.agencyId ?? null,
      agencyCode: doc.agencyCode ?? null,
      labels: doc.labels ? Object.fromEntries(doc.labels) : {},
      whatsapp: doc.whatsapp ?? null,
      acquisitionChannel: "freelance",
    });
  }
}
```

After backfill the legacy Mongo `clients` collection can be dropped.

### Phase 12 — `Blog` → `ecodrix_blogs` (✅ shipped)

Single read-only admin route was the only live caller, but the legacy schema was heavy (5 embedded engagement arrays + nested author + featured image). New table folds everything into one row with JSONB for the engagement blobs.

**Schema** — `shared/db/schema/platform/blogs.ts`:

- One row per post, `slug` unique
- Native `text[]` arrays for `tags`, `meta_keywords`, `related_posts` so admin search can use `WHERE 'design' = ANY(tags)` without JSONB overhead
- JSONB for `featured_image`, `author`, `comments`, `liked_by`, `viewed_by`, `shared_by`, `call_to_action` (write-once-per-event, never joined)
- Aggregate counters (`likes`, `views`, `shares`) maintained alongside the engagement arrays so listing pages don't have to read the JSONB
- Soft-delete via `deleted` boolean (mirrors the legacy flag)
- GIN index on `tags`, partial index on published-and-not-deleted, partial index on featured

**Migration** — `0010_blogs.sql`:

```bash
pnpm db:migrate:blogs
pnpm type
```

**Helper service** — `services/admin/blogs.service.ts`:

- `BlogRecord` type — Mongo-shaped with `_id` alias, full nested objects
- Read API: `getBlog(slugOrId)`, `listBlogs({ status, category, publishedOnly, featuredOnly, tag, limit, offset, order, includeDeleted })`
- Write API: `createBlog`, `updateBlog`, `softDeleteBlog`, `deleteBlog`
- Engagement helpers: `addComment`, `recordEngagement(slug, "like" | "view" | "share", entry)` — appends to JSONB array AND bumps the matching counter atomically

**Refactored**:

- `routes/platform/admin/blogs.routes.ts` — single `GET /services/blogs` handler now uses `listBlogs({ includeDeleted: false })`. Response shape unchanged.

**Removed**:

- `model/services/blog.ts` (entire file)
- `IBlog` ambient declaration in `types/global.d.ts`

**Backfill**:

```ts
// scripts/backfill-blogs.ts (run once, then delete)
const docs = await mongoose.connection.collection("blogs").find({}).toArray();
for (const doc of docs) {
  await createBlog({
    title: doc.title,
    slug: doc.slug,
    body: doc.body,
    category: doc.category,
    featuredImage: doc.featuredImage,
    author: doc.author
      ? {
          id: doc.author.id?.toString() ?? null,
          name: doc.author.name,
          avatar: doc.author.avatar,
        }
      : null,
    isPublished: doc.isPublished,
    publishDate: doc.publishDate,
    featured: doc.featured,
    metaTitle: doc.metaTitle,
    metaDescription: doc.metaDescription,
    canonicalUrl: doc.canonicalUrl,
    metaKeywords: doc.metaKeywords ?? [],
    status: doc.status,
    tags: doc.tags ?? [],
    relatedPosts: (doc.relatedPosts ?? []).map((id: any) => id.toString()),
    callToAction: doc.call_to_action ?? [],
    wordCount: doc.wordCount,
    readTime: doc.readTime,
  });
  // Engagement arrays + counters need to be patched in separately because
  // createBlog only sets initial counts to 0.
  // ... (see commented patch in scripts/backfill-blogs.ts)
}
```

### Phase 13 — `Lead` (services) → `ecodrix_corporate_leads` (✅ shipped)

The platform's own sales pipeline (apify-sourced + corporate marketing form). 7 callers — 1 admin route + 6 cron jobs. Distinct from the per-tenant `Lead` model which lives in each tenant's isolated Mongo DB.

**Architectural decision** — went with a dedicated `ecodrix_corporate_leads` table rather than folding the corporate sales team into `ecodrix_organizations` as the "Ecodrix HQ" tenant. The corporate-specific fields (`first_contact_due`, `lead_score`, `deal_probability`, `lost_reason`, `research`) don't exist on the tenant model, and folding would force the corporate team into a "be a tenant of your own product" UX that's a separate question from a storage migration. The Erix-as-HQ idea remains an open product call but is no longer a blocker.

**Schema** — `shared/db/schema/platform/corporate-leads.ts`:

- All scalar fields from the legacy Mongoose schema as columns
- Embedded arrays (`follow_ups`, `notes`, `activity`, `attachments`, `services_offered`) as JSONB — append-only timeline data, never joined
- `research` as a single JSONB blob with `{status, notes, done}`
- `tags` as native `text[]`
- Indexes tuned for the 6 cron query patterns: partial indexes on `(next_follow_up_date) WHERE follow_up_overdue = false`, `(first_contact_due) WHERE first_contact_done = false AND first_contact_overdue = false`, `(reminder_date) WHERE reminder_date IS NOT NULL`, etc.

**Migration** — `0011_corporate_leads.sql`:

```bash
pnpm db:migrate:corporate-leads
pnpm type
```

**Helper service** — `services/admin/corporate-leads.service.ts`:

Two helper categories:

- **CRUD** (Mongo-shaped record returned): `getLead`, `findLeadByPhoneOrTitle`, `createLead`, `updateLead`, `deleteLead`
- **Cron-batch** (each job reduces to a single atomic UPDATE):
  - `applyOverdueFollowUps()` — followUpJob
  - `applyFirstContactOverdue()` — firstContactJob
  - `applyAutoClose()` — autoCloseJob
  - `applyFollowUpLimit()` — followUpLimitJob
  - `applyReminderTouches()` — remindersJob
  - `applyResearchDelays()` — researchJob

The cron-batch helpers use `activity || jsonb_build_array(...)` inside the same `UPDATE` to mirror Mongo's `$push: { activity: ... }` — the legacy two-step `find → updateMany` pattern collapses to one statement, with the partial indexes making the WHERE clauses cheap.

**Refactored**:

- `routes/platform/admin/leads.routes.ts` — `POST /add-lead` now uses `createLead` + `findLeadByPhoneOrTitle`
- `jobs/leads/followUpJob.ts`, `remindersJob.ts`, `autoCloseJob.ts`, `firstContactJob.ts`, `followUpLimitJob.ts`, `researchJob.ts` — each now ~3 lines; entire job body collapsed into a single helper call

**Removed**:

- `model/services/leads.ts` (entire file)
- `IAttachment`, `IFollowUp`, `IActivity`, `INote`, `IServiceLead` ambient declarations in `types/global.d.ts`

**Backfill**:

```ts
// scripts/backfill-corporate-leads.ts (run once, then delete)
const docs = await mongoose.connection.collection("leads").find({}).toArray();
for (const doc of docs) {
  await createLead({
    title: doc.title,
    name: doc.name,
    phone: doc.phone,
    email: doc.email,
    categoryName: doc.categoryName,
    city: doc.city,
    state: doc.state,
    street: doc.street,
    purpose: doc.purpose,
    timeline: doc.timeline,
    serviceSelected: doc.serviceSelected,
    status: doc.status,
    source: doc.source,
    leadScore: doc.leadScore,
    rating: doc.rating,
    reviewsCount: doc.reviewsCount,
    activity: (doc.activity ?? []).map((a: any) => ({
      type: a.type,
      message: a.message,
      meta: a.meta,
      createdAt: a.createdAt?.toISOString(),
      createdBy: a.createdBy?.toString() ?? null,
    })),
    tags: doc.tags ?? [],
  });
  // Other fields (followUps, notes, attachments, research, deal pricing,
  // reminder/callback dates, follow-up counters, first-contact flags) need
  // a follow-up updateLead({...}) — see the full backfill script in
  // scripts/backfill-corporate-leads.ts for the complete column mapping.
}
```

After this phase the corporate `Lead` collection can be dropped from the legacy `services` Mongo database — it has zero readers.

### Phase 3 — `Blueprint` → `ecodrix_blueprints` (✅ shipped — final phase)

Originally deferred pending live-vs-shelfware analysis. Confirmed live: `OrchestratorService.deployBlueprint` actively clones blueprint content into tenant Mongo on admin onboarding flows. Migrated rather than deleted.

**Schema** — `shared/db/schema/platform/blueprints.ts`:

- One row per template
- `content` is a single JSONB column with the legacy nested shape (`{ pipelines, automationRules, leadFields, scoringConfigs }`). Inner arrays were `Mixed` on Mongo — JSONB preserves the flexibility because blueprint content evolves with every new automation feature
- `category` enum-checked at the SQL level
- Partial indexes on `is_public` and `owner_agency_id`, plus a flat `category` index

**Migration** — `0012_blueprints.sql`:

```bash
pnpm db:migrate:blueprints
pnpm type
```

**Helper service** — `services/admin/blueprints.service.ts`:

- `BlueprintRecord` with `_id` alias, full `content` access
- `getBlueprint`, `listBlueprints({ category, publicOnly, ownerAgencyId, order, limit })`, `createBlueprint`, `updateBlueprint`, `deleteBlueprint`

**Refactored**:

- `routes/platform/admin/agency.routes.ts` — `GET /blueprints` and `POST /blueprints` use `listBlueprints` / `createBlueprint`. The previous `Staff` routes were already removed (vestigial). `dbConnect("services")` calls dropped from the file.
- `services/global/orchestrator.service.ts` — `deployBlueprint` reads via `getBlueprint(blueprintId)`. The clone logic against tenant Mongo (`Pipeline.create`, `PipelineStage.create`, `AutomationRule.create`) is unchanged — JSONB content shape mirrors the legacy embedded sub-doc.

**Removed**:

- `model/global/blueprint.model.ts` (entire file)
- `model/global/staff.model.ts` (entire file — vestigial agency org-chart)
- `IBlueprint` and `IStaff` ambient declarations
- The empty `model/global/`, `model/queue/`, `model/clients/`, `model/services/`, `model/common/`, `model/laie/` directories
- Mongo `Job` model (`model/queue/job.model.ts`) and the queue inspector routes (`routes/erix/queue.routes.ts` + `GET /jobs/status/:jobId`) — replaced by ErixStore sidecar; live queue-stats surfacing is its own workstream

### Final state — Platform-Mongo deprecation complete

After Phase 13:

- Zero Mongoose models on the platform `services` connection.
- The `dbConnect("services")` bootstrap call can be removed.
- All `model/clients/`, `model/global/`, `model/services/`, `model/queue/`, `model/cors-origin.model.ts` deleted.
- `model/saas/**` remains as the schemas registered per-tenant by `lib/tenant/crm.models.ts` — that's the correct boundary.

## Rules for adding new platform metadata

When you need to store new platform-level data (anything that isn't tenant CRM data inside a freelance client's isolated database):

1. **Add a Drizzle pgTable under `src/shared/db/schema/platform/`** with the `ecodrix_` prefix.
2. **Re-export from `platform/index.ts`** (the barrel).
3. **Generate a migration** with `pnpm drizzle-kit generate:pg` (or update `0002_platform_completion.sql` if pre-launch).
4. **Never add a new `mongoose.Schema` under `model/clients/`, `model/global/`, `model/services/`, or top-level `model/`.** Those folders are deprecated and being deleted.
5. **For tenant CRM data** (per-freelance-client Mongo) → use `model/saas/**` and register via `lib/tenant/crm.models.ts`.

## Encryption

The existing `lib/crypto.ts` (AES-256-CBC) is the canonical encryption helper. Apply it inline for sensitive columns (org secrets, external DB URIs):

```typescript
import { encrypt, decrypt } from "@/lib/crypto";

// Write
await db.update(ecodrix_org_secrets).set({
  whatsappToken: encrypt(rawToken),
});

// Read
const [row] = await db.select().from(ecodrix_org_secrets).where(...);
const token = decrypt(row.whatsappToken);
```

The IV-prefixed format `<32-hex-IV>:<hex-content>` is preserved so existing encrypted Mongo data can be backfilled verbatim into Postgres.

## Per-tenant Mongo (the part that stays)

The schemas under `src/model/saas/**` are registered by `lib/tenant/crm.models.ts` against the **per-tenant Mongo connection** that comes from `getTenantConnection(clientCode)`. They do NOT live on the platform `services` connection.

These are the legitimate Mongo collections:

| Folder                 | Purpose                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `model/saas/crm/`      | Leads, pipelines, automations, sequences, scoring, segments, notifications, activities, notes, lead-gen data, scoring config |
| `model/saas/whatsapp/` | Conversations, messages, templates, broadcasts                                                                               |
| `model/saas/meet/`     | Meetings                                                                                                                     |
| `model/saas/email/`    | Email templates                                                                                                              |
| `model/saas/event/`    | Event log, callback log, custom event defs                                                                                   |
| `model/saas/checkout/` | Checkout products, sessions, orders, coupons                                                                                 |

**Do not touch these in the platform-Mongo migration.** They're the right shape, in the right database, accessed via the right helper.

## See also

- `ECOD/server/src/services/admin/mongo-provisioner.ts` — Atlas Admin API client + manual URI fallback for freelance tenant DB provisioning
- `ECOD/server/src/lib/erix-adapter/` — adapter abstraction that routes CRM ops to platform Postgres OR per-tenant Mongo based on `data_mode`
- `ECOD/saas/.kiro/specs/platform-completion-end-to-end/` — the spec covering this work
