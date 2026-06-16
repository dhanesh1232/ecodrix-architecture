# Render Deployment Checklist

## Issue Diagnosis

Your production server returned:
```
Cannot GET /health/browser-pool
```

This means the health endpoint code hasn't been deployed to Render yet.

---

## ✅ Step-by-Step Deployment

### Step 1: Add Environment Variables to Render

Go to your Render dashboard → Your service → Environment tab

Add these 2 variables:

**Variable 1:**
```
Name: BROWSERLESS_INSTANCES
Value: ws://34.67.120.145:3000,ws://34.70.195.57:3000,ws://34.57.152.115:3000,ws://34.57.3.86:3000,ws://34.71.205.62:3000
```

**Variable 2:**
```
Name: BROWSERLESS_TOKEN
Value: 408d9b09b90939b78cdfbe714f1059eccaaa5fbf7a1c05c779d8bfcd9f0e65a8
```

### Step 2: Verify Git Status

```bash
cd ~/ecodrix/ECOD/server
git status
```

Check if these files are staged:
- `server.ts` (updated with health endpoint)
- `src/routes/health/browser-pool.ts` (new file)

### Step 3: Commit and Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add session isolation health endpoints"

# Push to trigger Render deployment
git push origin main
```

### Step 4: Monitor Render Deployment

1. Go to Render dashboard
2. Watch the deployment logs
3. Look for these success messages:
   - `✅ Session isolation system activated`
   - `Server running at http://localhost:4000`

### Step 5: Test Production Endpoint

Wait for deployment to complete (usually 2-5 minutes), then test:

```bash
curl https://api.ecodrix.com/health/browser-pool
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-11T...",
  "browserPool": {
    "totalInstances": 5,
    "totalActiveJobs": 0,
    "totalContexts": 0,
    "capacity": 50,
    "utilization": 0,
    "instances": [
      {
        "ip": "34.67.120.145",
        "activeJobs": 0,
        "contexts": 0,
        "utilization": 0,
        "status": "available"
      },
      ...
    ]
  },
  "sessions": {
    "total": 0,
    "ipPoolSize": 5,
    "active": 0
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Still getting 404 after deployment

**Possible causes:**
1. Deployment failed (check Render logs)
2. Wrong branch deployed (check Render settings)
3. Build errors (check Render build logs)

**Fix:**
```bash
# Check which branch Render is watching
# Go to Render dashboard → Settings → Branch

# Make sure it matches your push branch (usually 'main' or 'master')
```

### Issue: 500 Error after deployment

**Possible causes:**
1. Environment variables not set correctly
2. GCE instances not accessible from Render
3. Browserless containers stopped

**Fix:**
```bash
# 1. Verify environment variables in Render dashboard
# 2. Check GCE instances are running
gcloud compute instances list --filter="name~laie-browser"

# 3. Test connectivity from Render to GCE
# (Render should be able to reach public IPs)
```

### Issue: "Cannot connect to Browserless"

**Check:**
1. Firewall allows traffic from Render IPs
2. Browserless containers are running
3. Token matches in Render and GCE

**Fix:**
```bash
# Check firewall
gcloud compute firewall-rules describe allow-browserless

# Should show:
# sourceRanges: ['0.0.0.0/0']  # Allows all IPs including Render
```

---

## 📊 Deployment Verification Checklist

After deployment completes, verify:

- [ ] `/health/browser-pool` returns 200 OK
- [ ] Response shows `"status": "healthy"`
- [ ] Shows 5 instances
- [ ] All instances show `"status": "available"`
- [ ] `ipPoolSize: 5`
- [ ] `capacity: 50`
- [ ] No errors in Render logs

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Health endpoint accessible: `https://api.ecodrix.com/health/browser-pool`
✅ Returns healthy status with 5 instances
✅ No errors in Render deployment logs
✅ Session isolation system activated

---

## 📝 Quick Commands

```bash
# Check git status
git status

# Stage and commit
git add .
git commit -m "Add session isolation health endpoints"

# Push to deploy
git push origin main

# Test production
curl https://api.ecodrix.com/health/browser-pool

# Check GCE instances
gcloud compute instances list --filter="name~laie-browser"

# Check Browserless on instance
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker ps"
```

---

## 🚀 Next Steps After Successful Deployment

1. Monitor health endpoint regularly
2. Set up monitoring/alerting (optional)
3. Test scraping jobs with session isolation
4. Monitor GCE instance costs (~$15-20/month)

---

**Deployment Date**: 2026-05-11
**Status**: Ready to Deploy ✓
