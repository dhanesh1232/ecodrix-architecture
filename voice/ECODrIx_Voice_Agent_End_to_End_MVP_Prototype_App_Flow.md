# ECODrIx Voice Agent

## End-to-End MVP, Prototype, Architecture & App Flow Specification

**Document version:** 1.0  
**Created:** 2026-10-09  
**Status:** Proposed implementation blueprint — validate against the existing ECODrIx repository and provider capabilities before implementation  
**Primary goal:** Build a working, testable voice-agent MVP for inbound calls first, then enable controlled outbound calling.

---

## 1. Executive Summary

ECODrIx Voice Agent is a multi-tenant voice automation product that lets a business configure an AI phone agent to answer calls, speak supported Indian languages, capture leads, answer approved questions, book appointments, take messages, and transfer callers to a human when required.

The initial integration plan uses:

- **Vobiz** for telephony and call control.
- **Sarvam AI** for speech-to-text (STT), language-model responses where appropriate, and text-to-speech (TTS), using direct APIs.
- **TypeScript / Node.js** for the existing ECODrIx business API, authorization, database operations, wallet, billing, provider webhooks, and business tools.
- **Python / FastAPI** for a dedicated real-time voice runtime.
- **PostgreSQL + the existing Drizzle setup** as the authoritative business data store.
- **Next.js + TypeScript** for the dashboard.
- **The existing ERIX API SDK** for frontend-to-backend communication where it already fits the current codebase.

### Architectural decision

Keep the TypeScript platform and Python runtime in the same repository initially, but deploy them as separate services. They can share a cloud project. The Python runtime may initially run on the existing ERIX Store VPS **only after capacity, isolation, uptime, and telephony-network requirements have been checked**. Do not place the runtime inside the ERIX Store application process or share its dependency environment.

### MVP scope

1. Configure a voice agent.
2. Associate a Vobiz number with the correct tenant and agent.
3. Handle an inbound call with a supported real-time audio path.
4. Recognize caller speech, generate a response, and play synthesized speech.
5. Use controlled business tools: save a lead, take a message, book an appointment, and request human handoff.
6. Record call state, transcript/events according to configured privacy policy, duration, outcome, and usage.
7. Enforce tenant access, wallet reservation, billing reconciliation, and auditability.
8. Provide a dashboard for agents, numbers, calls, and usage.
9. Add one-to-one outbound calling only after consent, suppression, time-window, opt-out, provider, and legal/compliance controls are reviewed and tested.

**Do not promise live streaming, exact language/voice coverage, call transfer, or outbound origination until the selected Vobiz account and Sarvam models have been verified against current provider documentation and tested with real credentials.**

---

## 2. Product Goals and Non-Goals

### 2.1 MVP goals

- Deliver a reliable inbound voice-agent experience for pilot businesses.
- Support Telugu, Hindi, and Indian English only where the selected STT/LLM/TTS configuration supports the required input and output quality.
- Let a business configure agent instructions, language, greeting, business hours, fallback behavior, and escalation settings.
- Capture useful business outcomes, not merely hold a conversation.
- Keep tenant data isolated.
- Make provider usage and wallet charging traceable.
- Allow providers to be replaced through adapters rather than rewriting the conversation engine.
- Keep a clear separation between prototype behavior and production behavior.

### 2.2 Non-goals for the first pilot

- Large outbound marketing campaigns or automated bulk dialing.
- Unrestricted autonomous actions on behalf of businesses.
- Training a custom foundational language model.
- Building a new telephony carrier or speech model.
- Storing payment-card data.
- Treating an LLM transcript as proof that an external business action succeeded.
- Using an LLM to determine wallet charges or override authorization.
- Adding Redis, MongoDB, Supabase, or BullMQ unless a reviewed architecture decision proves a concrete need and the repository's current rules permit it.

---

## 3. Personas and Core Use Cases

### Business owner / administrator

- Creates and configures a voice agent.
- Connects or assigns a phone number.
- Sets language, greeting, business information, working hours, and handoff rules.
- Reviews calls, outcomes, leads, messages, usage, and wallet balance.
- Enables outbound calls only when eligible and compliant.

### Staff member

- Reviews call summaries and leads.
- Receives human-transfer requests.
- Updates appointments or follows up with customers.

### Caller

- Calls a business number.
- Speaks naturally in a supported language.
- Receives answers based on approved business information.
- Can request a human or opt out of outbound calling.

### Platform operator

- Monitors provider health, service latency, failures, usage reconciliation, and abuse.
- Can disable a provider, agent, tenant, or outbound calling globally through an operational kill switch.

---

## 4. Scope by Delivery Stage

| Stage                                     | Scope                                                                                                                                   | Exit criteria                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Stage 0 — Audit and provider verification | Inspect repository; verify Vobiz media/call-control capabilities; verify Sarvam API capabilities, models, pricing, and language support | Written decisions and no duplicate architecture                      |
| Stage 1 — Contracts and mocked prototype  | API schemas, call state machine, fake telephony/STT/TTS adapters, simulated call flow                                                   | Repeatable automated tests without paid provider calls               |
| Stage 2 — Inbound voice MVP               | Real Vobiz inbound webhook/media path and Sarvam integration                                                                            | End-to-end test call succeeds and failures recover safely            |
| Stage 3 — Business tools and billing      | Lead/message/appointment tools, handoff, wallet reservation and reconciliation                                                          | No unauthorized tool actions; usage is auditable                     |
| Stage 4 — Dashboard                       | Agent, number, call, usage, and configuration screens                                                                                   | User can manage pilot without manual database edits                  |
| Stage 5 — Outbound one-to-one             | Consent evidence, suppression, calling windows, dry-run, one-to-one dialing, opt-out                                                    | Compliance and safety tests pass; disabled by default until approval |
| Stage 6 — Hardening                       | Load tests, alerting, privacy review, incident runbooks, deployment rollback                                                            | Pilot readiness review signed off                                    |

The stages are an implementation sequence, not a promise that every provider dependency is already available.

---

## 5. High-Level Architecture

```text
Caller / Business Phone
        |
        v
Vobiz Telephony
  | inbound webhook / call events
  | live media connection (protocol must be verified)
        |
        +---------------------------> TypeScript API
        |                              - verify webhook
        |                              - map number -> tenant/agent
        |                              - authorize call
        |                              - reserve wallet allowance
        |                              - store business state
        |
        v
Python Voice Runtime
  - call/session lifecycle
  - audio buffering and codec handling
  - turn-taking and interruption handling
  - orchestration and timeouts
        |
        +------> Sarvam STT
        +------> Sarvam LLM (if selected and verified)
        +------> Sarvam TTS
        |
        +------> TypeScript API for approved business tools/events
                                       |
                                       v
                              PostgreSQL / Drizzle
                                       |
                                       v
                                ERIX API SDK
                                       |
                                       v
                              Next.js Voice Dashboard
```

### Service boundaries

**TypeScript API owns:**

- Authentication and authorization.
- Tenant resolution and isolation.
- Voice-agent and phone-number configuration.
- Call records and authoritative call status.
- Wallet reservations, ledger entries, and final billing.
- Provider webhook verification and idempotency.
- Consent, suppression, outbound policy, and audit events.
- Business actions such as lead creation and appointment booking.
- Runtime authorization and service-to-service access.

**Python runtime owns:**

- Real-time audio session processing.
- Audio framing, buffering, codec conversion where required, and interruption handling.
- Coordinating STT, LLM, and TTS turns.
- Session-local state and timeouts.
- Emitting structured call events and measured usage.
- Calling approved tools through the TypeScript API.

**Frontend owns:**

- User experience and configuration forms.
- Displaying data returned by the API.
- Client-side validation for usability only; server validation remains authoritative.

### Avoid a split-brain design

Do not independently maintain authoritative wallet balance, tenant permissions, appointment records, or outbound consent in Python. The runtime may cache session configuration briefly, but it must receive authorization from the TypeScript API and respect revocation/expiry rules.

---

## 6. Proposed Monorepo Structure

> This is the target structure. First audit the real repository and map existing files to it. Do not create duplicate apps, SDKs, database schemas, auth modules, or migration systems just to match this tree.

```text
ecodrix/
├── apps/
│   ├── web/                              # Existing Next.js app, if this is its current location
│   │   └── src/
│   │       ├── app/
│   │       │   └── (dashboard)/voice/
│   │       │       ├── agents/
│   │       │       ├── calls/
│   │       │       ├── numbers/
│   │       │       ├── outbound/
│   │       │       └── settings/
│   │       ├── features/voice/
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   ├── schemas/
│   │       │   └── types/
│   │       └── lib/
│   └── api/                              # Existing Node.js API if it is appropriate to locate here
│       └── src/
│           ├── app.ts
│           ├── server.ts
│           ├── modules/voice/
│           ├── middleware/
│           └── infrastructure/
├── voice-runtime/# Python + FastAPI
│       ├── pyproject.toml
│       ├── Dockerfile
│       ├── .env.example
│       ├── src/voice_runtime/
│       │   ├── main.py
│       │   ├── api/
│       │   │   ├── health.py
│       │   │   ├── sessions.py
│       │   │   └── internal.py
│       │   ├── sessions/
│       │   │   ├── manager.py
│       │   │   ├── session.py
│       │   │   └── state.py
│       │   ├── audio/
│       │   │   ├── pipeline.py
│       │   │   ├── codecs.py
│       │   │   ├── buffering.py
│       │   │   └── interruption.py
│       │   ├── orchestration/
│       │   │   ├── conversation.py
│       │   │   ├── turn_manager.py
│       │   │   └── tool_dispatcher.py
│       │   ├── providers/
│       │   │   ├── sarvam/
│       │   │   │   ├── stt.py
│       │   │   │   ├── llm.py
│       │   │   │   └── tts.py
│       │   │   └── vobiz/
│       │   │       ├── media.py
│       │   │       └── call_control.py
│       │   ├── clients/ecodrix_api.py
│       │   ├── security/
│       │   ├── config/
│       │   └── observability/
│       └── tests/
│           ├── unit/
│           ├── contract/
│           └── integration/
├── packages/
│   ├── erix-api/                         # Reuse existing SDK package
│   ├── contracts/                        # API/event contracts; fit to existing workspace conventions
│   └── config/                           # Shared TS tooling config, if needed
├── database/
│   ├── migrations/                       # Only if this matches existing migration ownership
│   └── seeds/
├── infrastructure/
│   ├── docker/
│   ├── gcp/
│   └── scripts/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── api/
│   ├── providers/
│   ├── security/
│   └── runbooks/
├── tests/e2e/
├── package.json
├── pnpm-workspace.yaml                  # Keep if already used
├── tsconfig.base.json                   # Keep if already used
├── .gitignore
├── .env.example
├── README.md
└── global.md                            # Link to canonical docs; avoid duplicating all content
```

### Folder ownership rules

- `apps/web`: UI and client-side feature composition.
- `apps/api`: business API and integrations, following the existing repository's conventions.
- `services/voice-runtime`: Python runtime only; no duplicated business database logic.
- `packages/contracts`: schemas and event shapes shared across service boundaries. Python should validate equivalent schemas; do not assume it can import TypeScript directly.
- `packages/erix-api`: use the existing SDK rather than inventing a second client.
- `database`: only one canonical schema/migration owner. Do not move migrations without auditing current deployment and migration practices.
- `docs`: canonical architecture, provider findings, API contracts, operational instructions, and decision records.

---

## 7. Application Flow (App_Flow)

### 7.1 Main dashboard flow

```text
Sign in
  |
  v
Voice Overview
  |-- View active/recent calls
  |-- View wallet and usage
  |-- View provider/service status
  |
  +--> Agents
  |      |-- Create agent
  |      |-- Configure language and voice
  |      |-- Add greeting and business context
  |      |-- Configure hours and fallback
  |      |-- Test in simulator
  |      +-- Activate/deactivate
  |
  +--> Numbers
  |      |-- View available/connected numbers
  |      |-- Assign number to agent
  |      +-- Validate inbound routing
  |
  +--> Calls
  |      |-- Filter by date, status, agent, outcome
  |      |-- Open call details
  |      |-- Review transcript/summary (if enabled)
  |      |-- Review usage and tool events
  |      +-- Flag an issue
  |
  +--> Outbound (disabled by default)
  |      |-- Verify consent
  |      |-- Check suppression and permitted calling time
  |      |-- Preview one-to-one call
  |      |-- Dry-run
  |      +-- Request/enable live calling after policy approval
  |
  +--> Settings
         |-- Wallet and billing
         |-- Privacy and retention
         |-- Human handoff
         |-- Team access
         +-- Audit log
```

### 7.2 Agent creation flow

1. User opens **Voice → Agents → Create**.
2. Frontend loads supported languages, voices, and features from the backend; options must reflect verified provider capabilities.
3. User enters agent name, default language, greeting, business facts, working hours, fallback behavior, and escalation settings.
4. Frontend validates the form for usability.
5. Backend validates tenant ownership, supported options, and configuration constraints.
6. Backend saves a draft agent.
7. User runs a simulator using mocked or explicitly configured test providers.
8. User activates the agent.
9. Backend checks required setup: assigned number, provider configuration, wallet eligibility, and required business policy.
10. Agent becomes active only after checks pass.

### 7.3 Inbound call flow

```text
Caller dials business number
  -> Vobiz receives call
  -> Vobiz webhook reaches TypeScript API
  -> Verify webhook signature/authenticity
  -> Resolve number -> tenant -> active agent
  -> Check agent state, policy, and wallet allowance
  -> Create/claim idempotent call record
  -> Authorize a short-lived runtime session
  -> Connect Vobiz live media to Python runtime
  -> Runtime receives audio
  -> STT produces recognized text
  -> Turn manager builds context and requests response
  -> Tool dispatcher invokes an approved business tool if required
  -> TTS generates audio
  -> Runtime sends audio to telephony media path
  -> Repeat until hangup, transfer, timeout, or failure
  -> Emit final usage and call events
  -> TypeScript API reconciles usage and ledger
  -> Dashboard displays final outcome
```

**Critical:** Confirm Vobiz's exact webhook and media sequence. A webhook may signal an event without carrying live audio. The real-time media transport, codec, bidirectional streaming, transfer, and hangup mechanisms must come from the actual account/API documentation and integration tests.

### 7.4 Outbound one-to-one call flow

Outbound calls are a separate capability, not merely an inbound call with the direction field changed.

```text
Authorized user requests one outbound call
  -> Backend authenticates user and tenant
  -> Validate destination and permitted purpose
  -> Verify consent evidence and its scope
  -> Check suppression / opt-out list
  -> Check permitted calling window and applicable rules
  -> Check agent, provider, wallet, and account eligibility
  -> Record policy decision and idempotency key
  -> Reserve budget
  -> Runtime/provider adapter requests call origination
  -> Call progresses through ringing / answered / failed / ended
  -> Runtime conducts approved conversation
  -> Opt-out request immediately suppresses further eligible calls
  -> Final usage reconciled
  -> Persist outcome and audit events
```

Outbound live calling must be **disabled by default** until applicable Indian telecom requirements, DND/DLT obligations where applicable, consent rules, provider terms, and business-specific legal review are complete. Never treat possession of a phone number as proof of consent.

### 7.5 Human handoff flow

1. Caller asks for a person, the agent is uncertain, a configured rule triggers escalation, or the caller is distressed.
2. Runtime stops attempting unsupported autonomous actions.
3. Runtime requests a handoff from the TypeScript API with a reason and call ID.
4. Backend checks the configured handoff destination and policy.
5. Telephony adapter attempts transfer using the verified Vobiz capability.
6. If transfer fails or is unsupported, runtime follows the configured fallback: take a message, provide a safe callback expectation, or end politely.
7. Record handoff requested, attempted, succeeded/failed, and fallback events.

### 7.6 Failure flow

- **Provider unavailable:** retry only safe, idempotent operations; use a configured polite fallback.
- **Wallet cannot be reserved:** do not start paid AI handling; follow configured business-safe call behavior.
- **Runtime unavailable:** telephony should use a tested fallback if the provider supports it.
- **STT/TTS timeout:** cap retries and time spent; don't leave callers waiting indefinitely.
- **Tool failure:** do not claim success. Explain the limitation and offer a message/handoff.
- **Duplicate webhook:** acknowledge safely and do not create duplicate calls or ledger entries.
- **Network disconnect:** reconcile final status from provider events where possible.
- **Outbound opt-out:** record suppression before any subsequent campaign or retry eligibility check.

---

## 8. Call State Machine

Use a defined state machine and validate transitions. Example states:

```text
created
  -> authorized
  -> queued (optional)
  -> initiating (outbound only)
  -> ringing (outbound only)
  -> connecting
  -> active
  -> handoff_requested
  -> transferring
  -> completed
  -> failed
  -> cancelled
```

A terminal state is one of `completed`, `failed`, or `cancelled`; terminal records must not silently return to `active`. Handoff states may lead to `active` (if the AI resumes after a failed transfer) or a terminal state, according to explicit policy.

Store event history separately from the current status. State changes should include an actor/source, timestamp, event ID, and relevant sanitized metadata.

---

## 9. Data Model (Proposed)

Names should be adapted to existing schema naming conventions. Use the current Drizzle/PostgreSQL migration path. Add appropriate tenant IDs, foreign keys, indexes, constraints, and soft-delete/retention behavior where required.

### 9.1 `voice_agents`

- `id`
- `tenant_id`
- `name`
- `status` (`draft`, `active`, `paused`, `archived`)
- `default_language`
- `voice_config` (validated JSON/config columns)
- `greeting`
- `system_instructions`
- `business_context` or reference to approved knowledge source
- `business_hours`
- `fallback_policy`
- `handoff_config`
- `created_by`
- `created_at`
- `updated_at`

### 9.2 `voice_numbers`

- `id`
- `tenant_id`
- `agent_id`
- `provider`
- `provider_number_id`
- `phone_number` (access-controlled)
- `status`
- `created_at`
- `updated_at`

Enforce that the assigned agent and number belong to the same tenant. Provider identifiers should be unique within the appropriate provider/account scope.

### 9.3 `voice_calls`

- `id`
- `tenant_id`
- `agent_id`
- `number_id`
- `provider`
- `provider_call_id`
- `direction` (`inbound`, `outbound`)
- `status`
- `from_number` / `to_number` (protected personal data)
- `started_at`
- `answered_at`
- `ended_at`
- `duration_ms`
- `outcome`
- `handoff_status`
- `usage_estimate`
- `usage_final`
- `estimated_cost_paise`
- `final_cost_paise`
- `currency`
- `failure_code`
- `created_at`
- `updated_at`

Use integer minor units for money (paise for INR), not floating-point arithmetic. Keep provider usage quantities and monetary cost fields clearly distinguished.

### 9.4 `voice_call_events`

- `id`
- `tenant_id`
- `call_id`
- `event_id` (idempotency key where appropriate)
- `event_type`
- `source`
- `occurred_at`
- `metadata` (sanitized JSON)
- `created_at`

Add a uniqueness constraint suitable for preventing duplicate processing of the same provider event.

### 9.5 `voice_wallets`

- `id`
- `tenant_id`
- `currency`
- `available_balance_paise`
- `reserved_balance_paise`
- `status`
- `updated_at`

Balances should be derived or maintained transactionally with ledger invariants. Never allow concurrent calls to spend the same available balance.

### 9.6 `voice_wallet_ledger`

- `id`
- `tenant_id`
- `wallet_id`
- `call_id` (nullable for non-call adjustments)
- `entry_type` (`credit`, `reserve`, `capture`, `release`, `refund`, `adjustment`)
- `amount_paise` (integer; document sign convention)
- `idempotency_key`
- `reference_type`
- `reference_id`
- `metadata` (sanitized)
- `created_at`

Ledger entries should be immutable; corrections use compensating entries. Enforce idempotency and transactionally update wallet reservation state.

### 9.7 Outbound safety tables

`voice_outbound_permissions` (or equivalent consent records):

- tenant, destination, purpose, consent source, consent timestamp, scope, evidence reference, expiry/revocation, verification status.

`voice_suppressions`:

- tenant or global scope as policy requires, normalized destination, reason, source, created timestamp, expiry if legally/policy appropriate.

`voice_outbound_jobs` (for one-to-one scheduling; campaigns are later):

- tenant, call request, destination reference, scheduled time, status, idempotency key, policy decision, retry count, last failure, created/updated timestamps.

Protect personal data with restricted access, retention limits, redaction, and encryption appropriate to the platform.

---

## 10. API Design (Illustrative)

Use the existing API versioning, authentication, validation, response envelope, and error conventions. The paths below are proposed and must be reconciled with existing routes before implementation.

### 10.1 Public/dashboard API

| Method  | Endpoint                        | Purpose                               |
| ------- | ------------------------------- | ------------------------------------- |
| `GET`   | `/v1/voice/overview`            | Summary and usage                     |
| `GET`   | `/v1/voice/agents`              | List tenant agents                    |
| `POST`  | `/v1/voice/agents`              | Create draft agent                    |
| `GET`   | `/v1/voice/agents/:id`          | Get agent                             |
| `PATCH` | `/v1/voice/agents/:id`          | Update agent                          |
| `POST`  | `/v1/voice/agents/:id/activate` | Validate and activate                 |
| `POST`  | `/v1/voice/agents/:id/pause`    | Pause agent                           |
| `GET`   | `/v1/voice/numbers`             | List assigned numbers                 |
| `POST`  | `/v1/voice/numbers/:id/assign`  | Assign number to agent                |
| `GET`   | `/v1/voice/calls`               | Paginated, filtered call list         |
| `GET`   | `/v1/voice/calls/:id`           | Call details and permitted events     |
| `GET`   | `/v1/voice/usage`               | Usage and billing summary             |
| `POST`  | `/v1/voice/outbound/preview`    | Evaluate policy without dialing       |
| `POST`  | `/v1/voice/outbound/calls`      | Request one-to-one call, once enabled |
| `POST`  | `/v1/voice/outbound/:id/cancel` | Cancel if still cancellable           |
| `POST`  | `/v1/voice/outbound/opt-out`    | Record an opt-out/suppression         |

### 10.2 Provider webhooks

- `POST /v1/webhooks/vobiz/call-events`
- Any additional media-session or call-control callback routes required by Vobiz's actual integration.

Webhook handlers must verify authenticity, validate payloads, tolerate retries, deduplicate events, and respond promptly. Do not trust a caller-supplied tenant ID; resolve tenant ownership from the verified provider number/call mapping.

### 10.3 Internal runtime API

- `POST /internal/voice/sessions/authorize`
- `POST /internal/voice/calls/:id/events`
- `POST /internal/voice/calls/:id/usage`
- `POST /internal/voice/tools/save-lead`
- `POST /internal/voice/tools/take-message`
- `POST /internal/voice/tools/book-appointment`
- `POST /internal/voice/tools/request-handoff`

These are conceptual contracts, not a mandate to create a route per tool. Use the existing API conventions and keep internal endpoints inaccessible from the public internet where possible. Authenticate service-to-service calls with short-lived credentials or signed requests, enforce expiry and replay protection, and scope every request to a previously authorized session/call.

### 10.4 Example request: create a draft agent

```json
{
  "name": "Clinic Reception",
  "defaultLanguage": "te-IN",
  "greeting": "Namaskaram. How can I help you?",
  "businessHours": {
    "timezone": "Asia/Kolkata",
    "days": ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    "start": "09:00",
    "end": "18:00"
  },
  "fallbackPolicy": "take_message",
  "handoffEnabled": true
}
```

The API must reject unsupported language/voice combinations based on verified provider configuration. Treat the sample as illustrative, not as proof that a specific voice is supported.

### 10.5 Error shape

Use the existing API error contract if present. Otherwise, a consistent error can include:

```json
{
  "error": {
    "code": "VOICE_AGENT_NOT_ACTIVE",
    "message": "This voice agent is not active.",
    "requestId": "request-id"
  }
}
```

Do not expose provider secrets, raw credentials, private stack traces, or unnecessary caller information in errors.

---

## 11. Runtime Design and Code Patterns

### 11.1 Python provider interfaces

The runtime should depend on interfaces rather than embedding provider-specific API calls throughout conversation logic.

```python
from typing import Protocol


class SpeechToText(Protocol):
    async def transcribe(self, audio: bytes) -> str:
        """Recognize speech from an audio segment."""
        ...


class TextToSpeech(Protocol):
    async def synthesize(self, text: str, language: str) -> bytes:
        """Synthesize speech for the requested supported language."""
        ...
```

This is a simple illustrative interface. Real streaming providers may require async iterators, WebSockets, timestamps, partial hypotheses, or audio frames instead of a single `bytes` input/output. Adapt to the verified Sarvam API.

### 11.2 TypeScript service boundary

The Python runtime should call a narrow internal API client instead of connecting directly to all business tables.

```typescript
type AuthorizedVoiceSession = {
  callId: string;
  tenantId: string;
  agentId: string;
  expiresAt: string;
  allowedTools: Array<
    "save_lead" | "take_message" | "book_appointment" | "request_handoff"
  >;
};

// Illustrative only: use existing HTTP client, schema validation,
// auth middleware, and API response conventions from the repository.
async function authorizeVoiceSession(
  callId: string,
  runtimeCredential: string,
): Promise<AuthorizedVoiceSession> {
  // Send an authenticated request to the TypeScript API.
  // Validate the response schema before starting the call.
  // Do not log the credential or raw sensitive response.
  throw new Error("Implement using the existing API client");
}
```

The placeholder intentionally does not pretend to be a complete implementation. Replace it using the repository's actual HTTP client, auth, error, and validation patterns.

### 11.3 Conversation turn flow

1. Receive an audio frame/segment from the verified telephony media adapter.
2. Feed audio to the STT adapter.
3. Handle partial/final recognition results according to the provider protocol.
4. Apply turn-end detection and interruption rules.
5. Build a bounded conversation context using the active agent configuration.
6. Ask the response model for a user-facing response and, if applicable, a structured tool request.
7. Validate tool name and arguments against an allowlist/schema.
8. Execute tools only through the TypeScript API.
9. Confirm the tool actually succeeded before telling the caller it succeeded.
10. Send the final response to TTS.
11. Stream audio to the media adapter using the exact supported protocol/codec.
12. Record timings, failures, and measured usage without logging secrets or unnecessary personal data.

### 11.4 Tool contracts

Each tool must have a strict schema and permission policy:

- `save_lead`: only create a lead for the authenticated tenant; validate phone number and required fields.
- `take_message`: persist a message and optional callback request.
- `book_appointment`: check availability and confirm the booking only after the business API returns success.
- `request_handoff`: use a configured destination and verified telephony capability.

LLM output is untrusted input. It cannot select a tenant, invent a destination, override a permission, or directly execute arbitrary code or SQL.

---

## 12. Billing and Wallet Safety

Billing is a correctness-critical subsystem.

1. Before a paid AI call starts, the TypeScript API verifies the wallet and reserves an appropriate allowance.
2. Reservation must be atomic and safe under concurrent calls.
3. If the call never starts, release the reservation according to policy.
4. During the call, runtime usage reports are estimates/events, not independent authority to debit arbitrary amounts.
5. On termination, reconcile provider-reported duration and Sarvam usage against the configured price rules.
6. Capture the final charge once, using an idempotency key.
7. Release unused reserved funds.
8. On late provider events, apply a deterministic reconciliation policy and create compensating ledger entries if required.
9. Display estimated versus final usage clearly.
10. If balance is insufficient, do not begin paid AI handling. Follow a safe business-approved fallback.

Do not hardcode provider prices into call handlers. Store effective pricing/rate versions and retain enough source usage data to reproduce a charge.

---

## 13. Outbound Calling, Consent, and Safety

Outbound is not automatically allowed just because the provider API can originate calls.

Before live outbound is enabled:

- Verify current applicable Indian telecom rules, including TRAI/DND/DLT requirements where relevant to the traffic and business model.
- Review Vobiz terms and account permissions for the intended call type.
- Record consent evidence, purpose, source, timestamp, and scope.
- Normalize destinations consistently before suppression checks.
- Check suppression immediately before origination, not only when a job is created.
- Enforce permitted calling windows using the correct recipient/business policy and timezone.
- Provide a clear opt-out mechanism and apply it to future eligible calls promptly.
- Make retries bounded, explainable, and policy-compliant.
- Use a global kill switch, tenant-level switch, and per-agent switch.
- Start in dry-run mode; require an explicit operator action to enable live calls.
- Keep audit records for allow/deny decisions.
- Do not use the MVP for indiscriminate bulk or unsolicited calls.

This document is a technical plan, not legal advice. Obtain an appropriate compliance review before production outbound traffic.

---

## 14. Security and Privacy Requirements

- Enforce tenant scope in every data access path; never trust a tenant ID from the client or LLM.
- Authenticate all dashboard APIs and internal service requests.
- Verify provider webhooks using the actual provider-supported signature/authentication mechanism.
- Use short-lived runtime authorization with expiry, audience, call ID, tenant ID, allowed tools, and replay protection.
- Keep credentials in a secrets manager or protected runtime environment. Never commit real secrets.
- Do not expose provider credentials to the browser.
- Redact phone numbers, transcripts, tokens, and sensitive metadata from logs.
- Define whether audio and transcripts are stored, for how long, who can access them, and how deletion requests work.
- Minimize data collection and provide appropriate notice/consent for recording or transcript processing as required.
- Encrypt traffic and sensitive stored data according to platform policy.
- Rate-limit session creation and sensitive endpoints.
- Validate JSON schemas, length limits, tool arguments, media sizes, and file/audio payloads.
- Audit configuration changes, outbound policy decisions, handoff, billing adjustments, and access to sensitive call data.
- Define retention and deletion behavior for call records, events, transcripts, consent evidence, and suppression records.

---

## 15. Observability and Operational Readiness

### Metrics

- Inbound calls received, answered, completed, failed, and transferred.
- Provider webhook failures and duplicate events.
- Session start latency.
- STT, LLM, and TTS latency.
- Time to first audible response.
- Turn interruption rate and timeout rate.
- Calls ended by provider, runtime, or caller.
- Usage estimates versus final provider usage.
- Wallet reservation failures and reconciliation differences.
- Outbound policy allow/deny reasons and opt-out processing latency.
- Runtime CPU, memory, open connections, and active sessions.

### Logging

Use structured logs with `request_id`, `call_id`, service, provider, event type, and sanitized error code. Do not log full audio, secrets, or full transcripts by default.

### Alerts

- Runtime health check fails.
- Provider error rate exceeds a threshold.
- First-response latency or timeout rate exceeds the pilot SLO.
- Usage reconciliation has unexplained discrepancies.
- Wallet ledger invariant fails.
- Outbound call is attempted while the kill switch is active.
- A sudden increase in call volume or cost occurs.

### Runbooks

Document how to disable outbound, pause an agent, disable a provider adapter, release stuck reservations, reconcile calls, roll back a runtime deployment, and investigate a provider outage.

---

## 16. Deployment Plan

### 16.1 Local development

Use separate processes/containers for:

- Existing TypeScript API.
- Python voice runtime.
- Existing PostgreSQL/database dependencies.
- Web dashboard.

Mocks must allow development without live Vobiz/Sarvam credentials. Use a fake telephony event source and fake STT/TTS adapters for deterministic tests.

### 16.2 Existing ERIX Store VPS

The Python runtime may initially share the ERIX Store VPS if capacity and reliability checks pass.

**Required isolation:**

- Separate container/service and deployment lifecycle.
- Separate environment variables and secrets.
- Separate logs and health checks.
- Explicit CPU/memory limits and connection limits where supported.
- Private service communication where possible.
- No shared process, Python environment, dependency tree, or writable application directory with ERIX Store.
- Firewall rules exposing only necessary ports.
- Reverse proxy or provider-compatible media endpoint with TLS as required.
- Monitoring for resource contention and voice latency.
- A tested rollback path.

Do not assume the existing VPS is adequate until checking CPU, RAM, disk, network, existing service load, expected concurrent calls, and the media transport's networking requirements.

### 16.3 Example container topology

```text
VPS / Cloud environment
├── reverse-proxy (only if required and configured safely)
├── erix-store (existing service)
├── voice-runtime (Python container)
└── monitoring/logging agent (if already used)
```

The TypeScript API can remain on its existing hosting platform. It does not need to move onto the VPS merely because the Python runtime is deployed there.

### 16.4 Scaling trigger

Consider a dedicated voice-runtime host/service when:

- Storage and voice workloads contend for CPU, RAM, disk I/O, or network.
- Voice latency becomes unstable during storage activity.
- The required concurrent-call capacity exceeds safe VPS capacity.
- Provider media connectivity requires a different network setup.
- Independent uptime or deployment isolation is needed.
- The cost of a single-server failure becomes unacceptable.

Do not choose a concurrency limit from guesswork. Establish it with load tests and provider limits.

---

## 17. Environment Configuration

Use a committed `.env.example` with placeholders only. Actual secret values belong in the deployment secret store.

### TypeScript API variables (illustrative names)

```dotenv
NODE_ENV=development
DATABASE_URL=
VOICE_RUNTIME_BASE_URL=
VOICE_RUNTIME_AUTH_SECRET=
VOBIZ_API_KEY=
VOBIZ_WEBHOOK_SECRET=
SARVAM_API_KEY=
VOICE_OUTBOUND_ENABLED=false
VOICE_GLOBAL_KILL_SWITCH=true
```

Only services that need a given secret should receive it. If Sarvam calls are made exclusively from Python, the Sarvam key should ordinarily exist only in the runtime's secret configuration, not in the frontend or unnecessary API containers.

### Python runtime variables (illustrative names)

```dotenv
APP_ENV=development
HOST=0.0.0.0
PORT=8000
ECODRIX_API_BASE_URL=
ECODRIX_RUNTIME_CREDENTIAL=
SARVAM_API_KEY=
VOBIZ_MEDIA_CONFIG=
LOG_LEVEL=INFO
```

The exact variable names, port, provider credential structure, and media configuration must match the implemented adapters. Never commit production values.

---

## 18. Prototype and Testing Strategy

### Prototype definition

A successful prototype demonstrates the whole path without pretending mocked services are production integrations:

1. Dashboard creates a draft agent.
2. API persists it in the development database.
3. A fake inbound-call event maps to that agent.
4. API authorizes a session and reserves mock credits.
5. Python runtime receives a simulated audio/text turn.
6. Mock STT/LLM/TTS returns a response.
7. Runtime emits structured events.
8. API persists call state and reconciles mock usage.
9. Dashboard shows the final call and usage.
10. Duplicate events and failure scenarios are tested.

Then replace one mock at a time with the real provider adapter.

### Required test categories

**Unit tests**

- Call state transitions.
- Tenant-scoped repository queries.
- Wallet reservation/capture/release.
- Outbound consent and suppression policy.
- Input validation and tool argument schemas.
- Provider error mapping.

**Contract tests**

- TypeScript API schemas match Python client expectations.
- Internal authorization expiry and invalid credentials.
- Event payload versioning and idempotency.
- Provider adapter request/response mappings.

**Integration tests**

- PostgreSQL transactions and concurrent wallet reservations.
- Duplicate provider webhooks.
- Runtime/API network failure.
- STT/TTS timeout and retry behavior.
- Tool failures and safe fallback.
- Handoff success/failure.

**End-to-end tests**

- Inbound happy path.
- Unsupported language fallback.
- Agent paused or wallet unavailable.
- Caller interrupts the assistant.
- Caller asks for a human.
- Provider disconnects mid-call.
- Outbound dry-run denial cases.
- Outbound opt-out and suppression checks.

**Security tests**

- Cross-tenant access attempts.
- Forged webhook attempts.
- Replayed runtime credentials/events.
- Tool argument injection.
- Secret leakage in logs.
- Public access to internal endpoints.
- Outbound call attempt while disabled.

**Load tests**

- Simultaneous session starts.
- Long-running sessions.
- Provider rate limits.
- Runtime memory under concurrent audio streams.
- Storage traffic competing with voice traffic on the shared VPS.

---

## 19. Definition of Done

The inbound MVP is not done until:

- [ ] Repository audit and provider capability matrix are documented.
- [ ] Existing auth, SDK, DB schema, and migration conventions are reused.
- [ ] Tenant isolation tests pass.
- [ ] Agent creation/configuration and activation checks work.
- [ ] Inbound webhook verification and idempotency work.
- [ ] Real Vobiz media path is verified end to end.
- [ ] Selected Sarvam STT/LLM/TTS configuration is verified for target languages.
- [ ] Caller can complete a basic conversation without a mocked provider.
- [ ] Safe fallback and human handoff behavior are tested where supported.
- [ ] Call events and outcomes persist correctly.
- [ ] Wallet reservation and final billing are idempotent and auditable.
- [ ] Sensitive data is protected and retention policy is documented.
- [ ] Dashboard displays call history and usage.
- [ ] Monitoring, alerts, rollback, and incident runbooks exist.
- [ ] Load tests establish a safe pilot concurrency limit.
- [ ] Outbound is disabled until its compliance and safety gate is signed off.

Outbound one-to-one calling has a separate definition of done and must not block an inbound-only pilot if not yet approved.

---

## 20. Implementation Checklist for Kiro / Coding Agent

Use the following execution order. Do not ask the coding agent to implement the entire platform in one unreviewed change.

### Phase 0 — Audit only

- [ ] Inspect the complete repository tree and package/workspace configuration.
- [ ] Locate the existing Next.js app, API server entry points, Drizzle schema/migrations, auth middleware, SDK, environment loading, deployment manifests, and project-specific rules.
- [ ] Read root `README.md`, `global.md`, and all relevant architecture/rule documents.
- [ ] Search for existing voice, telephony, wallet, billing, webhook, and provider abstractions.
- [ ] Produce an inventory mapping existing files to the proposed structure.
- [ ] List duplicate responsibilities, missing pieces, risks, and proposed minimal changes.
- [ ] Do not move or delete files during this phase.
- [ ] Verify current Vobiz and Sarvam docs/capabilities; record unknowns explicitly.

### Phase 1 — Architecture and contracts

- [ ] Produce a decision record for service boundaries and deployment.
- [ ] Define call state machine and allowed transitions.
- [ ] Define versioned API schemas and event payloads.
- [ ] Define idempotency strategy.
- [ ] Define wallet reservation/capture/release rules.
- [ ] Define tenant and runtime authorization model.
- [ ] Define provider adapter interfaces.
- [ ] Add contract tests and mock providers.

### Phase 2 — Inbound vertical slice

- [ ] Create a draft agent through the API.
- [ ] Simulate an inbound event.
- [ ] Authorize the session.
- [ ] Run a mocked conversation.
- [ ] Persist events and final status.
- [ ] Display the call in the dashboard.
- [ ] Verify failure and duplicate-event behavior.

### Phase 3 — Live provider integration

- [ ] Implement Vobiz webhook and media adapter from verified documentation.
- [ ] Implement Sarvam adapters from verified API specifications.
- [ ] Add timeouts, bounded retries, rate limits, structured errors, and observability.
- [ ] Run real end-to-end calls in a controlled test environment.
- [ ] Record latency, cost, codec, language, and quality results.

### Phase 4 — Business tools and billing

- [ ] Implement lead/message/appointment/handoff tools through the API.
- [ ] Add atomic wallet reservations and idempotent ledger entries.
- [ ] Reconcile actual provider usage.
- [ ] Add billing and failure tests.
- [ ] Add retention/redaction controls.

### Phase 5 — Dashboard and operations

- [ ] Complete agents, numbers, calls, and usage screens.
- [ ] Add operational health and provider status where useful.
- [ ] Add pause/disable controls and audit history.
- [ ] Add runbooks, deployment manifests, monitoring, and rollback.

### Phase 6 — Outbound gate

- [ ] Complete compliance review.
- [ ] Implement consent evidence, suppression, allowed time windows, bounded retries, opt-out, and dry-run.
- [ ] Test policy denials and kill switch.
- [ ] Keep live outbound disabled until explicit production approval.

### Coding-agent operating rules

- Read repository rules before changing files.
- Reuse existing modules; do not create parallel auth, SDK, database, or configuration systems.
- Make small, reviewable changes with tests.
- Never delete or rename files without showing the impact and confirming migration safety.
- Never place real credentials in code, tests, docs, or logs.
- Do not claim provider integration is complete until a real end-to-end test has passed.
- Keep a change log and report files changed, tests run, results, and remaining blockers after each phase.

---

## 21. Open Questions to Resolve During Audit

These are explicit verification tasks, not assumed answers:

1. Does the current Vobiz account support the required inbound webhook, live bidirectional media stream, codecs, call transfer, and outbound origination?
2. Which media transport is available for this account: WebSocket audio, SIP/RTP, or another supported option?
3. Which exact Sarvam models/endpoints support required languages, streaming, interruption-friendly latency, and production terms?
4. What are current provider prices, rate limits, regional availability, and concurrency limits?
5. Where are the current TypeScript API and Drizzle migrations located?
6. How does the existing ERIX SDK authenticate and structure errors?
7. Where is ERIX Store deployed, and what are its actual CPU/RAM/network headroom and service-level requirements?
8. Is PostgreSQL shared by existing ECODrIx services, and what are its current connection limits and migration rules?
9. What transcript/audio retention and caller notice requirements apply to the intended deployment?
10. Which business actions must be supported in the first pilot: lead capture, message-taking, appointment booking, human transfer, or some subset?

Resolve these questions in Stage 0. Do not silently invent answers.

---

## 22. Final Recommendation

Build a **mock-first inbound vertical slice** before building every dashboard page or enabling outbound calls.

Use the existing TypeScript backend as the business authority, Python as the dedicated real-time voice runtime, PostgreSQL/Drizzle as the existing authoritative data layer, Vobiz for telephony, Sarvam for verified voice capabilities, and the existing ERIX SDK for the frontend.

Keep the repository unified initially and deployments separated. Reuse the ERIX Store VPS only if capacity and isolation checks pass; preserve the option to move the voice runtime to a dedicated service without changing the product's business contracts.

The next implementation artifact should be a repository-specific audit and migration plan. After that, implement the contracts and mocked inbound flow, then replace mocks with real provider integrations one at a time.
