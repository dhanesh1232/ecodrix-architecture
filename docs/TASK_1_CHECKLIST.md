# Task 1: Deploy GCE Infrastructure - Checklist

## Overview

This checklist ensures all acceptance criteria for Task 1 are met.

## Pre-Deployment Checklist

- [ ] Google Cloud SDK (gcloud) installed
- [ ] Authenticated with GCP (`gcloud auth login`)
- [ ] GCP project created and billing enabled
- [ ] Project ID noted and exported as `GCP_PROJECT_ID`
- [ ] Sufficient quota for 5 f1-micro instances in us-central1
- [ ] Scripts directory accessible (`cd ECOD/server/scripts`)

## Deployment Checklist

### 1. Deploy GCE Instances

- [ ] Set environment variable: `export GCP_PROJECT_ID="your-project-id"`
- [ ] Make script executable: `chmod +x deploy-gce-instances.sh`
- [ ] Run deployment: `./deploy-gce-instances.sh`
- [ ] Verify 5 instances created:
  - [ ] laie-browser-1
  - [ ] laie-browser-2
  - [ ] laie-browser-3
  - [ ] laie-browser-4
  - [ ] laie-browser-5
- [ ] Verify instances in correct zone: us-central1-a
- [ ] Verify instances tagged with "browserless"
- [ ] Verify firewall rule created: `allow-browserless`
- [ ] IP addresses displayed and saved to `gce-instance-ips.txt`

### 2. Install Docker and Browserless

- [ ] Make script executable: `chmod +x setup-browserless.sh`
- [ ] Run setup: `./setup-browserless.sh`
- [ ] Verify Docker installed on all 5 instances
- [ ] Verify Browserless containers running on all instances
- [ ] Verify containers configured with:
  - [ ] CONCURRENT=10
  - [ ] TOKEN=laie_browser_secret_token_2026
  - [ ] Port 3000 exposed
  - [ ] Restart policy: always

### 3. Verify Connectivity

- [ ] Make script executable: `chmod +x verify-browserless.sh`
- [ ] Run verification: `./verify-browserless.sh`
- [ ] All 5 instances pass HTTP connectivity test
- [ ] All 5 instances pass WebSocket port accessibility test
- [ ] All 5 Docker containers running
- [ ] Verification summary shows 0 failures

### 4. Test WebSocket Connections (Optional but Recommended)

- [ ] Install playwright-core: `pnpm add -D playwright-core`
- [ ] Make test script executable: `chmod +x test-browserless-connection.ts`
- [ ] Run test: `pnpm tsx scripts/test-browserless-connection.ts`
- [ ] All instances successfully connect
- [ ] Test pages load correctly
- [ ] Average response time < 5000ms

### 5. Update Environment Configuration

- [ ] Open `.env` file: `nano ECOD/server/.env`
- [ ] Add `BROWSERLESS_INSTANCES` with actual IPs from `gce-instance-ips.txt`
- [ ] Add `BROWSERLESS_TOKEN=laie_browser_secret_token_2026`
- [ ] Save and close file
- [ ] Verify environment variables loaded correctly

## Acceptance Criteria Verification

### ✅ 5 GCE f1-micro instances created in us-central1-a zone

Verify:
```bash
gcloud compute instances list --filter="name~laie-browser" --format="table(name,zone,machineType)"
```

Expected output:
```
NAME             ZONE            MACHINE_TYPE
laie-browser-1   us-central1-a   f1-micro
laie-browser-2   us-central1-a   f1-micro
laie-browser-3   us-central1-a   f1-micro
laie-browser-4   us-central1-a   f1-micro
laie-browser-5   us-central1-a   f1-micro
```

- [ ] All 5 instances listed
- [ ] All in us-central1-a zone
- [ ] All are f1-micro type

### ✅ Instances named laie-browser-1 through laie-browser-5

- [ ] laie-browser-1 exists
- [ ] laie-browser-2 exists
- [ ] laie-browser-3 exists
- [ ] laie-browser-4 exists
- [ ] laie-browser-5 exists

### ✅ Docker installed on all instances

Verify on each instance:
```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="docker --version"
```

- [ ] laie-browser-1 has Docker
- [ ] laie-browser-2 has Docker
- [ ] laie-browser-3 has Docker
- [ ] laie-browser-4 has Docker
- [ ] laie-browser-5 has Docker

### ✅ Browserless containers running on all instances

Verify:
```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker ps --filter name=browserless"
```

- [ ] laie-browser-1 container running
- [ ] laie-browser-2 container running
- [ ] laie-browser-3 container running
- [ ] laie-browser-4 container running
- [ ] laie-browser-5 container running

### ✅ Port 3000 exposed for WebSocket connections

Verify firewall rule:
```bash
gcloud compute firewall-rules describe allow-browserless
```

Expected:
- [ ] Rule exists
- [ ] Allows TCP port 3000
- [ ] Targets instances with "browserless" tag

Verify port accessibility:
```bash
# Test from local machine (replace IP with actual)
nc -zv 35.202.1.1 3000
```

- [ ] laie-browser-1 port 3000 accessible
- [ ] laie-browser-2 port 3000 accessible
- [ ] laie-browser-3 port 3000 accessible
- [ ] laie-browser-4 port 3000 accessible
- [ ] laie-browser-5 port 3000 accessible

### ✅ All instances tagged with "browserless"

Verify:
```bash
gcloud compute instances describe laie-browser-1 --zone=us-central1-a --format="get(tags.items)"
```

- [ ] laie-browser-1 has "browserless" tag
- [ ] laie-browser-2 has "browserless" tag
- [ ] laie-browser-3 has "browserless" tag
- [ ] laie-browser-4 has "browserless" tag
- [ ] laie-browser-5 has "browserless" tag

### ✅ IP addresses documented

- [ ] `gce-instance-ips.txt` file exists
- [ ] File contains all 5 IP addresses
- [ ] File contains BROWSERLESS_INSTANCES environment variable
- [ ] IP addresses are valid and accessible

Example content:
```
laie-browser-1: 35.202.1.1
laie-browser-2: 35.202.2.2
laie-browser-3: 35.202.3.3
laie-browser-4: 35.202.4.4
laie-browser-5: 35.202.5.5

BROWSERLESS_INSTANCES=ws://35.202.1.1:3000,ws://35.202.2.2:3000,...
```

## Post-Deployment Verification

### Manual WebSocket Test

Test one instance manually:

```bash
# Install wscat if not already installed
npm install -g wscat

# Test connection (replace IP with actual)
wscat -c "ws://35.202.1.1:3000/chromium/playwright?token=laie_browser_secret_token_2026"
```

- [ ] Connection established
- [ ] No errors in output

### Container Health Check

Check container health on each instance:

```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker inspect browserless --format='{{.State.Status}}'"
```

- [ ] All containers status: "running"

### Resource Usage Check

Check resource usage:

```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker stats browserless --no-stream"
```

- [ ] Memory usage < 500MB
- [ ] CPU usage reasonable
- [ ] No excessive resource consumption

## Documentation Checklist

- [ ] `deploy-gce-instances.sh` script created
- [ ] `setup-browserless.sh` script created
- [ ] `verify-browserless.sh` script created
- [ ] `test-browserless-connection.ts` script created
- [ ] `GCE_DEPLOYMENT_GUIDE.md` documentation created
- [ ] `README-GCE-DEPLOYMENT.md` quick reference created
- [ ] `gce-instance-ips.example.txt` template created
- [ ] `TASK_1_CHECKLIST.md` (this file) created

## Files Created

- [x] `ECOD/server/scripts/deploy-gce-instances.sh`
- [x] `ECOD/server/scripts/setup-browserless.sh`
- [x] `ECOD/server/scripts/verify-browserless.sh`
- [x] `ECOD/server/scripts/test-browserless-connection.ts`
- [x] `ECOD/server/scripts/README-GCE-DEPLOYMENT.md`
- [x] `ECOD/server/scripts/gce-instance-ips.example.txt`
- [x] `ECOD/server/docs/GCE_DEPLOYMENT_GUIDE.md`
- [x] `ECOD/server/docs/TASK_1_CHECKLIST.md`

## Common Issues and Solutions

### Issue: "Permission denied" when running scripts

**Solution**:
```bash
chmod +x *.sh
```

### Issue: "Project not found"

**Solution**:
```bash
export GCP_PROJECT_ID="your-actual-project-id"
gcloud config set project $GCP_PROJECT_ID
```

### Issue: "Quota exceeded"

**Solution**:
- Check GCP console for quota limits
- Request quota increase if needed
- Or reduce number of instances

### Issue: "Cannot connect to instance"

**Solution**:
```bash
# Check firewall rules
gcloud compute firewall-rules list

# Check instance status
gcloud compute instances describe laie-browser-1 --zone=us-central1-a
```

### Issue: "Docker not found"

**Solution**:
```bash
# Re-run setup script
./setup-browserless.sh
```

### Issue: "Browserless container not starting"

**Solution**:
```bash
# Check logs
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker logs browserless"

# Restart container
gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker restart browserless"
```

## Final Verification

Before marking Task 1 as complete, ensure:

- [ ] All 5 instances are running
- [ ] All 5 Browserless containers are running
- [ ] All instances are accessible via WebSocket
- [ ] IP addresses are documented
- [ ] Environment variables are configured
- [ ] All scripts are executable and working
- [ ] Documentation is complete and accurate
- [ ] Test script passes successfully

## Sign-Off

Task 1 is complete when:

1. ✅ All acceptance criteria are met
2. ✅ All verification steps pass
3. ✅ Documentation is complete
4. ✅ Environment is configured
5. ✅ Ready to proceed to Task 2

**Completed by**: _________________  
**Date**: _________________  
**Verified by**: _________________  
**Date**: _________________

## Next Steps

After Task 1 completion:

1. Proceed to **Task 2**: Create SessionManager Core
2. Use the IP addresses from `gce-instance-ips.txt`
3. Ensure `BROWSERLESS_INSTANCES` is in `.env` file
4. Begin implementing session isolation logic

---

**Task Status**: ⏳ Pending  
**Priority**: High  
**Estimated Time**: 30 minutes  
**Actual Time**: _________________
