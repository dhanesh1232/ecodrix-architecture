# GCloud Infrastructure Audit Report

**Project:** `project-e1433182-358c-4bdd-a34`  
**Date:** 2026-05-24  
**Issue:** Cost spike from ~₹140/day to ~₹1000/day starting May 22

---

## Running Resources Summary

### 1. Cloud Run Services (6 total)

| Service | Region | CPU | Memory | Min Instances | Max Instances | Status |
|---------|--------|-----|--------|---------------|---------------|--------|
| ecodrix-api | us-central1 | 1 | 512Mi | 0 (was 1) | 3 | ✅ Updated |
| scraper-proxy | us-central1 | 1 | 256Mi | 0 | 2 | ✅ Updated |
| scraper-proxy | us-east1 | 1 | 256Mi | 0 | 2 | ✅ Updated |
| scraper-proxy | us-east4 | 1 | 256Mi | 0 | 2 | ✅ Updated |
| scraper-proxy | us-west1 | 1 | 256Mi | 0 | 2 | ✅ Updated |
| scraper-proxy | europe-west1 | 1 | 256Mi | 0 | 2 | ✅ Updated |

**Notes:**
- `ecodrix-api` still has `session-affinity: true` and `startup-cpu-boost: true` — these should be removed
- `cpu-throttling: true` is set on all — good (CPU billed only during requests)
- All scraper-proxies have `containerConcurrency: 1` — very conservative, could increase to 10

### 2. Cloud Functions (6 total)

| Function | Region | State | Gen |
|----------|--------|-------|-----|
| scraper-proxy | us-central1 | ACTIVE | 2nd gen |
| scraper-proxy | us-east1 | ACTIVE | 2nd gen |
| scraper-proxy | us-east4 | ACTIVE | 2nd gen |
| scraper-proxy | us-west1 | ACTIVE | 2nd gen |
| scraper-proxy | europe-west1 | ACTIVE | 2nd gen |
| scraper-proxy | europe-west2 | FAILED | 2nd gen |

**⚠️ ISSUE:** These Cloud Functions are the SAME scraper-proxy services shown in Cloud Run (Gen 2 functions run on Cloud Run). They are NOT separate resources. The `europe-west2` one is FAILED and should be deleted.

### 3. Compute Engine VMs (5 total) — ⚠️ MAJOR COST DRIVER

| Instance | Zone | Machine Type | External IP | Status |
|----------|------|-------------|-------------|--------|
| laie-browser-1 | us-central1-a | f1-micro | 34.67.120.145 | RUNNING |
| laie-browser-2 | us-central1-a | f1-micro | 34.70.195.57 | RUNNING |
| laie-browser-3 | us-central1-a | f1-micro | 34.57.152.115 | RUNNING |
| laie-browser-4 | us-central1-a | f1-micro | 34.57.3.86 | RUNNING |
| laie-browser-5 | us-central1-a | f1-micro | 34.71.205.62 | RUNNING |

**Purpose:** Browserless (headless Chrome) instances for LAIE scraping  
**Referenced in:** `BROWSERLESS_INSTANCES` env var on ecodrix-api  
**Cost:** 5× f1-micro + 5× static external IPs = ~₹200-300/day

---

## Cost Breakdown (Estimated Daily)

| Resource | Before Fix | After Fix | Savings |
|----------|-----------|-----------|---------|
| ecodrix-api (min=1, 2CPU, 2Gi) | ₹400-500 | ₹0 idle, ~₹20 active | ~₹400 |
| 5× scraper-proxy (min=1 each) | ₹200-300 | ₹0 idle, ~₹10 active | ~₹250 |
| 5× Compute Engine VMs (24/7) | ₹200-300 | ₹200-300 (unchanged) | ₹0 |
| Cloud Build (per deploy) | ₹10-20 | ₹10-20 | ₹0 |
| **Total** | **~₹900-1100** | **~₹230-350** | **~₹600-700** |

---

## Remaining Issues & Recommendations

### HIGH PRIORITY

1. **5 Compute Engine VMs running 24/7**
   - These are `f1-micro` instances running Browserless (headless Chrome)
   - Each has a static external IP (₹~25/day per IP = ₹125/day just for IPs)
   - **Options:**
     - A) Reduce to 2-3 VMs (you likely don't need 5 concurrent browser pools)
     - B) Switch to e2-micro (same free tier eligibility, better performance)
     - C) Replace with Cloud Run service running browserless (scale to zero)
     - D) Use a managed service like Browserless.io or Browserbase

2. **Remove session-affinity from ecodrix-api**
   ```bash
   gcloud run services update ecodrix-api --region=us-central1 --no-session-affinity
   ```
   Session affinity keeps instances alive longer, preventing scale-to-zero.

3. **Remove startup-cpu-boost from ecodrix-api**
   ```bash
   gcloud run services update ecodrix-api --region=us-central1 --no-cpu-boost
   ```
   CPU boost charges extra CPU during cold starts.

4. **Delete failed Cloud Function**
   ```bash
   gcloud functions delete scraper-proxy --region=europe-west2 --gen2
   ```

### MEDIUM PRIORITY

5. **Increase scraper-proxy concurrency from 1 to 10**
   - Currently each proxy handles only 1 request at a time, forcing more instances
   ```bash
   for REGION in us-central1 us-east1 us-east4 us-west1 europe-west1; do
     gcloud run services update scraper-proxy --region=$REGION --concurrency=10
   done
   ```

6. **Container Registry → Artifact Registry migration**
   - `gcr.io` is deprecated; switch to `us-central1-docker.pkg.dev` to avoid future issues

7. **Set billing alerts**
   ```bash
   # Set a budget alert at ₹200/day (₹6000/month)
   gcloud billing budgets create \
     --billing-account=YOUR_BILLING_ACCOUNT \
     --display-name="Daily spend alert" \
     --budget-amount=6000INR \
     --threshold-rule=percent=50 \
     --threshold-rule=percent=80 \
     --threshold-rule=percent=100
   ```

### LOW PRIORITY

8. **Secrets in env vars** — All API keys/secrets are stored as plain env vars in Cloud Run. Consider migrating to Secret Manager for security.

9. **Duplicate env vars** — `PARALLEL_AUTOMATION_STORAGE`, `USE_ERIX_STORE_AUTOMATION`, `USE_ERIX_STORE_EVENTS`, `USE_ERIX_STORE_WORKFLOWS`, `ERIX_STORE_ROLLOUT_PERCENTAGE` are each set TWICE in the service config.

---

## Commands to Apply All Fixes

```bash
# 1. Remove session-affinity and cpu-boost from API
gcloud run services update ecodrix-api --region=us-central1 \
  --no-session-affinity --no-cpu-boost

# 2. Increase scraper-proxy concurrency
for REGION in us-central1 us-east1 us-east4 us-west1 europe-west1; do
  gcloud run services update scraper-proxy --region=$REGION --concurrency=10
done

# 3. Delete failed function
gcloud functions delete scraper-proxy --region=europe-west2 --gen2

# 4. (Optional) Stop 3 of 5 browser VMs to save ~₹150/day
gcloud compute instances stop laie-browser-3 --zone=us-central1-a
gcloud compute instances stop laie-browser-4 --zone=us-central1-a
gcloud compute instances stop laie-browser-5 --zone=us-central1-a
# Then update BROWSERLESS_INSTANCES env var to only include browser-1 and browser-2
```

---

## Current Config Files (Updated)

- `deploy.sh` — Deploys API (512Mi/1CPU/0→3) + Worker (1Gi/1CPU/0→2), both scale-to-zero
- `cloudbuild.yaml` — CI/CD pipeline builds and deploys both services with same optimized settings
- `deploy-cloudrun.sh` — Manual deploy script (same settings as deploy.sh)

All deployment configs now use:
- `--min-instances=0` (scale to zero)
- `--cpu-throttling` (pay only during requests)
- Reduced CPU/memory to match actual needs
- No session-affinity or cpu-boost
