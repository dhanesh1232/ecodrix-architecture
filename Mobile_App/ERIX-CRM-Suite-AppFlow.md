# ERIX CRM Suite — App Flow Architecture
**Version 1.0 | ECODrIx Technologies**

---

## 1. Application Overview

ERIX CRM Suite is accessed via web, PWA (Phase 1), and native app (Phase 2), all sharing the same REST API through @ecodrix/erix-api. This document maps every core user flow from authentication through daily operation.

---

## 2. User Journey Map

**Flow: First-Time Founder Journey**
1. Signup → verify → onboarding wizard
   - Create workspace, name business
   - Connect WhatsApp via erix-connect Embedded Signup
   - Create first pipeline (template suggested by business type)
2. Land on Console home
   - See empty inbox, prompt to send test message
3. First real lead arrives
   - Inbox notification → reply → convert to deal
4. Deal progresses
   - Move through pipeline stages, automation nudges fire
5. Deal closes
   - Project auto-created, task board populated
6. Daily return loop
   - Push notification pulls founder back to inbox

---

## 3. Authentication Flow

**Flow: Login / Refresh / Logout / Forgot Password**
1. Login
   - Enter email + password (or Google OAuth)
   - Server validates, issues JWT (15min) + httpOnly refresh cookie (30d)
2. Session refresh
   - Access token expires → silent refresh call using httpOnly cookie
   - New access token issued, no user interruption
3. Logout
   - Client clears local state, server invalidates refresh token
4. Forgot password
   - Request reset → email link (AWS SES) → set new password → auto-login

---

## 4. Registration and Verification Flow

**Flow: New Tenant Signup**
1. Enter email, business name, phone
   - Validate email format, check for existing tenant
2. Email verification
   - AWS SES sends OTP/link → user confirms
3. Password creation
   - Enforce minimum strength requirements
4. Workspace provisioning
   - Tenant record created in Postgres, default roles seeded

---

## 5. Onboarding Flow

**Flow: Guided Setup Wizard**
1. Business type selection
   - Choose from templates (agency, real estate, D2C, education, healthcare)
2. Connect WhatsApp
   - erix-connect Embedded Signup flow, OAuth to Meta
3. Pipeline template applied
   - Pre-built stages based on business type selection
4. Invite team members
   - Optional at onboarding, can skip and do later

---

## 6. Subscription and Payment Flow

**Flow: Plan Selection and Billing**
1. Select tier
   - Free / Solo / Small Team / Growth / Scale displayed with feature comparison
2. Razorpay checkout
   - Redirect to Razorpay, handle success/failure webhook
3. Subscription activation
   - Webhook confirms payment → tenant plan upgraded → limits unlocked
4. Renewal / dunning
   - Failed renewal → grace period → downgrade to Free after grace expires

---

## 7. Workspace / Account Setup Flow

**Flow: Team and Channel Configuration**
1. Add team members
   - Invite via email, assign role (Admin/Agent/Viewer)
2. Configure channels
   - WhatsApp (required), Instagram (optional), Email (optional via SES)
3. Set business hours
   - Used for automation timing and SLA calculations

---

## 8. Core Feature Flows

### 8.1 Unified Inbox Flow
**Flow: Message Received to Reply Sent**
1. Inbound message arrives
   - erix-connect webhook receives from Meta/SES → ErixStore queue
2. Contact resolution
   - Match phone/email to existing contact or create new
3. Thread updates
   - WebSocket pushes new message to any open inbox sessions
4. Agent replies
   - Reply routes back through erix-connect to correct channel

### 8.2 Pipeline Flow
**Flow: Deal Creation to Close**
1. Deal created
   - Manually or converted from inbox contact
2. Stage progression
   - Drag-drop or automation-driven stage change
3. Automation evaluation
   - ErixStore checks rules matching new stage, queues actions
4. Deal closed
   - Won triggers project creation; Lost triggers reason capture

### 8.3 Project Flow
**Flow: Task Board Lifecycle**
1. Project created
   - Auto (from deal) or manual
2. Tasks added
   - Assignee, due date, checklist items
3. Status updates
   - Drag between To Do / In Progress / Done
4. Completion
   - Customer notified via WhatsApp template if configured

---

## 9. Admin Panel Flow

**Flow: Tenant Administration**
1. Admin views usage dashboard
   - Contact count, message volume, plan limits vs actual
2. Manage billing
   - Upgrade/downgrade plan, view invoices
3. Manage team
   - Change roles, remove members, view activity log

---

## 10. Team and Role Management Flow

**Flow: Role Assignment**
1. Owner invites member
   - Selects role at invite time
2. Member accepts
   - Sets password, lands on onboarding-lite (skip business setup)
3. Permission enforcement
   - Every API call checked against role capability matrix

---

## 11. Notification Flow

**Flow: Realtime and Push Notifications**
1. Event occurs
   - New inbox message, deal assigned, task overdue
2. ErixStore pub/sub
   - Pushes to connected WebSocket clients
3. Push notification (offline/background)
   - Web Push API (PWA) or native push (Phase 2) if client not connected
4. Notification center
   - Persisted list, mark-as-read state synced across devices

---

## 12. Automation / Trigger Flow

**Flow: Rule Evaluation**
1. Trigger event fires
   - Stage change, tag added, inbox message received
2. Rule matching
   - ErixStore evaluates active rules for tenant matching event type
3. Condition check
   - Server-side validation (e.g., WhatsApp 24hr window) before action
4. Action execution
   - Send template, assign owner, create task — logged as activity

---

## 13. AI Interaction Flow

**Flow: AI-Assisted Actions**
1. Trigger
   - Broadcast caption request, or inbound lead classification
2. Claude API call
   - Prompt includes tenant context, language preference (Telugu/Hindi/English)
3. Response applied
   - Suggested caption inserted for review, or lead auto-tagged

---

## 14. Error Handling Flow

**Flow: Failed Send / API Error**
1. Action fails
   - WhatsApp send rejected, API timeout, validation error
2. User feedback
   - Toast notification, non-blocking, retry button offered
3. Retry logic
   - ErixStore retries transient failures with backoff, surfaces persistent failures

---

## 15. Edge Cases

- Session expiry mid-form-fill: client silently refreshes token, form data preserved in local state
- Payment failure on upgrade: tenant stays on current plan, retry prompt shown, no feature loss
- Quota exceeded (contact limit): new contact creation blocked with upgrade prompt, existing data untouched
- WhatsApp 24-hour window expired: automation falls back to template-only send, agent notified

---

## 16. State Management Logic

- Zustand for local UI state (modals, selected filters, drag state)
- TanStack Query for all server state, invalidated on WebSocket events
- No duplicate source of truth — server state never manually mutated client-side outside optimistic updates

---

## 17. API Communication Pattern

- All calls via @ecodrix/erix-api SDK — no direct fetch calls from components
- Optimistic UI updates for drag-drop actions, rolled back on server rejection
- WebSocket for push, REST for pull/mutation

---

## 18. Role-Based Access Control Flow

**Flow: Permission Check**
1. Request arrives with JWT
   - Middleware extracts tenant_id + role
2. Capability check
   - Route-level permission map checked against role
3. Deny or proceed
   - 403 with clear message if denied, request proceeds if allowed

---

## 19. Session Handling

- Access token in memory only, never localStorage
- Refresh token httpOnly cookie, 30-day expiry, rotated on each refresh
- Multi-device sessions supported independently, no forced single-session

---

## 20. Offline Strategy

- PWA caches last-loaded inbox threads and pipeline board via service worker
- Read-only offline mode — actions queued locally, synced on reconnect
- Clear "offline" banner shown, no silent failures

---

## Assumptions Made

- Native app (Phase 2) reuses this exact flow map — no divergent flows planned
- Embedded Signup for WhatsApp connection reuses existing erix-connect implementation already built
- Offline support is read-only at MVP; full offline write queue is a future enhancement
