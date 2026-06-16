# GCE Infrastructure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the GCE infrastructure required for the Session Isolation feature. The infrastructure consists of 5 f1-micro GCE instances running Browserless containers, providing a pool of isolated browser environments for web scraping.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GCE Infrastructure                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ laie-brow-1  │  │laie-brow-2   │  │ laie-brow-3  │           │
│  │ f1-micro     │  │ f1-micro     │  │ f1-micro     │           │
│  │ Ubuntu 20.04 │  │ Ubuntu 20.04 │  │ Ubuntu 20.04 │           │
│  │ Docker       │  │ Docker       │  │ Docker       │           │
│  │ Browserless  │  │ Browserless  │  │ Browserless  │           │
│  │ Port 3000    │  │ Port 3000    │  │ Port 3000    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ laie-brow-4  │  │ laie-brow-5  │                             │
│  │ f1-micro     │  │ f1-micro     │                             │
│  │ Ubuntu 20.04 │  │ Ubuntu 20.04 │                             │
│  │ Docker       │  │ Docker       │                             │
│  │ Browserless  │  │ Browserless  │                             │
│  │ Port 3000    │  │ Port 3000    │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Google Cloud Platform Account

- Active GCP account with billing enabled
- Project created (or use existing project)
- Sufficient quota for 5 f1-micro instances in us-central1

### 2. Google Cloud SDK (gcloud CLI)

Install the gcloud CLI:

```bash
# For Linux/macOS
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# For Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

Authenticate:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Required Permissions

Your GCP account needs the following IAM roles:
- `Compute Instance Admin (v1)` - To create and manage instances
- `Compute Security Admin` - To create firewall rules
- `Service Account User` - To attach service accounts

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# Set your GCP project ID
export GCP_PROJECT_ID="your-project-id"

# Set Browserless token (or use default)
export BROWSERLESS_TOKEN="laie_browser_secret_token_2026"
```

### Step 2: Deploy GCE Instances

Navigate to the scripts directory:

```bash
cd ECOD/server/scripts
```

Make the deployment script executable:

```bash
chmod +x deploy-gce-instances.sh
```

Run the deployment script:

```bash
./deploy-gce-instances.sh
```

This script will:
1. Create a firewall rule to allow traffic on port 3000
2. Create 5 f1-micro instances named `laie-browser-1` through `laie-browser-5`
3. Display the IP addresses of all instances
4. Generate the `BROWSERLESS_INSTANCES` environment variable
5. Save IP addresses to `gce-instance-ips.txt`

**Expected Output:**

```
==========================================
GCE Instance Deployment for Session Isolation
==========================================

Project ID: your-project-id
Zone: us-central1-a
Machine Type: f1-micro
Number of Instances: 5

Creating GCE instances...

Creating instance: laie-browser-1
✓ Instance laie-browser-1 created

Creating instance: laie-browser-2
✓ Instance laie-browser-2 created

...

==========================================
Instance IP Addresses
==========================================

laie-browser-1: 35.202.1.1
laie-browser-2: 35.202.2.2
laie-browser-3: 35.202.3.3
laie-browser-4: 35.202.4.4
laie-browser-5: 35.202.5.5

==========================================
WebSocket URLs
==========================================

ws://35.202.1.1:3000
ws://35.202.2.2:3000
ws://35.202.3.3:3000
ws://35.202.4.4:3000
ws://35.202.5.5:3000

==========================================
Environment Variable Configuration
==========================================

Add this to your .env file:

BROWSERLESS_INSTANCES=ws://35.202.1.1:3000,ws://35.202.2.2:3000,ws://35.202.3.3:3000,ws://35.202.4.4:3000,ws://35.202.5.5:3000
BROWSERLESS_TOKEN=laie_browser_secret_token_2026

✓ IP addresses saved to: gce-instance-ips.txt

Deployment complete! ✓
```

### Step 3: Install Docker and Browserless

Make the setup script executable:

```bash
chmod +x setup-browserless.sh
```

Run the setup script:

```bash
./setup-browserless.sh
```

This script will:
1. SSH into each instance
2. Install Docker
3. Pull the Browserless Docker image
4. Run the Browserless container with proper configuration
5. Verify the container is running

**Expected Output:**

```
==========================================
Browserless Setup on GCE Instances
==========================================

Project ID: your-project-id
Zone: us-central1-a
Browserless Image: ghcr.io/browserless/chromium
Concurrent Sessions: 10

Running setup on all instances...

==========================================
Setting up: laie-browser-1
==========================================

Starting Browserless setup...
Updating package list...
Installing Docker...
✓ Docker installed successfully
Pulling Browserless image...
Starting Browserless container...
Waiting for Browserless to start...
✓ Browserless container is running

Container logs:
[Browserless] Starting Browserless...
[Browserless] Listening on port 3000
[Browserless] Ready to accept connections

✓ Setup complete for laie-browser-1

...

==========================================
Setup Complete!
==========================================

All instances have been configured with Browserless.
```

### Step 4: Verify Connectivity

Make the verification script executable:

```bash
chmod +x verify-browserless.sh
```

Run the verification script:

```bash
./verify-browserless.sh
```

This script will:
1. Test HTTP connectivity to each instance
2. Verify WebSocket port accessibility
3. Check Docker container status
4. Display a summary of results

**Expected Output:**

```
==========================================
Browserless Connectivity Verification
==========================================

Testing connectivity to all instances...

==========================================
Testing: laie-browser-1
==========================================
IP Address: 35.202.1.1
Testing HTTP endpoint... ✓ HTTP accessible
Testing WebSocket endpoint... ✓ WebSocket port accessible
Checking Docker container... ✓ Container running: Up 2 minutes

...

==========================================
Verification Summary
==========================================

Total Instances: 5
Successful: 5
Failed: 0

✓ All instances are working correctly!

You can now use these WebSocket URLs:

  ws://35.202.1.1:3000/chromium/playwright?token=laie_browser_secret_token_2026
  ws://35.202.2.2:3000/chromium/playwright?token=laie_browser_secret_token_2026
  ws://35.202.3.3:3000/chromium/playwright?token=laie_browser_secret_token_2026
  ws://35.202.4.4:3000/chromium/playwright?token=laie_browser_secret_token_2026
  ws://35.202.5.5:3000/chromium/playwright?token=laie_browser_secret_token_2026
```

### Step 5: Update Environment Configuration

Update your `.env` file with the generated environment variables:

```bash
# Navigate to server directory
cd ECOD/server

# Edit .env file
nano .env
```

Add the following lines (use the actual IPs from your deployment):

```env
# Browserless Instance Pool
BROWSERLESS_INSTANCES=ws://35.202.1.1:3000,ws://35.202.2.2:3000,ws://35.202.3.3:3000,ws://35.202.4.4:3000,ws://35.202.5.5:3000
BROWSERLESS_TOKEN=laie_browser_secret_token_2026

# ERIX Store URL (if not already set)
ERIX_STORE_URL=http://localhost:6399
```

## Instance Specifications

### Machine Type: f1-micro

- **vCPUs**: 1 shared core
- **Memory**: 0.6 GB
- **Disk**: 10 GB standard persistent disk
- **Network**: 1 Gbps egress
- **Cost**: FREE (within GCP always-free tier)

### Browserless Configuration

Each instance runs Browserless with:

- **Concurrent Sessions**: 10
- **Timeout**: 300 seconds (5 minutes)
- **Max Queue Length**: 100
- **Preboot Chrome**: Enabled
- **Keep Alive**: Enabled

### Total Capacity

- **Total Instances**: 5
- **Concurrent Sessions per Instance**: 10
- **Total Concurrent Sessions**: 50
- **Monthly Cost**: $0 (within free tier)

## IP Address Documentation

After deployment, your IP addresses will be saved to `gce-instance-ips.txt`:

```
# GCE Instance IP Addresses
# Generated on: 2026-05-10 10:30:00

laie-browser-1: 35.202.1.1
laie-browser-2: 35.202.2.2
laie-browser-3: 35.202.3.3
laie-browser-4: 35.202.4.4
laie-browser-5: 35.202.5.5

# Environment Variable
BROWSERLESS_INSTANCES=ws://35.202.1.1:3000,ws://35.202.2.2:3000,ws://35.202.3.3:3000,ws://35.202.4.4:3000,ws://35.202.5.5:3000
```

## Firewall Configuration

The deployment creates a firewall rule named `allow-browserless`:

- **Name**: allow-browserless
- **Protocol**: TCP
- **Port**: 3000
- **Source**: 0.0.0.0/0 (all IPs)
- **Target Tags**: browserless
- **Description**: Allow WebSocket connections to Browserless

**Security Note**: In production, you should restrict the source IP range to only your application servers.

## Testing WebSocket Connection

You can manually test WebSocket connectivity using Node.js:

```javascript
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.connect(
    'ws://35.202.1.1:3000/chromium/playwright?token=laie_browser_secret_token_2026'
  );
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://example.com');
  console.log('Title:', await page.title());
  
  await browser.close();
})();
```

## Monitoring and Maintenance

### Check Instance Status

```bash
gcloud compute instances list --filter="name~laie-browser"
```

### SSH into an Instance

```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a
```

### Check Docker Container Logs

```bash
# SSH into instance first
gcloud compute ssh laie-browser-1 --zone=us-central1-a

# View logs
sudo docker logs browserless

# Follow logs in real-time
sudo docker logs -f browserless
```

### Restart Browserless Container

```bash
# SSH into instance
gcloud compute ssh laie-browser-1 --zone=us-central1-a

# Restart container
sudo docker restart browserless
```

### Check Container Resource Usage

```bash
# SSH into instance
gcloud compute ssh laie-browser-1 --zone=us-central1-a

# View resource usage
sudo docker stats browserless
```

## Troubleshooting

### Issue: Cannot connect to WebSocket

**Symptoms**: Connection timeout or refused

**Solutions**:
1. Check firewall rule exists:
   ```bash
   gcloud compute firewall-rules describe allow-browserless
   ```

2. Verify instance has correct tags:
   ```bash
   gcloud compute instances describe laie-browser-1 --zone=us-central1-a --format="get(tags.items)"
   ```

3. Check if Browserless container is running:
   ```bash
   gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker ps"
   ```

### Issue: Browserless container not starting

**Symptoms**: Container exits immediately

**Solutions**:
1. Check container logs:
   ```bash
   gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker logs browserless"
   ```

2. Verify Docker is running:
   ```bash
   gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo systemctl status docker"
   ```

3. Try pulling the image again:
   ```bash
   gcloud compute ssh laie-browser-1 --zone=us-central1-a --command="sudo docker pull ghcr.io/browserless/chromium"
   ```

### Issue: Out of memory errors

**Symptoms**: Browser crashes or container restarts

**Solutions**:
1. Reduce concurrent sessions (edit container):
   ```bash
   sudo docker stop browserless
   sudo docker rm browserless
   sudo docker run -d --name browserless --restart always -p 3000:3000 \
     -e "CONCURRENT=5" \
     -e "TOKEN=laie_browser_secret_token_2026" \
     ghcr.io/browserless/chromium
   ```

2. Consider upgrading to g1-small instances (not free tier)

### Issue: High latency

**Symptoms**: Slow page loads or timeouts

**Solutions**:
1. Check instance location matches your application
2. Monitor network usage
3. Consider using a different GCP region closer to target websites

## Cleanup and Teardown

To delete all instances and clean up resources:

```bash
# Delete all instances
for i in {1..5}; do
  gcloud compute instances delete laie-browser-$i --zone=us-central1-a --quiet
done

# Delete firewall rule
gcloud compute firewall-rules delete allow-browserless --quiet
```

## Cost Optimization

### Free Tier Limits

GCP provides the following always-free resources:
- 1 f1-micro instance per month (we use 5, so 4 are billed)
- 30 GB standard persistent disk
- 1 GB network egress per month

**Actual Cost**: With 5 f1-micro instances, expect ~$15-20/month for the 4 instances beyond the free tier.

### Cost Reduction Strategies

1. **Use Preemptible Instances**: Reduce cost by 80% but instances may be terminated
   ```bash
   gcloud compute instances create laie-browser-1 --preemptible ...
   ```

2. **Stop Instances When Not in Use**:
   ```bash
   gcloud compute instances stop laie-browser-1 --zone=us-central1-a
   ```

3. **Use Spot Instances**: Similar to preemptible but with more flexibility

4. **Reduce to 1 Instance**: Stay within free tier but lose IP rotation benefits

## Next Steps

After completing the infrastructure deployment:

1. ✅ **Task 1 Complete**: GCE infrastructure deployed
2. ⏭️ **Task 2**: Implement SessionManager core
3. ⏭️ **Task 3**: Implement BrowserPool core
4. ⏭️ **Task 4**: Create ERIX-Store client wrapper
5. ⏭️ **Task 5**: Update environment configuration

## Support and Resources

- **GCP Documentation**: https://cloud.google.com/compute/docs
- **Browserless Documentation**: https://www.browserless.io/docs
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Docker Documentation**: https://docs.docker.com/

## Appendix: Manual Deployment Steps

If you prefer to deploy manually without scripts:

### Create Instance

```bash
gcloud compute instances create laie-browser-1 \
  --zone=us-central1-a \
  --machine-type=f1-micro \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB \
  --boot-disk-type=pd-standard \
  --tags=browserless,http-server
```

### Install Docker

```bash
gcloud compute ssh laie-browser-1 --zone=us-central1-a

# On the instance:
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

### Run Browserless

```bash
sudo docker run -d \
  --name browserless \
  --restart always \
  -p 3000:3000 \
  -e "CONCURRENT=10" \
  -e "TOKEN=laie_browser_secret_token_2026" \
  ghcr.io/browserless/chromium
```

Repeat for all 5 instances.

---

**Document Version**: 1.0  
**Last Updated**: May 10, 2026  
**Status**: Ready for Deployment
