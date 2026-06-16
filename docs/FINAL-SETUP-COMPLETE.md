# ✅ ERIX Setup Complete - Redis + BullMQ Pattern

## 🎉 What You Have Now

Your ECOD server now uses ERIX **exactly like Redis + BullMQ**!

### File Structure
```
ECOD/server/src/lib/erix/
├── connection.ts    # ERIX connection (like Redis)
├── queues.ts        # Queue definitions (like BullMQ Queue)
├── workers.ts       # Worker definitions (like BullMQ Worker)
└── index.ts         # Main exports
```

### Usage Pattern (Same as BullMQ!)

#### 1. Import (like BullMQ)
```typescript
import { scraperQueue, registerWorker, startWorkers } from '@lib/erix'
```

#### 2. Add Jobs (like BullMQ queue.add())
```typescript
await scraperQueue.add('google-maps', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
})
```

#### 3. Register Workers (like BullMQ Worker)
```typescript
registerWorker({
  name: 'scraper-worker',
  queueName: 'laie-scrapers',
  handler: async (job) => {
    await processJob(job.data)
  }
})
```

#### 4. Start Workers
```typescript
startWorkers()
```

## 📚 Documentation

### Quick Start
1. **[START-HERE.md](./START-HERE.md)** ⭐ - Start here!
2. **[REDIS-BULLMQ-PATTERN.md](./REDIS-BULLMQ-PATTERN.md)** - Redis + BullMQ pattern
3. **[USAGE-PATTERNS.md](./USAGE-PATTERNS.md)** - Usage patterns

### Examples
4. **[examples/01-simple-scraping.ts](./examples/01-simple-scraping.ts)** - Simple queue
5. **[examples/02-worker-setup.ts](./examples/02-worker-setup.ts)** - Worker setup
6. **[examples/03-complete-setup.ts](./examples/03-complete-setup.ts)** - Complete setup
7. **[examples/04-priority-and-delay.ts](./examples/04-priority-and-delay.ts)** - Priority & delay
8. **[examples/05-real-world-usage.ts](./examples/05-real-world-usage.ts)** - Real-world API

## 🚀 Quick Start

### Run Examples
```bash
# Simple scraping (like BullMQ queue.add())
pnpm example:simple

# Worker setup (like BullMQ Worker)
pnpm example:worker

# Complete setup (Redis + BullMQ pattern)
pnpm example:complete

# Priority and delayed jobs
pnpm example:priority

# Real-world usage (Express API)
pnpm example:realworld
```

### Start Server
```bash
pnpm dev
```

The worker starts automatically!

## 📦 Available Queues

```typescript
import { scraperQueue, emailQueue, imageQueue, reportQueue, webhookQueue } from '@lib/erix'

// Use like BullMQ queues
await scraperQueue.add('job', data)
await emailQueue.add('job', data)
await imageQueue.add('job', data)
await reportQueue.add('job', data)
await webhookQueue.add('job', data)
```

## 🔧 Configuration

### Environment Variables (Already Set)
```bash
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=erix_19d13b9a9a9e72f0c9d65f2de05cdf70fa1b7b3d64d845b89f49f39501aedac3
ERIX_TENANT_ID=laie
```

### Worker Options
```typescript
registerWorker({
  name: 'my-worker',
  queueName: 'my-queue',
  handler: async (job) => {
    await processJob(job.data)
  },
  options: {
    pollIntervalMs: 5000,        // Poll every 5 seconds
    maxConcurrentJobs: 10,       // Process 10 jobs at once
    heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
  }
})
```

## 🎯 Common Operations

### Add Job
```typescript
await scraperQueue.add('job-name', data)
```

### Add Job with Options
```typescript
await scraperQueue.add('job-name', data, {
  priority: 100,      // High priority
  maxAttempts: 3,     // Retry 3 times
  delayMs: 5000,      // Delay 5 seconds
  runAt: new Date()   // Run at specific time
})
```

### Get Job Status
```typescript
const job = await scraperQueue.getJob(jobId)
console.log(job.status) // waiting, active, completed, failed
```

### Get Queue Stats
```typescript
const stats = await scraperQueue.getStats()
console.log(stats)
// {
//   waiting: 10,
//   active: 5,
//   completed: 100,
//   failed: 2
// }
```

### Get Worker Stats
```typescript
import { getWorkerStats } from '@lib/erix'

const stats = getWorkerStats()
console.log(stats)
// {
//   'scraper-worker': {
//     totalJobsProcessed: 1234,
//     successfulJobs: 1200,
//     failedJobs: 34,
//     isRunning: true
//   }
// }
```

## 🔄 Comparison with BullMQ

| Operation | BullMQ | ERIX |
|-----------|--------|------|
| **Import** | `import { Queue, Worker } from 'bullmq'` | `import { scraperQueue, registerWorker } from '@lib/erix'` |
| **Connection** | `new Redis()` | `getErixClient()` |
| **Create Queue** | `new Queue('name', { connection })` | `new ErixQueue('name')` |
| **Add Job** | `queue.add('job', data)` | `queue.add('job', data)` |
| **Create Worker** | `new Worker('name', handler, { connection })` | `registerWorker({ name, queueName, handler })` |
| **Start Worker** | Automatic | `startWorkers()` |
| **Stop Worker** | `worker.close()` | `stopWorkers()` |
| **Get Job** | `queue.getJob(id)` | `queue.getJob(id)` |
| **Priority** | `{ priority: 100 }` | `{ priority: 100 }` |
| **Delay** | `{ delay: 5000 }` | `{ delayMs: 5000 }` |
| **Retry** | `{ attempts: 3 }` | `{ maxAttempts: 3 }` |

## 📊 Real-World Example

```typescript
// server.ts
import express from 'express'
import { scraperQueue, emailQueue, startWorkers, stopWorkers } from '@lib/erix'

const app = express()
app.use(express.json())

// Start workers (like BullMQ)
startWorkers()

// API routes
app.post('/api/scrape', async (req, res) => {
  const job = await scraperQueue.add('scrape', req.body)
  res.json({ jobId: job.id })
})

app.post('/api/send-email', async (req, res) => {
  const job = await emailQueue.add('email', req.body)
  res.json({ jobId: job.id })
})

app.get('/api/jobs/:jobId', async (req, res) => {
  const job = await scraperQueue.getJob(req.params.jobId)
  res.json({ job })
})

app.get('/api/stats', async (req, res) => {
  const scraperStats = await scraperQueue.getStats()
  const emailStats = await emailQueue.getStats()
  res.json({ scraper: scraperStats, email: emailStats })
})

// Start server
const server = app.listen(4000)

// Graceful shutdown
process.on('SIGTERM', async () => {
  server.close()
  await stopWorkers()
  process.exit(0)
})
```

## 🎯 Benefits

### vs Redis + BullMQ
✅ **Simpler Setup** - No Redis installation
✅ **Single Service** - ERIX-Store handles everything
✅ **Same API** - Familiar BullMQ-style API
✅ **More Features** - Cache, PubSub, Analytics built-in
✅ **Type Safe** - Full TypeScript support

### vs Direct Client Usage
✅ **Better Organization** - Queues and workers separated
✅ **Easier Testing** - Mock queues easily
✅ **Familiar Pattern** - Redis + BullMQ pattern
✅ **Scalable** - Add more workers easily
✅ **Maintainable** - Clear file structure

## 🧪 Testing

```bash
# Test examples
pnpm example:simple
pnpm example:worker
pnpm example:complete
pnpm example:priority
pnpm example:realworld

# Test session isolation
pnpm test:session:isolation

# Test all actors
pnpm test:actors
```

## 📞 Support

- **Redis + BullMQ Pattern**: [REDIS-BULLMQ-PATTERN.md](./REDIS-BULLMQ-PATTERN.md)
- **Usage Patterns**: [USAGE-PATTERNS.md](./USAGE-PATTERNS.md)
- **Examples**: `examples/` directory
- **Email**: contact@ecodrix.com

## 🎉 Summary

Your ECOD server now uses ERIX **exactly like Redis + BullMQ**:

✅ **Connection** - `getErixClient()` (like `new Redis()`)
✅ **Queues** - `new ErixQueue('name')` (like `new Queue()`)
✅ **Workers** - `registerWorker()` (like `new Worker()`)
✅ **Jobs** - `queue.add()` (same as BullMQ)
✅ **Options** - Priority, delay, retry (same as BullMQ)

**It's Redis + BullMQ, but simpler!** 🚀

---

**Built with ❤️ using ERIX**
**Version**: 2.0.0 (Redis + BullMQ Pattern)
**Date**: May 11, 2024
**Status**: ✅ Production Ready
