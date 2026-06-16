# Task 14: Create Test Script - COMPLETE ✅

## Summary

Created a comprehensive manual test script to verify session isolation end-to-end with real jobs.

---

## ✅ Created Files

### `scripts/test-session-isolation.ts`

**Features:**
- ✅ Enqueues 5 test jobs (mix of actors)
- ✅ Polls for job completion
- ✅ Displays results summary
- ✅ Verifies IP rotation
- ✅ Verifies session isolation
- ✅ Calculates success rate
- ✅ Clear output formatting

---

## 🧪 Test Coverage

### Test Jobs
1. **Google Maps**: "coffee shops in Seattle" (browser-based)
2. **IndiaMart**: "industrial equipment" (HTTP-based)
3. **TradeIndia**: "textile machinery" (HTTP-based)
4. **Google Maps**: "restaurants in Mumbai" (browser-based)
5. **Deep Crawler**: "https://example.com" (HTTP-based)

### Verification Checks
- ✅ All jobs enqueued successfully
- ✅ Jobs complete within 2 minutes
- ✅ Results include sessionId and ipAddress
- ✅ Different IPs used (round-robin)
- ✅ Unique session IDs per job
- ✅ Success rate ≥95%

---

## 🚀 Usage

### Run the Test

```bash
cd ECOD/server

# Run test script
pnpm test:session:isolation
```

### Expected Output

```
🧪 Starting Session Isolation Test
============================================================

📤 Step 1: Enqueueing test jobs...
------------------------------------------------------------
✅ Job 1/5 enqueued: google-maps (job_abc123)
✅ Job 2/5 enqueued: indiamart (job_def456)
✅ Job 3/5 enqueued: tradeindia (job_ghi789)
✅ Job 4/5 enqueued: google-maps (job_jkl012)
✅ Job 5/5 enqueued: deep-crawler (job_mno345)

✅ Enqueued 5 jobs successfully

⏳ Step 2: Waiting for jobs to complete...
------------------------------------------------------------
This may take 30-60 seconds...

✅ Job completed: google-maps (job_abc123)
✅ Job completed: indiamart (job_def456)
✅ Job completed: tradeindia (job_ghi789)
✅ Job completed: google-maps (job_jkl012)
✅ Job completed: deep-crawler (job_mno345)

📊 Step 3: Test Results
============================================================

✅ Completed: 5/5
❌ Failed: 0/5
⏳ Pending: 0/5

✅ Completed Jobs:
------------------------------------------------------------
  • google-maps
    Job ID: job_abc123
    Results: 3 items
    Session: session_1234567890_abc123def456
    IP: 34.67.120.145

  • indiamart
    Job ID: job_def456
    Results: 5 items
    Session: session_1234567891_def456ghi789
    IP: 34.70.195.57

  • tradeindia
    Job ID: job_ghi789
    Results: 5 items
    Session: session_1234567892_ghi789jkl012
    IP: 34.57.152.115

  • google-maps
    Job ID: job_jkl012
    Results: 3 items
    Session: session_1234567893_jkl012mno345
    IP: 34.57.3.86

  • deep-crawler
    Job ID: job_mno345
    Results: 3 items
    Session: session_1234567894_mno345pqr678
    IP: 34.71.205.62

🔍 Step 4: Session Isolation Verification
============================================================

✅ Unique IPs used: 5
✅ Unique sessions: 5
✅ IP rotation working correctly!
   IPs: 34.67.120.145, 34.70.195.57, 34.57.152.115, 34.57.3.86, 34.71.205.62
✅ Session isolation working correctly!
   Each job got a unique session ID.

============================================================
🎉 Test Complete!
============================================================

Success Rate: 100.0%
✅ SUCCESS: Session isolation is working correctly!

📝 Next Steps:
  1. Check ERIX-Store dataset for full results
  2. Verify sessionId and ipAddress in result items
  3. Check browser pool health: /health/browser-pool
  4. Monitor worker logs for any errors

✅ Test script completed
```

---

## 🔍 What the Test Verifies

### 1. Job Enqueueing ✅
- Jobs can be enqueued to ERIX-Store
- Job IDs are returned
- No errors during enqueueing

### 2. Job Processing ✅
- Worker picks up jobs from queue
- Actors execute successfully
- Jobs complete within timeout

### 3. Session Isolation ✅
- Each job gets unique session ID
- Session IDs follow format: `session_{timestamp}_{random_hex}`
- Sessions are properly created and destroyed

### 4. IP Rotation ✅
- Different IPs assigned via round-robin
- All 5 IPs used across jobs
- No IP reuse until all IPs used once

### 5. Results Quality ✅
- Results include sessionId field
- Results include ipAddress field
- Result count matches expected

### 6. Success Rate ✅
- ≥95% jobs complete successfully
- Failed jobs are logged with errors
- Pending jobs are tracked

---

## 🐛 Troubleshooting

### Issue: Jobs Not Completing

**Possible Causes:**
1. Worker not running
2. ERIX-Store connection issues
3. Browserless instances not accessible

**Fix:**
```bash
# Check worker is running
pnpm worker:start

# Check ERIX-Store connection
curl https://store.ecodrix.com/health

# Check browser pool
curl https://api.ecodrix.com/health/browser-pool
```

### Issue: No Session Information

**Possible Causes:**
1. Actors not updated with session isolation
2. Dataset not storing sessionId/ipAddress
3. Results not being saved

**Fix:**
```bash
# Verify actors are updated
grep -r "sessionId" src/lib/laie/actors/

# Check dataset in ERIX-Store
# Query: GET /datasets/v2/{jobId}/items
```

### Issue: Same IP Used for All Jobs

**Possible Causes:**
1. Only one Browserless instance configured
2. Round-robin logic not working
3. SessionManager not initialized

**Fix:**
```bash
# Check BROWSERLESS_INSTANCES env var
echo $BROWSERLESS_INSTANCES

# Should show 5 WebSocket URLs
# If not, update .env file
```

### Issue: Low Success Rate

**Possible Causes:**
1. Browserless instances down
2. Network connectivity issues
3. Actor errors

**Fix:**
```bash
# Check GCE instances
gcloud compute instances list --filter="name~laie-browser"

# Check Browserless containers
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker ps"

# Check worker logs for errors
pnpm worker:start
```

---

## 📊 Success Criteria

### ✅ Test Passes When:
- All 5 jobs enqueue successfully
- ≥95% jobs complete within 2 minutes
- Each job has unique sessionId
- At least 2 different IPs used
- Results include sessionId and ipAddress
- No critical errors in logs

### ⚠️ Test Warnings When:
- 80-94% jobs complete
- Only 1-2 IPs used
- Some jobs timeout
- Minor errors in logs

### ❌ Test Fails When:
- <80% jobs complete
- No session information in results
- All jobs use same IP
- Critical errors in logs

---

## 🎯 Acceptance Criteria ✅

- [x] Script enqueues 5 test jobs
- [x] Script waits for job completion
- [x] Script displays session IDs and IPs
- [x] Script verifies different IPs used
- [x] Script displays results summary
- [x] Script has clear output formatting
- [x] Script added to package.json
- [x] Script handles errors gracefully
- [x] Script calculates success rate
- [x] Script provides next steps

---

## 🚀 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Session Isolation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-session-isolation:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
        working-directory: ECOD/server
      
      - name: Run session isolation test
        run: pnpm test:session:isolation
        working-directory: ECOD/server
        env:
          ERIX_STORE_URL: ${{ secrets.ERIX_STORE_URL }}
          ERIX_API_KEY: ${{ secrets.ERIX_API_KEY }}
          ERIX_TENANT_ID: laie
          BROWSERLESS_INSTANCES: ${{ secrets.BROWSERLESS_INSTANCES }}
          BROWSERLESS_TOKEN: ${{ secrets.BROWSERLESS_TOKEN }}
```

---

## 📝 Next Steps

After running this test successfully:

1. **Verify Results in ERIX-Store**
   - Check dataset for full results
   - Verify sessionId and ipAddress in items
   - Confirm data quality

2. **Monitor Production**
   - Set up alerts for success rate
   - Monitor browser pool utilization
   - Track session statistics

3. **Run Load Tests** (Task 17)
   - Test with 50 concurrent jobs
   - Measure performance under load
   - Verify ≥95% success rate at scale

4. **Complete Documentation** (Task 16)
   - Add usage examples
   - Create troubleshooting guide
   - Document best practices

---

**Completed**: 2026-05-11  
**Status**: ✅ READY FOR TESTING  
**Command**: `pnpm test:session:isolation`
