# Release v3.0.0 — Postgres-first Platform Cutover Playbook

> Based on `.Architecture/PLATFORM_DATA_BOUNDARIES.md` phases 0–12 (already
> implemented in code) plus the new platform/auth/automation features in this
> release. This playbook moves them into production safely.
>
> **Scope of the migration:** platform metadata only (orgs, plans, billing,
> secrets, storage, cors, audit). Tenant CRM data (leads, conversations,
> messages, etc.) **stays where it is** — Mongo for freelance clients, Postgres
> for direct clients — routed through `ErixAdapter`. No CRM data is moved.

---

## Pre-conditions checklist

Before starting, confirm each of these. If any answer is "no" or "not sure",
stop and resolve it before going further.

- [ ] You have access to the Supabase Postgres console (or `psql` access via
      the connection string in `DATABASE_URL`).
- [ ] You have access to the production Mongo Atlas cluster (read access is
      enough — backfill scripts only read from Mongo).
- [ ] You have `gcloud` CLI authenticated against the project that owns
      `ecodrix-api` and `ecodrix-worker` Cloud Run services
      (`gcloud auth login` and `gcloud config set project <PROJECT_ID>`).
- [ ] You have a recent Atlas backup or snapshot (in case you need to roll
      back the platform metadata move).
- [ ] You know the current production Cloud Run revisions for both services
      (`gcloud run revisions list --service=ecodrix-api --region=us-central1`).
      Note them down — they're your rollback target.
- [ ] No deploy is in progress and there are no open PRs auto-merging into
      master.

---

## Step 1 — Prepare the release branch locally

```bash
# In ECOD/server
git checkout master
git pull
git checkout -b release/v3.0.0

# Stage everything currently in the working tree
git add -A

# Sanity-check what is going in
git status
git diff --cached --stat | tail -5

# Bump the version
# Edit package.json: "version": "2.0.1" -> "version": "3.0.0"

# Prepend the v3.0.0 entry to CHANGELOG.md (use the block I drafted earlier)

# Build + lint locally — this is what CI will run
pnpm install
pnpm run build
pnpm run lint
```

If `pnpm run build` fails, fix the errors before continuing. CI on the PR runs
the same command and will block the merge otherwise.

**Do not push yet.** The push triggers Cloud Build which deploys on green.

---

## Step 2 — Snapshot the production Postgres

Even though we are only adding tables and columns, take a logical backup
first. Supabase has a one-click backup; alternatively:

```bash
# From a machine that can reach the Supabase host
pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges \
  --file=ecodrix_pre_v3_$(date +%F).sql
```

Keep this file. Steps 3–4 are mostly additive but a backup is cheap insurance.

---

## Step 3 — Apply Postgres migrations

> **Update (June 1, 2026):** The Supabase database has been verified
> already-migrated. All 20 platform tables exist with the correct shape
> (run `pnpm tsx scripts/inspect-migration-state.ts` to re-verify).
>
> **Skip this step.** Migrations 0001 through 0014 + erix 0001 are already
> in place. Going to step 4.
>
> Original instructions kept below for reference if a future environment
> needs them.

Run these from your laptop (or any machine with `DATABASE_URL` set to the
production Supabase URL). Each command applies a single SQL file and is
idempotent enough to re-run safely if it fails halfway.

```bash
# Make sure DATABASE_URL points to PRODUCTION Supabase, not local
echo $DATABASE_URL  # double-check the host

pnpm run db:migrate:platform           # 0001_platform_pricing.sql
pnpm run db:migrate:completion         # 0002_platform_completion.sql
pnpm run db:migrate:email-verification # 0003_email_verification.sql
pnpm run db:migrate:cors-origins       # 0004_cors_origins.sql
pnpm run db:migrate:audit-extensions   # 0005_audit_log_extensions.sql
pnpm run db:migrate:service-config     # 0006_org_service_config.sql
pnpm run db:migrate:org-secrets        # 0007_org_secrets.sql
pnpm run db:migrate:cloud-storage      # 0008_cloud_storage.sql
pnpm run db:migrate:org-client-columns # 0009_org_client_columns.sql
pnpm run db:migrate:blogs              # 0010_blogs.sql
pnpm run db:migrate:corporate-leads    # 0011_corporate_leads.sql
pnpm run db:migrate:blueprints         # 0012_blueprints.sql
pnpm run db:migrate:agency-invoices    # 0013_agency_invoices.sql
pnpm run db:migrate:admin-staff        # 0014_admin_staff.sql
pnpm run db:migrate:erix               # erix/0001_erix_crm.sql
```

Then verify:

```bash
pnpm run db:validate:platform
pnpm run db:validate:schema
```

Both should exit cleanly. If `db:validate:schema` reports drift, stop and
investigate before moving to backfill.

---

## Step 4 — Backfill platform metadata from Mongo to Postgres

This is the part that copies live data from Mongo Atlas into the new Postgres
tables. The release ships with a one-shot backfill script that handles
phases 4 through 12 from `PLATFORM_DATA_BOUNDARIES.md`.

### 4.1 Dry run first

```bash
# Reads from MONGODB_URI, writes nothing. Reports what it WOULD do.
pnpm run db:backfill:platform-mongo
```

Read the output. It should list, per collection:

- Number of documents found in Mongo
- Number that would be inserted into Postgres
- Number that already exist in Postgres (skipped or merged)
- Any documents that look unusual or inconsistent

If anything looks wrong (zero documents found for a collection that should
have data, type mismatches, missing `clientCode`), stop and investigate.

### 4.2 Real run

```bash
pnpm run db:backfill:platform-mongo:execute
```

This writes to Postgres. It uses ON CONFLICT DO UPDATE so it's safe to re-run.

### 4.3 Resolve orphans and dedupe

```bash
pnpm run db:resolve:orphans            # link any tenant-without-org rows
pnpm run db:dedup:corporate-leads      # dry run
pnpm run db:dedup:corporate-leads:execute  # real run
```

### 4.4 End-to-end verification

```bash
pnpm run verify:e2e
pnpm run db:inspect:tenants            # spot-check: does each org look right?
pnpm run db:inspect:pricing            # spot-check: subscriptions attached?
pnpm run db:inspect:memberships        # spot-check: users -> members links?
```

`verify:e2e` is the most important one. If it fails, do not proceed to step 5.

---

## Step 5 — Stage Cloud Run environment variables

The new code reads new env vars (DATABASE_URL, ENCRYPTION_KEY, ERIX_STORE
config, Vertex AI config). Update both Cloud Run services so the next
revision has what it needs. Use Secret Manager for credentials, not plain
env vars.

```bash
# For each secret, create or update in Secret Manager:
echo -n "<value>" | gcloud secrets versions add DATABASE_URL --data-file=-
echo -n "<value>" | gcloud secrets versions add ENCRYPTION_KEY --data-file=-
echo -n "<value>" | gcloud secrets versions add ERIX_STORE_API_KEY --data-file=-
# ... repeat for every secret in .env.example that is not already in Secret Manager

# Wire the secrets to Cloud Run
gcloud run services update ecodrix-api \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=DATABASE_URL:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest,ERIX_STORE_API_KEY=ERIX_STORE_API_KEY:latest \
  --update-env-vars=ERIX_STORE_URL=https://erix.your-domain,GOOGLE_CLOUD_PROJECT=<project>,CLOUD_ML_REGION=us-central1

gcloud run services update ecodrix-worker \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=DATABASE_URL:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest,ERIX_STORE_API_KEY=ERIX_STORE_API_KEY:latest \
  --update-env-vars=ERIX_STORE_URL=https://erix.your-domain,GOOGLE_CLOUD_PROJECT=<project>,CLOUD_ML_REGION=us-central1,ENABLE_WORKERS=true
```

This update creates a new Cloud Run revision but routes 0% traffic to it
(unless you also pass `--no-traffic`, which is the default for env-only
updates on Cloud Run when source/image hasn't changed). Confirm with:

```bash
gcloud run services describe ecodrix-api --region=us-central1 --format="value(status.traffic)"
```

You should see 100% on the current revision.

---

## Step 6 — Push the branch and open a PR

```bash
# Stage updated package.json + CHANGELOG.md
git add package.json CHANGELOG.md
git commit -F COMMIT_MSG.txt   # use the commit message I drafted
git push -u origin release/v3.0.0

# Open the PR
gh pr create \
  --base master \
  --head release/v3.0.0 \
  --title "v3.0.0 — Postgres-first platform overhaul" \
  --body-file docs/RELEASE_v3.0.0_PLAYBOOK.md
```

CI runs `pnpm run build` and `pnpm run lint`. Wait for green.

**Do not merge yet.** First decide your traffic strategy.

---

## Step 7 — Pin traffic to the current revision (recommended)

This is the safety net. It tells Cloud Run "even when a new image is
deployed, keep all traffic on the current revision until I say otherwise".

```bash
# Replace <CURRENT_REV> with the revision name from the pre-conditions check
gcloud run services update-traffic ecodrix-api \
  --region=us-central1 \
  --to-revisions=<CURRENT_API_REV>=100

gcloud run services update-traffic ecodrix-worker \
  --region=us-central1 \
  --to-revisions=<CURRENT_WORKER_REV>=100
```

Now you can merge the PR without worrying. Cloud Build will build a new
image, deploy a new revision, but no traffic flows to it.

---

## Step 8 — Merge and let Cloud Build run

Once CI is green and traffic is pinned:

- Merge the PR (squash or merge commit, your choice)
- Watch Cloud Build: https://console.cloud.google.com/cloud-build/builds
- It builds `Dockerfile.api` and `Dockerfile.worker`, pushes to GCR, then
  deploys to Cloud Run

The build takes 8–15 minutes. When it completes, the new revisions exist
but are at 0% traffic.

```bash
# Confirm new revisions exist
gcloud run revisions list --service=ecodrix-api --region=us-central1 --limit=5
gcloud run revisions list --service=ecodrix-worker --region=us-central1 --limit=5
```

Note the new revision names (let's call them `<NEW_API_REV>` and
`<NEW_WORKER_REV>`).

---

## Step 9 — Smoke-test the new revision before sending traffic

Cloud Run gives every revision a unique URL. Test against the new revision
without any production traffic shifting yet.

```bash
# Get the new revision URL
gcloud run revisions describe <NEW_API_REV> \
  --region=us-central1 \
  --format="value(status.url)"
```

Hit the health endpoints with curl:

```bash
curl https://<NEW_API_REV>-<HASH>.run.app/health
curl https://<NEW_API_REV>-<HASH>.run.app/api/platform/health
```

Run the smoke tests against this URL if you have them set up:

```bash
BASE_URL=https://<NEW_API_REV>-<HASH>.run.app pnpm run test:bash
```

If anything fails, do not promote traffic. Investigate. Roll back is just
"don't shift traffic" — the old revision is still serving 100%.

---

## Step 10 — Gradual traffic shift

Start with 10%, watch logs and metrics for 10–15 minutes, then ramp.

```bash
gcloud run services update-traffic ecodrix-api \
  --region=us-central1 \
  --to-revisions=<NEW_API_REV>=10,<CURRENT_API_REV>=90

# Watch logs
gcloud logging tail "resource.labels.service_name=ecodrix-api" --format=json
```

What you're watching for:

- Error rate stays normal
- p95 latency stays normal
- No "table does not exist" or "column does not exist" errors
- No "TENANT_NOT_FOUND" spikes (would mean tenant resolver regressed)

If everything looks fine, ramp:

```bash
gcloud run services update-traffic ecodrix-api \
  --region=us-central1 \
  --to-revisions=<NEW_API_REV>=50,<CURRENT_API_REV>=50

# wait 15 min, watch metrics

gcloud run services update-traffic ecodrix-api \
  --region=us-central1 \
  --to-latest

# Same for the worker — workers don't take HTTP traffic in the same way,
# so flip them at 100% once the API is at 100%:
gcloud run services update-traffic ecodrix-worker \
  --region=us-central1 \
  --to-latest
```

### Rollback (if anything goes wrong)

```bash
gcloud run services update-traffic ecodrix-api \
  --region=us-central1 \
  --to-revisions=<CURRENT_API_REV>=100

gcloud run services update-traffic ecodrix-worker \
  --region=us-central1 \
  --to-revisions=<CURRENT_WORKER_REV>=100
```

Traffic shifts back in seconds. The old revision is still warm and ready.

---

## Step 11 — Tag the release

Once both services are at 100% on the new revision and have been stable for
at least an hour:

```bash
git checkout master
git pull
git tag -a v3.0.0 -m "v3.0.0 — Postgres-first platform overhaul"
git push origin v3.0.0
```

The `release.yml` GitHub workflow auto-creates a GitHub Release. Edit the
release notes to paste the v3.0.0 section from `CHANGELOG.md` as the body.

---

## Step 12 — Post-deploy cleanup (wait at least 7 days)

After a week of clean traffic on v3.0.0, the legacy Mongo platform
collections can be retired.

```bash
# Snapshot first — creates a JSON dump of the collections that will be dropped
pnpm run db:teardown:legacy-mongo:snapshot

# Then actually drop them
pnpm run db:teardown:legacy-mongo:execute
```

Tenant Mongo databases for freelance clients (`data_mode = "own"`) are NOT
touched. Only the platform-shared `services` database collections that are
now mirrored in Postgres.

---

## Operational notes

### Worker capacity

Current `cloudbuild.yaml` deploys `ecodrix-worker` with `concurrency=5` and
`max-instances=2`. The new release adds three workers (`workflow.worker`,
`ai-respond.worker`, `subscription-lifecycle.worker`) on top of the existing
ones. If you see worker queue backlogs after deploy, raise `--max-instances`
to 5 and re-run `gcloud run services update`.

### API URL changes

This release renames many routes (`/api/saas/...` -> `/api/erix/...`,
`/api/agency/...` is gone, etc.). Anyone calling the old URLs will get 404.
Confirm before deploy:

- The `saas/` Next.js frontend uses `@ecodrix/erix-api` — it picks up the
  new routes automatically when the SDK is updated. Bump
  `@ecodrix/erix-api` if the SDK was changed too.
- The `admin/` panel — same.
- Any third-party SDK consumers — coordinate with them, or keep route
  shims for a deprecation window.

### Migration ordering

The 14 platform migrations are NOT independent. Run them in numeric order
(`db:migrate:platform` first, `db:migrate:admin-staff` last). The `db:migrate:erix`
step runs after all 14 platform migrations.

### CI pipeline change for next release

`cloudbuild.yaml` does not run migrations. For future releases, add a
migration step before the deploy steps so this manual process becomes
automated. Tracked separately.

---

## Quick reference — what to do if X breaks

| Symptom                                     | What to check                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| 500s on `/api/auth/*`                       | New auth routes — check `ENCRYPTION_KEY` is set on Cloud Run           |
| 500s on `/api/platform/*`                   | Postgres connectivity — check `DATABASE_URL` and Supabase IP allowlist |
| `relation "ecodrix_..." does not exist`     | Migration didn't run — re-run step 3                                   |
| `column "..." does not exist`               | Older migration ran but newer one didn't — re-run step 3               |
| `TENANT_NOT_FOUND` for working clients      | Backfill incomplete — re-run step 4.2 with `:execute`                  |
| Workers not picking up jobs                 | `ENABLE_WORKERS=true` not set — re-check Cloud Run env vars            |
| WhatsApp inbound webhooks 404               | Route moved — frontend/Meta webhook URL needs update                   |
| Old API consumers (mobile app etc.) get 404 | Routes moved — coordinate or add shims                                 |

---

Last updated: 2026-06-01
