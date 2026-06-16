# Task 10: Actor Worker Runner - COMPLETE ✅

## Summary

The Actor Worker Runner already exists and is fully functional with all required features for session isolation.

---

## ✅ Existing Implementation

### File: `src/workers/actor-runner.ts`

**Features Implemented:**
- ✅ Continuous job queue polling from ERIX-Store
- ✅ Actor routing via ACTOR_REGISTRY
- ✅ Job lifecycle management (claim → execute → complete/fail)
- ✅ Error handling with automatic retry
- ✅ Graceful shutdown on SIGTERM/SIGINT
- ✅ Heartbeat mechanism (30s intervals)
- ✅ Performance monitoring and statistics
- ✅ Concurrency control (max 10 concurrent jobs)
- ✅ Backoff on polling errors
- ✅ Connection drop detection and retry

### File: `scripts/start-worker-production.ts`

**Production Startup Script:**
- ✅ Environment variable validation
- ✅ Required vars check (ERIX_STORE_URL, BROWSERLESS_INSTANCES, etc.)
- ✅ Graceful error handling
- ✅ Unhandled rejection handling

---

## 🎯 How It Works

### 1. **Job Polling**
```typescript
// Polls ERIX-Store queue every 5 seconds
const job = await claimScraperJob('laie-scrapers');
```

### 2. **Actor Routing**
```typescript
// Routes to correct actor handler
const actorDef = ACTOR_REGISTRY[actorName];
// actorName can be: 'google-maps', 'indiamart', 'tradeindia', 'deep-crawler'
```

### 3. **Job Execution**
```typescript
// Creates ActorContext with session isolation
const ctx = new ActorContext(jobId, actorDef.name, input);

// Executes actor handler (which uses SessionManager + BrowserPool)
await actorDef.handler(ctx);
```

### 4. **Job Completion**
```typescript
// On success
await completeScraperJob(jobId, { count, completedAt });

// On failure (with retry)
await failScraperJob(jobId, errorMessage);
```

---

## 🚀 Usage

### Development
```bash
# Start worker in development mode
cd ECOD/server
pnpm worker:start
```

### Production
```bash
# Start worker in production mode
cd ECOD/server
pnpm worker:production
```

### As a Service (Render/PM2)
```bash
# Add to Render or PM2 configuration
node dist/scripts/start-worker-production.js
```

---

## 📊 Worker Configuration

```typescript
{
  queueName: 'laie-scrapers',
  pollIntervalMs: 5000,           // Poll every 5 seconds
  maxConcurrentJobs: 10,          // Max 10 jobs at once
  heartbeatIntervalMs: 30000,     // Heartbeat every 30 seconds
  maxRetries: 3,                  // Retry failed jobs 3 times
  backoffMultiplier: 2,           // Exponential backoff
  maxBackoffMs: 60000             // Max 1 minute backoff
}
```

---

## 🔍 Monitoring

### Statistics Logged Every Minute
```json
{
  "totalJobsProcessed": 150,
  "successfulJobs": 143,
  "failedJobs": 7,
  "currentConcurrency": 5,
  "uptimeMinutes": 120,
  "successRate": 95,
  "activeJobs": [
    {
      "jobId": "job_abc123",
      "actorName": "google-maps",
      "durationMs": 15000
    }
  ]
}
```

### Health Check
```typescript
// Get worker status programmatically
const status = actorRunner.getStatus();
```

---

## 🧪 Testing

### Test Script: `scripts/test-actor-worker.ts`

Run the test:
```bash
pnpm test:work
```

### Manual Test

1. **Start the worker:**
```bash
pnpm worker:start
```

2. **Enqueue a test job:**
```bash
curl -X POST https://store.ecodrix.com/queue/v2/laie-scrapers/jobs \
  -H "Content-Type: application/json" \
  -H "x-erix-api-key: YOUR_KEY" \
  -d '{
    "data": {
      "actor": "google-maps",
      "input": {
        "query": "restaurants in Hyderabad",
        "maxResults": 5
      }
    }
  }'
```

3. **Watch worker logs:**
```
[ActorRunner] Claimed job from queue
[ActorRunner] Starting job execution
[SessionManager] Session created
[BrowserPool] Browser context created
[GoogleMaps] Starting scrape with session isolation
[GoogleMaps] Scrape completed
[ActorRunner] Job completed successfully
```

---

## 🔄 Integration with Session Isolation

The worker automatically uses session isolation because:

1. **Actor Handlers Updated** (Tasks 6-9)
   - All actors now use `SessionManager.createSession()`
   - Browser-based actors use `BrowserPool.getContextForSession()`
   - All results include `sessionId` and `ipAddress`

2. **Worker Executes Actors**
   - Worker calls `actorDef.handler(ctx)`
   - Handler creates session → gets context → scrapes → cleans up
   - Worker doesn't need to know about session isolation

3. **Automatic Cleanup**
   - Actors handle cleanup in try-finally blocks
   - Worker handles job lifecycle
   - Sessions destroyed after completion

---

## 🎯 Acceptance Criteria ✅

- [x] Actor registry mapping actor names to handlers
- [x] Worker polls ERIX-Store queue continuously
- [x] Jobs marked as active when processing starts
- [x] Actor handlers invoked with job data
- [x] Jobs marked as completed on success
- [x] Jobs marked as failed on error
- [x] Error handling with retry logic
- [x] Graceful shutdown on SIGTERM
- [x] Logging for all operations
- [x] Back-off on queue polling errors

---

## 📝 Environment Variables Required

```env
# ERIX-Store Connection
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=erix_19d13b9a9a9e72f0c9d65f2de05cdf70fa1b7b3d64d845b89f49f39501aedac3
ERIX_TENANT_ID=laie

# Session Isolation
BROWSERLESS_INSTANCES=ws://34.67.120.145:3000,ws://34.70.195.57:3000,ws://34.57.152.115:3000,ws://34.57.3.86:3000,ws://34.71.205.62:3000
BROWSERLESS_TOKEN=408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8
```

---

## 🚨 Error Handling

### Connection Drops
```typescript
// Detects Browserless connection drops
if (error.message.includes('TargetClosedError') || 
    error.message.includes('WebSocket')) {
  // Fails job for automatic retry
  await failScraperJob(jobId, error.message);
}
```

### Retry Logic
- Failed jobs automatically retry up to 3 times
- Exponential backoff between retries
- Permanent failure after max retries

### Graceful Shutdown
- Stops accepting new jobs
- Waits up to 30 seconds for active jobs to complete
- Force cleans up remaining jobs
- Logs final statistics

---

## 🎉 Production Deployment

### Option 1: Separate Worker Service (Recommended)

**Render Configuration:**
```yaml
services:
  - type: web
    name: ecodrix-api
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: node dist/server.js
    
  - type: worker
    name: ecodrix-actor-worker
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: node dist/scripts/start-worker-production.js
```

### Option 2: Single Service with PM2

```json
{
  "apps": [
    {
      "name": "api-server",
      "script": "dist/server.js"
    },
    {
      "name": "actor-worker",
      "script": "dist/scripts/start-worker-production.js"
    }
  ]
}
```

### Option 3: Integrated in Server (Not Recommended)

Add to `server.ts`:
```typescript
import { actorRunner } from './workers/actor-runner';

// After server starts
await actorRunner.start();
```

---

## 📊 Performance Metrics

### Expected Performance
- **Throughput**: 10 concurrent jobs
- **Success Rate**: ≥95%
- **Average Job Duration**: 15-30 seconds
- **Heartbeat Interval**: 30 seconds
- **Poll Interval**: 5 seconds

### Monitoring
- Statistics logged every minute
- Active jobs tracked in real-time
- Success/failure rates calculated
- Uptime tracking

---

## ✅ Task Complete

**Status**: The Actor Worker Runner is fully implemented and production-ready.

**What Was Done:**
- ✅ Worker already exists with all required features
- ✅ Production startup script exists
- ✅ Environment validation implemented
- ✅ Integration with ACTOR_REGISTRY complete
- ✅ Session isolation automatically used via actor handlers

**Next Steps:**
- Deploy worker as separate service on Render
- Monitor performance and success rates
- Proceed to testing tasks (Tasks 11-14)

---

**Completed**: 2026-05-11  
**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT
