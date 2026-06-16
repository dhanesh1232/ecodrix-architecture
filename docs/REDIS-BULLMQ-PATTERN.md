# ERIX: Redis + BullMQ Pattern

## Overview

ERIX follows the exact same pattern as Redis + BullMQ, making it familiar and easy to use.

## Comparison

### Redis + BullMQ
```typescript
import Redis from 'ioredis'
import { Queue, Worker } from 'bullmq'

// 1. Connect to Redis
const redis = new Redis({
  host: 'localhost',
  port: 6379
})

// 2. Create Queue
const myQueue = new Queue('my-queue', { connection: redis })

// 3. Add Job
await myQueue.add('job-name', { data: 'value' })

// 4. Create Worker
const worker = new Worker('my-queue', async (job) => {
  await processJob(job.data)
}, { connection: redis })

// 5. Start Worker
// (Worker starts automatically)
```

### ERIX (Same Pattern!)
```typescript
import { getErixClient, ErixQueue, registerWorker, startWorkers } from '@lib/erix'

// 1. Connect to ERIX (like Redis)
const client = getErixClient()

// 2. Create Queue (like BullMQ Queue)
const myQueue = new ErixQueue('my-queue')

// 3. Add Job (like BullMQ queue.add())
await myQueue.add('job-name', { data: 'value' })

// 4. Register Worker (like BullMQ Worker)
registerWorker({
  name: 'my-worker',
  queueName: 'my-queue',
  handler: async (job) => {
    await processJob(job.data)
  }
})

// 5. Start Workers
startWorkers()
```

## File Structure

### Redis + BullMQ Pattern
```
src/
├── lib/
│   ├── redis.ts          # Redis connection
│   ├── queues.ts         # Queue definitions
│   └── workers.ts        # Worker definitions
└── server.ts             # Main server
```

### ERIX Pattern (Same!)
```
src/
├── lib/
│   └── erix/
│       ├── connection.ts  # ERIX connection (like Redis)
│       ├── queues.ts      # Queue definitions (like BullMQ Queue)
│       ├── workers.ts     # Worker definitions (like BullMQ Worker)
│       └── index.ts       # Main exports
└── server.ts              # Main server
```

## Usage Patterns

### 1. Connection Management

**Redis:**
```typescript
// lib/redis.ts
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT)
    })
  }
  return redis
}
```

**ERIX (Same Pattern!):**
```typescript
// lib/erix/connection.ts
import { ErixClient } from '@ecodrix/erix-client'

let erixClient: ErixClient | null = null

export function getErixClient(): ErixClient {
  if (!erixClient) {
    erixClient = new ErixClient({
      baseUrl: process.env.ERIX_STORE_URL!,
      apiKey: process.env.ERIX_API_KEY!,
      tenantId: process.env.ERIX_TENANT_ID!
    })
  }
  return erixClient
}
```

### 2. Queue Definitions

**BullMQ:**
```typescript
// lib/queues.ts
import { Queue } from 'bullmq'
import { getRedis } from './redis'

export const emailQueue = new Queue('emails', {
  connection: getRedis()
})

export const scraperQueue = new Queue('scrapers', {
  connection: getRedis()
})
```

**ERIX (Same Pattern!):**
```typescript
// lib/erix/queues.ts
import { ErixQueue } from '@lib/erix'

export const emailQueue = new ErixQueue('emails')
export const scraperQueue = new ErixQueue('scrapers')
```

### 3. Worker Definitions

**BullMQ:**
```typescript
// lib/workers.ts
import { Worker } from 'bullmq'
import { getRedis } from './redis'

export const emailWorker = new Worker('emails', async (job) => {
  await sendEmail(job.data)
}, {
  connection: getRedis(),
  concurrency: 10
})

export const scraperWorker = new Worker('scrapers', async (job) => {
  await scrapeData(job.data)
}, {
  connection: getRedis(),
  concurrency: 5
})
```

**ERIX (Same Pattern!):**
```typescript
// lib/erix/workers.ts
import { registerWorker } from '@lib/erix'

registerWorker({
  name: 'email-worker',
  queueName: 'emails',
  handler: async (job) => {
    await sendEmail(job.data)
  },
  options: {
    maxConcurrentJobs: 10
  }
})

registerWorker({
  name: 'scraper-worker',
  queueName: 'scrapers',
  handler: async (job) => {
    await scrapeData(job.data)
  },
  options: {
    maxConcurrentJobs: 5
  }
})
```

### 4. Server Setup

**BullMQ:**
```typescript
// server.ts
import express from 'express'
import { emailQueue, scraperQueue } from './lib/queues'
import './lib/workers' // Workers start automatically

const app = express()

app.post('/api/send-email', async (req, res) => {
  const job = await emailQueue.add('email', req.body)
  res.json({ jobId: job.id })
})

app.post('/api/scrape', async (req, res) => {
  const job = await scraperQueue.add('scrape', req.body)
  res.json({ jobId: job.id })
})

app.listen(4000)
```

**ERIX (Same Pattern!):**
```typescript
// server.ts
import express from 'express'
import { emailQueue, scraperQueue, startWorkers } from '@lib/erix'

const app = express()

// Start workers
startWorkers()

app.post('/api/send-email', async (req, res) => {
  const job = await emailQueue.add('email', req.body)
  res.json({ jobId: job.id })
})

app.post('/api/scrape', async (req, res) => {
  const job = await scraperQueue.add('scrape', req.body)
  res.json({ jobId: job.id })
})

app.listen(4000)
```

## API Comparison

| Operation | BullMQ | ERIX |
|-----------|--------|------|
| **Connection** | `new Redis()` | `getErixClient()` |
| **Create Queue** | `new Queue('name', { connection })` | `new ErixQueue('name')` |
| **Add Job** | `queue.add('job', data)` | `queue.add('job', data)` |
| **Create Worker** | `new Worker('name', handler, { connection })` | `registerWorker({ name, queueName, handler })` |
| **Start Worker** | Automatic | `startWorkers()` |
| **Stop Worker** | `worker.close()` | `stopWorkers()` |
| **Get Job** | `queue.getJob(id)` | `queue.getJob(id)` |
| **Priority** | `queue.add('job', data, { priority })` | `queue.add('job', data, { priority })` |
| **Delay** | `queue.add('job', data, { delay })` | `queue.add('job', data, { delayMs })` |
| **Retry** | `queue.add('job', data, { attempts })` | `queue.add('job', data, { maxAttempts })` |

## Migration from BullMQ

### Step 1: Replace Imports
```typescript
// Before (BullMQ)
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

// After (ERIX)
import { getErixClient, ErixQueue, registerWorker, startWorkers } from '@lib/erix'
```

### Step 2: Replace Connection
```typescript
// Before (BullMQ)
const redis = new Redis()

// After (ERIX)
const client = getErixClient()
```

### Step 3: Replace Queue Creation
```typescript
// Before (BullMQ)
const myQueue = new Queue('my-queue', { connection: redis })

// After (ERIX)
const myQueue = new ErixQueue('my-queue')
```

### Step 4: Replace Worker Creation
```typescript
// Before (BullMQ)
const worker = new Worker('my-queue', async (job) => {
  await processJob(job.data)
}, { connection: redis })

// After (ERIX)
registerWorker({
  name: 'my-worker',
  queueName: 'my-queue',
  handler: async (job) => {
    await processJob(job.data)
  }
})
startWorkers()
```

## Examples

### Example 1: Simple Queue
```bash
pnpm example:simple
```

### Example 2: Worker Setup
```bash
pnpm example:worker
```

### Example 3: Complete Setup
```bash
pnpm example:complete
```

### Example 4: Priority & Delay
```bash
pnpm example:priority
```

### Example 5: Real-World Usage
```bash
pnpm example:realworld
```

## Benefits Over Redis + BullMQ

1. **Simpler Setup** - No Redis installation needed
2. **Single Service** - ERIX-Store handles everything
3. **More Features** - Cache, PubSub, Analytics built-in
4. **Type Safe** - Full TypeScript support
5. **Same API** - Familiar BullMQ-style API

## Summary

ERIX follows the **exact same pattern** as Redis + BullMQ:

✅ **Connection** - `getErixClient()` (like `new Redis()`)
✅ **Queues** - `new ErixQueue()` (like `new Queue()`)
✅ **Workers** - `registerWorker()` (like `new Worker()`)
✅ **Jobs** - `queue.add()` (same as BullMQ)
✅ **Options** - Priority, delay, retry (same as BullMQ)

**It's Redis + BullMQ, but simpler!** 🚀
