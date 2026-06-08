# LAIE — Pipeline Operations Runbook

> Operator + engineer reference for how a LAIE campaign actually runs end to end,
> the two-phase gate, the enrichment-module registry, and the opt-in queue
> migration. Pair with `laie-design-consolidated.md` (product boundary) and
> `laie-app-flow.md` (UX flow).

---

## 1. What a campaign does (the real pipeline)

A LAIE campaign is **not** "scrape a source". It is a lead engine:

```
Discover → Enrich → Find contact → Time it → Outreach-ready → Export to ERIX
```

- **Discover** — a self-built scraper (Google Maps / JustDial / Sulekha /
  IndiaMART / TradeIndia / Bing Places / Yelp) pulls raw businesses.
- **Enrich / contact / time / outreach** — per-lead modules (see §3) run GBP
  audits, email + WhatsApp discovery, competitor gap, lifecycle, seasonal
  timing, deep website research, demo page, and AI outreach scripts.
- **Export** — cleaned, scored, contactable leads are pushed to ERIX CRM.
  LAIE deliberately stops at "ready lead"; staging/pipeline is ERIX's job.

Server orchestrator: `server/src/jobs/laie/scraperWorker.ts → processJob`.

---

## 2. The two-phase gate (discover, then enrich)

A run does **not** auto-chain discovery into enrichment. It stops at
`discovered` and waits for the user.

| Phase          | Trigger                                                          | Status transitions                             |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 1 — Discovery  | `POST /api/laie/v1/flows/:id/run`                                | `pending → running → discovered` (or `failed`) |
| 2 — Enrichment | `POST /api/laie/v1/batches/:jobId/enrich` (only on `discovered`) | `discovered → enriching → done` (or `failed`)  |

Frontend: the campaign detail page (`saas .../campaigns/[id]/page.tsx`) shows a
**Start Enrichment** CTA when status is `discovered`. Before this was wired,
discovered leads were never enriched because nothing called `/enrich`.

`discovered` is a first-class status across the frontend now
(`CampaignStatus`, `LeadJobStatus`, the campaign-mapper, and the campaign
state machine: `searching → discovered → researching → complete`).

---

## 3. Enrichment-module registry (single source of truth)

`server/src/lib/laie/enrichmentModules.ts` declares every module once. The
worker's `enabled()` checks, the flow/run Zod validation, and the frontend
builder all derive from it — so the lists cannot drift.

- **User-selectable** (offered in the campaign builder, served via
  `GET /api/laie/v1/flows/modules`): `gbp_audit`, `wa_identity`,
  `competitor_gap`, `lifecycle`, `seasonal`, `email_finder`, `demo_page`,
  `research_agent`, `outreach_kit`.
- **Cron/job-level only** (NOT per-lead campaign toggles): `velocity` (M12),
  `ab_test` (M09).

Empty `enrichmentModules` = "run all" (backend default). Unknown module IDs are
**rejected** by validation (`isKnownModule`), not silently ignored.

Adding a module = one entry in `enrichmentModules.ts` + the matching worker
wiring in `runEnrichmentPipeline`. The builder picks it up automatically.

---

## 4. Execution model — inline vs queue

`processJob` historically ran **inline** on the API request thread: no retries,
no restart-safety, large campaigns tie up the process. There is now an opt-in
queue path.

### Flag

`env.LAIE_QUEUE_PIPELINE` (`"true"` / `"false"`, default `false`).

| Mode              | Behavior                                                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default) | `enqueueScrapeJob` runs `processJob` inline, non-blocking. Historical behavior, unchanged.                                                                                                                                                      |
| `true`            | `enqueueScrapeJob` pushes `{ jobId }` to the dedicated `laie-pipeline` erix-store queue (priority 7, 3 attempts) and returns. The registered `laie-pipeline` worker claims it and runs `processJob` with retry/backoff and bounded concurrency. |

Safety net: if the queue push fails (erix-store unreachable), it falls back to
inline so a run is never silently lost.

### Tunables (queue mode)

| Env                         | Default | Meaning                                                                         |
| --------------------------- | ------- | ------------------------------------------------------------------------------- |
| `LAIE_PIPELINE_POLL_MS`     | `5000`  | Worker poll interval (ms).                                                      |
| `LAIE_PIPELINE_CONCURRENCY` | `2`     | Max concurrent pipeline jobs. Keep low — each run spawns Chromium (~100–200MB). |

Worker registration: `server/src/lib/laie/index.ts → initializeLAIE()` (gated
on the flag, registered before the single `startWorkers()` call). Queue name
constant: `LAIE_PIPELINE_QUEUE = "laie-pipeline"` in `scraperWorker.ts`.

---

## 5. Staging rollout for queue mode

The queue path can only be verified against a live erix-store, so roll out
deliberately:

1. Deploy to staging with `LAIE_QUEUE_PIPELINE=true`.
2. Run a campaign. Confirm in logs:
   `laie-pipeline queue worker registered` and the job is pushed (not run inline).
3. Confirm the worker **claims and completes** the job (status reaches
   `discovered`, leads inserted, socket events stream as usual).
4. Force a server restart mid-run; confirm the job **resumes via retry** rather
   than being lost.
5. Verify enrichment phase 2 still works end to end.
6. Promote `LAIE_QUEUE_PIPELINE=true` to production.

If anything misbehaves, set the flag back to `false` — the inline path is
unchanged and remains the safe default.

---

## 6. Real-time signals (Socket.IO)

Emitted on the job room during a run; the live terminal + leads tab consume them.

| Event                | Payload                                      |
| -------------------- | -------------------------------------------- |
| `laie:job:created`   | `{ jobId, status }`                          |
| `laie:job:log`       | `{ jobId, level, message, meta, timestamp }` |
| `laie:lead:enriched` | `{ jobId, lead: {...} }`                     |
| `laie:job:complete`  | `{ jobId, processed, failed, status? }`      |
| `laie:job:cancelled` | `{ jobId }`                                  |

---

## 7. Key file map

| Concern                      | Path                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| Pipeline orchestrator        | `server/src/jobs/laie/scraperWorker.ts`                                    |
| Module registry              | `server/src/lib/laie/enrichmentModules.ts`                                 |
| Flow/run validation          | `server/src/validation/laie/flows.schema.ts`                               |
| Module catalog endpoint      | `server/src/routes/laie/flows.routes.ts` (`GET /flows/modules`)            |
| Enrich trigger endpoint      | `server/src/routes/laie/batches.routes.ts` (`POST /batches/:jobId/enrich`) |
| Worker registration          | `server/src/lib/laie/index.ts`                                             |
| Env flags                    | `server/src/lib/env.ts`                                                    |
| Campaign builder             | `saas/src/app/(product)/product/laie/campaigns/new/page.tsx`               |
| Campaign detail + enrich CTA | `saas/src/app/(product)/product/laie/campaigns/[id]/page.tsx`              |
| Lead detail intelligence     | `saas/src/app/(product)/product/laie/leads/[id]/page.tsx`                  |
| Pipeline preview             | `saas/src/components/laie/campaigns/CampaignPipelinePreview.tsx`           |
| API client                   | `saas/src/lib/laie/api/laie.ts`                                            |
