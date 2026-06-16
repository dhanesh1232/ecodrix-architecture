# ERIX - Redis + BullMQ Pattern for ECOD Server

## 🎉 Complete Setup

Your ECOD server now uses ERIX **exactly like Redis + BullMQ**!

## 📁 File Structure

```
ECOD/server/
├── src/
│   └── lib/
│       └── erix/
│           ├── connection.ts    # ERIX connection (like Redis)
│           ├── queues.ts        # Queue definitions (like BullMQ Queue)
│           ├── workers.ts       # Worker definitions (like BullMQ Worker)
│           └── index.ts         # Main exports
├── examples/
│   ├── 01-simple-scraping.ts   # Simple queue usage
│   ├── 02-worker-setup.ts      # Worker setup
│   ├── 03-complete-setup.ts    # Complete pattern
│   ├── 04-priority-and-delay.ts # Advanced options
│   └── 05-real-world-usage.ts  # Real-world API
└── docs/
    ├── START-HERE.md            # Start here!
    ├── REDIS-BULLMQ-PATTERN.md  # Pattern guide
    ├── USAGE-PATTERNS.md        # Usage patterns
    └── FINAL-SETUP-COMPLETE.md  # Setup summary
```

## 🚀 Quick Start

### 1. Run Examples
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

### 2. Start Server
```bash
pnpm dev
```

Workers start automatically!

## 📚 Usage

### Import (like BullMQ)
```typescript
import { scraperQueue, emailQueue, registerWorker, startWorkers } from '@lib/erix'
```

### Add Jobs (like BullMQ queue.add())
```typescript
// Simple
await scraperQueue.add('google-maps', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
})

// With options
await scraperQueue.add('google-maps', data, {
  priority: 100,      // High priority
  maxAttempts: 3,     // Retry 3 times
  delayMs: 5000,      // Delay 5 seconds
})
```

### Register Workers (like BullMQ Worker)
```typescript
registerWorker({
  name: 'scraper-worker',
  queueName: 'laie-scrapers',
  handler: async (job) => {
    await processJob(job.data)
  },
  options: {
    maxConcurrentJobs: 10
  }
})
```

### Start Workers
```typescript
startWorkers()
```

## 📦 Available Queues

```typescript
import {
  scraperQueue,   // For scraping jobs
  emailQueue,     // For email jobs
  imageQueue,     // For image processing
  reportQueue,    // For report generation
  webhookQueue    // For webhook calls
} from '@lib/erix'
```

## 🔧 Configuration

### Environment Variables
```bash
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=your-api-key
ERIX_TENANT_ID=your-tenant-id
```

### Worker Options
```typescript
{
  pollIntervalMs: 5000,        // Poll every 5 seconds
  maxConcurrentJobs: 10,       // Process 10 jobs at once
  heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
}
```

## 🎯 Common Operations

### Get Job Status
```typescript
const job = await scraperQueue.getJob(jobId)
console.log(job.status) // waiting, active, completed, failed
```

### Get Queue Stats
```typescript
const stats = await scraperQueue.getStats()
// { waiting: 10, active: 5, completed: 100, failed: 2 }
```

### Get Worker Stats
```typescript
import { getWorkerStats } from '@lib/erix'
const stats = getWorkerStats()
```

### Graceful Shutdown
```typescript
import { stopWorkers } from '@lib/erix'
await stopWorkers()
```

## 📊 Comparison with BullMQ

| Feature | BullMQ | ERIX |
|---------|--------|------|
| **Connection** | `new Redis()` | `getErixClient()` |
| **Queue** | `new Queue('name', { connection })` | `new ErixQueue('name')` |
| **Add Job** | `queue.add('job', data)` | `queue.add('job', data)` |
| **Worker** | `new Worker('name', handler, { connection })` | `registerWorker({ name, queueName, handler })` |
| **Start** | Automatic | `startWorkers()` |
| **Stop** | `worker.close()` | `stopWorkers()` |
| **Priority** | ✅ | ✅ |
| **Delay** | ✅ | ✅ |
| **Retry** | ✅ | ✅ |

## 🧪 Examples

### Example 1: Simple Queue
```typescript
import { scraperQueue } from '@lib/erix'

const job = await scraperQueue.add('scrape', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
})
```

### Example 2: Worker Setup
```typescript
import { registerWorker, startWorkers } from '@lib/erix'

registerWorker({
  name: 'email-worker',
  queueName: 'emails',
  handler: async (job) => {
    await sendEmail(job.data)
  }
})

startWorkers()
```

### Example 3: Express API
```typescript
import express from 'express'
import { scraperQueue, startWorkers } from '@lib/erix'

const app = express()
startWorkers()

app.post('/api/scrape', async (req, res) => {
  const job = await scraperQueue.add('scrape', req.body)
  res.json({ jobId: job.id })
})

app.listen(4000)
```

## 📖 Documentation

1. **[START-HERE.md](./START-HERE.md)** - Quick start guide
2. **[REDIS-BULLMQ-PATTERN.md](./REDIS-BULLMQ-PATTERN.md)** - Pattern comparison
3. **[USAGE-PATTERNS.md](./USAGE-PATTERNS.md)** - Usage patterns
4. **[FINAL-SETUP-COMPLETE.md](./FINAL-SETUP-COMPLETE.md)** - Setup summary

## 🎯 Benefits

✅ **Familiar API** - Same as Redis + BullMQ
✅ **Simpler Setup** - No Redis installation
✅ **Type Safe** - Full TypeScript support
✅ **More Features** - Cache, PubSub, Analytics built-in
✅ **Production Ready** - Tested and deployed

## 📞 Support

- **Examples**: `examples/` directory
- **Documentation**: See docs above
- **Email**: contact@ecodrix.com

## 🎉 Summary

ERIX = Redis + BullMQ, but simpler!

```typescript
// Import (like BullMQ)
import { scraperQueue, registerWorker, startWorkers } from '@lib/erix'

// Add jobs (like BullMQ)
await scraperQueue.add('job', data)

// Register workers (like BullMQ)
registerWorker({ name, queueName, handler })

// Start workers
startWorkers()
```

**It's that simple!** 🚀

---

**Built with ❤️ using ERIX**
**Pattern**: Redis + BullMQ
**Status**: ✅ Production Ready
