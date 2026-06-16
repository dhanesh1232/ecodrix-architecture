# 🏗️ Hybrid Automation System - Architecture Diagram

---

## 📊 Current System Architecture (Parallel Storage Mode)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / API REQUEST                          │
│                    (Lead created, Stage changed, etc.)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTOMATION ROUTER                              │
│                 (Feature Flag Decision Layer)                       │
│                                                                     │
│  • Checks: USE_ERIX_STORE_EVENTS                                   │
│  • Checks: ERIX_STORE_ROLLOUT_PERCENTAGE                           │
│  • Checks: PARALLEL_AUTOMATION_STORAGE                             │
│                                                                     │
│  Current Config:                                                    │
│    USE_ERIX_STORE_EVENTS = false                                   │
│    PARALLEL_AUTOMATION_STORAGE = true                              │
│    ERIX_STORE_ROLLOUT_PERCENTAGE = 0                               │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │   MONGODB SYSTEM (V1)     │ │  ERIX-STORE SYSTEM (V2)   │
    │      ✅ PRIMARY           │ │     ✅ SECONDARY          │
    │   (Executes Automation)   │ │  (Receives Events Only)   │
    └───────────┬───────────────┘ └───────────┬───────────────┘
                │                             │
                ▼                             ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │     EventBus (V1)         │ │    EventBusV2 (V2)        │
    │                           │ │                           │
    │  • Stores in EventLog     │ │  • Idempotency (KV)       │
    │  • Creates Bull job       │ │  • Queue V2 job           │
    │  • Existing system        │ │  • New system             │
    └───────────┬───────────────┘ └───────────┬───────────────┘
                │                             │
                ▼                             ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │    Bull Queue (Redis)     │ │   ERIX Queue V2           │
    │                           │ │                           │
    │  • Job: automation_event  │ │  • automation-events      │
    │  • Existing queue         │ │  • workflow-executions    │
    └───────────┬───────────────┘ └───────────┬───────────────┘
                │                             │
                ▼                             ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │     CRM Worker            │ │   CRM ERIX Worker         │
    │                           │ │                           │
    │  • Processes Bull jobs    │ │  • Processes Queue V2     │
    │  • Existing worker        │ │  • New worker             │
    │  • ✅ EXECUTES RULES     │ │  • ⏸️  READY (no exec)   │
    └───────────┬───────────────┘ └───────────┬───────────────┘
                │                             │
                ▼                             ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │  Automation Execution     │ │   (No Execution Yet)      │
    │                           │ │                           │
    │  • Find matching rules    │ │  • Worker ready           │
    │  • Evaluate conditions    │ │  • Waiting for rollout    │
    │  • Execute actions        │ │  • Testing mode           │
    │  • Send messages          │ │                           │
    └───────────────────────────┘ └───────────────────────────┘
```

---

## 🔄 Event Flow (Current - Parallel Storage)

```
1. User Action (e.g., Lead Created)
   │
   ▼
2. AutomationRouter.emitEvent()
   │
   ├─→ Feature Flag Check
   │   │
   │   ├─ USE_ERIX_STORE_EVENTS = false
   │   │  └─→ Use MongoDB (PRIMARY)
   │   │
   │   └─ PARALLEL_AUTOMATION_STORAGE = true
   │      └─→ Also use ERIX-Store (SECONDARY)
   │
   ├─→ MongoDB Path (PRIMARY - EXECUTES)
   │   │
   │   ├─→ EventBus.emit()
   │   │   └─→ Store in EventLog collection
   │   │
   │   ├─→ Bull Queue
   │   │   └─→ Create job: automation_event
   │   │
   │   ├─→ CRM Worker
   │   │   └─→ Process job
   │   │
   │   └─→ Automation Execution
   │       ├─→ Find matching rules
   │       ├─→ Evaluate conditions
   │       ├─→ Execute actions
   │       └─→ Send messages ✅
   │
   └─→ ERIX-Store Path (SECONDARY - TESTING)
       │
       ├─→ EventBusV2.emit()
       │   ├─→ Check idempotency (KV)
       │   └─→ Store event metadata
       │
       ├─→ ERIX Queue V2
       │   └─→ Create job: automation-events
       │
       ├─→ CRM ERIX Worker
       │   └─→ Process job (logs only)
       │
       └─→ No Execution (Testing Mode)
           └─→ Ready for rollout ⏸️
```

---

## 🚀 Event Flow (After 10% Rollout)

```
1. User Action
   │
   ▼
2. AutomationRouter.emitEvent()
   │
   ├─→ Feature Flag Check
   │   │
   │   ├─ USE_ERIX_STORE_EVENTS = true
   │   ├─ ERIX_STORE_ROLLOUT_PERCENTAGE = 10
   │   │
   │   └─→ Hash clientCode
   │       ├─ 10% → Use ERIX-Store
   │       └─ 90% → Use MongoDB
   │
   ├─→ 90% of Clients → MongoDB Path
   │   └─→ (Same as before)
   │
   └─→ 10% of Clients → ERIX-Store Path
       │
       ├─→ EventBusV2.emit()
       │   ├─→ Check idempotency
       │   └─→ Store event
       │
       ├─→ ERIX Queue V2
       │   └─→ Create job
       │
       ├─→ CRM ERIX Worker
       │   └─→ Process job
       │
       └─→ Automation Execution ✅
           ├─→ Find matching rules
           ├─→ Evaluate conditions
           ├─→ Execute actions
           └─→ Send messages
```

---

## 🎯 Event Flow (After Full Rollout - 100%)

```
1. User Action
   │
   ▼
2. AutomationRouter.emitEvent()
   │
   ├─→ Feature Flag Check
   │   │
   │   ├─ USE_ERIX_STORE_EVENTS = true
   │   ├─ ERIX_STORE_ROLLOUT_PERCENTAGE = 100
   │   └─ PARALLEL_AUTOMATION_STORAGE = false
   │
   └─→ 100% of Clients → ERIX-Store Path ONLY
       │
       ├─→ EventBusV2.emit()
       │   ├─→ Check idempotency
       │   └─→ Store event
       │
       ├─→ ERIX Queue V2
       │   └─→ Create job
       │
       ├─→ CRM ERIX Worker
       │   └─→ Process job
       │
       └─→ Automation Execution ✅
           ├─→ Find matching rules
           ├─→ Evaluate conditions
           ├─→ Execute actions
           └─→ Send messages

   (MongoDB system deprecated)
```

---

## 🔧 Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATION ROUTER                            │
│                  (Unified Interface)                            │
│                                                                 │
│  Methods:                                                       │
│    • emitEvent()                                               │
│    • enrollInWorkflow()                                        │
│    • getBackendStatus()                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   EventBus V1    │      │  EventBusV2      │
│   (MongoDB)      │      │  (ERIX-Store)    │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ WorkflowEngine   │      │ WorkflowEngineV2 │
│   (MongoDB)      │      │  (ERIX-Store)    │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  CRM Worker      │      │ CRM ERIX Worker  │
│  (Bull Queue)    │      │  (Queue V2)      │
└──────────────────┘      └──────────────────┘
```

---

## 📦 Data Storage

### **MongoDB (V1):**
```
Collections:
├─ EventLog
│  └─ Stores all automation events
│
├─ AutomationRule
│  └─ Stores automation rules (conditions, actions)
│
├─ WorkflowRun
│  └─ Stores workflow execution state
│
└─ Lead
   └─ Stores lead data
```

### **ERIX-Store (V2):**
```
Storage:
├─ KV (Key-Value)
│  └─ event:idempotency:{key}
│     └─ Prevents duplicate events (1 hour TTL)
│
├─ Hash
│  └─ workflow:run:{runId}
│     └─ Stores workflow execution state
│
└─ Queue V2
   ├─ automation-events
   │  └─ Event processing jobs
   │
   └─ workflow-executions
      └─ Workflow execution jobs
```

---

## 🔄 Rollout Progression

```
Phase 1: Parallel Storage (Current)
┌─────────────────────────────────────┐
│  MongoDB: 100% execution            │
│  ERIX-Store: 0% execution (testing) │
│  Duration: 1 week                   │
└─────────────────────────────────────┘

Phase 2: 10% Rollout
┌─────────────────────────────────────┐
│  MongoDB: 90% execution             │
│  ERIX-Store: 10% execution          │
│  Duration: 1 week                   │
└─────────────────────────────────────┘

Phase 3: 50% Rollout
┌─────────────────────────────────────┐
│  MongoDB: 50% execution             │
│  ERIX-Store: 50% execution          │
│  Duration: 1 week                   │
└─────────────────────────────────────┘

Phase 4: Full Rollout
┌─────────────────────────────────────┐
│  MongoDB: 0% execution (deprecated) │
│  ERIX-Store: 100% execution         │
│  Duration: Ongoing                  │
└─────────────────────────────────────┘
```

---

## 🎯 Key Decision Points

### **AutomationRouter Decision Logic:**

```typescript
function routeEvent(clientCode: string, trigger: string, payload: any) {
  // Step 1: Check if ERIX-Store is enabled
  if (!USE_ERIX_STORE_EVENTS) {
    return 'mongodb';  // Use MongoDB
  }
  
  // Step 2: Check rollout percentage
  if (ERIX_STORE_ROLLOUT_PERCENTAGE >= 100) {
    return 'erix-store';  // Use ERIX-Store
  }
  
  if (ERIX_STORE_ROLLOUT_PERCENTAGE <= 0) {
    return 'mongodb';  // Use MongoDB
  }
  
  // Step 3: Deterministic rollout based on client hash
  const hash = hashClientCode(clientCode);
  const bucket = hash % 100;
  
  if (bucket < ERIX_STORE_ROLLOUT_PERCENTAGE) {
    return 'erix-store';  // Use ERIX-Store
  } else {
    return 'mongodb';  // Use MongoDB
  }
}
```

---

## 📊 Monitoring Points

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MongoDB System:                                            │
│    • Events/min: 1,234                                     │
│    • Success rate: 99.8%                                   │
│    • Avg latency: 45ms                                     │
│    • Queue depth: 12                                       │
│                                                             │
│  ERIX-Store System:                                         │
│    • Events/min: 123 (10% rollout)                        │
│    • Success rate: 99.9%                                   │
│    • Avg latency: 38ms                                     │
│    • Queue depth: 3                                        │
│                                                             │
│  Workers:                                                   │
│    • CRM Worker: ✅ Running (50 jobs/min)                 │
│    • CRM ERIX Worker: ✅ Running (5 jobs/min)             │
│                                                             │
│  Connections:                                               │
│    • MongoDB: ✅ Connected                                 │
│    • ERIX-Store: ✅ Connected (uptime: 8.2h)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Summary

**Current Architecture:**
- ✅ Hybrid system with routing layer
- ✅ Parallel storage for testing
- ✅ Feature flags for gradual rollout
- ✅ Automatic fallback to MongoDB
- ✅ Both systems operational

**Key Components:**
- AutomationRouter (routing)
- EventBusV2 (ERIX-Store events)
- WorkflowEngineV2 (ERIX-Store workflows)
- CRM ERIX Worker (ERIX-Store jobs)

**Current State:**
- MongoDB: 100% execution (primary)
- ERIX-Store: 0% execution (testing)
- Parallel storage: Enabled
- Ready for rollout: Yes

---

**Status:** 🟢 **OPERATIONAL**

**Next:** Enable 10% rollout after 1 week of testing
