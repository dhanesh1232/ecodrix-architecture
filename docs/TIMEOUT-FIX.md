# ProxyKit Timeout Issues - Quick Fix

## Issue

Cloud relays (Cloudflare Workers, GCP Functions, AWS Lambda) are timing out:

```
TypeError: fetch failed: Connect Timeout Error 
(attempted address: scraper-proxy-1.dhaneshreddy980.workers.dev:443, timeout: 10000ms)
```

## Root Cause

The cloud relay endpoints may be:
1. Down or not responding
2. Taking longer than 10s to respond
3. Blocked by firewall/network

## Immediate Solutions

### Option 1: Use Direct Fetch Mode (Fastest)

Run the demo with direct fetch (bypasses cloud relays):

```bash
pnpm demo:clay:direct
```

This will:
- Skip cloud relays entirely
- Use direct fetch from your server
- Still test LinkedIn enrichment
- Verify core functionality works

### Option 2: Increase Timeout (Already Applied)

The code has been updated to:
- Use 30s minimum timeout for cloud relays (was 10s)
- Fallback to direct fetch after 2 consecutive timeouts
- Better error handling and logging

Try the regular demo again:

```bash
pnpm demo:clay
```

### Option 3: Test Individual Components

Test just the LinkedIn enricher (no website crawling):

```bash
pnpm test:linkedin
```

## What Was Fixed

### 1. Increased Cloud Relay Timeout

**Before:**
```typescript
signal: AbortSignal.timeout(timeoutMs), // 10-20s
```

**After:**
```typescript
const relayTimeout = Math.max(timeoutMs, 30000); // At least 30s
signal: AbortSignal.timeout(relayTimeout),
```

### 2. Smart Fallback After Timeouts

**New Logic:**
```typescript
let consecutiveTimeouts = 0;

// After 2 consecutive timeouts, skip to direct fetch
if (consecutiveTimeouts >= 2) {
  log.warn("Multiple timeouts, falling back to direct fetch");
  return await fetchDirect(url, headers, timeoutMs);
}
```

### 3. Timeout Detection

```typescript
const isTimeout =
  err.message?.includes("Timeout") ||
  err.message?.includes("timeout") ||
  err.code === "ETIMEDOUT" ||
  err.code === "ECONNABORTED";

if (isTimeout) {
  consecutiveTimeouts++;
}
```

## Testing the Fixes

### Test 1: Direct Fetch Mode

```bash
cd ECOD/server
pnpm demo:clay:direct
```

**Expected:**
- ✅ No timeout errors
- ✅ Website crawling works
- ✅ LinkedIn enrichment works
- ✅ Both ECODrix and Zomato find decision makers

### Test 2: Regular Mode (With Fallback)

```bash
pnpm demo:clay
```

**Expected:**
- ⚠️  May see timeout warnings for cloud relays
- ✅ Should automatically fallback to direct fetch
- ✅ Research should complete successfully
- ✅ Both businesses should find decision makers

### Test 3: LinkedIn Only

```bash
pnpm test:linkedin
```

**Expected:**
- ✅ No website crawling (no timeouts)
- ✅ LinkedIn enrichment works
- ✅ Finds 2+ decision makers per business

## Checking Cloud Relay Health

### Test Cloudflare Worker

```bash
curl -X POST https://scraper-proxy-1.dhaneshreddy980.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Secret: f005cc2b6c85678047ae44a541516b09deca544f62ed1068de5ebbf8bb0d8073" \
  -d '{"url":"https://www.google.com","headers":{}}' \
  --max-time 30
```

**Expected:**
- Status 200
- JSON response with `{ html: "...", status: 200, finalUrl: "..." }`

**If it fails:**
- Cloudflare Worker may be down
- Check Cloudflare dashboard
- Deploy new worker if needed

### Test GCP Function

```bash
curl -X POST https://us-central1-project-e1433182-358c-4bdd-a34.cloudfunctions.net/scraper-proxy \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Secret: f005cc2b6c85678047ae44a541516b09deca544f62ed1068de5ebbf8bb0d8073" \
  -d '{"url":"https://www.google.com","headers":{}}' \
  --max-time 30
```

### Test AWS Lambda

```bash
curl -X POST https://y3dtpbvwjgavx374bukbci6lce0vqjvc.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Secret: f005cc2b6c85678047ae44a541516b09deca544f62ed1068de5ebbf8bb0d8073" \
  -d '{"url":"https://www.google.com","headers":{}}' \
  --max-time 30
```

## Understanding the Logs

### Good (Success):

```
[06:03:08 UTC] INFO: ProxyKit initialized
  relays: ["cloudflare","gcp","lambda","browser","direct"]
  totalRelays: 22

[06:03:10 UTC] INFO: Relay used: cloudflare
  status: 200
  durationMs: 1234
```

### Warning (Timeout, but recovers):

```
[06:03:24 UTC] WARN: ProxyKit: relay timeout, rotating
  relay: "cloudflare"
  consecutiveTimeouts: 1

[06:03:26 UTC] WARN: ProxyKit: relay timeout, rotating
  relay: "gcp"
  consecutiveTimeouts: 2

[06:03:27 UTC] WARN: Multiple timeouts, falling back to direct fetch

[06:03:30 UTC] INFO: Relay used: direct
  status: 200
```

### Error (All relays failed):

```
[06:03:50 UTC] ERROR: ProxyKit: all 15 attempts failed for https://ecodrix.com
```

## Production Recommendations

### 1. Monitor Relay Health

Add to monitoring:

```typescript
// Every 5 minutes
const health = proxyKit.getRelayHealth();
if (health.cloudflare.successRate < 0.5) {
  alert("Cloudflare relay degraded");
}
```

### 2. Set Up Alerts

```bash
# Cron job to test relays
*/5 * * * * curl -X POST https://scraper-proxy-1.dhaneshreddy980.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.google.com","headers":{}}' \
  --max-time 10 || echo "Relay down" | mail -s "Alert" admin@ecodrix.com
```

### 3. Deploy Backup Relays

If primary relays are unreliable:

1. Deploy more Cloudflare Workers (free tier: 100k requests/day)
2. Deploy more GCP Functions (free tier: 2M requests/month)
3. Deploy more AWS Lambdas (free tier: 1M requests/month)

Add URLs to `.env`:

```bash
CF_RELAY_URLS=https://scraper-proxy-1.workers.dev,https://scraper-proxy-2.workers.dev,...
GCP_RELAY_URLS=https://us-central1-project.cloudfunctions.net/scraper-proxy,...
AWS_RELAY_URLS=https://xxx.lambda-url.us-east-1.on.aws/,...
```

### 4. Use Direct Fetch as Default (If Relays Unreliable)

If cloud relays are consistently timing out, you can prioritize direct fetch:

```typescript
// In proxyKit/index.ts
const relays: RelayConfig[] = [
  { type: "direct" }, // Move to first position
  // ... cloud relays after
];
```

**Trade-off:**
- ✅ Faster (no relay overhead)
- ✅ More reliable (no relay downtime)
- ❌ Same IP for all requests (easier to block)
- ❌ No IP rotation (higher ban risk)

## Quick Commands

```bash
# Test with direct fetch (fastest)
pnpm demo:clay:direct

# Test regular mode (with fallback)
pnpm demo:clay

# Test LinkedIn only (no website crawling)
pnpm test:linkedin

# Check relay health
curl -X POST https://scraper-proxy-1.dhaneshreddy980.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.google.com","headers":{}}' \
  --max-time 10
```

## Expected Results

### Direct Fetch Mode:

```
🧪 Starting Clay-style AI Research Demo (Direct Fetch Mode)...
⚠️  Note: Using direct fetch (bypassing cloud relays)

🔍 Researching: ECODrix (https://ecodrix.com)
⏱️  Research completed in 25s

💎 AI INSIGHTS FOUND:
👤 Decision Makers (Enhanced):
  - Dhanesh Reddy (Founder & CEO)
    Confidence: 85% ⭐
    LinkedIn: https://www.linkedin.com/in/dhaneshreddy

🔍 Researching: Zomato (https://www.zomato.com)
⏱️  Research completed in 28s

👤 Decision Makers (Enhanced):
  - Deepinder Goyal (Founder & CEO)
    Confidence: 85% ⭐
  - Mohit Gupta (Co-Founder & CEO)
    Confidence: 80% ⭐

✅ Demo complete!
```

## Summary

**Immediate Action:**
```bash
pnpm demo:clay:direct
```

This bypasses cloud relays and tests core functionality.

**If that works:**
- Core system is fine
- Cloud relays are the issue
- Use direct fetch mode or fix relays

**If that also fails:**
- Check network connectivity
- Check if target websites are accessible
- Check LinkedIn enrichment separately with `pnpm test:linkedin`

---

**Status:** ✅ Fixes applied, ready for testing

Run `pnpm demo:clay:direct` to test immediately!
