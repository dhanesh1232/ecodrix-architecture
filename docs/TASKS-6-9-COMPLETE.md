# Tasks 6-9: Actor Handlers with Session Isolation - COMPLETE ✅

## Summary

Successfully updated all 4 actor handlers to use session isolation with SessionManager and BrowserPool.

---

## ✅ Task 6: Google Maps Actor Handler

### Changes
- **File**: `ECOD/server/src/lib/laie/actors/google-maps/index.ts`
- **Type**: Browser-based scraper (uses BrowserPool)
- **Session Isolation**: Full (SessionManager + BrowserPool + isolated contexts)

### Key Features
- Creates isolated session with unique IP
- Gets browser context from pool
- Includes sessionId and ipAddress in results
- Nested try-finally cleanup (page → context → session)
- Progress tracking: 10%, 30%, 50%, 70%, 90%, 100%

---

## ✅ Task 7: IndiaMart Actor Handler

### Changes
- **File**: `ECOD/server/src/lib/laie/actors/indiamart/index.ts`
- **Type**: HTTP-based scraper (uses ProxyKit + Cheerio)
- **Session Isolation**: Partial (SessionManager only, no browser needed)

### Key Features
- Creates isolated session with unique IP
- Uses ProxyKit for HTTP fetching (SSR content)
- Includes sessionId and ipAddress in results
- Try-finally cleanup for session
- Progress tracking: 10%, 50%, 80%, 100%

---

## ✅ Task 8: TradeIndia Actor Handler

### Changes
- **File**: `ECOD/server/src/lib/laie/actors/tradeindia/index.ts`
- **Type**: HTTP-based scraper (uses ProxyKit + Cheerio)
- **Session Isolation**: Partial (SessionManager only, no browser needed)

### Key Features
- Creates isolated session with unique IP
- Uses ProxyKit for HTTP fetching (SSR content)
- Includes sessionId and ipAddress in results
- Try-finally cleanup for session
- Progress tracking: 10%, 50%, 80%, 100%

---

## ✅ Task 9: Deep Crawler Actor Handler

### Changes
- **File**: `ECOD/server/src/lib/laie/actors/deep-crawler/index.ts`
- **Type**: HTTP-based crawler (uses ProxyKit + Cheerio)
- **Session Isolation**: Partial (SessionManager only, no browser needed)

### Key Features
- Creates isolated session with unique IP
- Uses ProxyKit for HTTP fetching (SSR content)
- Includes sessionId and ipAddress in all crawled pages
- Try-finally cleanup for session
- Progress tracking: 5% → 95% (dynamic based on pages crawled) → 100%

---

## Architecture Comparison

### Browser-Based Actors (Google Maps)
```
Actor Handler
    ↓
SessionManager.createSession() → Assigns unique IP
    ↓
BrowserPool.getContextForSession() → Connects to Browserless
    ↓
Isolated Browser Context → Stealth mode + user agent rotation
    ↓
Scraping Logic
    ↓
Results + Session Metadata
    ↓
Cleanup: page.close() → releaseContext() → destroySession()
```

### HTTP-Based Actors (IndiaMart, TradeIndia, Deep Crawler)
```
Actor Handler
    ↓
SessionManager.createSession() → Assigns unique IP
    ↓
ProxyKit.fetch() → HTTP requests with session tracking
    ↓
Cheerio Parsing → Fast SSR content extraction
    ↓
Results + Session Metadata
    ↓
Cleanup: destroySession()
```

---

## Benefits

### 1. **Session Isolation**
- Each job runs with a unique session ID
- Complete isolation between concurrent jobs
- No cookie/state sharing between sessions

### 2. **IP Rotation**
- Round-robin IP assignment across 5 instances
- Automatic distribution of load
- Reduces rate limiting and blocking

### 3. **Traceability**
- Every result includes `sessionId` and `ipAddress`
- Easy debugging and monitoring
- Track which IP was used for each scrape

### 4. **Resource Management**
- Proper cleanup prevents memory leaks
- Browser contexts released after use
- Sessions destroyed after completion

### 5. **Scalability**
- Supports 50 concurrent sessions (5 instances × 10 each)
- Browser-based: 10 concurrent per instance
- HTTP-based: Higher concurrency (no browser overhead)

---

## Testing

### Test Google Maps (Browser-Based)
```bash
curl -X POST https://store.ecodrix.com/queue/v2/laie-scrapers/jobs \
  -H "Content-Type: application/json" \
  -H "x-erix-api-key: YOUR_KEY" \
  -d '{
    "data": {
      "actor": "google-maps",
      "input": {
        "query": "restaurants in Hyderabad",
        "maxResults": 10
      }
    }
  }'
```

### Test IndiaMart (HTTP-Based)
```bash
curl -X POST https://store.ecodrix.com/queue/v2/laie-scrapers/jobs \
  -H "Content-Type: application/json" \
  -H "x-erix-api-key: YOUR_KEY" \
  -d '{
    "data": {
      "actor": "indiamart",
      "input": {
        "query": "industrial equipment",
        "maxResults": 20
      }
    }
  }'
```

### Test TradeIndia (HTTP-Based)
```bash
curl -X POST https://store.ecodrix.com/queue/v2/laie-scrapers/jobs \
  -H "Content-Type: application/json" \
  -H "x-erix-api-key: YOUR_KEY" \
  -d '{
    "data": {
      "actor": "tradeindia",
      "input": {
        "query": "textile machinery",
        "maxResults": 15
      }
    }
  }'
```

### Test Deep Crawler (HTTP-Based)
```bash
curl -X POST https://store.ecodrix.com/queue/v2/laie-scrapers/jobs \
  -H "Content-Type: application/json" \
  -H "x-erix-api-key: YOUR_KEY" \
  -d '{
    "data": {
      "actor": "deep-crawler",
      "input": {
        "url": "https://example.com",
        "maxDepth": 2,
        "maxPages": 10
      }
    }
  }'
```

---

## Acceptance Criteria ✅

### Task 6: Google Maps
- [x] Actor directory structure exists
- [x] GoogleMapsActorInput/Output interfaces defined
- [x] Session created at start
- [x] Browser context obtained from pool
- [x] Progress updates implemented
- [x] Results include sessionId and ipAddress
- [x] Nested try-finally cleanup
- [x] Error handling implemented

### Task 7: IndiaMart
- [x] Actor directory structure exists
- [x] IndiaMartActorInput/Output interfaces defined
- [x] Session isolation integrated
- [x] Progress tracking implemented
- [x] Results include sessionId and ipAddress
- [x] Try-finally cleanup
- [x] Error handling implemented

### Task 8: TradeIndia
- [x] Actor directory structure exists
- [x] TradeIndiaActorInput/Output interfaces defined
- [x] Session isolation integrated
- [x] Progress tracking implemented
- [x] Results include sessionId and ipAddress
- [x] Try-finally cleanup
- [x] Error handling implemented

### Task 9: Deep Crawler
- [x] Actor directory structure exists
- [x] DeepCrawlerActorInput/Output interfaces defined
- [x] Session isolation integrated
- [x] Progress tracking implemented
- [x] Results include sessionId and ipAddress
- [x] Try-finally cleanup
- [x] Error handling implemented

---

## Next Steps

### **Task 10: Create Actor Worker Runner** (High Priority)
- Worker process that polls ERIX-Store job queue
- Executes actor handlers with proper error handling
- Marks jobs as active/completed/failed
- Graceful shutdown on SIGTERM
- Estimated: 1 hour

### **Task 11-13: Testing** (Medium Priority)
- Unit tests for SessionManager
- Unit tests for BrowserPool
- Integration tests for session isolation
- Estimated: 2.5 hours

### **Task 14: Test Script** (Medium Priority)
- Manual test script for end-to-end verification
- Estimated: 30 minutes

---

## Files Modified

1. `ECOD/server/src/lib/laie/actors/google-maps/index.ts`
2. `ECOD/server/src/lib/laie/actors/indiamart/index.ts`
3. `ECOD/server/src/lib/laie/actors/tradeindia/index.ts`
4. `ECOD/server/src/lib/laie/actors/deep-crawler/index.ts`

---

**Completed**: 2026-05-11  
**Status**: ✅ READY FOR TASK 10 (Actor Worker Runner)
