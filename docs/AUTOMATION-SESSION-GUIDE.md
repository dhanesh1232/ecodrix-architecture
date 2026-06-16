# ECOD Server - Automation & Session Management Guide

## Overview

The ECOD server is now equipped with a complete automation and session isolation system powered by **ERIX-Worker** and **LAIE (Lead AI Engine)**. This guide shows you how to use it for various automation tasks.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOD Server (Render)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              LAIE (Lead AI Engine)                         │ │
│  │                                                            │ │
│  │  ┌──────────────┐         ┌──────────────────────┐       │ │
│  │  │ ErixClient   │         │   ErixWorker         │       │ │
│  │  │ (Queue Ops)  │         │   (Auto-polling)     │       │ │
│  │  └──────┬───────┘         └──────────┬───────────┘       │ │
│  │         │                            │                    │ │
│  │         │  ┌─────────────────────────┘                    │ │
│  │         │  │                                               │ │
│  │         ▼  ▼                                               │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │         Actor Registry                        │        │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │        │ │
│  │  │  │Google    │  │IndiaMart │  │TradeIndia│   │        │ │
│  │  │  │Maps      │  │Scraper   │  │Scraper   │   │        │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘   │        │ │
│  │  │  ┌──────────────────────────────────────┐   │        │ │
│  │  │  │      Deep Crawler (Universal)        │   │        │ │
│  │  │  └──────────────────────────────────────┘   │        │ │
│  │  └──────────────────────────────────────────────┘        │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │         Session Isolation System              │        │ │
│  │  │  ┌──────────────┐    ┌──────────────────┐   │        │ │
│  │  │  │SessionManager│    │   BrowserPool    │   │        │ │
│  │  │  │(IP Rotation) │    │(5 GCE Instances) │   │        │ │
│  │  │  └──────────────┘    └──────────────────┘   │        │ │
│  │  └──────────────────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   ERIX-Store Server      │
              │   (Queue Backend)        │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   Browser Pool (GCP)     │
              │   5 x f1-micro instances │
              │   34.67.120.145:3000     │
              │   34.70.195.57:3000      │
              │   34.57.152.115:3000     │
              │   34.57.3.86:3000        │
              │   34.71.205.62:3000      │
              └──────────────────────────┘
```

## Current Configuration

### Environment Variables (Already Set)
```bash
# ERIX-Store Configuration
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=erix_19d13b9a9a9e72f0c9d65f2de05cdf70fa1b7b3d64d845b89f49f39501aedac3
ERIX_TENANT_ID=laie

# Session Isolation (5 GCE Instances)
BROWSERLESS_INSTANCES=ws://34.67.120.145:3000,ws://34.70.195.57:3000,ws://34.57.152.115:3000,ws://34.57.3.86:3000,ws://34.71.205.62:3000
BROWSERLESS_TOKEN=408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8

# LAIE Configuration
LAIE_API_KEY=8469640326c3a05fcb47fa1277a205607bb8ae3320193a826217d066fabe18c0
LAIE_DATABASE_URL=postgresql://postgres.bnchmgyybdsklxrumcnd:gZn79UnIYxAKBFys@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

## Available Actors (Automation Tasks)

### 1. Google Maps Scraper
**Purpose**: Extract business data from Google Maps

**Input**:
```typescript
{
  query: string;           // e.g., "restaurants in NYC"
  maxResults?: number;     // Default: 20
  includeReviews?: boolean; // Default: false
}
```

**Output**:
```typescript
{
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  category: string;
  coordinates: { lat: number; lng: number };
  sessionId: string;       // For traceability
  ipAddress: string;       // Which browser instance
}
```

**Example**:
```typescript
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: {
    query: 'coffee shops in San Francisco',
    maxResults: 50,
    includeReviews: true
  }
})
```

### 2. IndiaMart Scraper
**Purpose**: Extract supplier data from IndiaMart

**Input**:
```typescript
{
  query: string;           // e.g., "industrial pumps"
  maxResults?: number;     // Default: 20
}
```

**Output**:
```typescript
{
  companyName: string;
  products: string[];
  contact: string;
  location: string;
  gstNumber?: string;
  sessionId: string;
  ipAddress: string;
}
```

### 3. TradeIndia Scraper
**Purpose**: Extract supplier data from TradeIndia

**Input**:
```typescript
{
  query: string;           // e.g., "textile machinery"
  maxResults?: number;     // Default: 20
}
```

**Output**:
```typescript
{
  companyName: string;
  products: string[];
  contact: string;
  location: string;
  sessionId: string;
  ipAddress: string;
}
```

### 4. Deep Crawler (Universal)
**Purpose**: Crawl any website with custom selectors

**Input**:
```typescript
{
  url: string;
  selectors: {
    [key: string]: string;  // CSS selectors
  };
  maxDepth?: number;        // Default: 1
  followLinks?: boolean;    // Default: false
}
```

**Output**:
```typescript
{
  url: string;
  data: Record<string, any>;
  links: string[];
  sessionId: string;
  ipAddress: string;
}
```

**Example**:
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

## Usage Examples

### 1. Simple Job Enqueue

```typescript
import { ErixClient } from '@ecodrix/erix-client'

const client = new ErixClient({
  baseUrl: process.env.ERIX_STORE_URL!,
  apiKey: process.env.ERIX_API_KEY!,
  tenantId: process.env.ERIX_TENANT_ID!,
})

// Enqueue a Google Maps scraping job
const job = await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: {
    query: 'restaurants in NYC',
    maxResults: 100
  }
}, {
  priority: 10,  // High priority
  maxAttempts: 3 // Retry up to 3 times
})

console.log('Job enqueued:', job.id)
```

### 2. Monitor Job Progress

```typescript
// Get job status
const job = await client.queueV2.get(jobId)
console.log('Status:', job.status)
console.log('Progress:', job.progress)

// Subscribe to job events
const subscription = client.queueV2.subscribe('laie-scrapers', {
  onCompleted: (job) => {
    console.log('Job completed:', job.id)
    console.log('Result:', job.result)
  },
  onFailed: (job) => {
    console.log('Job failed:', job.id)
    console.log('Error:', job.error)
  }
})
```

### 3. Batch Processing

```typescript
// Enqueue multiple jobs
const queries = [
  'restaurants in NYC',
  'hotels in LA',
  'cafes in SF'
]

const jobs = await Promise.all(
  queries.map(query =>
    client.queueV2.push('laie-scrapers', {
      actor: 'google-maps',
      input: { query, maxResults: 50 }
    })
  )
)

console.log(`Enqueued ${jobs.length} jobs`)
```

### 4. Scheduled Jobs

```typescript
// Run job at specific time
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
}, {
  runAt: new Date('2024-12-31T23:59:59Z')
})

// Run job after delay
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: { query: 'restaurants in NYC' }
}, {
  delayMs: 3600000 // 1 hour
})
```

### 5. Priority Queue

```typescript
// High priority (processed first)
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: { query: 'urgent query' }
}, {
  priority: 100
})

// Low priority (processed last)
await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: { query: 'background task' }
}, {
  priority: 1
})
```

## Session Isolation Features

### Automatic IP Rotation
Each job gets a unique session with a different IP address from the browser pool:

```typescript
// Job 1 → 34.67.120.145
// Job 2 → 34.70.195.57
// Job 3 → 34.57.152.115
// Job 4 → 34.57.3.86
// Job 5 → 34.71.205.62
// Job 6 → 34.67.120.145 (rotates back)
```

### Session Traceability
Every result includes session information:

```typescript
{
  ...data,
  sessionId: "sess_abc123",
  ipAddress: "34.67.120.145"
}
```

### Browser Pool Health Check

```bash
curl https://api.ecodrix.com/health/browser-pool
```

Response:
```json
{
  "status": "healthy",
  "browserPool": {
    "totalInstances": 5,
    "totalActiveJobs": 3,
    "capacity": 50,
    "utilization": 6,
    "instances": [
      {
        "ip": "34.67.120.145",
        "activeJobs": 1,
        "status": "available"
      },
      ...
    ]
  }
}
```

## API Endpoints

### 1. Enqueue Job
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

### 2. Get Job Status
```http
GET /api/laie/session/jobs/:jobId
Authorization: Bearer <LAIE_API_KEY>
```

### 3. Health Check
```http
GET /api/laie/session/health
```

### 4. Worker Statistics
```http
GET /api/laie/session/stats
```

Response:
```json
{
  "totalJobsProcessed": 1234,
  "successfulJobs": 1200,
  "failedJobs": 34,
  "currentConcurrency": 5,
  "isRunning": true,
  "activeJobs": 5
}
```

## Worker Configuration

The worker is configured in `src/lib/laie/index.ts`:

```typescript
const worker = new ErixWorker(client, 'laie-scrapers', handler, {
  pollIntervalMs: 5000,        // Poll every 5 seconds
  maxConcurrentJobs: 10,       // Process 10 jobs at once
  heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
})
```

### Adjust for Your Needs

**High Throughput** (more jobs, faster):
```typescript
{
  pollIntervalMs: 2000,        // Poll every 2 seconds
  maxConcurrentJobs: 20,       // Process 20 jobs at once
  heartbeatIntervalMs: 15000,  // Heartbeat every 15 seconds
}
```

**Resource Constrained** (fewer jobs, slower):
```typescript
{
  pollIntervalMs: 10000,       // Poll every 10 seconds
  maxConcurrentJobs: 5,        // Process 5 jobs at once
  heartbeatIntervalMs: 60000,  // Heartbeat every 60 seconds
}
```

## Testing

### Test Session Isolation
```bash
pnpm test:session:isolation
```

This will:
1. Enqueue 5 test jobs (mix of actors)
2. Wait for completion
3. Verify IP rotation
4. Display results summary

### Test All Actors
```bash
pnpm test:actors
```

### Test Worker
```bash
pnpm test:work
```

## Monitoring

### View Worker Logs
```bash
# In production (Render)
# Check Render dashboard logs

# In development
pnpm dev
# Watch console for:
# 🚀 LAIE initialized with auto-starting worker
# 📊 Worker polling 'laie-scrapers' queue every 5 seconds
# Processing job: <jobId>
# ✅ Job completed: <jobId>
```

### Monitor Queue Depth
```typescript
const stats = await client.analytics.usage()
console.log('Queue depth:', stats['queue:waiting'])
```

### Set Up Alerts
```typescript
const subscription = client.analytics.subscribeAlerts((alert) => {
  if (alert.metric === 'queue:fail') {
    // Send alert to Slack/Email
    console.error(`ALERT: ${alert.message}`)
  }
})
```

## Common Use Cases

### 1. Lead Generation
```typescript
// Scrape Google Maps for leads
const job = await client.queueV2.push('laie-scrapers', {
  actor: 'google-maps',
  input: {
    query: 'real estate agents in Miami',
    maxResults: 500,
    includeReviews: true
  }
})
```

### 2. Market Research
```typescript
// Scrape competitor data
const job = await client.queueV2.push('laie-scrapers', {
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

### 3. Supplier Discovery
```typescript
// Find suppliers on IndiaMart
const job = await client.queueV2.push('laie-scrapers', {
  actor: 'indiamart',
  input: {
    query: 'industrial machinery',
    maxResults: 200
  }
})
```

### 4. Price Monitoring
```typescript
// Monitor prices daily
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

## Best Practices

### 1. Use Priority for Important Jobs
```typescript
await client.queueV2.push('laie-scrapers', data, {
  priority: 100 // High priority
})
```

### 2. Set Reasonable Retry Limits
```typescript
await client.queueV2.push('laie-scrapers', data, {
  maxAttempts: 3 // Retry up to 3 times
})
```

### 3. Monitor Job Progress
```typescript
// For long-running jobs
const subscription = client.queueV2.subscribe('laie-scrapers', {
  onActive: (job) => console.log('Started:', job.id),
  onCompleted: (job) => console.log('Done:', job.id),
  onFailed: (job) => console.error('Failed:', job.id, job.error)
})
```

### 4. Handle Errors Gracefully
```typescript
try {
  const job = await client.queueV2.push('laie-scrapers', data)
  // Wait for completion
  const result = await waitForJob(job.id)
} catch (error) {
  console.error('Job failed:', error)
  // Implement fallback logic
}
```

### 5. Use Batch Processing
```typescript
// Instead of 100 individual requests
const jobs = await Promise.all(
  items.map(item =>
    client.queueV2.push('laie-scrapers', {
      actor: 'google-maps',
      input: item
    })
  )
)
```

## Troubleshooting

### Worker Not Processing Jobs
1. Check worker is running: `getLAIEStats()`
2. Check environment variables
3. Check ERIX-Store is reachable: `await client.ping()`
4. Check logs for errors

### Jobs Failing
1. Check job error: `await client.queueV2.get(jobId)`
2. Check actor exists in `ACTOR_REGISTRY`
3. Check input format is correct
4. Check browser pool health

### High Memory Usage
1. Reduce `maxConcurrentJobs`
2. Check for memory leaks in actors
3. Monitor browser pool usage

### Slow Processing
1. Increase `maxConcurrentJobs`
2. Reduce `pollIntervalMs`
3. Add more browser instances
4. Check network latency

## Summary

Your ECOD server is now a complete automation platform with:

✅ **4 Built-in Actors**: Google Maps, IndiaMart, TradeIndia, Deep Crawler
✅ **Session Isolation**: 5 GCE browser instances with IP rotation
✅ **Auto-Polling Worker**: Processes jobs automatically
✅ **Priority Queue**: High-priority jobs processed first
✅ **Retry Logic**: Automatic retry on failure
✅ **Progress Tracking**: Monitor job progress in real-time
✅ **Health Monitoring**: Check system health anytime
✅ **Scalable**: Add more workers or browser instances as needed

**Start automating now!** 🚀
