# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## App Flow Architecture

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Authentication Flow](#authentication-flow)
3. [Workflow Creation Flow](#workflow-creation-flow)
4. [Workflow Execution Flow](#workflow-execution-flow)
5. [Template Marketplace Flow](#template-marketplace-flow)
6. [Run History Flow](#run-history-flow)
7. [Error Handling Flow](#error-handling-flow)
8. [Role-Based Access Control Flow](#role-based-access-control-flow)
9. [Subscription and Payment Flow](#subscription-and-payment-flow)
10. [Notification Flow](#notification-flow)
11. [State Management Logic](#state-management-logic)
12. [Assumptions Made](#assumptions-made)

---

## Application Overview

ERIX-FLOW is accessed through the ECODrIx Console Hub. Users navigate to the FLOW module, manage workflows, build on the canvas, trigger runs, and monitor results. The application has three primary interaction surfaces: the workflow list, the canvas editor, and the run history viewer. Template marketplace is a secondary surface activated after initial onboarding.

---

## Authentication Flow

1. **User accesses ECODrIx Console (/console)**
   Next.js middleware checks for valid JWT in httpOnly cookie.
   - Valid JWT: proceed to console hub
   - Expired JWT: call /api/auth/refresh with refresh token cookie
   - No token: redirect to /login
2. **JWT refresh attempt**
   POST /api/auth/refresh — exchange refresh token for new access JWT.
   - Success: set new JWT cookie, resume navigation
   - Refresh expired (30d): redirect to /login, clear all auth cookies
3. **Login page (/login)**
   Email + password form. Submits to POST /api/auth/login.
   - Success: set JWT + refresh cookie, redirect to /console
   - Failure: show inline field error (no toast, no full-page error)
4. **FLOW module access check**
   On entering /console/flow, check tenant plan includes FLOW access (not Free).
   - Free plan: show upgrade prompt overlay on canvas
   - Paid plan: proceed to workflow list

---

## Workflow Creation Flow

1. **User opens ERIX-FLOW (/console/flow)**
   Workflow list page loads. Shows existing workflows as cards with last run status.
   - Empty state: show onboarding card with 'Create workflow' and 'Browse templates' CTAs
2. **User clicks 'New Workflow'**
   Modal: enter workflow name + optional description. Click Create.
   - POST /api/v1/flow/workflows with {name, description}
   - Server creates workflow record, returns workflowId
   - Navigate to /console/flow/[workflowId] (canvas editor)
3. **Canvas editor loads (empty)**
   Empty canvas with dot-grid background. Node library sidebar visible on left.
   - Trigger node auto-placed at top-left as starting point
   - Prompt tooltip: 'Add a trigger to start your workflow'
4. **User drags nodes from library to canvas**
   React Flow handles drag-drop. Node placed at drop position.
   - Node appears with default config
   - Config panel slides in on the right
   - User fills required fields in config panel
5. **User connects nodes with edges**
   Drag from output handle of one node to input handle of next.
   - Edge renders in source node category color
   - Incompatible connections (e.g., output leads to trigger input) rejected with tooltip
6. **Auto-save**
   Zustand state serialised to JSON every 30 seconds. PUT /api/v1/flow/workflows/:id.
   - Saved indicator in toolbar: 'Saved 3s ago'
   - Manual save: Ctrl+S
7. **User clicks Run**
   POST /api/v1/flow/workflows/:id/run — server validates graph, enqueues run.
   - Credit estimate shown in confirm modal before execution
   - On confirm: run starts, SSE connection opens, canvas enters run-mode display

---

## Workflow Execution Flow

1. **Run triggered**
   Server receives POST /api/v1/flow/workflows/:id/run. Creates workflow_run record with status=QUEUED.
   - Topological sort of node graph to determine execution order
   - First node job enqueued in ErixStore: ERIX.JOB.PUSH FLOW:{tenantId}:{runId}:{nodeId}
2. **erix-flow-worker dequeues first node**
   ERIX.JOB.DEQUEUE FLOW:{tenantId} — atomic, prevents double execution.
   - Node executor instantiated based on node type
   - Context built: {tenantId, runId, nodeId, config, inputData}
3. **Node executes (example: LAIE Scrape Node)**
   HTTP call to LAIE scraper service: POST /scrape {query, city, source, limit}.
   - Scraper returns leads array
   - Results written to ErixStore: ERIX.SET FLOW.RESULT.{runId}.{nodeId}
   - SSE event pushed to frontend: {nodeId, status: COMPLETED, leadsOut: 147}
4. **Worker enqueues next node(s)**
   After node completes, resolve all downstream nodes that have all inputs ready.
   - If condition node: evaluate branch, enqueue only the matching branch's downstream nodes
   - Parallel branches: both enqueued simultaneously — ErixStore handles concurrency
5. **Run completes**
   All nodes in terminal state (COMPLETED or FAILED). Update workflow_run status.
   - Aggregate stats: total leads in, leads at each stage, messages sent, credits consumed
   - SSE event: {runId, status: COMPLETED, summary: {...}}
   - Write run stats to PostgreSQL node_run_logs
6. **CRM sync**
   Last node (CRM Push) writes all processed leads to tenant MongoDB.
   - Upsert contacts: match by phone or email
   - Append outreach_history array entry per lead
   - Tag leads with workflow_id for CRM filtering

---

## Template Marketplace Flow

1. **User navigates to Templates tab**
   GET /api/v1/flow/templates — returns paginated list of official + community templates.
   - Templates displayed as cards: name, category, node count, install count, preview thumbnail
2. **User clicks template card**
   Template preview drawer opens showing full node graph (read-only React Flow canvas).
   - Shows estimated credit cost per run
   - Shows which modules are required (e.g., 'Requires ERIX-LAIE and ErixSender')
3. **User clicks Install Template**
   POST /api/v1/flow/templates/:id/install — server clones template workflow into tenant workspace.
   - New workflow created with status=DRAFT and template-sourced canvas JSON
   - Navigate to new workflow canvas with 'Configure required fields' overlay
4. **User configures template variables**
   Config panel highlights all required fields in amber with 'Required' badge.
   - User fills: target city, product name, WhatsApp template ID, CRM tags
   - All required fields filled: 'Ready to Run' button activates

---

## Run History Flow

1. **User navigates to Run History tab or workflow run list**
   GET /api/v1/flow/runs?workflowId=X — returns paginated run history.
   - Table: run #, date, status (badge), leads in, leads out, credits used, duration
2. **User clicks a run row**
   Run detail drawer opens: canvas view with node-level stats overlaid.
   - Each node shows: leads in, leads out, duration, status badge
   - Failed nodes show error message in red tooltip
3. **User clicks 'View Logs' on a node**
   Log drawer opens: structured log entries per lead processed through that node.
   - Phone/email redacted in display
   - Timestamp, status, input summary, output summary per lead
   - Export logs as CSV button (Growth+ plans)
4. **Re-run from failed node**
   Button on failed node: 'Re-run from here'. POST /api/v1/flow/runs/:id/retry?fromNode=nodeId.
   - Server replays execution from specified node
   - Completed upstream nodes skipped (results fetched from ErixStore cache)
   - New run record created with parent_run_id reference

---

## Error Handling Flow

1. **Node execution fails**
   Worker catches exception. Updates node_run_log status=FAILED, error_message=sanitized error.
   - SSE event: {nodeId, status: FAILED, error: 'WhatsApp API rate limit exceeded'}
2. **Retry logic**
   ErixStore ERIX.JOB.RETRY with backoff: 30s, 2min, 10min.
   - Max 3 retries. After 3 failures: mark node as PERMANENTLY_FAILED
3. **Workflow run marked FAILED**
   If any P0 node permanently fails, entire run status = FAILED.
   - Canvas shows red banner
   - In-console notification created for tenant
4. **Quota exceeded mid-run**
   Credit balance hits 0 during run. All pending node jobs cancelled.
   - Run status = FAILED (quota)
   - Leads already processed and sent to CRM are preserved
   - In-console notification + top-up prompt with Razorpay link

---

## Role-Based Access Control Flow

1. **Tenant admin creates workflow**
   Full access: create, edit, run, delete, view logs.
   - Can configure all node types including webhook and API trigger
2. **Team member (editor role) uses canvas**
   Can create and edit workflows but cannot delete. Can view run logs.
   - Cannot access webhook secret values (masked in config panel)
3. **Team member (viewer role) views canvas**
   Read-only canvas. Cannot drag nodes or modify config.
   - Can view run history and logs
   - Run button disabled
4. **External API trigger (Scale plan)**
   API key in Authorization header triggers workflow via POST /api/v1/flow/workflows/:id/run.
   - API key scoped to specific workflow IDs — not global tenant access

---

## Subscription and Payment Flow

1. **User hits credit limit mid-workflow or views low balance warning**
   In-console amber banner: 'You have X credits remaining. Top up to continue.'
   - Click 'Top Up' opens credit pack selection modal
   - Packs: Rs 499 (1,000 credits) | Rs 999 (3,000 credits) | Rs 1,999 (8,000 credits)
2. **User selects pack and clicks Pay**
   POST /api/v1/billing/credits/topup — creates Razorpay order.
   - Razorpay checkout opens (web SDK)
   - User completes UPI/card/netbanking payment
3. **Payment success webhook**
   Razorpay calls POST /api/v1/billing/webhooks/razorpay with payment_id.
   - HMAC signature verified
   - credit_ledger entry created: type=credit, amount=+credits, razorpay_payment_id
   - Tenant credit balance updated in PostgreSQL
   - In-console notification: 'Rs 999 top-up successful. 3,000 credits added.'
4. **Payment failure**
   Razorpay order status = failed.
   - No credit_ledger entry created
   - In-console error toast: 'Payment failed. No credits deducted. Try again.'

---

## Notification Flow

1. **Workflow run completes (success or failure)**
   erix-flow-worker publishes run completion event to ErixStore.
   - Event: ERIX.EVENT.PUBLISH FLOW.RUN.COMPLETE {tenantId, runId, status, summary}
2. **Notification service consumes event**
   Creates in-console notification record in PostgreSQL notifications table.
   - Success: 'Workflow [Name] completed. 147 leads processed, 143 WhatsApps sent.'
   - Failure: 'Workflow [Name] failed at WhatsApp node. View details.'
3. **Frontend receives notification**
   Console notification bell badge increments. Dropdown shows new entry.
   - Click notification navigates to workflow run detail
   - Mark as read on click
4. **Weekly digest email**
   Sunday cron job (ErixStore scheduler) aggregates week's run stats per tenant.
   - ErixSender sends digest email: total runs, total leads, credits used, top workflow by leads
   - Opt-out link in email footer

---

## State Management Logic

- Canvas state (nodes, edges, viewport): Zustand store — local to canvas editor, persisted to server every 30s
- Run status map: Zustand store — {[nodeId]: {status, leadsIn, leadsOut, error}} — updated by SSE events
- Workflow list: TanStack Query with 30s stale time — refetched on window focus
- Run history: TanStack Query with infinite scroll — 20 runs per page, prefetch next page
- Credit balance: TanStack Query with 60s stale time + invalidated on any billing event
- Template list: TanStack Query with 10-minute cache — templates change infrequently
- Selected node (config panel): Zustand selectedNodeId — drives right panel render

---

## Assumptions Made

- ECODrIx Console auth flow (JWT + refresh) applies to FLOW module without modification
- Free plan users can view the canvas and browse templates but cannot trigger runs
- Team roles (admin, editor, viewer) are already implemented in ECODrIx Console — FLOW extends them
- SSE connection is stable for typical workflow durations (under 30 minutes); longer runs fall back to polling
- All workflow canvas state is persisted before run is triggered — no risk of losing unsaved canvas on browser close during run

---
