# 🚀 Quick Start - Hybrid Automation System

**Status:** ✅ **OPERATIONAL**

---

## ⚡ Quick Commands

### **Start Server:**
```bash
cd ECOD/server
pnpm run dev
```

**Expected:** `✅ CRM ERIX Worker started`

---

### **Run Tests:**
```bash
tsx test-automation-system.ts
```

**Expected:** All tests pass, 2 jobs processed

---

### **Check Worker Stats:**
```typescript
import { crmErixWorker } from '@/workers/crm-erix-worker';

const stats = crmErixWorker.getStats();
console.log(stats);
// {
//   totalJobsProcessed: 5,
//   successfulJobs: 5,
//   failedJobs: 0,
//   isRunning: true,
//   successRate: 100
// }
```

---

### **Emit Event:**
```typescript
import { AutomationRouter } from '@/services/saas/automation/automationRouter.service';

await AutomationRouter.emitEvent('CLIENT_CODE', 'lead_created', {
  phone: '+919876543210',
  email: 'user@example.com',
  variables: { firstName: 'John' }
});
```

---

### **Check Backend Status:**
```typescript
import { AutomationRouter } from '@/services/saas/automation/automationRouter.service';

const status = AutomationRouter.getBackendStatus('CLIENT_CODE');
console.log(status);
// {
//   events: 'mongodb',
//   workflows: 'mongodb',
//   parallelStorage: true
// }
```

---

## 🎯 Current Configuration

**Mode:** Parallel Storage (MongoDB primary, ERIX-Store secondary)

**Feature Flags:**
```bash
PARALLEL_AUTOMATION_STORAGE=true      # ✅ Both systems
USE_ERIX_STORE_EVENTS=false           # ❌ MongoDB only
ERIX_STORE_ROLLOUT_PERCENTAGE=0       # 0% ERIX-Store
```

---

## 📊 System Components

### **1. AutomationRouter** ✅
**File:** `src/services/saas/automation/automationRouter.service.ts`

**Purpose:** Routes events between MongoDB and ERIX-Store

**Methods:**
- `AutomationRouter.emitEvent()` - Emit events
- `AutomationRouter.enrollInWorkflow()` - Enroll in workflows
- `AutomationRouter.getBackendStatus()` - Get backend status

---

### **2. EventBusV2** ✅
**File:** `src/services/saas/event/eventBusV2.service.ts`

**Purpose:** ERIX-Store native event processing

**Methods:**
- `eventBusV2.emit()` - Emit single event
- `eventBusV2.emitBatch()` - Emit multiple events

---

### **3. WorkflowEngineV2** ✅
**File:** `src/services/saas/automation/workflowEngineV2.service.ts`

**Purpose:** ERIX-Store native workflow execution

**Methods:**
- `workflowEngineV2.enrollInWorkflow()` - Enroll lead
- `workflowEngineV2.getRunStatus()` - Get run status

---

### **4. CRM ERIX Worker** ✅
**File:** `src/workers/crm-erix-worker.ts`

**Purpose:** Processes ERIX-Store jobs

**Methods:**
- `crmErixWorker.start()` - Start worker
- `crmErixWorker.stop()` - Stop worker
- `crmErixWorker.getStats()` - Get statistics

---

## 🔄 Rollout Process

### **Current: Phase 1 - Parallel Storage**
```bash
PARALLEL_AUTOMATION_STORAGE=true
USE_ERIX_STORE_EVENTS=false
ERIX_STORE_ROLLOUT_PERCENTAGE=0
```
**Result:** MongoDB executes, ERIX-Store receives (testing)

---

### **Next: Phase 2 - 10% Rollout**
```bash
USE_ERIX_STORE_EVENTS=true
ERIX_STORE_ROLLOUT_PERCENTAGE=10
```
**Result:** 10% of clients use ERIX-Store

---

### **Later: Phase 3 - 50% Rollout**
```bash
ERIX_STORE_ROLLOUT_PERCENTAGE=50
```
**Result:** 50% of clients use ERIX-Store

---

### **Final: Phase 4 - Full Rollout**
```bash
USE_ERIX_STORE_EVENTS=true
USE_ERIX_STORE_WORKFLOWS=true
ERIX_STORE_ROLLOUT_PERCENTAGE=100
PARALLEL_AUTOMATION_STORAGE=false
```
**Result:** All clients use ERIX-Store!

---

## 🧪 Testing Checklist

- [ ] Server starts: `pnpm run dev`
- [ ] Worker starts: See "✅ CRM ERIX Worker started"
- [ ] Run test script: `tsx test-automation-system.ts`
- [ ] Check worker stats: `crmErixWorker.getStats()`
- [ ] Emit test event: `AutomationRouter.emitEvent()`
- [ ] Verify MongoDB EventLog has entry
- [ ] Verify ERIX-Store queue has job
- [ ] Check logs for errors
- [ ] Monitor for 1 week

---

## 📚 Documentation

- **SYSTEM_STATUS.md** - Current system status
- **IMPLEMENTATION_COMPLETE.md** - What was built
- **README_IMPLEMENTATION.md** - How to use
- **QUICK_START.md** - This file
- **test-automation-system.ts** - Test script

---

## 🐛 Common Issues

### **Worker not starting?**
- Check ERIX-Store connection
- Verify .env configuration
- Restart server

### **Events not processing?**
- Check worker stats
- Verify MongoDB connection
- Check error logs

### **Parallel storage not working?**
- Verify `PARALLEL_AUTOMATION_STORAGE=true`
- Restart server
- Check ERIX-Store connection

---

## 💡 Tips

1. **Always use AutomationRouter** - Don't call EventBus directly
2. **Monitor worker stats** - Track job processing
3. **Check logs regularly** - Catch errors early
4. **Test before rollout** - Verify everything works
5. **Gradual rollout** - Don't rush to 100%

---

## 🎯 Next Steps

1. ✅ System is running
2. 🧪 Run tests
3. 📊 Monitor for 1 week
4. 🚀 Enable 10% rollout
5. 📈 Gradual increase
6. 🎉 Full production

---

**Status:** 🟢 **READY TO USE**

**Start testing:** `tsx test-automation-system.ts`
