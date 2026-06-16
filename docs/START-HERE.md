# 🚀 START HERE - ECOD Server Automation Platform

## Welcome! 👋

Your ECOD server is now a **complete automation platform** powered by ERIX-Worker. This guide will get you started in 5 minutes.

## ⚡ Quick Start (5 Minutes)

### Step 1: Start the Server (1 min)
```bash
cd ECOD/server
pnpm dev
```

You should see:
```
🚀 Initializing LAIE (Lead AI Engine)
✅ LAIE initialized with auto-starting worker
📊 Worker polling 'laie-scrapers' queue every 5 seconds
Server running at http://localhost:4000
```

### Step 2: Run Your First Automation (2 min)
```bash
# Open a new terminal
pnpm automation:examples 1
```

This will scrape Google Maps for coffee shops in San Francisco!

### Step 3: Test Everything (2 min)
```bash
pnpm test:session:isolation
```

This will run 5 test jobs and verify session isolation is working.

## ✅ What You Have

### 🤖 4 Built-in Actors
1. **Google Maps** - Extract business data
2. **IndiaMart** - Find suppliers
3. **TradeIndia** - Find suppliers
4. **Deep Crawler** - Scrape any website

### 🔒 Session Isolation
- 5 GCE browser instances
- Automatic IP rotation
- 50 concurrent sessions

### ⚙️ Auto-Polling Worker
- Processes jobs automatically
- 10 concurrent jobs
- Automatic retry on failure

## 📚 Documentation

### Start Here
1. **[READY-TO-USE.md](./READY-TO-USE.md)** ⭐ - Everything you need to know
2. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick reference card
3. **[AUTOMATION-README.md](./AUTOMATION-README.md)** - Main guide

### Deep Dive
4. **[AUTOMATION-SESSION-GUIDE.md](./AUTOMATION-SESSION-GUIDE.md)** - Complete guide
5. **[scripts/automation-examples.ts](./scripts/automation-examples.ts)** - 10 examples

### Package Docs
6. **[../erix-store/ERIX-WORKER-PACKAGE.md](../erix-store/ERIX-WORKER-PACKAGE.md)** - Worker package
7. **[../erix-store/QUICK-START-GUIDE.md](../erix-store/QUICK-START-GUIDE.md)** - Quick start
8. **[../erix-store/ARCHITECTURE.md](../erix-store/ARCHITECTURE.md)** - Architecture

## 🎯 Common Tasks

### Scrape Google Maps (Redis + BullMQ Pattern)
```typescript
import { scraperQueue } from '@lib/erix'

// Add job to queue (like BullMQ queue.add())
await scraperQueue.add('google-maps', {
  actor: 'google-maps',
  input: {
    query: 'restaurants in NYC',
    maxResults: 100
  }
})
```

### Find Suppliers
```typescript
await scraperQueue.add('indiamart', {
  actor: 'indiamart',
  input: {
    query: 'industrial machinery',
    maxResults: 200
  }
})
```

### Scrape Any Website
```typescript
await scraperQueue.add('deep-crawler', {
  actor: 'deep-crawler',
  input: {
    url: 'https://example.com/products',
    selectors: {
      title: 'h1.product-title',
      price: '.price'
    }
  }
})
```

## 🧪 Examples

Run practical examples (Redis + BullMQ pattern):

```bash
# 1. Simple scraping (like BullMQ queue.add())
pnpm example:simple

# 2. Worker setup (like BullMQ Worker)
pnpm example:worker

# 3. Complete setup (Redis + BullMQ pattern)
pnpm example:complete

# 4. Priority and delayed jobs
pnpm example:priority

# 5. Real-world usage (Express API)
pnpm example:realworld
```

### Legacy Examples (Direct client usage)
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

# Test production
pnpm test:production
```

## 📊 Monitoring

### Worker Statistics
```bash
curl http://localhost:4000/api/laie/session/stats
```

### Browser Pool Health
```bash
curl http://localhost:4000/health/browser-pool
```

### In Code
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

## 🔧 Configuration

### Environment Variables (Already Set)
```bash
ERIX_STORE_URL=https://store.ecodrix.com
ERIX_API_KEY=erix_19d13b9a9a9e72f0c9d65f2de05cdf70fa1b7b3d64d845b89f49f39501aedac3
ERIX_TENANT_ID=laie

BROWSERLESS_INSTANCES=ws://34.67.120.145:3000,ws://34.70.195.57:3000,...
BROWSERLESS_TOKEN=408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8

LAIE_API_KEY=8469640326c3a05fcb47fa1277a205607bb8ae3320193a826217d066fabe18c0
```

### Worker Configuration (src/lib/laie/index.ts)
```typescript
{
  pollIntervalMs: 5000,        // Poll every 5 seconds
  maxConcurrentJobs: 10,       // Process 10 jobs at once
  heartbeatIntervalMs: 30000,  // Heartbeat every 30 seconds
}
```

## 💡 Use Cases

### 1. Lead Generation
```bash
pnpm automation:examples 1
# Scrapes Google Maps for leads
```

### 2. Market Research
```bash
pnpm automation:examples 8
# Scrapes competitor websites
```

### 3. Supplier Discovery
```bash
pnpm automation:examples 7
# Finds suppliers on IndiaMart
```

### 4. Price Monitoring
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

### Worker Not Starting?
```bash
# Check logs
pnpm dev

# Look for:
# 🚀 Initializing LAIE (Lead AI Engine)
# ✅ LAIE initialized with auto-starting worker
```

### Jobs Not Processing?
```typescript
import { getLAIEStats } from '@lib/laie'
const stats = getLAIEStats()
console.log('Worker running:', stats?.isRunning)
```

### Browser Pool Issues?
```bash
curl http://localhost:4000/health/browser-pool
```

## 📞 Need Help?

1. **Read the docs**: Start with [READY-TO-USE.md](./READY-TO-USE.md)
2. **Run examples**: `pnpm automation:examples`
3. **Check tests**: `pnpm test:session:isolation`
4. **Email**: contact@ecodrix.com

## 🎉 What's Next?

### Immediate
1. ✅ Run examples: `pnpm automation:examples 1`
2. ✅ Test everything: `pnpm test:session:isolation`
3. ✅ Read docs: [READY-TO-USE.md](./READY-TO-USE.md)

### Short Term
1. 🔄 Deploy to production
2. 🔄 Monitor performance
3. 🔄 Adjust configuration
4. 🔄 Add custom actors (if needed)

### Long Term
1. 🔄 Scale horizontally (add more workers)
2. 🔄 Scale browser pool (add more instances)
3. 🔄 Optimize performance
4. 🔄 Add monitoring alerts

## 📦 What's Included

### Packages
- ✅ `@ecodrix/erix-worker` - Auto-polling job processor
- ✅ `@ecodrix/erix-client` - Queue operations

### Actors
- ✅ Google Maps scraper
- ✅ IndiaMart scraper
- ✅ TradeIndia scraper
- ✅ Deep Crawler (universal)

### Infrastructure
- ✅ 5 GCE browser instances
- ✅ Session isolation
- ✅ IP rotation
- ✅ Health monitoring

### Documentation
- ✅ 8 comprehensive guides
- ✅ 10 practical examples
- ✅ Quick reference card
- ✅ API documentation

### Testing
- ✅ Integration tests
- ✅ Actor tests
- ✅ Worker tests
- ✅ Production tests

## 🚀 Ready to Go!

Everything is configured and working. Just run:

```bash
# Start server
pnpm dev

# Run examples
pnpm automation:examples 1

# Test everything
pnpm test:session:isolation
```

**Happy Automating!** 🎉

---

**Built with ❤️ using ERIX-Worker**
**Version**: 1.0.0
**Status**: ✅ Production Ready
**Date**: May 11, 2024

## 📋 Checklist

- [x] ERIX-Worker installed
- [x] ERIX-Client installed
- [x] 4 actors ready
- [x] Session isolation configured
- [x] 5 GCE instances running
- [x] Worker auto-starts
- [x] Documentation complete
- [x] Examples ready
- [x] Tests passing
- [x] Production ready

**Everything is ready to use!** ✅
