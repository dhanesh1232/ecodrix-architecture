# ERIX Quick Reference Guide

> **TL;DR:** ERIX works exactly like Redis + BullMQ. If you know BullMQ, you already know ERIX.

---

## 🚀 Quick Start (3 Steps)

### 1. Connect (like Redis)
```typescript
import { getErixClient } from '@lib/erix'

const client = getErixClient()
```

### 2. Add Jobs (like BullMQ Queue)
```typescript
import { scraperQueue } from '@lib/erix'

const job = await scraperQueue.add('google-maps', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
})
```

### 3. Process Jobs (like BullMQ Worker)
```typescript
import { registerWorker, startWorkers } from '@lib/erix'

registerWorker({
  name: 'scraper-worker',
  queueName: 'laie-scrapers',
  handler: async (job) => {
    // Process job
    console.log(job.data)
  }
})

startWorkers()
```

---

## 📦 Available Queues

```typescript
import { 
  scraperQueue,   // Web scraping jobs
  emailQueue,     // Email sending jobs
  imageQueue,     // Image processing jobs
  reportQueue,    // Report generation jobs
  webhookQueue    // Webhook delivery jobs
} from '@lib/erix'
```

---

## 🔧 Common Operations

### Add a Job
```typescript
const job = await scraperQueue.add('job-name', {
  // your data
})
```

### Add Job with Options
```typescript
const job = await scraperQueue.add('job-name', data, {
  priority: 1,        // Higher = more important
  delay: 5000,        // Delay 5 seconds
  attempts: 3,        // Retry 3 times
  backoff: 1000       // Wait 1s between retries
})
```

### Get Job Status
```typescript
const job = await scraperQueue.getJob(jobId)
console.log(job.status)  // 'waiting' | 'active' | 'completed' | 'failed'
```

### Get Queue Stats
```typescript
const stats = await scraperQueue.getStats()
console.log(stats)
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3
// }
```

### Update Job Progress
```typescript
await scraperQueue.updateProgress(jobId, 50)  // 50% complete
```

---

## 👷 Worker Operations

### Register Worker
```typescript
registerWorker({
  name: 'my-worker',
  queueName: 'my-queue',
  handler: async (job) => {
    // Process job
    console.log(job.id, job.data)
  },
  options: {
    pollIntervalMs: 5000,      // Poll every 5 seconds
    maxConcurrentJobs: 10,     // Process 10 jobs at once
    heartbeatIntervalMs: 30000 // Heartbeat every 30 seconds
  }
})
```

### Start All Workers
```typescript
startWorkers()
```

### Stop All Workers
```typescript
await stopWorkers()
```

### Get Worker Stats
```typescript
const stats = getWorkerStats()
console.log(stats)
// {
//   'my-worker': {
//     processed: 100,
//     failed: 2,
//     active: 3
//   }
// }
```

---

## 🎯 Real-World Example

```typescript
import express from 'express'
import { scraperQueue, registerWorker, startWorkers } from '@lib/erix'

const app = express()

// ─── API Endpoint ────────────────────────────────────────────
app.post('/api/scrape', async (req, res) => {
  const { actor, input } = req.body
  
  // Add job to queue
  const job = await scraperQueue.add('scrape-request', {
    actor,
    input
  })
  
  res.json({
    jobId: job.id,
    status: job.status
  })
})

// ─── Worker ──────────────────────────────────────────────────
registerWorker({
  name: 'scraper-worker',
  queueName: 'laie-scrapers',
  handler: async (job) => {
    const { actor, input } = job.data
    
    // Process scraping
    const results = await scrapeData(actor, input)
    
    // Update progress
    await scraperQueue.updateProgress(job.id, 100)
    
    return results
  }
})

// ─── Start Server ────────────────────────────────────────────
startWorkers()
app.listen(4000)
```

---

## 🔍 Job Lifecycle

```
┌─────────┐
│ waiting │  ← Job added to queue
└────┬────┘
     │
     ▼
┌─────────┐
│ active  │  ← Worker picked up job
└────┬────┘
     │
     ├─────────────┐
     ▼             ▼
┌───────────┐  ┌────────┐
│ completed │  │ failed │
└───────────┘  └────────┘
```

---

## 📊 Monitoring

### Check Connection
```typescript
const ping = await client.ping()
console.log(ping.uptime)  // Server uptime in seconds
```

### Monitor Queue
```typescript
const stats = await scraperQueue.getStats()
console.log(`
  Waiting: ${stats.waiting}
  Active: ${stats.active}
  Completed: ${stats.completed}
  Failed: ${stats.failed}
`)
```

### Monitor Workers
```typescript
const stats = getWorkerStats()
Object.entries(stats).forEach(([name, stat]) => {
  console.log(`${name}: ${stat.processed} processed, ${stat.failed} failed`)
})
```

---

## 🚨 Error Handling

### Job Handler Errors
```typescript
registerWorker({
  name: 'my-worker',
  queueName: 'my-queue',
  handler: async (job) => {
    try {
      // Process job
      await processJob(job.data)
    } catch (error) {
      // Log error
      console.error('Job failed:', error)
      
      // Re-throw to mark job as failed
      throw error
    }
  }
})
```

### Connection Errors
```typescript
try {
  const client = getErixClient()
  await client.ping()
} catch (error) {
  console.error('ERIX connection failed:', error)
}
```

---

## 🎨 Advanced Patterns

### Priority Queue
```typescript
// High priority
await scraperQueue.add('urgent', data, { priority: 1 })

// Normal priority
await scraperQueue.add('normal', data, { priority: 5 })

// Low priority
await scraperQueue.add('background', data, { priority: 10 })
```

### Delayed Jobs
```typescript
// Run in 1 hour
await scraperQueue.add('delayed', data, {
  delay: 60 * 60 * 1000
})
```

### Retry Strategy
```typescript
await scraperQueue.add('retry', data, {
  attempts: 5,           // Retry 5 times
  backoff: 2000,         // Wait 2s between retries
})
```

### Batch Processing
```typescript
const jobs = await Promise.all([
  scraperQueue.add('job1', data1),
  scraperQueue.add('job2', data2),
  scraperQueue.add('job3', data3),
])

console.log(`Added ${jobs.length} jobs`)
```

---

## 📝 Environment Variables

```env
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_STORE_API_KEY=your_api_key_here
ERIX_TENANT_ID=your_tenant_id
```

---

## 🔗 Useful Links

- **Examples:** `ECOD/server/examples/`
- **Full Documentation:** `REDIS-BULLMQ-PATTERN.md`
- **Usage Patterns:** `USAGE-PATTERNS.md`
- **Audit Report:** `AUDIT-REPORT.md`

---

## 💡 Tips

1. **Use pre-defined queues** - They're already configured and ready to use
2. **Register workers early** - Before your server starts accepting requests
3. **Monitor queue stats** - Keep an eye on waiting/failed jobs
4. **Use priorities** - For time-sensitive jobs
5. **Set retry policies** - For jobs that might fail temporarily

---

## 🆘 Troubleshooting

### "Missing ERIX configuration" Error
**Solution:** Check your `.env` file has all required variables:
```env
ERIX_STORE_URL=...
ERIX_STORE_API_KEY=...
ERIX_TENANT_ID=...
```

### Worker Not Processing Jobs
**Solution:** Make sure you called `startWorkers()`:
```typescript
registerWorker({ ... })
startWorkers()  // Don't forget this!
```

### Jobs Stuck in "waiting"
**Solution:** Check if worker is running and queue name matches:
```typescript
// Queue name must match
registerWorker({ queueName: 'laie-scrapers', ... })
await scraperQueue.add(...)  // Uses 'laie-scrapers'
```

---

**Last Updated:** May 11, 2026  
**Version:** 1.0.0
