Understood. Going to do a proper deletion-first audit before any migration plan. The order matters: figure out what's actually used → delete the dead code → only migrate what survives.

I'll delegate the discovery work to a sub-agent so the main context stays free for the actual execution.

Invoked Context Gatherer
Delegate the read-only audit. The agent must produce a deletion + migration plan with concrete callsite counts so I can execute it without re-discovering everything.
I've gathered enough context for a per-model verdict. Here's the audit deliverable.

═══════════════════════════════════════════════════════════════════ SECTION 1 — Model inventory ═══════════════════════════════════════════════════════════════════

PLATFORM (registered on default mongoose / used after dbConnect("services")):

File Model
client.ts
Client
secrets.ts
ClientSecrets
config.ts
ClientServiceConfig
dataSource.ts
ClientDataSource
usage.model.ts
ClientUsage
auditLog.ts
AuditLog
ClientStorage.ts
ClientStorage
StorageEvent.ts
StorageEvent
blueprint.model.ts
Blueprint
staff.model.ts
Staff
blog.ts
Blog (corporate marketing)
leads.ts
Lead (corporate sales lead, NOT tenant CRM)
job.model.ts
Job (deprecated, erix-store replaces)
cors-origin.model.ts
CorsOrigin
cors-origins.ts
helper (uses Client + CorsOrigin)
cache.model.ts
CacheModel (fallback only)
TENANT (schemas wired into per-tenant Mongoose connections via
crm.models.ts
; KEEP — these belong to per-freelance-client Mongo):

All src/model/saas/\*\* (crm × 14, whatsapp × 4, meet × 1, email × 1, event × 3, checkout × 4)
LAIE (Mongoose files left over after Postgres migration; not wired anywhere):

FraudDetectionLog.model.ts
IntegrationConfig.model.ts
ResearchReport.model.ts
(Postgres equivalent at
researchReport.schema.ts
)
OTHER: none.

═══════════════════════════════════════════════════════════════════ SECTION 2 — Usage frequency (PLATFORM models) ═══════════════════════════════════════════════════════════════════

Model Distinct callers Top callers Surface
Client ~10
clients.routes.ts
,
google.routes.ts
,
marketing.routes.ts
,
sdk.routes.ts
,
health.service.ts
,
portfolio.service.ts
,
crm.models.ts
,
cors-origins.ts
,
cron.ts
routes + services + cron
ClientSecrets ~10 services/mail/{MailClient,EmailHealthService,EmailConfigService}, routes/erix/mail/ses-notification, routes/erix/whatsapp/{webhook,templates}, routes/erix/marketing,
google.routes
,
meet.sdk
,
health.routes
, lib/callbackSender routes + services + sdk
ClientDataSource 3
connectionManager.ts
,
connection.ts
,
clients.routes.ts
infra
ClientServiceConfig 1
clients.routes.ts
route only
ClientUsage 1
usage.service.ts
service
AuditLog 1
audit.service.ts
service
ClientStorage 3
StorageService.ts
,
clients.routes.ts
,
cron.ts
service + cron
StorageEvent 1
StorageService.ts
service
Blueprint 2
agency.routes.ts
,
orchestrator.service.ts
admin + orchestrator
Staff 1
agency.routes.ts
admin only
Blog 1
blogs.routes.ts
admin only
Lead (services) 7
leads.routes.ts
, jobs/leads/{firstContact,followUp,followUpLimit,reminders,research,autoClose}Job.ts route + cron
Job (queue) 4
queue.routes.ts
,
health.routes.ts
(×2),
meeting.service.ts
routes + service
CorsOrigin 2
cors.routes.ts
,
cors-origins.ts
admin + middleware
CacheModel 1
cache.ts
(MongoCache fallback only; erix-store is primary) infra
LAIE × 3 (FraudDetectionLog, IntegrationConfig, ResearchReport) 0 — dead
═══════════════════════════════════════════════════════════════════ SECTION 3 — Postgres equivalent check ═══════════════════════════════════════════════════════════════════

Model PG status Target
Client PARTIALLY_MIGRATED ecodrix_organizations (missing: whatsapp.connectedAt/disconnectedAt, plan.startDate/endDate/billingCycle, labels map; agency relation)
ClientSecrets NOT_MIGRATED new ecodrix_org_secrets (encrypted fields + email_stats JSONB)
ClientServiceConfig NOT_MIGRATED merge into ecodrix_organizations.service_config JSONB
ClientDataSource PARTIALLY_MIGRATED ecodrix_organizations.external_db_type/external_db_uri already exist; missing permissions
ClientUsage PARTIALLY_MIGRATED ecodrix_usage (key change: clientCode/type/month → orgId/service/feature/periodStart)
AuditLog PARTIALLY_MIGRATED ecodrix_audit_logs (missing severity, user_agent, TTL)
ClientStorage NOT_MIGRATED ecodrix_cloud_storage is per-file; need new ecodrix_client_storage (per-org quota) + ecodrix_storage_folders
StorageEvent NOT_MIGRATED new ecodrix_storage_events
Blueprint NOT_MIGRATED new ecodrix_blueprints if kept
Staff PARTIALLY_MIGRATED consolidate into ecodrix_members with role + assigned_clients array
Blog NOT_MIGRATED new ecodrix_blogs (+ side tables for comments/likes/views)
Lead (services) NOT_MIGRATED new ecodrix_corporate_leads (+ embedded JSONB for followUps/notes/activity)
Job SUPPLANTED erix-store queueV2 already replaces it
CorsOrigin NOT_MIGRATED new ecodrix_cors_origins
CacheModel SUPPLANTED erix-store cache (MongoCache is dead-fallback only)
LAIE × 3 only ResearchReport ALREADY_MIGRATED (laie_research_reports); FraudDetectionLog and IntegrationConfig NOT_MIGRATED but unused n/a
═══════════════════════════════════════════════════════════════════ SECTION 4 — Verdict per platform model ═══════════════════════════════════════════════════════════════════

Model Verdict Rationale
FraudDetectionLog.model.ts
DELETE 0 callers, no Mongo writes anywhere
IntegrationConfig.model.ts
DELETE 0 callers, no Mongo writes anywhere
ResearchReport.model.ts
DELETE 0 callers, Postgres laie_research_reports already in use
cache.model.ts
DELETE Only the dead MongoCache fallback in
cache.ts
; erix-store cache is primary. Drop fallback class + model.
job.model.ts
DELETE (after callsite swap) Marked @deprecated. erix-store queueV2 is the sanctioned queue. 4 thin callers can swap to erix.queueV2.{stats,get,delete,cancel}.
cors-origin.model.ts

- cors-origins.ts
  MIGRATE Admin-edited whitelist; small table. Move to ecodrix*cors_origins (also kills the platform Client.find lookup inside cors-origins.ts).
  blueprint.model.ts
  DELETE (pending product confirmation) 2 callers, both admin-only. Looks like a never-shipped agency template feature.
  staff.model.ts
  DELETE (pending product confirmation) 1 admin route. Overlaps with ecodrix_members.role already in PG.
  blog.ts
  MIGRATE Corporate marketing site is live; needs ecodrix_blogs.
  leads.ts
  MIGRATE Corporate sales pipeline (NOT tenant CRM). Wired into 5 cron jobs + admin route. Needs ecodrix_corporate_leads.
  auditLog.ts
  MIGRATE Trivial swap to ecodrix_audit_logs (1 service). Add severity, user_agent, retention policy.
  usage.model.ts
  MIGRATE Trivial swap to ecodrix_usage (1 service). Map (clientCode, type, month) → (orgId, service, feature, periodStart).
  config.ts
  MIGRATE 1 caller. Fold into ecodrix_organizations.service_config JSONB.
  dataSource.ts
  MIGRATE ecodrix_organizations.external_db*\* already exist. Tenant connection manager reads from PG instead.
  ClientStorage.ts
  MIGRATE Needs new ecodrix_client_storage (per-org quota) + ecodrix_storage_folders.
  StorageEvent.ts
  MIGRATE Needs new ecodrix_storage_events (TTL via partitioning or pg_cron).
  secrets.ts
  MIGRATE Largest blast radius (~10 callers across mail/whatsapp/google/ses). Needs ecodrix_org_secrets with column-level pgcrypto or app-side encrypt (preserve existing AES-256 helper).
  client.ts
  MIGRATE Largest blast radius (~10 callers). Already 80% modeled in ecodrix_organizations. Add the missing columns and rewrite callers.
  KEEP_AS_MONGO_FOR_NOW: none. Architecture rule allows zero exceptions on the platform connection.

═══════════════════════════════════════════════════════════════════ SECTION 5 — Execution order ═══════════════════════════════════════════════════════════════════

Phase 0 — Pure deletes (zero migration burden, zero callsite swap)

Files to delete:

FraudDetectionLog.model.ts
IntegrationConfig.model.ts
ResearchReport.model.ts
No new files. No SQL. No backfill.

Phase 1 — Retire Mongo Job model

Modify (swap to erix.queueV2):

meeting.service.ts
— Job.deleteMany → erix queue cancel by filter
queue.routes.ts
— admin list/stats/retry/delete → erix.queueV2.\* (or drop in favor of
admin.ts
which already has DLQ replay)
health.routes.ts
— Job.countDocuments (×2) and Job.findById → erix.queueV2.stats / queueV2.get
Delete:
job.model.ts
. No SQL. No backfill (in-flight jobs already on erix-store).

Phase 2 — Retire Mongo cache fallback

Modify:
cache.ts
— remove MongoCache class; keep ErixStoreCache + in-memory fallback.

Delete:
cache.model.ts
. No SQL. No backfill (TTL data, ephemeral).

Phase 3 — Confirm + delete agency-template features

Pending product call (open question §6). If unused:

Delete
blueprint.model.ts
,
staff.model.ts
Delete the Blueprint/Staff halves of
agency.routes.ts
Delete
orchestrator.service.ts
Blueprint usage (or stub applyBlueprint to no-op)
If kept: add ecodrix_blueprints and merge Staff into ecodrix_members (push to a later phase).

Phase 4 — CorsOrigin → Postgres

Add:
cors-origins.ts
(ecodrix_cors_origins table). Modify:
cors-origins.ts
(rewrite to use Drizzle + drop the Client.find website-derived origin block — replace with ecodrix_organizations.website query).
cors.routes.ts
— Drizzle CRUD. Delete:
cors-origin.model.ts
,
cors-origins.ts
(replaced inline). SQL: CREATE TABLE ecodrix_cors_origins .... Backfill: dump corsorigins collection → INSERT.

Phase 5 — AuditLog → ecodrix_audit_logs

Add columns to ecodrix_audit_logs (severity, user_agent) and a cleanup_audit_logs_90d pg_cron or partition-by-month strategy. Modify:
audit.service.ts
(Drizzle). Update IAuditLog consumers. Delete:
auditLog.ts
. Backfill: optional (90-day TTL data).

Phase 6 — ClientUsage → ecodrix_usage

Modify:
usage.service.ts
— change keys from (clientCode, type, month) to (orgId, service, feature, periodStart). Map type enum values to service/feature pairs. Delete:
usage.model.ts
. Backfill: per-org migration script that reads current month rows and upserts into ecodrix_usage.

Phase 7 — ClientServiceConfig → ecodrix_organizations.service_config (JSONB)

Add column: service_config jsonb default '{}' on ecodrix_organizations. Modify: 4 admin endpoints in
clients.routes.ts
. Delete:
config.ts
. Backfill: copy each clientservicconfigs doc into the matching org row.

Phase 8 — ClientDataSource → ecodrix*organizations.external_db*\*

Modify:
connectionManager.ts
,
connection.ts
(read URI from ecodrix_organizations instead of Mongo).
clients.routes.ts
admin CRUD. Delete:
dataSource.ts
. Backfill: copy clientdatasources into the existing external_db_uri/type columns (decrypt+re-encrypt unchanged via the same helper).

Phase 9 — ClientSecrets → ecodrix_org_secrets

Add:
secrets.ts
with ecodrix_org_secrets (one row per org; encrypted columns + JSONB for customSecrets and email_stats; ses_dns_records JSONB; preserve the existing IV-prefixed AES format). Modify: ~10 callsites (services/mail/{MailClient,EmailHealthService,EmailConfigService}, services/mail/providers/SesProvider, routes/erix/mail/ses-notification, routes/erix/whatsapp/{webhook,templates}, routes/erix/marketing,
google.routes
,
meet.sdk
,
health.routes
, lib/callbackSender). Move pre-save encryption to a tiny service helper. Delete:
secrets.ts
. SQL: CREATE TABLE ecodrix_org_secrets .... Backfill: dump → INSERT (values already encrypted, copy verbatim).

Phase 10 — ClientStorage + StorageEvent → Postgres

Add:
client-storage.ts
(ecodrix_client_storage, ecodrix_storage_folders, ecodrix_storage_events). Modify:
StorageService.ts
(full rewrite of CRUD),
clients.routes.ts
(provision + delete-cascade),
cron.ts
(storage-sync). Delete:
ClientStorage.ts
,
StorageEvent.ts
. Backfill: copy provisioned storage docs + last-30d events.

Phase 11 — Client → ecodrix_organizations (largest blast radius)

Add columns to ecodrix_organizations: whatsapp_connected_at, whatsapp_disconnected_at, plan_start_date, plan_end_date, billing_cycle, labels jsonb, tags text[]. Modify: ~10 callers —
clients.routes.ts
,
google.routes.ts
,
marketing.routes.ts
,
sdk.routes.ts
,
health.service.ts
,
portfolio.service.ts
,
crm.models.ts
,
cors-origins.ts
(already updated in Phase 4),
cron.ts
. Replace Mongoose Client imports with Drizzle queries against ecodrix_organizations. Delete:
client.ts
. Backfill: dual-write window (orgs already mostly mirrored), then one-shot reconcile by client_code.

Phase 12 — Blog → ecodrix_blogs

Add: ecodrix_blogs, ecodrix_blog_comments, ecodrix_blog_engagements (likes/views/shares as event rows). Modify:
blogs.routes.ts
and any public-facing blog endpoint. Delete:
blog.ts
. Backfill: full collection dump.

Phase 13 — Corporate Lead → ecodrix_corporate_leads

Add: ecodrix_corporate_leads (JSONB columns for followUps, notes, activity, attachments). Modify:
leads.routes.ts

- src/jobs/leads/{firstContact,followUp,followUpLimit,reminders,research,autoClose}Job.ts. Delete:
  leads.ts
  . Backfill: full collection dump.

After phase 13: zero Mongoose models registered on the platform services connection. The dbConnect("services") call itself can be removed and its bootstrap deleted.

═══════════════════════════════════════════════════════════════════ SECTION 6 — Open questions ═══════════════════════════════════════════════════════════════════

Blueprint + Staff fate: Are the agency-template (Blueprint) and white-label staff (Staff) features part of the live product, or shelf-ware? If shelf-ware, Phase 3 = pure deletes. If live, they need ecodrix*blueprints and a Staff-flavored variant of ecodrix_members.
Job model reachable callers:
queue.routes.ts
and
health.routes.ts
queue endpoints — are these still consumed by an admin UI, or has the API gateway's /admin/dlq/\* already replaced them? If replaced, delete the routes outright instead of swapping to erix-store.
Cache fallback policy: When ERIX_STORE_URL is unset (local dev?), is in-memory cache acceptable, or do we still want a persistent fallback? This decides whether Phase 2 also needs a small SQLite/PG cache fallback.
Corporate Lead separation: The platform Lead (in
leads.ts
) is the corporate sales pipeline for ECODrIx itself. Should it move to a dedicated ecodrix*\* table, or be folded into a single Lead table that the founders themselves access via the same Erix UI as a normal tenant? The latter would mean creating an internal "ECODrIx HQ" tenant org instead of a separate platform table.
ClientSecrets encryption migration: Keep the existing app-side AES-256 helper, or switch to pgcrypto/AWS KMS during the cutover? This changes Phase 9 — same-format copy is trivial; provider switch is a bigger lift but better audit story.
Tenant Mongo URI lookup performance: Today connectionManager caches ClientDataSource.findOne via cache.getOrSet (1h TTL). After Phase 8, the read becomes a Postgres query — is the same cache layer sufficient, or do we want a stronger guarantee (LISTEN/NOTIFY invalidation on URI change)?
Excellent — comprehensive read-only audit done. Before starting Phase 0 (the pure deletes), I need three answers because they rewrite the plan downstream. Let me ask once and then execute end-to-end:

The audit is done. 18 platform Mongo models inventoried, 13-phase execution plan ready. Where do you want me to start?

The audit found 5 models with zero callers (3 LAIE + 1 cache fallback + 1 deprecated Job) — those are pure deletes. Everything else needs migration with varying blast radius. Pick one entry point.
