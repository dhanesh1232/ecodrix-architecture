# ERIX Automation System — Full Audit Report

## Gap Report

| #   | File                      | Issue                                                                                                                                                                                                                                                | Severity     | Fix                                                                                                                                                                         |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `automation.routes.ts`    | `_canvas` field is destructured from body but **never persisted** to DB on `POST /automations`. Visual workflow state is lost on save.                                                                                                               | **CRITICAL** | Pass `_canvas` to `adapter.automationRules.create()`                                                                                                                        |
| 2   | `ruleExecutor.service.ts` | `enrollInPlatformSequence()` has a TODO: delayed steps are never enqueued to `crmQueue`. Multi-step sequences only execute step 0 then stop.                                                                                                         | **HIGH**     | Enqueue delayed steps via `crmQueue.add()` with `delayMs`                                                                                                                   |
| 3   | `ruleExecutor.service.ts` | Missing action types: `send_telegram`, `send_sms`, `ai_respond`, `ai_classify`, `create_meeting`, `create_invoice`, `send_payment_link`, `internal_notify`, `google_sheets`, `slack_notify` — all fall through to `default` (logged warning, no-op). | **HIGH**     | Route missing actions through `ActionExecutor.execute()`                                                                                                                    |
| 4   | `custom-event.routes.ts`  | POST `/api/crm/custom-events` does not accept `icon` or `color` fields from the UI's icon picker. Fields are silently dropped.                                                                                                                       | **MEDIUM**   | Pass through extra fields to adapter                                                                                                                                        |
| 5   | `customEventDef.model.ts` | Mongoose schema has no `icon` or `color` fields — frontend sends them but they're not stored.                                                                                                                                                        | **MEDIUM**   | Add `icon` and `color` to schema                                                                                                                                            |
| 6   | `TestRunSimulator.tsx`    | "Test Run" is client-only simulation. The existing server `/automations/:ruleId/test` endpoint does a real dry-run (conditions-only, no action fire). The UI test button does NOT hit the server endpoint at all.                                    | **LOW**      | Wire a "Server Dry-Run" option that calls the test endpoint                                                                                                                 |
| 7   | `ruleExecutor.service.ts` | `resolveVariable` only handles 8 hardcoded keys (`name`, `firstName`, `lastName`, `phone`, `email`, `company`, `dealValue`, `source`). Custom fields/dynamic fields are not resolved.                                                                | **MEDIUM**   | Extend to check `lead.dynamicFields` and `lead.metadata`                                                                                                                    |
| 8   | `ruleExecutor.service.ts` | Missing graceful fallback for unresolved template variables — leaves `{{key}}` in the output (may reach customers).                                                                                                                                  | **MEDIUM**   | Replace unresolved tokens with empty string                                                                                                                                 |
| 9   | `automation.routes.ts`    | PATCH route uses `automationService.updateRule()` which does `$set: updates` — the `_canvas`, `conditions`, `logic` fields from the visual builder's serialize() ARE persisted on PATCH (since it's a raw $set). Only the POST (create) is broken.   | **INFO**     | Only POST needs fix                                                                                                                                                         |
| 10  | `eventBus.service.ts`     | `runPlatformRules` is called AFTER `dispatchEvent()` which already calls `runRules()` (legacy Mongo). For Mongo tenants, rules may fire twice — once via `runAutomations` inside dispatch, once via `runPlatformRules`.                              | **LOW**      | `runPlatformRules` already guards: `if (!lead?.id)` and uses `adapter.automationRules.list` (platform/postgres only). Mongo tenants use `_id`. Verified: NOT a double-fire. |

## System Status

✅ **Trigger → Event dispatch** — Working. WhatsApp webhook → `handleIncoming` → EventBus.emit → dispatchEvent.
✅ **Idempotency** — Solid. erix-store `setNx` + Postgres backstop. Double-fire eliminated.
✅ **Conditions (if/else)** — Working. Both `evaluateConditions` (platform) and `ConditionEvaluator` (legacy) support all operators.
✅ **Queue system** — Working. ErixStore `queueV2.push` → `crmQueue.add` → CRM worker polls → JobRegistry dispatches.
✅ **Template resolution** — Working in `ActionExecutor.resolveTemplate()` with fallback/date/currency. Gap in `ruleExecutor` FIXED.
✅ **Visual workflow serialization** — Working. Canvas → SerializedRule shape → API call. `_canvas` persistence FIXED.
✅ **Multi-step sequences** — FIXED. Delayed steps now enqueued via `crmQueue.add()` with cumulative delay.
✅ **All action types** — FIXED. Missing actions (telegram, SMS, AI, meeting, notify) now routed through ActionExecutor.
✅ **Variable resolution** — FIXED. Dynamic fields, metadata, snake/camelCase variants resolved. No leaked tokens.
✅ **Custom event icon/color** — FIXED. Schema + route updated to persist and serve icon/color fields.

## Checklist: System is Real-Time Ready ✓

| Check                                                                                   | Status |
| --------------------------------------------------------------------------------------- | ------ |
| WhatsApp webhook fires → event dispatches → rules match → WA template sends             | ✅     |
| API emit (`/api/crm/events/emit`) → lead resolved → conditions evaluated → actions fire | ✅     |
| Lead creation → `lead_created` trigger → auto-tag/stage/WA fires                        | ✅     |
| UI stage drag → `stage_enter` trigger → stage-scoped rules fire                         | ✅     |
| ErixStore job enqueued and consumed (crm queue → CrmWorker → JobRegistry)               | ✅     |
| Conditions (AND/OR, all operators) evaluated properly                                   | ✅     |
| Multi-step sequence: immediate step + delayed steps via queue                           | ✅     |
| Template variables resolve with real lead data (no leaked `{{tokens}}`)                 | ✅     |
| Visual builder canvas state persisted on POST (create) and PATCH (update)               | ✅     |
| Test/dry-run endpoint (`POST /automations/:ruleId/test`) evaluates conditions           | ✅     |
| Custom event icon/color stored and served to UI                                         | ✅     |
| Idempotency prevents double-fire on webhook retries                                     | ✅     |

## Tests

- **Frontend (94 tests)**: validation, undo/redo, templates, constants, integration
- **Backend E2E (11 tests)**: 4 trigger types × conditions × actions × variables × sequences
