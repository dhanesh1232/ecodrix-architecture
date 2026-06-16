# ECOD Server - Complete Automation Platform 🚀

## What's New?

Your ECOD server is now a **complete automation platform** powered by:

- **@ecodrix/erix-worker** - BullMQ-style worker (auto-polling job processor)
- **@ecodrix/erix-client** - Redis-style client (queue operations)
- **LAIE (Lead AI Engine)** - 4 built-in actors for web scraping
- **Session Isolation** - 5 GCE browser instances with IP rotation

## 🎯 What Can You Do?

### 1. **Google Maps Scraping**
Extract business data from Google Maps:
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: {
    query: 'restaurants in NYC',
    maxResults: 100,
    includeReviews: true
  }
})
```

### 2. **Supplier Discovery**
Find suppliers on IndiaMart and TradeIndia:
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'indiamart',
  input: {
    query: 'industrial machinery',
    maxResults: 200
  }
})
```

### 3. **Custom Web Scraping**
Scrape any website with custom selectors:
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'deep-crawler',
  input: {
    url: 'https://example.com/products',
    selectors: {
      title: 'h1.product-title',
      price: '.price',
      description: '.description'
    },
    maxDepth: 2,
    followLinks: true
  }
})
```

### 4. **Batch Processing**
Process multiple jobs at once:
```typescript
const queries = ['query1', 'query2', 'query3']
const jobs = await Promise.all(
  queries.map(query =>
    client.queueV2.push('laie-scrapers', {
      actor: 'google-maps',
      input: { query }
    })
  )
)
```

### 5. **Priority Queue**
High-priority jobs processed first:
```typescript
await client.queueV2.push('laie-scrapers', data, {
  priority: 100 // Higher = processed first
})
```

### 6. **Scheduled Jobs**
Run jobs at specific times:
```typescript
await client.queueV2.push('laie-scrapers', data, {
  runAt: new Date('2024-12-31T23:59:59Z')
})
```

### 7. **Real-time Monitoring**
Subscribe to job events:
```typescript
const subscription = client.queueV2.subscribe('laie-scrapers', {
  onCompleted: (job) => console.log('Done:', job.id),
  onFailed: (job) => console.error('Failed:', job.id)
})
```

## 📦 Installation

Already installed! Just use it:

```typescript
import { ErixClient } from '@ecodrix/erix-client'
import { ErixWorker } from '@ecodrix/erix-worker'
```

## 🚀 Quick Start

### 1. Start the Server
```bash
pnpm dev
```

The worker starts automatically and begins polling for jobs!

### 2. Enqueue a Job
```typescript
import { ErixClient } from '@ecodrix/erix-client'

const client = new ErixClient({
  baseUrl: process.env.ERIX_STORE_URL!,
  apiKey: process.env.ERIX_API_KEY!,
  tenantId: process.env.ERIX_TENANT_ID!,
})

const job = await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
})

console.log('Job enqueued:', job.id)
```

### 3. Monitor Progress
```typescript
const job = await client.queueV2.get(jobId)
console.log('Status:', job.status)
console.log('Progress:', job.progress)
```

## 📚 Documentation

### Complete Guides
- **[AUTOMATION-SESSION-GUIDE.md](./AUTOMATION-SESSION-GUIDE.md)** - Complete automation guide
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick reference card
- **[ERIX-WORKER-MIGRATION-COMPLETE.md](./ERIX-WORKER-MIGRATION-COMPLETE.md)** - Migration details

### Package Documentation
- **[ERIX-WORKER-PACKAGE.md](../erix-store/ERIX-WORKER-PACKAGE.md)** - Worker package docs
- **[QUICK-START-GUIDE.md](../erix-store/QUICK-START-GUIDE.md)** - Quick start guide
- **[ARCHITECTURE.md](../erix-store/ARCHITECTURE.md)** - System architecture

## 🧪 Examples

Run practical examples:

```bash
# Simple Google Maps scraping
pnpm automation:examples 1

# Batch processing
pnpm automation:examples 2

# Priority queue
pnpm automation:examples 3

# Scheduled jobs
pnpm automation:examples 4

# Monitor job progress
pnpm automation:examples 5 <jobId>

# Subscribe to events
pnpm automation:examples 6

# IndiaMart search
pnpm automation:examples 7

# Deep crawler
pnpm automation:examples 8

# Wait for completion
pnpm automation:examples 9 <jobId>

# Batch with progress tracking
pnpm automation:examples 10
```

## 🧪 Testing

```bash
# Test session isolation
pnpm test:session:isolation

# Test all actors
pnpm test:actors

# Test worker
pnpm test:work

# Test production integration
pnpm test:production
```

## 📊 Monitoring

### Worker Statistics
```typescript
import { getLAIEStats } from '@lib/laie'

const stats = getLAIEStats()
console.log(stats)
// {
//   totalJobsProcessed: 1234,
//   successfulJobs: 1200,
//   failedJobs: 34,
//   currentConcurrency: 5,
//   isRunning: true,
//   activeJobs: 5
// }
```

### Health Check
```bash
curl https://api.ecodrix.com/health/browser-pool
```

### Queue Analytics
```typescript
const usage = await client.analytics.usage()
console.log('Queue depth:', usage['queue:waiting'])
```

## 🔧 Configuration

### Environment Variables (Already Set)
```bash
# ERIX-Store
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=erix_19d13b9a9a9e72f0c9d65f2de05cdf70fa1b7b3d64d845b89f49f39501aedac3
ERIX_TENANT_ID=laie

# Session Isolation (5 GCE Instances)
BROWSERLESS_INSTANCES=ws://34.67.120.145:3000,ws://34.70.195.57:3000,...
BROWSERLESS_TOKEN=408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8

# LAIE
LAIE_API_KEY=8469640326c3a05fcb47fa1277a205607bb8ae3320193a826217d066fabe18c0
```

### Worker Configuration
Edit `src/lib/laie/index.ts`:

```typescript
const worker = new ErixWorker(client, 'laie-scrapers', handler, {
  pollIntervalMs: 5000,        // Poll every 5 seconds
  maxConcurrentJobs: 10,       // Process 10 jobs at once
  heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
})
```

## 🎨 Available Actors

### 1. Google Maps (`google-maps`)
```typescript
{
  actor: 'google-maps',
  input: {
    query: string;           // e.g., "restaurants in NYC"
    maxResults?: number;     // Default: 20
    includeReviews?: boolean; // Default: false
  }
}
```

### 2. IndiaMart (`indiamart`)
```typescript
{
  actor: 'indiamart',
  input: {
    query: string;           // e.g., "industrial pumps"
    maxResults?: number;     // Default: 20
  }
}
```

### 3. TradeIndia (`tradeindia`)
```typescript
{
  actor: 'tradeindia',
  input: {
    query: string;           // e.g., "textile machinery"
    maxResults?: number;     // Default: 20
  }
}
```

### 4. Deep Crawler (`deep-crawler`)
```typescript
{
  actor: 'deep-crawler',
  input: {
    url: string;
    selectors: {
      [key: string]: string;  // CSS selectors
    };
    maxDepth?: number;        // Default: 1
    followLinks?: boolean;    // Default: false
  }
}
```

## 🔗 API Endpoints

### Enqueue Job
```http
POST /api/laie/session/jobs
Authorization: Bearer <LAIE_API_KEY>
Content-Type: application/json

{
  "actor": "google-maps",
  "input": {
    "query": "restaurants in NYC",
    "maxResults": 50
  }
}
```

### Get Job Status
```http
GET /api/laie/session/jobs/:jobId
Authorization: Bearer <LAIE_API_KEY>
```

### Health Check
```http
GET /api/laie/session/health
```

### Worker Statistics
```http
GET /api/laie/session/stats
```

### Browser Pool Health
```http
GET /health/browser-pool
```

## 💡 Use Cases

### Lead Generation
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: {
    query: 'real estate agents in Miami',
    maxResults: 500,
    includeReviews: true
  }
})
```

### Market Research
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'deep-crawler',
  input: {
    url: 'https://competitor.com/products',
    selectors: {
      name: '.product-name',
      price: '.price',
      features: '.features li'
    },
    maxDepth: 3,
    followLinks: true
  }
})
```

### Supplier Discovery
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'indiamart',
  input: {
    query: 'industrial machinery',
    maxResults: 200
  }
})
```

### Price Monitoring
```typescript
// Run daily
setInterval(async () => {
  await client.queueV2.push('laie-scrapers', {
    actor: 'deep-crawler',
    input: {
      url: 'https://example.com/products',
      selectors: { price: '.price' }
    }
  })
}, 86400000) // Every 24 hours
```

## 🛠️ Troubleshooting

### Worker Not Processing Jobs?
```typescript
const stats = getLAIEStats()
console.log('Worker running:', stats?.isRunning)
```

### Jobs Failing?
```typescript
const job = await client.queueV2.get(jobId)
console.log('Error:', job.error)
```

### High Memory Usage?
- Reduce `maxConcurrentJobs` in worker config
- Check for memory leaks in actors
- Monitor browser pool usage

### Slow Processing?
- Increase `maxConcurrentJobs`
- Reduce `pollIntervalMs`
- Add more browser instances

## 📈 Performance

### Current Capacity
- **5 Browser Instances** (GCE f1-micro)
- **50 Concurrent Sessions** (10 per instance)
- **10 Concurrent Jobs** (worker config)
- **~100-1000 jobs/hour** (depends on job complexity)

### Scaling Options

**Horizontal Scaling** (Add more workers):
```typescript
// Deploy multiple server instances
// Each runs its own worker
// All connect to same ERIX-Store
```

**Vertical Scaling** (More concurrent jobs):
```typescript
const worker = new ErixWorker(client, 'laie-scrapers', handler, {
  maxConcurrentJobs: 20, // Increase from 10
})
```

**Browser Pool Scaling** (Add more instances):
```bash
# Add more GCE instances to BROWSERLESS_INSTANCES
BROWSERLESS_INSTANCES=ws://ip1:3000,ws://ip2:3000,...,ws://ip10:3000
```

## 🎯 Best Practices

1. ✅ **Use Priority** for important jobs
2. ✅ **Set Retry Limits** to prevent infinite loops
3. ✅ **Monitor Progress** for long-running jobs
4. ✅ **Handle Errors** gracefully
5. ✅ **Use Batch Processing** for multiple jobs
6. ✅ **Subscribe to Events** for real-time updates
7. ✅ **Check Health** before enqueueing many jobs

## 🔒 Security

- ✅ API Key authentication
- ✅ Tenant isolation
- ✅ Secure token storage
- ✅ HTTPS/TLS encryption
- ✅ Environment variable configuration

## 📞 Support

- **Documentation**: See guides above
- **Examples**: `scripts/automation-examples.ts`
- **Issues**: GitHub Issues
- **Email**: contact@ecodrix.com

## 🎉 Summary

Your ECOD server is now a **complete automation platform** with:

✅ **4 Built-in Actors** (Google Maps, IndiaMart, TradeIndia, Deep Crawler)
✅ **Session Isolation** (5 GCE instances with IP rotation)
✅ **Auto-Polling Worker** (processes jobs automatically)
✅ **Priority Queue** (high-priority jobs first)
✅ **Retry Logic** (automatic retry on failure)
✅ **Progress Tracking** (monitor jobs in real-time)
✅ **Health Monitoring** (check system health anytime)
✅ **Scalable** (add more workers or browser instances)

**Start automating now!** 🚀

```bash
# Run examples
pnpm automation:examples 1

# Start server
pnpm dev

# Test everything
pnpm test:session:isolation
```

---

**Built with ❤️ using ERIX-Worker**
