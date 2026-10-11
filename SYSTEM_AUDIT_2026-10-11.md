# ECODrIx — Code-Based System Audit (2026-10-11)

Source of truth: the code in `ECOD/server/src` and `ECOD/erix-store/src`, read module by module.
Older `*.md` files (incl. `global.md`) are stale where they disagree with this file.
Status words: **works** · **partial** · **stub** · **dead** · **broken** · **risk** (security / data).

> **Reconciled 2026-10-11 against a second code audit — read `PLATFORM_PROPOSAL.md` for the merged plan.**
>
> **Corrected (verified in code):**
>
> - **§4 Laie, "Google Places API".** `getGooglePlacesClient` is a Playwright scrape of `google.com/maps` (`lib/scrap/googleMapsScraper.ts:524`), not the Places API.
> - **§4 / §9 item 6, "committed `wrangler-account.json`".** The file is untracked and git-ignored. The real problem is that the whole `lib/scrap/` folder (23 entries) has never been committed, yet 17 tracked files import from it, so a clean clone can't build.
>
> **Missing from this audit's P0 (all verified in code):**
>
> - The platform core key is shipped in a client site's public JS.
> - Production DB and Mongo credentials are committed in server scripts.
> - Login sessions are trusted from the shared, unwalled Store cache, so sessions can be forged.
> - SaaS NextAuth `update()` lets any member rewrite their own role.
> - The public SDK carries `coreApiKey` and 35 admin resources.
> - Invoice PDFs sit at guessable public URLs.
> - A global request-filter regex can freeze the API.
> - A "downgrade" can grant any paid plan for free, and subscription verify can be replayed.
> - The checkout OTP lets anyone pump SMS.
> - Inbound WhatsApp messages are lost on a DB error.
> - The SaaS console calls dead paths for LAIE, Flow and the inbox.

---

## 0. What the product is

ECODrIx is a **Business OS for small businesses** (India-first: WhatsApp, Razorpay, GST).
One tenant (an "org") gets:

| # | Module | One line | Path |
|---|---|---|---|
| 1 | **Platform** | Control plane: identity, orgs, plans, billing, credits, keys, AI gateway, inbox, notifications, admin console | `modules/platform` |
| 2 | **ERIX** | Business records: contacts, pipelines, projects, proposals, invoices, checkout, bookings, forms, portal | `modules/product/erix` |
| 3 | **Flow** | n8n-style automation engine; the only "when X happens do Y" brain; also the action bus | `modules/product/flow` |
| 4 | **Laie** | Lead intelligence: discover → enrich → validate → score → pain points → outreach kit → export | `modules/product/laie` |
| 5 | **Connect** | Every third-party integration: WhatsApp, IG, FB, Telegram, email, payments, Google Meet, webhooks | `modules/infra/connect` |
| 6 | **Storage** | Tenant files/media on Cloudflare R2 (Cloudinary/ImageKit-like, early) | `modules/infra/storage` (+ `editor`) |
| 7 | **Store** | `erix-store` sidecar: Redis-like KV, cache, queues, pub/sub, locks, rate limits | `ECOD/erix-store` + `infrastructure/{erix,queue,cache,lock}` |

### The money journey (what a customer actually buys)

```
Laie finds businesses ──export──▶ ERIX contact ──trigger──▶ Flow outreach ──action──▶ Connect (WhatsApp/email)
      ▲                                                                                     │
      │                                                             customer replies (webhook)
      │                                                                                     ▼
 Platform: plan, credits, keys, AI         Flow: AI reply / handoff ◀── whatsapp.incoming trigger
                                                   │
                                     booking (ERIX appointment + Connect Meet)
                                                   ▼
                     proposal ──accept──▶ invoice ──payment link (Connect)──▶ payment webhook
                                                   ▼
                          invoice.paid / payment.captured ──▶ Flow (thank-you, project, review)
                                                   ▼
                              ERIX project + client portal (docs, e-sign, messages)
```

Hop status today (see §9 for the fix list):

| Hop | Status | Why |
|---|---|---|
| Laie discover → enrich → score → kit | works | Gemini needed for pain points / kit |
| Laie → ERIX export | works | `POST /laie/import/crm` → `erix.lead.bulkUpsert` |
| ERIX `lead.created` → Flow | works | `publishTrigger` |
| ERIX stage move → Flow | **broken** | `PATCH /crm/leads/:id/move` publishes nothing; only `/convert` publishes `deal_won/lost` |
| Flow → Connect send | works | `connect.*` actions with receipts |
| Inbound WhatsApp → inbox + Flow | works | Meta webhook → `whatsapp.incoming` |
| Flow AI reply | works | needs AI agent enabled + paid plan |
| Multi-day drips / follow-ups | **broken** | Flow run state TTL 24h; delays > 24h silently die |
| "Stop on reply" | **stub** | `reply_pause` only writes a note |
| Booking → Meet → Flow | partial | `meeting.created` published, `appointment.booked` never |
| Proposal → invoice | works | no trigger published |
| Invoice → payment → Flow | works | `invoice.paid` + `payment.captured` published, not declared in manifests |
| Project → portal | works | invite email decided inside ERIX |
| Review request | works | via `flow.routine.review_request` |


---

## 1. Platform — control plane

**Mount:** `/v1/api/platform` (`routes/v1/platform/index.ts`).
- Public: `/auth`, `/public` (waitlist, track), `/webhooks/razorpay/subscriptions`, `/billing/plans/public`, `/external/inbox`, `/account`.
- Tenant (`authenticate({scope:"platform"})` + `sdk()`): `/users`, `/tenants` (admin+), `/billing` (owner only), `/inbox`, `/support`, `/ai` (`access.ai()`).
- Admin: `/admin` behind **one shared `x-core-api-key`**, ~40 routers (clients, revenue, payments, credits, flags, monitors for Laie/Flow/WhatsApp/email, corporate leads CRM, agency invoices, blogs …).

**Public surface:** `createPlatformSDK` / `req.platform` → `inbox, auth, tenants, billing, admin, notifications, email, ai, waitlist, onboarding, persona, products, support, audit` + lazy `account, track, activation, tenantDeletion, apiKeys, console`. Root also exports `PlatformInboxSDK`, `hashPassword/verifyPassword/isValidEmail`, `runToolLoop`.

**Owns:** identity & security (orgs, members, sessions, invitations, api-keys, cors), billing (plans, subscriptions, credits, usage, revenue snapshots, processed events, agency invoices), onboarding & persona, AI copilot sessions, notifications, support, flags, inbox (`connect_conversations/messages` live in the platform schema), growth (waitlist, visitor events, corporate leads, blogs).

**Background:** `workers/cron.ts` (node-cron: corporate-lead jobs, ERIX template sync 02:00, agency overdue 01:00, ERIX recurring invoices 06:00, storage sync 20:30, tenant purge 03:00, revenue snapshot, credit auto-topup 6h), subscription-lifecycle, tenant-purge queue, 5 persona/onboarding queues.

**AI:** `ai-gateway.ts` (plan × purpose → OpenAI/Anthropic/Gemini model) · `runToolLoop` (shared agent loop, confirm gate) · Copilot (tenant read tools across ERIX/Connect/Storage/Laie; confirm-gated write tools; admin tools) · Lead assistant · Persona learning pipeline.

**Journeys:** signup → org + free subscription + master key · invite → accept · Razorpay subscribe → webhook → entitlements → `access.feature/quota/ai` · credits topup / `access.quota` overage → wallet · delete → 30-day purge.

**Findings**

| Sev | Finding | Where |
|---|---|---|
| risk | Copilot admin tools unreachable and tenant write tools have no `minRole`: `req.userRole` is never set | `routes/workspace/ai/copilot.routes.ts:91` |
| risk | Admin = one shared core key; no per-staff RBAC on refund / impersonate / suspend / topup | `routes/v1/platform/index.ts` `/admin` |
| risk | AI gateway only records `ai_tokens`; credits are never charged for LLM calls. `access.ai()` fails open | `services/ai-gateway.ts:441`, `middleware/access.ts` |
| broken | Doubled path `/billing/subscriptions/subscriptions/*`; two cancel/plan APIs (checkout vs subscriptions) | `routes/workspace/billing/*` |
| partial | `/billing/*` is owner-only, so admins/agents can't read entitlements or balance | platform index |
| dead | Duplicate admin mounts (`/admin/tenants` ×2, invoices ×2) | `routes/v1/platform/admin/index.ts` |
| debt | Platform cron schedules ERIX jobs; `stopPlatformWorkers` stops only one cron | `workers/cron.ts`, `workers/runtime.ts` |
| debt | ~20 peers import Platform internals; Platform imports Laie internals (proxyKit, browser pool) | module-graph baseline |
| typo | `platform.onboarding-sessions.schema..ts` | `schema/platform` |

**Missing for a complete control plane:** admin RBAC + step-up + enforced audit; one meter (AI, sends, storage, Laie runs) against the credit wallet with spend caps; per-plan AI budget, fail-closed; one billing API; tenant lifecycle state machine (trial → active → past_due → suspended → deleted); tenant-facing event webhooks (plan, usage, key events); SSO/SCIM/MFA policy; one scheduler.


---

## 2. ERIX — business records

**Mount:** `/v1/api/product/erix` (`routes/v1/product/erix/index.ts`).
- `/crm/*` (auth `scope:"crm"` + `withSDK(io)`): leads, merge, profile, pipelines, projects/tasks, payments capture, activities/notes, analytics, revenue analytics, niche resources, document checklists, scoring, appointments/event types, forms, referrals, feedback, memberships, custom fields, CRM views, field configs.
- `/commerce/*`: invoices (+ export, settings), checkout (product read is public), proposals, project documents.
- Public: `/portal` (magic token + portal JWT), `/public` (forms, contact form, slots, booking, event types — scoped by clientCode).
- Also mounted here but owned elsewhere: `/ai` (Platform assistant, ponytail to drop), `/events` (Flow trigger ingress).

**Public surface:** `erixFlowManifest`, `crmFlowController` (find/create/update contact, tags, stage, activity, project, slots, booking, routine outbox composers), `createSDK`, `ErixCrmSource` (Connect CRM port), `peers.sdk.ts` (ERIX's only door to Flow / Platform / Storage).

**Owns (`schema/erix`):** leads, activities, notes, custom fields, views, segments, scoring · pipelines/stages · projects, tasks, task templates, project docs/clients/messages · proposals, invoices, invoice settings · checkout products/coupons/sessions/orders · appointment configs, event types, appointments · forms + submissions, feedback, referrals, memberships, AI conversations · `erix_event_logs`, `erix_callback_logs` (**no code uses them**).

**Background:** `crm` queue (`crm.score_refresh`; `crm.segment_refresh` never enqueued). `recurringInvoiceJob`, `templateSyncJob` scheduled by Platform's cron.

**Flow manifest:**
- Triggers declared: `lead.created`, `lead.tag_added/removed`, `lead.score_refreshed`, `stage.changed`, `lead.deal_won/lost`, `form.submitted`, `meeting.booked`, `appointment.booked`.
- Actions: `crm.lead.find/create/update/tag/move_stage`, `crm.activity.log`, `crm.appointment.slots/book`, `crm.project.create`.

**Findings**

| Sev | Finding | Where |
|---|---|---|
| broken | Kanban stage move publishes no event; won-stage move auto-creates a project but no `deal_won`. `/convert` does the opposite (event, no project) | `routes/crm/lead.routes.ts:711-835` |
| broken | Declared but never published: `stage.changed`, `form.submitted`, `appointment.booked` | `erix.flow.ts` |
| gap | Published but not declared: `payment.captured`, `meeting.created/rescheduled`, `invoice.paid` (Connect settler) | `crmHooks.ts`, `meeting.service.ts` |
| stub | `moveLead` helper returns null; `summarizeConversation` always "no history" | `lead.service.ts:670`, `crm-flow.controller.ts` |
| role | ERIX still decides sends: invoice email (`systemEmail` direct), checkout OTP, order WhatsApp, proposal delivery, portal invite, form notify, meeting create | §7 of sub-audit; e.g. `invoice.routes.ts:498` |
| dead | `crmHooks.onWhatsApp*`, `onEmailSent`; `mountErixRoutes` empty router; unused tables above | `services/crm/crmHooks.ts`, `routes/index.ts` |
| dup | Appointments (`erix_appointments`) vs meetings (`connect_meetings`) with a sync layer; three "fields" APIs; two analytics routers | — |
| debt | Many services skip the ErixAdapter and query tables directly; seed packs use old trigger ids (`deal_created`, `stage_entered`) | `services/crm/*`, niche packs |

**Missing:** one domain-event publisher with a declared event per business fact (stage.changed, deal_won/lost, form.submitted, appointment.booked, proposal.sent/accepted, invoice.created/paid, project.created); one conversion path; coupon/product admin CRUD; payments ledger (partials, refunds); explicit proposal → invoice → project links; all sends moved out (ERIX emits events only).


---

## 3. Flow — automation engine

**Mount:** `/v1/api/product/flow` (`scope:"flow"`): catalog, workflows CRUD, run, run-segment, launches, runs (get, records, logs, retry, approve), templates, `/config/triggers` (custom triggers), `/config/node-types`, `/config/custom-nodes`, marketplace. Public ingress: `POST /v1/api/product/erix/events/trigger` (`externalAuth("flow:events")` + runs quota).

**Engine:** `TriggerIngress` (normalise, aliases) → `dispatchEvent` (claim once, match active `crm_contact` flows by `triggerConfig.event`, 3 starts/contact/hour cap, meter once) → `startRun` (`flow_runs` row) → `flowEngine` (run state in erix-store, TTL 24h) → queue `workflow-executions` (1 job at a time) → node executor → advance (parallel fan-out). Engine-native: `delay`, `before_event`, `condition` (single field/op), `approval`, `wait_for_event`. Scheduled sweep hourly (segment or org scope). Segment launch paced 200/min with quiet hours.

**Nodes:** 33 internal types (Laie sources/pipeline, AI summary/painpoints/personalize, crm_upsert/activity, store_artifact, channel nodes, `connect_action`, `module_action`, `ai_agent`, control nodes) + `module_action` over manifests: Connect 16 actions, ERIX 9, Laie 12, Flow 7 (`flow.ai.reply`, `flow.ai.handoff`, 5 routines). Custom nodes: `webhook`, `transform` + marketplace. Custom triggers (`flow_custom_triggers`).

**AI:** `run-agent.ts` over Platform `runToolLoop` (tool allowlist from catalog, confirm tools return `pending`, injection guard). `ai_agent` node; `flow.ai.reply` (send / suggest / org mode, confidence threshold, 10 auto-sends/conversation/hour, handoff pause).

**Templates:** 21 official seeds (journeys, notifications, campaigns, recurring routines, AI auto-reply, review request) + 7 niche packs × 5 flows (healthcare, education, real estate, freelancer, d2c, agency, professional services).

**Findings**

| Sev | Finding | Where |
|---|---|---|
| **risk** | Custom node registry is global by `nodeType`: two orgs with `custom:x` collide and org B can run org A's webhook config | `nodes/customNodes.ts:205` |
| **broken** | Run/node state TTL 24h: any `delay`/approval/wait > 24h finds no state and the run hangs `running` forever. Breaks Drip (2d/3d), Smart Follow-Up (4d/7d), Review waits | `engine/flowEngine.ts:271`, `runService.ts`, `reviewService.ts` |
| broken | Custom nodes are not re-registered on boot / on other replicas → `no_executor_registered` after restart | `customNodes.ts` |
| broken | Node crash leaves state `running`; redelivery skips; no stale-run reaper. Exceptions are swallowed, so queue retries never apply | `dispatchFlowNode` |
| stub | `reply_pause` only appends a note; `wait_for_event` never resumes (`resumeWaitForEvent` has no caller) | `nodes/outreachNodes.ts:814`, `triggers/waitForEvent.ts` |
| broken | Parallel branches share one `runState.record` → last write wins | `advance` |
| gap | `webhook` trigger type has no inbound URL; no cancel-run route (`cancelRun` unused); no run list per flow; no delete/archive | routes |
| dup | Legacy `ActionExecutor` (1,069 lines) still backs channel nodes next to `connect.*` actions; `flowDefinitionService.ts` vs `flow-definition.service.ts`; legacy `flow_workflows*` tables | `engine/actions/action-executor.ts` |
| gap | `ai_agent` never passes `confirm`, so side-effecting tools have no human gate; agent `pending` is dropped | `ai/run-agent.ts` |

**Missing vs n8n:** durable run state in Postgres (not KV), graph versioning (graph is reloaded live mid-run), expressions beyond `{{path}}`, AND/OR/switch/merge, loops/iterators, error workflows + per-node retry policy, credentials for custom webhooks, trigger payload filters, dry-run / pinned data, tenant run history + cancel + replay-with-edit, AI flow builder (prompt → graph).


---

## 4. Laie — lead intelligence

**Mount:** `/v1/api/product/laie/*` (tenant, `scope:"laie"` + `resolveTenant` + `requireLaieEnabled`, **no plan/quota/rate gates in beta**) and `/v1/api/product/laie/sdk/*` (Apify-style gateway: actors, runs, datasets, schedules, webhooks; `planRateLimit` + `requireScope`). Legacy alias `/api/erix/v1`.

**Pipeline (code):**

| Stage | Implementation | Status |
|---|---|---|
| Discover | Google Places API, Google CSE → DDG, JustDial / Sulekha / IndiaMART / TradeIndia browser scrapers (robots-gated), OSM, `all` merge, CSV | works |
| Dedupe + vault | `insertDedupedLeads` → `laie_leads` + `laie_business_vault` | works |
| Website find | waterfall (DDG/Bing) | works |
| Enrich (parallel) | GBP audit, WhatsApp identity, competitor gap, lifecycle, seasonal, demo page, email, socials, GSTIN | works (review mining disabled) |
| Email validate | MX record only; pattern guesses confidence 30 | **partial** — no SMTP/catch-all |
| Phone validate | Meta contacts check, no-op without token | **fragile** |
| Pain points / gaps | Gemini research agent + SEO auditor + competitor gap | works (needs Gemini) |
| Outreach kit | Gemini EN + Telugu message, subject, pitch angle | works; persona path never used |
| Score | `compositeScoring` → tier; `laie.lead.qualified` on first hot | works |
| Export | ERIX `bulkUpsert` (idempotent), CSV/JSON 8 fixed columns, Flow `laie.lead.export` | works |

Phase 1 (discover) stops at `discovered`; Phase 2 (enrich) is started by the user (`POST /batches/:jobId/enrich`).

**Background:** queue `laie-scrapers` (actor runtime), `laie-pipeline` (only if `LAIE_QUEUE_PIPELINE`), `laieCron` (digest webhook, stale decay, hot-not-contacted signal, watchdog, relay sweeps, TTL), `productCron` (seasonal/lifecycle re-runs), relay monitor.

**Flow manifest:** triggers `laie.job.completed`, `laie.lead.qualified`; 12 actions (`leads.discover`, `lead.get/audit_website/enrich/score/export/mark_exported/find_email/check_whatsapp/research/outreach_kit`, `contact.suppress`).

**Findings**

| Sev | Finding | Where |
|---|---|---|
| **risk** | Committed relay infra under `lib/scrap/` incl. `node_modules/.bin` and `.cache/wrangler/wrangler-account.json` — check for account data before any push | `lib/scrap/cloudflare-worker`, `proxyKit/workers` |
| risk | No rate limit / quota on tenant routes during beta | `routes/laie.router.ts` |
| broken | Public demo page posts views to an authenticated route → tracking never lands | `leads.routes.ts:449`, `demoPageWorker.ts` |
| broken | `laie.leads.discover` runs discovery only, never enrichment | `laie.flow.ts` |
| dead | `leadMonitorWorker` (unscheduled), `linkedInEnricher-v2`, bing/yelp/search scrapers not dispatched, `actor-runner.ts` (would double-consume `laie-scrapers`), empty `mountLaieRoutes` | `workers/`, `lib/scrap/` |
| dup | 3 proxy stacks, 2 browser pools, 2 session managers, 2 crawlers, 2 researchers, 2 pipelines + 2 scorers (worker vs `pipeline/*` agents), 2 outreach kits, tenant vs gateway schedules/webhooks/datasets on the same tables | `lib/*`, `services/*` |
| role | Still outside "lead-gen only": notes/contacted actions, hot-not-contacted nudges, warm→cold decay, view-based escalation, `abTestId/abVariant` columns | `leadActions.routes.ts`, `laieCron.ts`, outreach kit schema |

**Missing vs Apify/Clay/Apollo/Hunter:** SMTP verification + catch-all + bounce score; named people (decision makers, titles, LinkedIn) in the main pipeline; firmographics, tech stack, intent/hiring signals; user-defined enrichment columns with credit waterfalls; field-picker exports (XLSX, scheduled); dedupe against existing CRM before export; real phone line-type validation.


---

## 5. Connect — integrations

**Mount:** `/v1/api/infra/connect` (`scope:"connect"`). Public, each verified: email track/unsubscribe (HMAC token), SES (SNS signature), payments `/:orgId/webhook` (tenant secret HMAC), Meta webhooks (`X-Hub-Signature-256`, fail-closed in prod), Telegram (per-bot secret), webchat (rate-limited), internal voice (runtime credential + call token). Tenant: providers/connections, grants, email (config, campaigns report, templates, send), `/send/*`, Instagram (~30 routes), voice, advanced (logs, analytics, usage, OAuth clients), Google events, WhatsApp templates, Meet.

**Providers:**

| Provider | Inbound → trigger | Outbound | Status |
|---|---|---|---|
| WhatsApp | Meta → inbox + `whatsapp.incoming` | text, template | works (2k-line service) |
| Instagram | Meta → inbox + `instagram_dm/comment` | DM, comment reply, publish | works |
| Facebook | Meta → `facebook_incoming` | text | thin |
| Telegram | webhook → `telegram.incoming` (no inbox write) | message | works |
| Email | SES bounce/complaint → suppression; track/unsub → ERIX engagement port | send, template, workspace, system | SES works; **Gmail OAuth broken** |
| Payments | webhook → `invoice.paid` (settler) + `payment.captured/failed/refunded` | payment link, checkout order | works (Stripe failure/refund unmapped) |
| Google | OAuth | Meet create/update/delete/busy | works |
| Webchat, Voice | widget / runtime | — | works |

**Core contract:** `connectSDK.forScope(scope).actions.execute()` → grant check (crm/flow/laie) → `connect_action_runs` claim (exactly-once by idempotency key) → driver → receipt.

**Findings**

| Sev | Finding | Where |
|---|---|---|
| **risk** | Disconnect keeps credentials (except Google): inbound still routes and sends still work | `connections/connection.controller.ts` `disconnect` |
| risk | Unsubscribe performs on GET → link scanners unsubscribe people | `email/routes/unsubscribe.routes.ts` |
| broken | A failed receipt is stored under the idempotency key and replayed forever → Flow retry never re-sends | `actions/action-run.service.ts` `resolveExisting` |
| broken | `meet.*`, `payments.*`, `webhook.send` bypass `actions.execute` (no receipt, no idempotency, no grant) | `connect.flow.ts` |
| broken | Legacy Flow `ActionExecutor` sends with `source:"connect"` → skips grant check | `flow/engine/actions/action-executor.ts` |
| broken | Gmail provider has no send branch; `connect()` never probes credentials | `providerRegistry.ts:130`, `mail.client.ts` |
| broken | Trigger publish failures swallowed while the webhook claim is marked done → lost events | `triggers/trigger.publisher.ts`, payments `emitCrmEvent` |
| partial | Metering inconsistent across channels (some meter on failure, some never) | `sender/sender.controller.ts` |
| dead | `connect_batches`, `connect_message_routes`, usage rollup (no cron), delivery tracking (no writer), webhook logs (replay only), OAuth token validation (no caller), `credentialStore.ts` shim | `services/*`, `core.schema.ts` |
| dup | Three WhatsApp send paths (`/send`, `actions.execute`, `sendWhatsAppTemplateToLead`); email tokens vs Platform keys | — |
| gap | Inbound triggers not in manifest: `instagram_dm/comment`, `facebook_incoming`, `voice.*`, `invoice.paid`; email events emit no triggers | `connect.flow.ts` |

**Missing vs Zapier/Nango:** declarative connector model; generic OAuth broker + token refresh + health scheduler; durable outbound queue with backoff + DLQ; per-provider rate limits; polling triggers; typed trigger payload registry; multiple accounts per provider; sandbox mode.


---

## 6. Storage — tenant files & media

One R2 bucket, keys `tenants/{CLIENTCODE}/{folder}/…` (platform: `ecodrix/self/…`). `StorageSDK` (upload, putDocument, list, delete, signed upload/download, readObject, usage, provision, WhatsApp/lead/profile/website helpers). Media: sharp → 1280px MozJPEG; ffmpeg video/audio **inline in the request**. Transforms = Cloudflare `/cdn-cgi/image` URLs only. `editor` = plan capabilities + text AI assist (not media editing).

**Mount:** `/v1/api/infra/storage` (`scope:"storage"`): `/files/*` (usage, folders, upload-url, confirm-upload, list, download-url, delete, ai/describe), `/media` (multer 100MB×50), `/storage/self` (platform admin). Callers: WhatsApp media, proposal/invoice PDFs, portal, project docs, admin agency invoices, nightly cron.

| Sev | Finding | Where |
|---|---|---|
| **risk** | `assertKeyScope` uses `startsWith("tenants/ACME")` with no trailing `/` → tenant ACME can presign/delete `tenants/ACME2/…` | `StorageService.ts:~73` |
| **risk** | List/upload return public CDN URLs for every object → "private" files are public | `r2.client.ts` `list` |
| **broken** | `/media` adds ≥ 1 "GB" to the storageGB counter per request, never decremented → tenants hit `QUOTA_EXCEEDED` after N uploads | `routes/media.routes.ts` `sizeFromHeaders` |
| broken | `ListObjectsV2` not paginated → usage/listing wrong past 1,000 objects | `r2.client.ts` |
| broken | `StorageSDK` upper-cases clientCode, `StorageService` doesn't → mismatch for lowercase codes | `sdk/storage.sdk.ts` |
| broken | Double compression; GIF → static JPEG; SVG rasterised; unknown types saved `.bin`; filenames not sanitised (overwrite / nesting); `confirm-upload` trusts client size | media + service |
| dup | Three quota systems (row `quotaBytes`, `access.storage()`, `access.quota` on `/media`); duplicate `compressIfNeeded`; dead `media.service` helpers | — |

**Missing vs Cloudinary/ImageKit:** asset table (ids, metadata, tags, search, versions); named/signed server transforms; HLS video; multipart/resumable upload; real private delivery + per-asset ACL; content-hash dedupe; upload webhooks; bandwidth analytics.

---

## 7. Store — `erix-store` (Redis-like sidecar)

Single-process in-memory server (port 6399, HTTP + msgpack WS): strings, hashes, lists, sets, sorted sets, TTL, LRU memory policy; `CacheService` (tags, TTL), `JobQueueV2` (priority heap, delay, retries with backoff, DLQ, heartbeat reaper, WAL), `/q` simple queue, distributed locks (mutex/RW/semaphore), pub/sub (+SSE), rate limiter, semantic cache, usage meter, MULTI/EXEC, Postgres snapshot every 5 min (+ optional AOF). Client `@ecodrix/erix-client` 1.4.0 (no lock API), worker `@ecodrix/erix-worker`. Server queues: `crm`, `workflow-executions`, `laie-scrapers`, `laie-pipeline`, `tenant-purge`, 5 persona/onboarding queues. `modules/infra/store` is an empty placeholder.

| Sev | Finding | Where |
|---|---|---|
| **risk** | No tenant isolation on queueV2, cache, locks, semantic: routes never read `req.tenantId`; `clientCode` comes from the body → any external key can claim/complete other tenants' jobs or read `/cache/_keys` | `erix-store/src/server/routes/*` |
| **broken** | Cache routes `/:key` declared first → `/_stats`, `/_keys`, `/mget`, `/mset`, `/pattern/invalidate`, `/_all` are treated as keys | `cache.routes.ts` |
| broken | Priority inverted: server maps realtime=1/bulk=9, store runs 9 first | `infrastructure/queue/QueueService.ts` |
| broken | `fail()` on retry doesn't release the tenant's active slot → after 50 retries a tenant starves | `JobQueueV2.ts` |
| broken | Worker dying before first heartbeat → job active forever; DLQ retry can duplicate | `JobQueueV2.ts` |
| broken | Pattern invalidation is a no-op; every generic `cacheSet` tagged `laie` → one Laie invalidation wipes the platform cache | `infrastructure/cache/erix-cache.ts` |
| dead | Server-side `erix-lock.ts` (non-atomic, no callers), `DailyCounter`, session store, `QueueService` DLQ claims | `infrastructure/*` |
| risk | Up to 5 min data loss without AOF; one JSON snapshot row for up to 512MB | snapshot service |

**Missing vs Redis/BullMQ:** tenant namespaces + per-key ACL; replication; blocking claims; repeatable/cron jobs; job-id dedupe; pause/cancel/remove; per-queue concurrency + rate limits; parent/child flows; streams; lock API in the client.


---

## 8. Agents — one per module, one for automation

The primitives already exist; no new framework is needed.

- **Loop:** Platform `runToolLoop` (step cap, confirm gate) — used by Copilot and Flow `run-agent`.
- **Tools:** every module manifest action is already a typed, tenant-scoped, idempotent tool (`defineFlowAction` with zod input). `run-agent` already turns catalog actions into an allowlisted toolset.
- **Gateway:** `ai-gateway` picks the model by plan × purpose.

Target shape (each agent = a toolset filter + a system prompt + a role gate, on the same loop):

| Agent | Tools (from) | Writes | Who can use |
|---|---|---|---|
| Platform agent ("Copilot admin") | Platform SDK: billing, credits, keys, members, usage | confirm-gated, owner/admin only | org owner/admin; staff via admin RBAC |
| ERIX agent ("CRM assistant") | `crm.*` actions + ERIX read SDK | confirm-gated per role | agent role+ |
| Flow agent ("Automation builder") | Flow definitions SDK + catalog list | draft flows only; activation needs confirm | admin+ |
| Laie agent ("Lead researcher") | `laie.*` actions + lead-insights | runs jobs (credits), never sends | agent role+ |
| Connect agent ("Channel ops") | connections status, templates, test sends | confirm-gated | admin+ |
| Storage agent | list/describe/organise files | delete confirm-gated | agent role+ |
| **Automation agent** (`ai_agent` node / `flow.ai.reply`) | any catalog action allowed by the flow author | runs inside a Flow run; `confirm` tools must pause the run (approval) | the flow's owner grants |

Rules each agent must keep: tenant scope from the auth context (never from the prompt); per-tool `minRole`; side-effect tools always confirm (interactive) or approval-node (automation); every tool call metered against credits and written to the run/audit log; the Copilot is the single chat UI that routes to these toolsets (no second chat).

Blockers before agents are safe: §1 `userRole` bug + `minRole`; §3 `ai_agent` confirm → approval pause; §1 AI credit metering; §7 Store isolation.

---

## 9. Fix plan (ordered)

**P0 — security & data (do first, small diffs)**
1. Storage `assertKeyScope` → require `prefix + "/"`. Private files → signed URLs only.
2. Flow custom-node registry keyed by `orgId:nodeType`; register on boot and on miss.
3. Store: scope queue/cache/lock routes by `req.tenantId`; fix cache route order; fix slot leak; fix priority mapping.
4. Copilot: set `req.userRole` in auth; add `minRole` on write tools.
5. Connect: disconnect deletes credentials + subjects; unsubscribe GET shows a confirm page, POST performs.
6. Laie: check the committed `wrangler-account.json` / relay artefacts before any push (human).

**P1 — broken journeys**
7. Flow run state durable in Postgres (or TTL = longest delay + margin); stale-run reaper; let the queue retry thrown node errors.
8. Implement `reply_pause` + `resumeWaitForEvent` from `whatsapp.incoming` (stop-on-reply).
9. ERIX domain events: publish `stage.changed` + `deal_won/lost` from the stage move (one conversion path), `form.submitted`, `appointment.booked`, `proposal.*`, `invoice.*`, `project.created`; declare them in manifests (incl. Connect's inbound).
10. Connect: failed receipts retryable; route `meet/payments/webhook.send` through `actions.execute`; don't mark webhook claims done when the Flow publish failed.
11. Storage quota: one meter in bytes, decrement on delete; paginate `list`.

**P2 — consolidation (ponytail: delete duplicates)**
12. Remove legacy `ActionExecutor` channel paths → `connect.*` actions only.
13. ERIX stops deciding sends (invoice/proposal/portal/OTP/order) → emits events; Flow templates send.
14. Laie: one proxy stack, one browser pool, one pipeline + scorer; drop dead workers/scrapers; move CRM-ish actions to ERIX.
15. Platform: one billing API; move ERIX crons to ERIX/Flow scheduled flows; admin RBAC.
16. Drop migrations (human applies): `erix_event_logs`, `erix_callback_logs`, `connect_batches`, `connect_message_routes`, rename `erix_custom_event_defs` → `flow_custom_triggers`.
17. Module graph baseline → 0 (currently 125 edges).

**P3 — product depth** (after P0–P2): Flow versioning + expressions + loops + error workflows; Laie SMTP verify + people data; Connect OAuth broker + durable outbound queue; Storage asset table + transforms; agents per §8; then SDK + frontend alignment.
