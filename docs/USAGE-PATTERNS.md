# ERIX Usage Patterns

## Overview

ERIX follows the **Redis + BullMQ pattern** exactly. This guide shows you how to use it in real applications.

## Pattern 1: Simple Queue (Most Common)

### Setup
```typescript
// lib/erix/queues.ts
import { ErixQueue } from '@lib/erix'

export const scraperQueue = new ErixQueue('scrapers')
export const emailQueue = new ErixQueue('emails')
```

### Usage
```typescript
// In your API route
import { scraperQueue } from '@lib/erix'

app.post('/api/scrape', async (req, res) => {
  const job = await scraperQueue.add('scrape-request', {
    actor: 'google-maps',
    input: req.body
  })
  
  res.json({ jobId: job.id })
})
```

## Pattern 2: Worker Setup

### Setup
```typescript
// lib/erix/workers.ts
import { registerWorker } from '@lib/erix'

registerWorker({
  name: 'scraper-worker',
  queueName: 'scrapers',
  handler: async (job) => {
    // Process job
    await scrapeData(job.data)
  },
  options: {
    maxConcurrentJobs: 10
  }
})
```

### Start
```typescript
// server.ts
import { startWorkers } from '@lib/erix'

startWorkers() // Start all registered workers
```

## Pattern 3: Complete Application

### File Structure
```
src/
├── lib/
│   └── erix/
│       ├── connection.ts   # ERIX connection
│       ├── queues.ts       # Queue definitions
│       ├── workers.ts      # Worker definitions
│       └── index.ts        # Exports
├── routes/
│   └── api.ts              # API routes
└── server.ts               # Main server
```

### connection.ts
```typescript
import { ErixClient } from '@ecodrix/erix-client'

let client: ErixClient | null = null

export function getErixClient(): ErixClient {
  if (!client) {
    client = new ErixClient({
      baseUrl: process.env.ERIX_STORE_URL!,
      apiKey: process.env.ERIX_API_KEY!,
      tenantId: process.env.ERIX_TENANT_ID!
    })
  }
  return client
}
```

### queues.ts
```typescript
import { ErixQueue } from '@lib/erix'

export const scraperQueue = new ErixQueue('scrapers')
export const emailQueue = new ErixQueue('emails')
export const imageQueue = new ErixQueue('images')
```

### workers.ts
```typescript
import { registerWorker } from '@lib/erix'

// Scraper worker
registerWorker({
  name: 'scraper-worker',
  queueName: 'scrapers',
  handler: async (job) => {
    await scrapeData(job.data)
  },
  options: {
    maxConcurrentJobs: 10
  }
})

// Email worker
registerWorker({
  name: 'email-worker',
  queueName: 'emails',
  handler: async (job) => {
    await sendEmail(job.data)
  },
  options: {
    maxConcurrentJobs: 20
  }
})
```

### server.ts
```typescript
import express from 'express'
import { scraperQueue, emailQueue, startWorkers, stopWorkers } from '@lib/erix'

const app = express()
app.use(express.json())

// Start workers
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

// Start server
const server = app.listen(4000)

// Graceful shutdown
process.on('SIGTERM', async () => {
  server.close()
  await stopWorkers()
  process.exit(0)
})
```

## Pattern 4: Priority Jobs

```typescript
// High priority (processed first)
await scraperQueue.add('urgent-scrape', data, {
  priority: 100
})

// Normal priority
await scraperQueue.add('normal-scrape', data, {
  priority: 50
})

// Low priority (processed last)
await scraperQueue.add('background-scrape', data, {
  priority: 1
})
```

## Pattern 5: Delayed Jobs

```typescript
// Run in 1 hour
await emailQueue.add('reminder', data, {
  delayMs: 3600000
})

// Run at specific time
await emailQueue.add('scheduled', data, {
  runAt: new Date('2024-12-31T23:59:59Z')
})
```

## Pattern 6: Retry Configuration

```typescript
await scraperQueue.add('scrape', data, {
  maxAttempts: 5 // Retry up to 5 times
})
```

## Pattern 7: Job Monitoring

```typescript
// Get job status
const job = await scraperQueue.getJob(jobId)
console.log(job.status) // waiting, active, completed, failed

// Get queue stats
const stats = await scraperQueue.getStats()
console.log(stats)
// {
//   waiting: 10,
//   active: 5,
//   completed: 100,
//   failed: 2
// }
```

## Pattern 8: Worker Statistics

```typescript
import { getWorkerStats } from '@lib/erix'

const stats = getWorkerStats()
console.log(stats)
// {
//   'scraper-worker': {
//     totalJobsProcessed: 1234,
//     successfulJobs: 1200,
//     failedJobs: 34,
//     currentConcurrency: 5,
//     isRunning: true,
//     activeJobs: 5
//   }
// }
```

## Pattern 9: Multiple Queues

```typescript
// Define multiple queues
export const scraperQueue = new ErixQueue('scrapers')
export const emailQueue = new ErixQueue('emails')
export const imageQueue = new ErixQueue('images')
export const reportQueue = new ErixQueue('reports')

// Register workers for each queue
registerWorker({
  name: 'scraper-worker',
  queueName: 'scrapers',
  handler: scraperHandler
})

registerWorker({
  name: 'email-worker',
  queueName: 'emails',
  handler: emailHandler
})

registerWorker({
  name: 'image-worker',
  queueName: 'images',
  handler: imageHandler
})

registerWorker({
  name: 'report-worker',
  queueName: 'reports',
  handler: reportHandler
})

// Start all workers
startWorkers()
```

## Pattern 10: Graceful Shutdown

```typescript
import { stopWorkers } from '@lib/erix'

async function shutdown() {
  console.log('Shutting down...')
  
  // Stop accepting new connections
  server.close()
  
  // Stop all workers (waits for active jobs)
  await stopWorkers()
  
  console.log('Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

## Best Practices

### 1. Use Queues for Organization
```typescript
// Good: Separate queues for different job types
const scraperQueue = new ErixQueue('scrapers')
const emailQueue = new ErixQueue('emails')

// Bad: One queue for everything
const jobQueue = new ErixQueue('jobs')
```

### 2. Set Appropriate Concurrency
```typescript
// CPU-intensive tasks: Lower concurrency
registerWorker({
  name: 'image-worker',
  queueName: 'images',
  handler: imageHandler,
  options: {
    maxConcurrentJobs: 3 // Lower for CPU-intensive
  }
})

// I/O-intensive tasks: Higher concurrency
registerWorker({
  name: 'email-worker',
  queueName: 'emails',
  handler: emailHandler,
  options: {
    maxConcurrentJobs: 20 // Higher for I/O-intensive
  }
})
```

### 3. Use Priority Wisely
```typescript
// User-facing: High priority
await scraperQueue.add('user-request', data, {
  priority: 100
})

// Background tasks: Low priority
await scraperQueue.add('cleanup', data, {
  priority: 1
})
```

### 4. Handle Errors Gracefully
```typescript
registerWorker({
  name: 'scraper-worker',
  queueName: 'scrapers',
  handler: async (job) => {
    try {
      await scrapeData(job.data)
    } catch (error) {
      console.error('Scraping failed:', error)
      throw error // Let ERIX handle retry
    }
  }
})
```

### 5. Monitor Your Queues
```typescript
// Regular health checks
setInterval(async () => {
  const stats = await scraperQueue.getStats()
  
  if (stats.failed > 100) {
    console.error('Too many failed jobs!')
    // Send alert
  }
  
  if (stats.waiting > 1000) {
    console.warn('Queue is backing up!')
    // Scale up workers
  }
}, 60000) // Every minute
```

## Summary

ERIX follows the **Redis + BullMQ pattern**:

✅ **Queues** - `new ErixQueue('name')`
✅ **Workers** - `registerWorker({ name, queueName, handler })`
✅ **Jobs** - `queue.add('job', data, options)`
✅ **Monitoring** - `queue.getStats()`, `getWorkerStats()`
✅ **Shutdown** - `stopWorkers()`

**It's Redis + BullMQ, but simpler!** 🚀
