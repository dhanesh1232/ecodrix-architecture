# SDK ↔ Backend Cross-Audit

> **Last audited:** 2026-04-10
> **Scope:** `ECOD/backend/src/routes/saas/**` ↔ `ECOD/packages/erix-api/src/resources/**`

---

## Summary of Fixes Applied

| #   | Issue                                                                            | File                 | Status                         |
| --- | -------------------------------------------------------------------------------- | -------------------- | ------------------------------ |
| 1   | `GET /conversations/:id` route missing — SDK called it, backend 404'd            | `chat.routes.ts`     | ✅ Fixed                       |
| 2   | `messages.upload()` return type only had `{url, type}` — `variants` missing      | `messages.ts`        | ✅ Fixed                       |
| 3   | `baseUrl` publicly documented — reveals internal API URL to any dev reading docs | `core.ts`            | ✅ Fixed — `@internal`         |
| 4   | `baseUrl` removed but CLI uses it — caused TS error                              | `core.ts` + `cli.ts` | ✅ Fixed — kept as `@internal` |

---

## Full Route Coverage Map

### WhatsApp — Conversations

| Method | Backend Route                                | SDK Method                                 | Status                 |
| ------ | -------------------------------------------- | ------------------------------------------ | ---------------------- |
| GET    | `/api/saas/chat/conversations`               | `ecod.whatsapp.conversations.list()`       | ✅                     |
| POST   | `/api/saas/chat/conversations`               | `ecod.whatsapp.conversations.create()`     | ✅                     |
| GET    | `/api/saas/chat/conversations/:id`           | `ecod.whatsapp.conversations.retrieve()`   | ✅ Fixed (route added) |
| GET    | `/api/saas/chat/conversations/:id/messages`  | `ecod.whatsapp.conversations.messages()`   | ✅                     |
| POST   | `/api/saas/chat/conversations/:id/read`      | `ecod.whatsapp.conversations.markRead()`   | ✅                     |
| POST   | `/api/saas/chat/conversations/:id/link-lead` | `ecod.whatsapp.conversations.linkLead()`   | ✅                     |
| DELETE | `/api/saas/chat/conversations/:id`           | `ecod.whatsapp.conversations.delete()`     | ✅                     |
| POST   | `/api/saas/chat/conversations/bulk-delete`   | `ecod.whatsapp.conversations.bulkDelete()` | ✅                     |

### WhatsApp — Messages

| Method | Backend Route                       | SDK Method                              | Status                 |
| ------ | ----------------------------------- | --------------------------------------- | ---------------------- |
| POST   | `/api/saas/chat/send`               | `ecod.whatsapp.messages.send()`         | ✅                     |
| POST   | `/api/saas/chat/send` (template)    | `ecod.whatsapp.messages.sendTemplate()` | ✅                     |
| POST   | `/api/saas/chat/messages/:id/star`  | `ecod.whatsapp.messages.star()`         | ✅                     |
| POST   | `/api/saas/chat/messages/:id/react` | `ecod.whatsapp.messages.react()`        | ✅                     |
| POST   | `/api/saas/chat/upload`             | `ecod.whatsapp.messages.upload()`       | ✅ Fixed (return type) |

### WhatsApp — Broadcasts

| Method | Backend Route                   | SDK Method                            | Status |
| ------ | ------------------------------- | ------------------------------------- | ------ |
| GET    | `/api/saas/chat/broadcasts`     | `ecod.whatsapp.broadcasts.list()`     | ✅     |
| GET    | `/api/saas/chat/broadcasts/:id` | `ecod.whatsapp.broadcasts.retrieve()` | ✅     |
| POST   | `/api/saas/chat/broadcast`      | `ecod.whatsapp.broadcasts.create()`   | ✅     |
| PATCH  | `/api/saas/chat/broadcasts/:id` | `ecod.whatsapp.broadcasts.update()`   | ✅     |
| DELETE | `/api/saas/chat/broadcasts/:id` | `ecod.whatsapp.broadcasts.delete()`   | ✅     |

### WhatsApp — Templates

| Method | Backend Route                                       | SDK Method                                   | Status |
| ------ | --------------------------------------------------- | -------------------------------------------- | ------ |
| GET    | `/api/saas/chat/templates`                          | `ecod.whatsapp.templates.list()`             | ✅     |
| GET    | `/api/saas/chat/templates/:name`                    | `ecod.whatsapp.templates.retrieve()`         | ✅     |
| POST   | `/api/saas/chat/templates`                          | `ecod.whatsapp.templates.create()`           | ✅     |
| PUT    | `/api/saas/chat/templates/:id`                      | `ecod.whatsapp.templates.update()`           | ✅     |
| DELETE | `/api/saas/chat/templates/:name?force`              | `ecod.whatsapp.templates.deleteTemplate()`   | ✅     |
| POST   | `/api/saas/chat/templates/sync`                     | `ecod.whatsapp.templates.sync()`             | ✅     |
| GET    | `/api/saas/chat/templates/mapping/config`           | `ecod.whatsapp.templates.mappingConfig()`    | ✅     |
| GET    | `/api/saas/chat/templates/collections`              | `ecod.whatsapp.templates.collections()`      | ✅     |
| GET    | `/api/saas/chat/templates/collections/:name/fields` | `ecod.whatsapp.templates.collectionFields()` | ✅     |
| PUT    | `/api/saas/chat/templates/:name/mapping`            | `ecod.whatsapp.templates.updateMapping()`    | ✅     |
| GET    | `/api/saas/chat/templates/:name/validate`           | `ecod.whatsapp.templates.validate()`         | ✅     |
| POST   | `/api/saas/chat/templates/:name/preview`            | `ecod.whatsapp.templates.preview()`          | ✅     |
| GET    | `/api/saas/chat/templates/:name/usage`              | `ecod.whatsapp.templates.checkUsage()`       | ✅     |

---

### Media / Storage

| Method | Backend Route                      | SDK Method                                                            | Status |
| ------ | ---------------------------------- | --------------------------------------------------------------------- | ------ |
| GET    | `/api/saas/storage/usage`          | `ecod.media.getUsage()` / `ecod.storage.usage()`                      | ✅     |
| POST   | `/api/saas/storage/folders`        | `ecod.media.createFolder()` / `ecod.storage.folders.create()`         | ✅     |
| DELETE | `/api/saas/storage/folders/:path`  | `ecod.storage.folders.delete()`                                       | ✅     |
| GET    | `/api/saas/storage/files/:folder`  | `ecod.media.list()` / `ecod.storage.files.list()`                     | ✅     |
| POST   | `/api/saas/storage/upload-url`     | `ecod.storage.files.getUploadUrl()`                                   | ✅     |
| POST   | `/api/saas/storage/confirm-upload` | `ecod.storage.files.confirmUpload()`                                  | ✅     |
| POST   | `/api/saas/storage/download-url`   | `ecod.media.getDownloadUrl()` / `ecod.storage.files.getDownloadUrl()` | ✅     |
| DELETE | `/api/saas/storage/files`          | `ecod.media.delete()` / `ecod.storage.files.delete()`                 | ✅     |
| GET    | `/api/saas/images`                 | `ecod.media.upload()` ← 3-step presigned                              | ✅     |
| POST   | `/api/saas/images` (multipart)     | Direct fetch / host proxy route                                       | ✅     |

---

### CRM — Leads

| Method | Backend Route                      | SDK Method                        | Status |
| ------ | ---------------------------------- | --------------------------------- | ------ |
| GET    | `/api/saas/crm/leads`              | `ecod.crm.leads.list()`           | ✅     |
| POST   | `/api/saas/crm/leads`              | `ecod.crm.leads.create()`         | ✅     |
| POST   | `/api/saas/crm/leads/upsert`       | `ecod.crm.leads.upsert()`         | ✅     |
| POST   | `/api/saas/crm/leads/import`       | `ecod.crm.leads.import()`         | ✅     |
| GET    | `/api/saas/crm/leads/:id`          | `ecod.crm.leads.retrieve()`       | ✅     |
| GET    | `/api/saas/crm/leads/phone/:phone` | `ecod.crm.leads.findByPhone()`    | ✅     |
| PATCH  | `/api/saas/crm/leads/:id`          | `ecod.crm.leads.update()`         | ✅     |
| PATCH  | `/api/saas/crm/leads/:id/metadata` | `ecod.crm.leads.updateMetadata()` | ✅     |
| PATCH  | `/api/saas/crm/leads/:id/move`     | `ecod.crm.leads.move()`           | ✅     |
| PATCH  | `/api/saas/crm/leads/:id/tags`     | `ecod.crm.leads.updateTags()`     | ✅     |
| POST   | `/api/saas/crm/leads/:id/score`    | `ecod.crm.leads.score()`          | ✅     |
| POST   | `/api/saas/crm/leads/:id/convert`  | `ecod.crm.leads.convert()`        | ✅     |
| DELETE | `/api/saas/crm/leads/:id`          | `ecod.crm.leads.delete()`         | ✅     |
| DELETE | `/api/saas/crm/leads` (bulk)       | `ecod.crm.leads.bulkDelete()`     | ✅     |

### CRM — Pipelines

| Method | Backend Route                                | SDK Method                           | Status |
| ------ | -------------------------------------------- | ------------------------------------ | ------ |
| GET    | `/api/saas/crm/pipelines`                    | `ecod.crm.pipelines.list()`          | ✅     |
| POST   | `/api/saas/crm/pipelines`                    | `ecod.crm.pipelines.create()`        | ✅     |
| GET    | `/api/saas/crm/pipelines/:id`                | `ecod.crm.pipelines.retrieve()`      | ✅     |
| PATCH  | `/api/saas/crm/pipelines/:id`                | `ecod.crm.pipelines.update()`        | ✅     |
| DELETE | `/api/saas/crm/pipelines/:id`                | `ecod.crm.pipelines.delete()`        | ✅     |
| POST   | `/api/saas/crm/pipelines/:id/stages`         | `ecod.crm.pipelines.addStage()`      | ✅     |
| PATCH  | `/api/saas/crm/pipelines/:id/stages/reorder` | `ecod.crm.pipelines.reorderStages()` | ✅     |
| PATCH  | `/api/saas/crm/stages/:id`                   | `ecod.crm.pipelines.updateStage()`   | ✅     |
| DELETE | `/api/saas/crm/stages/:id`                   | `ecod.crm.pipelines.deleteStage()`   | ✅     |

### CRM — Misc

| Module        | Backend Route                              | SDK Method                            | Status |
| ------------- | ------------------------------------------ | ------------------------------------- | ------ |
| Scoring       | `GET /api/saas/crm/scoring`                | `ecod.crm.scoring.get()`              | ✅     |
| Scoring       | `PATCH /api/saas/crm/scoring`              | `ecod.crm.scoring.update()`           | ✅     |
| Sequences     | `GET /api/saas/crm/sequences`              | `ecod.crm.sequences.list()`           | ✅     |
| Notifications | `GET /api/crm/notifications`               | `ecod.notifications.listAlerts()`     | ✅     |
| Notifications | `PATCH /api/crm/notifications/:id/dismiss` | `ecod.notifications.dismissAlert()`   | ✅     |
| Notifications | `DELETE /api/crm/notifications/clear-all`  | `ecod.notifications.clearAllAlerts()` | ✅     |
| Notifications | `POST /api/crm/notifications/:id/retry`    | `ecod.notifications.retryAction()`    | ✅     |
| Payments      | `POST /api/saas/crm/payments/capture`      | `ecod.crm.payments.capture()`         | ✅     |

---

### Events / Automations

| Method | Backend Route                     | SDK Method                           | Status |
| ------ | --------------------------------- | ------------------------------------ | ------ |
| GET    | `/api/saas/events`                | `ecod.events.list()`                 | ✅     |
| POST   | `/api/saas/events/assign`         | `ecod.events.assign()`               | ✅     |
| POST   | `/api/saas/events/unassign`       | `ecod.events.unassign()`             | ✅     |
| POST   | `/api/saas/events/unassign/bulk`  | `ecod.events.unassignBulk()`         | ✅     |
| POST   | `/api/saas/workflows/trigger`     | `ecod.events.trigger()`              | ✅     |
| GET    | `/api/saas/crm/custom-events`     | `ecod.events.listCustomEvents()`     | ✅     |
| POST   | `/api/saas/crm/custom-events`     | `ecod.events.createCustomEvent()`    | ✅     |
| DELETE | `/api/saas/crm/custom-events/:id` | `ecod.events.deleteCustomEvent()`    | ✅     |
| POST   | `/api/saas/crm/events/emit`       | `ecod.events.emit()`                 | ✅     |
| GET    | `/api/saas/events/logs`           | `ecod.notifications.listLogs()`      | ✅     |
| GET    | `/api/saas/events/logs/:id`       | `ecod.notifications.retrieveLog()`   | ✅     |
| GET    | `/api/saas/events/stats`          | `ecod.notifications.getStats()`      | ✅     |
| GET    | `/api/saas/callbacks/logs`        | `ecod.notifications.listCallbacks()` | ✅     |

---

### Meet (Appointments)

| Method | Backend Route        | SDK Method             | Status |
| ------ | -------------------- | ---------------------- | ------ |
| POST   | `/api/saas/meet`     | `ecod.meet.create()`   | ✅     |
| GET    | `/api/saas/meet`     | `ecod.meet.list()`     | ✅     |
| GET    | `/api/saas/meet/:id` | `ecod.meet.retrieve()` | ✅     |
| PATCH  | `/api/saas/meet/:id` | `ecod.meet.update()`   | ✅     |

### Marketing

| Method | Backend Route               | SDK Method                      | Status |
| ------ | --------------------------- | ------------------------------- | ------ |
| POST   | `/api/saas/emails/campaign` | `ecod.marketing.sendCampaign()` | ✅     |
| POST   | `/api/saas/emails/test`     | `ecod.marketing.sendTest()`     | ✅     |

### Queue

| Method | Backend Route               | SDK Method                | Status |
| ------ | --------------------------- | ------------------------- | ------ |
| GET    | `/api/saas/queue/failed`    | `ecod.queue.listFailed()` | ✅     |
| GET    | `/api/saas/queue/stats`     | `ecod.queue.stats()`      | ✅     |
| POST   | `/api/saas/queue/:id/retry` | `ecod.queue.retry()`      | ✅     |
| DELETE | `/api/saas/queue/:id`       | `ecod.queue.delete()`     | ✅     |

### Health

| Method | Backend Route               | SDK Method                | Status |
| ------ | --------------------------- | ------------------------- | ------ |
| GET    | `/api/saas/health`          | `ecod.health.check()`     | ✅     |
| GET    | `/api/saas/jobs/status/:id` | `ecod.health.jobStatus()` | ✅     |

---

## Routes Without SDK Wrappers (Intentional)

These backend routes exist but are **not** wrapped in the SDK — they are system-level or webhook-only endpoints not intended for host project consumption:

| Route                                       | Reason                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| `GET/POST /api/saas/whatsapp/webhook`       | Meta webhook verification — must be public, no auth         |
| `GET /api/saas/mail/open/:token`            | Email open-tracking pixel — browser redirect, no SDK needed |
| `GET /api/saas/mail/click/:token`           | Email click-tracking redirect — browser only                |
| `GET/PUT/DELETE /api/saas/mail/templates/*` | Internal email builder — used by platform UI only           |
| `GET /api/saas/crm/fields`                  | Internal field config — used by platform forms              |

---

## Real-Time Socket Events

The SDK maintains a persistent Socket.io connection automatically on construction. Use `ecod.on("event", handler)` to subscribe from any host project.

```ts
ecod.on("new_message", (msg) => {
  /* inbound WA message */
});
ecod.on("message_sent", (msg) => {
  /* outbound confirmed */
});
ecod.on("message_status_update", (s) => {
  /* delivered / read / failed */
});
ecod.on("conversation_updated", (c) => {
  /* unread count, last message */
});
ecod.on("conversation_deleted", ({ conversationId }) => {
  /* bulk/single delete */
});
ecod.on("message_updated", ({ messageId, updates }) => {
  /* star, react, media processed */
});
ecod.on("notification:new", (n) => {
  /* CRM alert */
});
ecod.on("workflow-run-update", (run) => {
  /* automation execution progress */
});
ecod.on("meet.scheduled", (appt) => {
  /* Google Meet appointment booked */
});
```

> Always call `ecod.off("event", handler)` in component cleanup (e.g. React `useEffect` return) to prevent duplicate handlers on reconnection.

---

## Minimal SDK Usage for Any Host Project

```ts
// 1. Install
// pnpm add @ecodrix/erix-api

// 2. Create singleton (lib/ecod.ts)
import { Ecodrix } from "@ecodrix/erix-api";

export const ecod = new Ecodrix({
  apiKey: process.env.ECOD_API_KEY!,
  clientCode: process.env.ECOD_CLIENT_CODE!,
  // No baseUrl needed — production URL is baked in
});

// 3. Use anywhere
const lead = await ecod.crm.leads.create({
  firstName: "Alice",
  phone: "+911234567890",
});
await ecod.whatsapp.messages.send({ to: "+911234567890", text: "Welcome!" });
const { data } = await ecod.media.upload(file, {
  folder: "avatars",
  filename: "profile.jpg",
  contentType: "image/jpeg",
});
console.log(data.variants?.thumb); // Cloudflare 150px WebP
```
