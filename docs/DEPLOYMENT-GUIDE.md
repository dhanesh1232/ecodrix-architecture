# Session Isolation - Deployment & Testing Guide

## ✅ What's Already Done

- [x] 5 GCE instances deployed and running
- [x] Browserless containers installed
- [x] Secure 256-bit token generated
- [x] Local .env file updated
- [x] Firewall rules configured

## 🚀 Deploy to Production (Render)

### Step 1: Update Render Environment Variables

Go to your Render dashboard → Your service → Environment

Add these 2 variables:

**Variable 1:**
```
Key: BROWSERLESS_INSTANCES
Value: ws://34.67.120.145:3000,ws://34.70.195.57:3000,ws://34.57.152.115:3000,ws://34.57.3.86:3000,ws://34.71.205.62:3000
```

**Variable 2:**
```
Key: BROWSERLESS_TOKEN
Value: 408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8
```

### Step 2: Deploy Your Code

```bash
# Commit and push your changes
git add .
git commit -m "Add session isolation with GCE browser pool"
git push origin main
```

Render will automatically deploy.

### Step 3: Verify Deployment

Check Render logs for:
```
✓ SessionManager initialized with 5 IPs
✓ BrowserPool initialized
```

---

## 🧪 Testing in Production

### Test 1: Health Check API

Create a health check endpoint to verify the browser pool is accessible.

**File**: `ECOD/server/src/routes/health.ts`

```typescript
import { Router } from 'express';
import { getSessionManager } from '@lib/laie/core/sessionManager';
import { getBrowserPool } from '@lib/laie/core/browserPool';

const router = Router();

router.get('/health/browser-pool', async (req, res) => {
  try {
    const sessionManager = getSessionManager();
    const browserPool = getBrowserPool();
    
    const sessionStats = sessionManager.getStats();
    const poolStats = browserPool.getStats();
    
    res.json({
      status: 'healthy',
      browserPool: {
        totalInstances: poolStats.totalInstances,
        totalActiveJobs: poolStats.totalActiveJobs,
        instances: poolStats.instances.map(i => ({
          ip: i.ipAddress,
          activeJobs: i.activeJobs,
          utilization: i.utilization
        }))
      },
      sessions: {
        total: sessionStats.totalSessions,
        ipPoolSize: sessionStats.ipPoolSize
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

export default router;
```

**Test it:**
```bash
curl https://your-app.onrender.com/health/browser-pool
```

**Expected response:**
```json
{
  "status": "healthy",
  "browserPool": {
    "totalInstances": 5,
    "totalActiveJobs": 0,
    "instances": [
      {"ip": "34.67.120.145", "activeJobs": 0, "utilization": 0},
      {"ip": "34.70.195.57", "activeJobs": 0, "utilization": 0},
      ...
    ]
  },
  "sessions": {
    "total": 0,
    "ipPoolSize": 5
  }
}
```

---

### Test 2: Create a Test Scraping Endpoint

**File**: `ECOD/server/src/routes/test-scraper.ts`

```typescript
import { Router } from 'express';
import { googleMapsActorHandler } from '@lib/laie/actors/google-maps';

const router = Router();

router.post('/test/scrape', async (req, res) => {
  try {
    const jobId = `test_${Date.now()}`;
    const input = {
      query: req.body.query || 'restaurants in Hyderabad',
      maxResults: req.body.maxResults || 5
    };
    
    console.log(`Starting test scrape: ${jobId}`);
    
    const result = await googleMapsActorHandler(jobId, input);
    
    res.json({
      success: true,
      jobId,
      sessionId: result.sessionId,
      ipAddress: result.ipAddress,
      resultsCount: result.count,
      results: result.results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

**Test it:**
```bash
curl -X POST https://your-app.onrender.com/test/scrape \
  -H "Content-Type: application/json" \
  -d '{"query": "coffee shops in Mumbai", "maxResults": 3}'
```

**Expected response:**
```json
{
  "success": true,
  "jobId": "test_1234567890",
  "sessionId": "session_1234567890_abc123def456",
  "ipAddress": "34.67.120.145",
  "resultsCount": 3,
  "results": [...]
}
```

---

### Test 3: Test IP Rotation

Run multiple scrapes and verify different IPs are used:

```bash
# Run 5 scrapes
for i in {1..5}; do
  curl -X POST https://your-app.onrender.com/test/scrape \
    -H "Content-Type: application/json" \
    -d '{"query": "test '$i'", "maxResults": 1}' \
    | jq '.ipAddress'
done
```

**Expected output:**
```
"34.67.120.145"
"34.70.195.57"
"34.57.152.115"
"34.57.3.86"
"34.71.205.62"
```

Different IPs = Round-robin working! ✓

---

### Test 4: Test Concurrent Sessions

Test that multiple scrapes can run simultaneously:

```bash
# Run 10 concurrent scrapes
for i in {1..10}; do
  curl -X POST https://your-app.onrender.com/test/scrape \
    -H "Content-Type: application/json" \
    -d '{"query": "concurrent test '$i'", "maxResults": 1}' &
done
wait

echo "All concurrent scrapes completed!"
```

---

### Test 5: Monitor GCE Instance Logs

Check Browserless logs on GCE instances:

```bash
# SSH into an instance
gcloud compute ssh laie-browser-1 --zone=us-central1-a --project=project-e1433182-358c-4bdd-a34

# View Browserless logs
sudo docker logs browserless --tail 50 --follow

# You should see:
# "WebSocket connection established"
# "Browser context created"
# "Page navigated to: https://..."
```

---

### Test 6: Load Test (50 Concurrent Sessions)

Test the maximum capacity:

```bash
# Install Apache Bench (if not installed)
# sudo apt-get install apache2-utils

# Run load test
ab -n 50 -c 50 -p test-payload.json -T application/json \
  https://your-app.onrender.com/test/scrape
```

**test-payload.json:**
```json
{"query": "load test", "maxResults": 1}
```

**Expected results:**
- All 50 requests should succeed
- Average response time: 2-5 seconds
- No failed requests

---

## 📊 Production Monitoring

### Key Metrics to Monitor

1. **Session Creation Rate**
   - Track: `sessionManager.getStats().totalSessions`
   - Alert if: > 45 active sessions (90% capacity)

2. **Browser Pool Utilization**
   - Track: `browserPool.getStats().totalActiveJobs`
   - Alert if: > 45 active jobs (90% capacity)

3. **IP Distribution**
   - Verify: Sessions distributed evenly across 5 IPs
   - Alert if: One IP has > 15 sessions (imbalanced)

4. **Success Rate**
   - Track: Successful scrapes / Total scrapes
   - Alert if: < 95% success rate

5. **Response Time**
   - Track: Average scrape duration
   - Alert if: > 10 seconds average

### Monitoring Dashboard

Add to your monitoring tool (Datadog, New Relic, etc.):

```javascript
// Log metrics every minute
setInterval(() => {
  const sessionStats = getSessionManager().getStats();
  const poolStats = getBrowserPool().getStats();
  
  console.log('METRICS', {
    activeSessions: sessionStats.totalSessions,
    activeJobs: poolStats.totalActiveJobs,
    instances: poolStats.instances.map(i => ({
      ip: i.ipAddress,
      jobs: i.activeJobs,
      utilization: i.utilization
    }))
  });
}, 60000);
```

---

## 🔒 Security Best Practices

### 1. Restrict GCP Firewall (Recommended)

Once Render is deployed, get Render's outbound IPs and restrict access:

```bash
# Update firewall to only allow Render
gcloud compute firewall-rules update allow-browserless \
  --source-ranges RENDER_IP_1/32,RENDER_IP_2/32 \
  --project=project-e1433182-358c-4bdd-a34
```

### 2. Rotate Token Periodically

Every 3-6 months, generate a new token:

```bash
# Generate new token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env and GCE instances
# Update Render environment variables
```

### 3. Monitor for Abuse

Watch for:
- Unusual traffic patterns
- High failure rates
- Excessive session creation

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Browserless"

**Check:**
1. Render has correct environment variables
2. GCE instances are running: `gcloud compute instances list --filter="name~laie-browser"`
3. Browserless containers are running: SSH into instance and run `sudo docker ps`
4. Firewall allows Render IPs

**Fix:**
```bash
# Restart Browserless containers
cd ~/ecodrix/ECOD/server/scripts
./setup-browserless-parallel.sh
```

### Issue: "Session creation timeout"

**Check:**
1. All 5 instances are running
2. No instance has > 10 active sessions
3. Network connectivity from Render to GCP

**Fix:**
- Scale up: Add more GCE instances
- Or reduce concurrent sessions per instance

### Issue: "IP rotation not working"

**Check:**
1. `BROWSERLESS_INSTANCES` has all 5 IPs
2. SessionManager is using round-robin

**Fix:**
- Verify environment variable is correct
- Restart app server

---

## 📈 Scaling Guide

### Current Capacity
- **5 instances** × **10 concurrent sessions** = **50 total capacity**

### To Scale Up

**Option 1: Add More Instances**
```bash
# Deploy 5 more instances (laie-browser-6 to laie-browser-10)
# Update BROWSERLESS_INSTANCES with new IPs
# Capacity: 100 concurrent sessions
```

**Option 2: Upgrade Instance Type**
```bash
# Upgrade from f1-micro to g1-small
# Increase CONCURRENT from 10 to 20
# Capacity: 100 concurrent sessions (5 × 20)
```

**Option 3: Use Preemptible Instances**
```bash
# Add preemptible instances for burst capacity
# Cost: ~80% cheaper
# Risk: May be terminated (add retry logic)
```

---

## ✅ Deployment Checklist

- [ ] GCE instances deployed and running
- [ ] Browserless containers running with secure token
- [ ] Local .env updated
- [ ] Code committed and pushed to Git
- [ ] Render environment variables added
- [ ] Render deployment successful
- [ ] Health check endpoint returns healthy
- [ ] Test scrape endpoint works
- [ ] IP rotation verified (5 different IPs)
- [ ] Concurrent sessions tested
- [ ] Monitoring dashboard configured
- [ ] Firewall restricted to Render IPs (optional)
- [ ] Documentation updated

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Health check shows all 5 instances
✅ Test scrapes return results
✅ Different IPs used for different scrapes
✅ 50 concurrent scrapes succeed
✅ Success rate ≥ 95%
✅ Average response time < 5 seconds

---

## 📞 Support

If you encounter issues:

1. Check Render logs
2. Check GCE instance logs: `sudo docker logs browserless`
3. Verify environment variables
4. Test connectivity: `curl http://34.67.120.145:3000`
5. Review this guide's troubleshooting section

---

**Deployment Date**: 2026-05-11
**Browser Pool**: 5 × f1-micro GCE instances
**Capacity**: 50 concurrent sessions
**Cost**: ~$15-20/month
**Status**: Ready for Production ✓
