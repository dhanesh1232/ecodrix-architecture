# ECODrix Automation Architecture Audit

This document provides a comprehensive audit and architectural breakdown of how Automations, Events, Triggers, Workflows, and Sequences function within the `ECOD/server` backend.

## 1. High-Level Architecture Overview

The system is currently operating in a hybrid state, gradually migrating from a **Legacy MongoDB/BullMQ** architecture to a highly scalable **ErixStore (Redis-based)** event-driven architecture.

The core flow is:
**Trigger / Event** → **Router** → **Queue / Event Bus** → **Worker** → **Workflow Engine** → **Action Executor**

---

## 2. Core Components

### A. The Automation Router (`automationRouter.service.ts`)

This acts as the traffic controller. When an event occurs (e.g., a lead is created or a webhook is received), the system calls the `AutomationRouter`.

- **Feature Flags:** It uses `USE_ERIX_STORE_EVENTS` and `USE_ERIX_STORE_WORKFLOWS` to decide which engine to use.
- **Rollout Percentage:** It uses `ERIX_STORE_ROLLOUT_PERCENTAGE` (currently set to 100) to deterministically route a percentage of traffic to the new V2 system, allowing safe migrations.

### B. The Event Bus (`eventBusV2.service.ts`)

The `EventBusV2` is responsible for receiving payloads, validating them, and placing them onto execution queues.

- **Idempotency:** Generates unique `idempotencyKey`s with TTLs to prevent duplicate event execution.
- **Filtering:** Evaluates conditions (e.g., `lead.source === 'Facebook'`) before allowing an event to trigger a workflow.
- **Queuing:** Pushes jobs onto ErixStore queues with strict priorities (`events:high`, `events:default`, `events:low`).

### C. The Background Worker (`crm-erix-worker.ts`)

A long-running polling worker that claims jobs from the ErixStore queues.

- **Polling Loop:** Continuously polls queues for pending events or workflow actions.
- **Fault Tolerance:** Tracks `attempts` and moves failed jobs to a KV-based Dead Letter Queue (DLQ) if they exceed `maxAttempts`.
- **Delegation:** Passes generic events to the Workflow Engine, or immediately executes atomic actions.

### D. The Workflow Engine (`workflowEngineV2.service.ts`)

The "State Machine" that orchestrates multi-step sequences.

- **Initialization:** When a trigger fires, it looks up the relevant `AutomationRule` from MongoDB, converts it into a sequence of `WorkflowStep`s, and generates a unique `WorkflowRun` state in ErixStore.
- **State Management:** Uses ErixStore `hset` to store the active state, variables, and completed steps of a run (`workflows:${clientCode}:${runId}`).
- **Control Flow:** Handles complex logic including:
  - **Sequential Execution:** Steps run one after another.
  - **Delays:** Pushes jobs back to the queue with a scheduled `runAt` time.
  - **Branching (If/Else):** Evaluates runtime conditions (e.g., "Did they open the email?") and routes execution to different sub-sequences.
  - **Parallel Execution:** Spawns multiple steps simultaneously.

### E. The Action Executor (`actionExecutor.service.ts`)

The "Doer". This service takes a single, isolated step and performs the actual business logic.

- **Dynamic Templating (`resolveTemplate`):** Deeply parses payloads, injecting variables like `{{lead.firstName}}` into subjects, URLs, or WhatsApp messages. Also features smart currency/date formatting.
- **Integrations:**
  - `send_whatsapp`: Connects with `whatsapp.service` to send Meta/Twilio approved templates.
  - `send_email`: Dispatches emails through SES/SendGrid with HTML resolution.
  - `generate_meet`: Automatically provisions Google Meet links.
  - `update_lead` / `add_tag` / `move_stage`: Modifies CRM state.
  - `webhook_notify`: Dispatches outbound HTTP requests to external systems.

---

## 3. Step-by-Step Flow Example: "Lead Created"

1. **Trigger Phase:** A new lead signs up. The API calls `AutomationRouter.routeEvent('lead_created', leadData)`.
2. **Routing Phase:** The router checks feature flags, sees V2 is active, and sends the payload to `EventBusV2`.
3. **Bus Phase:** The Event Bus creates an idempotency lock, ensures conditions pass, and pushes a job to the `events:high` ErixStore queue.
4. **Worker Phase:** `CrmErixWorker` claims the job and hands it to `WorkflowEngineV2`.
5. **Engine Phase:** The engine finds a rule mapping `lead_created` to a "Welcome Sequence". It saves the state in Redis and triggers step 1.
6. **Execution Phase:** Step 1 is `send_whatsapp`. The engine passes the step to `ActionExecutor`. The executor resolves `{{lead.firstName}}`, sends the WhatsApp via the Meta API, and returns success.
7. **Continuation:** The engine notes Step 1 is complete. Step 2 is a `delay` of 24 hours. The engine schedules a wake-up job in the queue for tomorrow.

---

## 4. Strengths & Migration Notes

- **Decoupled:** The separation between the Engine (state) and the Executor (action) means adding a new integration (e.g., Slack notifications) only requires adding a switch case in `actionExecutor.service.ts`.
- **Memory Efficient:** V2 completely removes heavy Mongoose aggregation pipelines from the runtime loop, utilizing lightweight Redis KV storage (`erixStore`) for intermediate states.
- **Strict Types:** Recent updates enforce strict type narrowing when communicating with `ErixClient`, reducing runtime crashes significantly.

## Summary

The ECODrix automation system is a highly modular, event-driven DAG (Directed Acyclic Graph) engine. It uses a robust queue-worker architecture to ensure reliability, retries, and high-throughput execution independent of the main API application thread.
