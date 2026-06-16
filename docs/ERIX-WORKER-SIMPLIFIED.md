# ERIX Worker - Simplified BullMQ-Style Integration ✅

## 🎉 No Separate Worker Deployment Needed!

The worker now starts automatically with your server - just like BullMQ!

---

## 📊 Before vs After

### ❌ Before (Complex - Separate Deployment)

```
API Server (Render)     +     Worker Service (Render)
    ↓                              ↓
Enqueue jobs                  Poll and execute
                              Separate deployment
                              Separate monitoring
```

**Problems:**
- Need to deploy 2 services
- Manage 2 processes
- More complexity
- More cost

### ✅ After (Simple - Auto-Starting)

```
API Server (Render)
    ↓
Enqueue jobs + Worker auto-starts
    ↓
Single deployment
Single process
Automatic polling
```

**Benefits:**
- Deploy once
- Worker starts automatically
- BullMQ-style API
- Simpler management

---

## 🚀 How It Works Now

### 1. Server Starts
```typescript
// In server.ts (already done!)
import { initializeLAIE } from './src/lib/laie';

await initializeLAIE(); // Worker starts automatically!
```

### 2. Worker Polls Automatically
```typescript
// Happens automatically in background
while (server is running) {
  job = await erixStore.queueV2.claim('laie-scrapers');
  if (job) {
    await executeActor(job);
    await erixStore.queueV2.complete(job.id);
  }
  await sleep(5000); // Poll every 5 seconds
}
```

### 3. Jobs Execute with Session Isolation
```typescript
// Automatic when job is claimed
SessionManager.createSession()
    ↓
BrowserPool.getContextForSession()
    ↓
Actor executes with isolated session
    ↓
Results include sessionId and ipAddress
```

---

## 📝 New Files Created

### 1. `src/lib/laie/erixWorker.ts`
**BullMQ-style worker wrapper**

```typescript
import { createErixWorker } from '@lib/laie/erixWorker';

const worker = createErixWorker('laie-scrapers', async (job) => {
  await executeActor(job.data);
});

worker.run(); // Starts polling
```

### 2. `src/lib/laie/index.ts`
**Auto-initialization module**

```typescript
import { initializeLAIE } from '@lib/laie';

await initializeLAIE(); // Worker starts automatically
```

### 3. Updated `server.ts`
**Worker starts with server**

```typescript
// In initializeRoutes()
await initializeLAIE();
// Worker is now running in background!
```

---

## 🎯 Usage

### Development
```bash
cd ECOD/server

# Start server (worker starts automatically)
pnpm dev

# You'll see:
# ✅ LAIE initialized with auto-starting worker
# 📊 Worker polling 'laie-scrapers' queue every 5 seconds
```

### Production
```bash
# Deploy to Render (single service)
git push origin master

# Worker starts automatically with server
# No separate worker deployment needed!
```

### Enqueue Jobs
```typescript
import { enqueueScraperJob } from '@lib/erixStore';

// Enqueue a job
await enqueueScraperJob('google-maps', {
  query: 'restaurants in Hyderabad',
  maxResults: 10
});

// Worker picks it up automatically within 5 seconds!
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Server (Render)                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Express Routes                          │  │
│  │  • /api/laie/v1/scrape                         │  │
│  │  • /health/browser-pool                        │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │         ERIX Worker (Auto-Started)             │  │
│  │  • Polls queue every 5 seconds                 │  │
│  │  • Executes actors                             │  │
│  │  • Uses session isolation                      │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    ERIX-Store Queue                     │
│  • Stores jobs                                          │
│  • Tracks status                                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              SessionManager + BrowserPool               │
│  • Creates isolated sessions                           │
│  • Assigns IPs via round-robin                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              5 GCE Instances (Browserless)              │
│  • Actual scraping happens here                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring

### Check Worker Status
```typescript
import { getLAIEStats } from '@lib/laie';

const stats = getLAIEStats();
console.log(stats);
// {
//   totalJobsProcessed: 150,
//   successfulJobs: 143,
//   failedJobs: 7,
//   currentConcurrency: 5,
//   isRunning: true,
//   activeJobs: 5
// }
```

### Health Endpoint
```bash
curl https://api.ecodrix.com/health/browser-pool

# Returns worker stats + browser pool stats
```

### Server Logs
```
🚀 Initializing LAIE (Lead AI Engine)
✅ LAIE initialized with auto-starting worker
📊 Worker will process jobs from 'laie-scrapers' queue
🚀 ERIX Worker started
Processing job: job_abc123
✅ Job completed: job_abc123
```

---

## 🎯 Benefits

### 1. **Simplified Deployment** ✅
- Single service deployment
- No separate worker service
- Easier to manage

### 2. **BullMQ-Style API** ✅
```typescript
// Familiar pattern
const worker = createErixWorker('queue-name', async (job) => {
  await processJob(job);
});
worker.run();
```

### 3. **Auto-Starting** ✅
- Worker starts with server
- No manual start needed
- Automatic in dev and production

### 4. **Graceful Shutdown** ✅
- Worker stops with server
- Waits for active jobs
- Clean shutdown

### 5. **Same Session Isolation** ✅
- All actors use SessionManager
- BrowserPool for isolated contexts
- Round-robin IP assignment

---

## 🔧 Configuration

### Worker Options
```typescript
await initializeLAIE({
  pollIntervalMs: 5000,        // Poll every 5 seconds
  maxConcurrentJobs: 10,       // Max 10 jobs at once
  heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
});
```

### Environment Variables
```env
# Same as before - no changes needed!
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=your_api_key
ERIX_TENANT_ID=laie
BROWSERLESS_INSTANCES=ws://...
BROWSERLESS_TOKEN=...
```

---

## 🧪 Testing

### Test End-to-End
```bash
# Start server (worker starts automatically)
pnpm dev

# In another terminal, run test
pnpm test:session:isolation

# Expected:
# ✅ 5 jobs enqueued
# ✅ Worker picks up jobs
# ✅ Jobs complete with session isolation
# ✅ Different IPs used
# ✅ Success rate 100%
```

---

## 📊 Comparison with BullMQ

### BullMQ Pattern
```typescript
import { Queue, Worker } from 'bullmq';

const queue = new Queue('scrape-jobs');
await queue.add('scrape', { actor: 'google-maps', input: {...} });

const worker = new Worker('scrape-jobs', async (job) => {
  await executeActor(job.data);
});
```

### ERIX Pattern (Now!)
```typescript
import { enqueueScraperJob } from '@lib/erixStore';
import { initializeLAIE } from '@lib/laie';

await enqueueScraperJob('google-maps', {...});

await initializeLAIE(); // Worker starts automatically
```

**Same concept, simpler API!**

---

## ✅ Migration Complete

### What Changed
- ✅ Created `erixWorker.ts` (BullMQ-style wrapper)
- ✅ Created `laie/index.ts` (auto-initialization)
- ✅ Updated `server.ts` (worker starts automatically)

### What Stayed the Same
- ✅ All actors still use session isolation
- ✅ SessionManager + BrowserPool unchanged
- ✅ ERIX-Store API unchanged
- ✅ Environment variables unchanged

### What's Better
- ✅ No separate worker deployment
- ✅ Simpler architecture
- ✅ BullMQ-style API
- ✅ Auto-starting worker
- ✅ Single service to manage

---

## 🚀 Deployment

### Single Command
```bash
# Commit and push
git add .
git commit -m "Simplify worker with auto-start"
git push origin master

# Render automatically deploys
# Worker starts with server
# Done! ✅
```

### No Separate Worker Service Needed!
- ❌ No worker service to create
- ❌ No separate environment variables
- ❌ No separate monitoring
- ✅ Just deploy API server
- ✅ Worker runs automatically

---

## 🎉 Summary

**Before:** Complex setup with separate worker deployment  
**After:** Simple setup with auto-starting worker

**API:** BullMQ-style, familiar pattern  
**Deployment:** Single service, automatic start  
**Management:** Simpler, less overhead  
**Functionality:** Same session isolation, same features

**Status:** ✅ READY FOR PRODUCTION

---

**Last Updated**: 2026-05-11  
**Status**: 🟢 SIMPLIFIED AND READY
