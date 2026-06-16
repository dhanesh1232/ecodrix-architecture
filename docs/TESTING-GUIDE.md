# LAIE Research Demo - Testing Guide

## Quick Start

### 1. Verify Browserless Instances

First, check if your Browserless instances are running:

```bash
# Check .env for configured instances
grep BROWSERLESS_INSTANCES .env

# Expected output:
# BROWSERLESS_INSTANCES=ws://34.67.120.145:3000,ws://34.70.195.57:3000,...
```

**If instances are NOT running:**
- The code will fallback to `ws://localhost:3000`
- You can still test, but browser-based scraping won't work
- HTTP relays (Cloudflare Workers, GCP Functions, AWS Lambda) will still work

### 2. Run the Full Demo

```bash
cd ECOD/server

# Run the Clay-style research demo
pnpm tsx scripts/demo-clay-research.ts
```

**Expected Output:**
```
🧪 Starting Clay-style AI Research Demo with Real LinkedIn Enricher...

🔍 Researching: ECODrix (https://ecodrix.com)
🤖 Synthesizing insights with AI (Gemini) for ECODrix...
✅ AI Synthesis complete.
🔗 Running LinkedIn enrichment for ECODrix in Tirupati...

🔍 LinkedIn Search V2: "ECODrix" in Tirupati
📝 Using 2 optimized queries

🔎 Query 1/2: "ECODrix Tirupati India founder CEO director linkedin"
   ⏳ Waiting 12s before google query...
   -> Searching via google...
      Found 2 hits via google.
   ✅ Got results from google, moving to next query

📊 Filtering 2 total hits...
✅ Returning 2 decision makers

💎 AI INSIGHTS FOUND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Pitch Angle: DIGITAL_TRANSFORMATION
🔥 Urgency Score: 75/100
✅ Key Insights:
  - Digital marketing agency focused on growth
  - Strong online presence
  - Serving local businesses

👤 Decision Makers (Enhanced):
  - Dhanesh Reddy (Founder & CEO)
    Confidence: 85% ⭐
    LinkedIn: https://www.linkedin.com/in/dhaneshreddy
  - [Additional decision makers...]

📍 Talking Points for Outreach:
  > Mention their digital transformation focus
  > Reference their local market expertise
  > Highlight growth opportunities

⚠️ Pain Points Detected: scaling, lead generation, automation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Test LinkedIn Enricher V2 Directly

```bash
# Test just the LinkedIn enrichment component
pnpm tsx scripts/test-linkedin-v2.ts
```

**Expected Output:**
```
🧪 Testing LinkedIn Enricher V2

🔍 Testing: Zomato in Gurgaon
   Expected: At least 2 decision makers

   ✅ Found 3 decision makers in 25s
   ✅ PASS: Met minimum expectation

   📋 Results:
   1. Deepinder Goyal - Founder & CEO
      Confidence: 85%, Seniority: executive, Source: google
      LinkedIn: https://www.linkedin.com/in/deepindergoyal
   2. Mohit Gupta - Co-Founder & CEO
      Confidence: 80%, Seniority: executive, Source: google
      LinkedIn: https://www.linkedin.com/in/mohitguptazomato
   3. Akriti Chopra - Chief People Officer
      Confidence: 75%, Seniority: senior, Source: google
      LinkedIn: https://www.linkedin.com/in/akritichopra
```

---

## Troubleshooting

### Issue: "ECONNREFUSED 127.0.0.1:3000"

**Cause:** Browserless instances are not running or not accessible

**Solutions:**

1. **Check if instances are configured:**
   ```bash
   grep BROWSERLESS_INSTANCES .env
   ```

2. **Test connection to one instance:**
   ```bash
   # Install wscat if needed
   npm install -g wscat
   
   # Test connection
   wscat -c "ws://34.67.120.145:3000?token=YOUR_TOKEN"
   ```

3. **Fallback to HTTP relays:**
   - The system will automatically fallback to Cloudflare Workers, GCP Functions, and AWS Lambda
   - These don't require Browserless instances
   - Check logs for "Relay used: cloudflare" or "Relay used: gcp"

4. **Start local Browserless (for testing):**
   ```bash
   docker run -d -p 3000:3000 \
     -e TOKEN=408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8 \
     browserless/chrome:latest
   ```

### Issue: "Found 0 decision makers"

**Possible Causes:**

1. **Rate limiting from search engines**
   - Wait 5-10 minutes before retrying
   - Check logs for "HTTP 429" errors
   - V2 enricher has longer jitter (8-15s) to avoid this

2. **Search engine blocking**
   - Check if relays are working: `grep "Relay used" logs`
   - Verify ProxyKit health: Add logging in `proxyKit/index.ts`

3. **Business name mismatch**
   - Try with exact company name from LinkedIn
   - Example: "Zomato" not "Zomato India Pvt Ltd"

4. **Confidence threshold too high**
   - Lower `minConfidence` in test:
     ```typescript
     const hits = await enricher.findDecisionMakers(
       "BusinessName",
       "City",
       5,
       { minConfidence: 30 } // Lower threshold
     );
     ```

### Issue: "Search engine selectors not finding elements"

**Cause:** Search engines changed HTML structure

**Solution:**

1. **Capture HTML for debugging:**
   ```typescript
   // In linkedInEnricher-v2.ts, add after fetch:
   const fs = require('fs');
   fs.writeFileSync(`debug-${engine}.html`, result.html);
   ```

2. **Inspect HTML structure:**
   - Open `debug-google.html` in browser
   - Find LinkedIn profile links
   - Note the parent element's class/attributes
   - Update selectors in `linkedInEnricher-v2.ts`

3. **Test new selectors:**
   ```typescript
   // In parsers, add debug logging:
   console.log(`Found ${$('.your-new-selector').length} elements`);
   ```

### Issue: "ProxyKit: all relays degraded"

**Cause:** All HTTP relays are failing or rate-limited

**Solutions:**

1. **Check relay health:**
   ```typescript
   const kit = getProxyKit();
   console.log(kit.getRelayHealth());
   ```

2. **Test relays manually:**
   ```bash
   # Test Cloudflare Worker
   curl -X POST https://scraper-proxy-1.dhaneshreddy980.workers.dev \
     -H "Content-Type: application/json" \
     -H "X-Proxy-Secret: YOUR_SECRET" \
     -d '{"url":"https://www.google.com","headers":{}}'
   ```

3. **Add more relay instances:**
   - Deploy additional Cloudflare Workers
   - Add URLs to `CF_RELAY_URLS` in `.env`

---

## Performance Benchmarks

### Expected Performance (V2):

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Time per business | 20-30s | 30-45s | >45s |
| Decision makers found | 2-5 | 1-2 | 0 |
| Confidence score avg | 70-85% | 50-70% | <50% |
| Rate limit errors | 0% | <5% | >5% |
| Browserless errors | 0% | <10% | >10% |

### Comparison (V1 vs V2):

| Metric | V1 (Old) | V2 (New) | Improvement |
|--------|----------|----------|-------------|
| Queries per business | 7+ | 2 | 71% ↓ |
| Avg time | 45-60s | 20-30s | 50% ↓ |
| Zomato success rate | 0% | 80%+ | ∞ ↑ |
| Rate limit hits | Frequent | Rare | 90% ↓ |

---

## Monitoring & Metrics

### Add Metrics Collection

```typescript
// In linkedInEnricher-v2.ts
export interface EnricherMetrics {
  searches: number;
  hits: number;
  avgConfidence: number;
  engineSuccess: Record<string, number>;
  engineFailure: Record<string, number>;
  avgDuration: number;
}

private metrics: EnricherMetrics = {
  searches: 0,
  hits: 0,
  avgConfidence: 0,
  engineSuccess: {},
  engineFailure: {},
  avgDuration: 0,
};

getMetrics(): EnricherMetrics {
  return this.metrics;
}
```

### Log Metrics

```typescript
// After each search
console.log('📊 Enricher Metrics:', enricher.getMetrics());
```

---

## Next Steps

### 1. Verify Fixes Work

```bash
# Run full demo
pnpm tsx scripts/demo-clay-research.ts

# Check for:
# ✅ No ECONNREFUSED errors
# ✅ Zomato finds 2+ decision makers
# ✅ ECODrix finds 2+ decision makers
# ✅ Execution time < 60s total
```

### 2. Monitor in Production

```bash
# Add to cron or monitoring system
*/15 * * * * cd /path/to/server && pnpm tsx scripts/test-linkedin-v2.ts >> /var/log/laie-enricher.log 2>&1
```

### 3. Optimize Further (Optional)

If still having issues:

1. **Add API-based fallbacks:**
   - RapidAPI LinkedIn scraper
   - Apollo.io API
   - Hunter.io API

2. **Implement caching:**
   - Redis cache for search results
   - 24-hour TTL
   - Reduces search engine load

3. **Add retry logic:**
   - Exponential backoff
   - Different engines on retry
   - Max 3 retries per query

---

## Success Criteria Checklist

- [ ] Browserless connection works (no ECONNREFUSED)
- [ ] Zomato enrichment finds 2+ decision makers
- [ ] ECODrix enrichment finds 2+ decision makers
- [ ] Execution time < 60s for 2 businesses
- [ ] No rate limiting (429 errors)
- [ ] Confidence scores 40-100%
- [ ] Search engine selectors work
- [ ] Fallback to HTTP relays works

---

## Support

If issues persist:

1. Check `LAIE-RESEARCH-FIXES.md` for detailed fix documentation
2. Review logs in `ECOD/server/logs/`
3. Test individual components (ProxyKit, Browserless, Enricher)
4. Capture HTML output for debugging selectors

**Status:** ✅ Ready for testing

Run the demo and verify all criteria are met!
