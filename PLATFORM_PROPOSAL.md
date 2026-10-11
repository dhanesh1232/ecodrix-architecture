# ECODrIx Platform Proposal — October 2026

**Status:** Proposal, awaiting founder decisions (§11) · **Date:** 2026-10-11 · **Owner:** Founder
**Supersedes for planning:** `MVP.md`, `new_mvp.md`, `POWER_PACK_PROPOSAL.md`, `EXECUTION_PLAN.md`, `blueprint/*` pricing. Engineering rules stay in `server/GLOBAL.md` (ADR-001, ADR-009).

This proposal is built from the **code**, not from earlier docs. Seven module audits read routes, services, tables, workers and what the frontends actually call (October 2026). Where earlier docs disagree with the code, the code wins and §12 lists the docs to correct.

---

## 1. Summary

ECODrIx should be **the WhatsApp-first Business OS for growing Indian SMBs**: one memory of every customer, one brain that acts on it, and one complete loop from first message to paid invoice.

The code is closer to that than the docs suggest. The loop exists end to end on the server. What stops it from being sold:

1. **Security holes that cross tenants.** Six are critical, including a superadmin key in public JavaScript, production credentials in git, and session forgery through the shared Store cache.
2. **A console that can't reach parts of its own API.** The LAIE, Flow, inbox, AI settings and custom-events screens call paths the server doesn't serve.
3. **Automation that silently drops work.** Any Flow wait over 24 hours dies, stage moves fire no triggers, and inbound WhatsApp messages are lost on database errors.
4. **Money paths that leak.** Credits are priced but mostly never charged; top-ups can be lost, plan "downgrades" can grant paid plans, and storefront orders never settle.

**The ask:**

- Approve the vision and principles (§2).
- Freeze new features until the five-stage plan's gates pass (§10).
- Make the decisions in §11.
- Build the per-module agent layer on Flow (§8) only after stage 2.

Two capabilities are **in scope**, not frozen:

- **LAIE as a quality lead-generation engine** on publicly available data (§7.4). It feeds the front of the loop.
- **The voice agent** as a channel on the same brain (§7.8). Inbound comes first; outbound is limited to consenting contacts.

---

## 2. Vision and principles

### Who we serve
A growing SMB with ₹25 lakh–₹50 crore revenue, 3–50 people and 50–5,000 leads a month. It runs on WhatsApp plus Excel or Tally today, and the buyer is the owner or sales head. Agencies resell as a second audience. Lead verticals are real estate and education, then clinics, D2C and professional services. The beachhead is 10 paying customers in Tirupati and Andhra Pradesh, then Hyderabad, Vijayawada and Chennai.

### The loop we own
**Find** quality prospects (LAIE, from publicly available data) → lead arrives or is contacted (WhatsApp, Instagram, forms, email, **voice calls**) → AI answers and qualifies → one pipeline → meeting or proposal → project → GST invoice → payment → review and repeat sale. Every product either feeds this loop or waits.

### Not now
- Bulk "spray" scraping. LAIE sells fewer, verified, explained leads, not raw lists.
- Cold WhatsApp to scraped numbers (against Meta policy). Cold outbound voice to numbers on the Do-Not-Disturb registry, or without consent.
- A developer marketplace.
- A website builder (Editor is cut).
- Bring-your-own-database: one Postgres, per ADR-001.

### Ten principles (every PR is checked against these)
1. **One tenant, one wall.** Every query, cache key, queue, file and socket is scoped to the caller's org by the system, never by the caller.
2. **One brain, many channels.** Every channel and the copilot run on the one TypeScript agent loop and the Flow catalog. Python handles live audio only.
3. **Flow composes the products.** Products never call each other; they publish events, and Flow wires them together.
4. **One canonical surface per job.** One inbox, one AI chat, one workflow builder, one URL per endpoint. A duplicate gets deleted.
5. **Frontends speak only through the SDK, and the SDK is contract-tested against the server.**
6. **Money and messages happen exactly once.** Use idempotency keys, and finish work before acknowledging the webhook.
7. **Least privilege.** Keys are narrow, nothing secret goes in a browser or git, money settings are owner-only, and each workload gets its own service account.
8. **Every AI action is bounded.** Tools come from an allow-list and are bound to the conversation; budget is checked before the call; a human approves money and outbound actions.
9. **Customer data is borrowed (DPDP).** Consent, retention limits, complete deletion and full export.
10. **Least code that works.** Finish half-built features or remove them.

---

## 3. What the product is today (from code)

| Module | What it is | Working | Broken or missing |
|---|---|---|---|
| **Platform** | Control layer: auth, workspaces, roles, API keys, plans, Razorpay subscriptions, credits wallet, quotas, notifications, support, AI gateway and agent loop, staff console, crons | Auth, sessions, invites, keys, subscriptions, auto top-up, notifications, support, staff console | No role change or ownership transfer. Credits priced but only voice and LAIE charge. AI has no quota or charge. Copilot has no screen and ignores roles. Top-up depends on the browser. No events to Flow |
| **ERIX** | CRM and back office: contacts, pipelines, notes, scoring, bookings, forms, projects, tasks, proposals, GST invoices, payment links, portal, e-sign, Tally/Zoho export | Contacts, pipelines, projects, invoices and Razorpay settlement, portal and e-sign, export | Kanban moves fire no trigger. `form.submitted` and `appointment.booked` never fire. The `move_stage` action does nothing, and the AI-summary step overwrites real summaries. No CGST/SGST/IGST split. Proposal client page is missing. Storefront broken at every step |
| **Flow** | DAG automation engine: catalog of 44 actions from 4 modules, triggers, schedules, segment launches, routines, the `ai_agent` node and the channel auto-reply | Dispatch, the `module_action` node, routines, segment launch, the agent loop | Run state expires at 24h. `wait_for_event` resume is missing. Policy checks cover only 9 Connect sends. No Flow DLQ. Console can't reach the API. The palette lacks catalog and agent nodes. Custom nodes are shared process-wide by node type |
| **LAIE** | Lead discovery (Maps browser scrape, Bing/DDG, OSM, directories), enrichment, scoring, Gemini research and pain points, outreach kits, demo pages, export to CRM | Server pipeline end to end; export to the tenant's own CRM | Console unreachable (wrong path, rejected key). Enrichment runs inline on the API. Schedules and actor runs are dead. Gemini runs unmetered on the free tier. No credit gate. Google Maps labelled "official API" but it's a scrape |
| **Connect** | Integrations: WhatsApp, Instagram, Facebook, Telegram, SES/SMTP email, web chat, Google Meet, Razorpay, Stripe, voice | WhatsApp (embedded signup, templates), email, Meet, Razorpay | IG/FB self-serve connect broken. Telegram doesn't write to the inbox. Web chat can't reply. Gmail OAuth is dead. Stripe never settles. `payment.captured` fires up to 3×. No health detection. AI reply needs a manual Flow grant |
| **Storage** | Per-tenant files on one R2 bucket, compression, Cloudflare resize URLs | Upload, compress, signed download, platform media | Everything public, including invoices at guessable paths. Three quota systems, counting requests, not bytes. Listing caps at 1,000. No per-file table, tags or search. LAIE writes outside it |
| **Store** | In-memory Redis-style service: KV types, pub/sub, locks, rate limits, queues, cache; sold to tenants | KV types (tenant-walled), pub/sub, queue basics | Cache, queue v2, locks, rate limits and semantic cache are shared across tenants. Login sessions live in that shared cache. Retry slot leak, inverted priority, DLQ lost on restart, delayed jobs over 48h pruned. No alerting |

---

## 4. The loop and its broken links

```
1 Connect  message in ........ works, but lost on any DB error
2 Platform inbox ............. BROKEN in console (dead path)
3 Flow     AI reply .......... needs manual flow install + Flow grant
4 ERIX     lead created ...... works
5 ERIX     pipeline move ..... BROKEN: no stage trigger reaches Flow
6 ERIX     booking ........... works, public page can double-book
7 ERIX     proposal .......... BROKEN: client link page doesn't exist
8 ERIX     project, portal ... works
9 ERIX     GST invoice ....... works, public PDF, no tax split
10 Connect payment ........... works (Razorpay), trigger fires up to 3x
11 Flow    follow-up ......... BROKEN: any wait >= 24h silently dies
12 LAIE    new prospects ..... BROKEN in console (404/401)
```

Other journeys:

| Journey | State |
|---|---|
| Signup to first use | Works; routines install as drafts |
| Buy credits | Works only if the browser returns from Razorpay |
| Invite a teammate | Works; the role can never change afterwards |
| Website form | Works; `form.submitted` never fires |
| Recurring invoice | Never sent to the client, and can double |
| Background job | Works; retries leak tenant slots |
| Delete a workspace | Leaves files, provider data and the Razorpay subscription behind |

---

## 5. Security posture (summary)

The full findings, with file references and fixes, are in the private audit doc **"Platform & Security Audit — Oct 2026"**. Reproduction detail is deliberately left out of this repo.

| Severity | Count | Themes |
|---|---|---|
| Critical | 6 | Leaked superadmin key; credentials in git; Store without tenant walls (including session forgery); public invoice files; WhatsApp message loss |
| High | 19 | Self-editable session role; keys baked into browser bundles; Flow custom nodes crossing tenants; keys broader than their scope; missing role checks on money settings; billing bypasses; SMS pumping; unbounded AI spend; agent tools not bound to the conversation; unescaped mail; public HTML on the CDN; cloud IAM; secrets everywhere; dev laptop on prod; supply chain; vulnerable frameworks; a request filter that can freeze the API |
| Medium | 28 | Mass assignment, identity headers, e-sign binding, public intake abuse, staff roles, AI cost leaks, voice concurrency, logging personal data, and others |

**Rule for this proposal:** stage 1 (§10) is credential rotation and walling off Store, before any feature or refactor.

---

## 6. Target architecture

```
 LAIE (find quality prospects from public data) ──► CRM, as leads with evidence
 Customers ──► WhatsApp · Instagram/FB · Email · Web chat/forms · Phone (voice agent)
                               │
                        ┌──────▼───────┐
                        │   Connect    │  one transport: receive, send, webhooks, vault
                        └──────┬───────┘
                ┌──────────────▼───────────────┐
                │  THE BRAIN                   │
                │  Agent loop (runToolLoop)    │  allow-listed tools, approvals, budgets
                │  Flow (catalog + engine)     │  runs every action, composes products
                └──────┬───────────┬───────────┘
        ┌──────────────┼───────────┼──────────────┐
   ┌────▼─────┐  ┌─────▼────┐ ┌────▼─────┐  ┌─────▼──────────────┐
   │ CRM      │  │ Commerce │ │ Delivery │  │ Acquisition: LAIE  │
   │ memory,  │  │ proposals│ │ projects,│  │ (Frozen: store-    │
   │ inbox    │  │ invoices │ │ portal   │  │  front checkout)   │
   └────┬─────┘  └─────┬────┘ └────┬─────┘  └────────────────────┘
        └──────────────┴───────────┘
                ┌──────▼──────────────────────────────────────┐
                │ Platform kernel: tenancy & roles · billing & │
                │ credits · Storage · Store (internal) · DPDP  │
                └─────────────────────────────────────────────┘
 Owners/staff ──► SaaS console · admin console · @ecodrix/erix-api SDK (contract-tested)
```

---

## 7. Module proposals

Each module gets one verdict, its next moves, and its own agent (designed in §8).

### 7.1 Platform — Fix
- **Roles:** add role change and ownership transfer. Pass the member role (`req.memberRole`) into the copilot and the tool loop. Let every member read entitlements and usage.
- **Credits:**
  - Charge every priced action (WhatsApp, email, SMS, Flow run, AI tokens, storage overage) through `billing.credits.meter` with idempotency keys.
  - Credit top-ups from the Razorpay webhook as well as the browser.
- **AI:** a quota and credit check in `AiGateway` *before* the provider call.
- **Billing:** close the free "downgrade" and the replayable verify. Cancel the Razorpay subscription on workspace deletion.
- **Staff console:** server-side staff roles, and an impersonation token that something actually verifies.
- **Flow:** a Platform manifest so Platform events reach Flow.

### 7.2 ERIX — Fix
- **Triggers:**
  - Publish `stage.changed` from every stage move, plus `form.submitted` and `appointment.booked`.
  - Fire `lead.created` from upsert and import.
- **Broken actions:** fix `crm.lead.move_stage`, and remove the AI-summary stub that overwrites real summaries.
- **Invoices:**
  - Arithmetic in integer paise, tax after discount, financial-year numbering.
  - A CGST/SGST/IGST split with HSN/SAC; a unique invoice number per org.
  - Recurring invoices in one locked pass that actually sends to the client.
- **Proposal client page:** build the `/proposal/{token}` page.
- **Bookings:** check the slot server-side before booking.
- **Roles:** owner-only bank and invoice settings; admin-only status changes, exports and bulk actions; allow-listed update fields.
- **Storefront:** freeze until the founder decides who holds the money (§11).

### 7.3 Flow — Fix (highest leverage)
- **Run state:** durable in Postgres for any wait, delay or approval, with no 24h limit.
- **Policy:** one check at `FlowCatalogController.run`; idempotency keys honoured by every side-effect action.
- **Custom nodes:** keyed by org, not by node type.
- **Trigger intake:** reject built-in names on `/events/trigger`; wire `resumeWaitForEvent` and reply ingest.
- **Reliability:** a Flow DLQ; node retries that actually retry.
- **Console:**
  - One builder: delete `useWorkflows`, fix the proxy base path to `/v1/api/product/flow`.
  - Build the palette from `GET /catalog` so `module_action`, `ai_agent` and `wait_for_event` appear.
- **AI auto-reply:** install it as a ready routine during onboarding. Prompt the owner for the Connect Flow grant when they enable it.

### 7.4 LAIE — Fix and make it a quality lead engine
**Positioning:** LAIE sells *quality*, not volume. Every lead it hands to the CRM is:

- **Verified:** reachable and still in business.
- **Fit:** matches the tenant's ICP.
- **Explained:** why this business, with evidence and sources.
- **Compliant:** from publicly available data, suppression-checked, contactable on an allowed channel.

The server pipeline already does most stages (§3). The work is quality, provenance, compliance and wiring.

**Quality pipeline (target)**

| Stage | What it does | Builds on (code today) | New work |
|---|---|---|---|
| 1. Source | Publicly available business data. **Allowed sources:** OpenStreetMap; the official Google Places API (paid, terms-compliant) instead of the Maps browser scrape; the business's own website and public social pages; public directories with a terms review per source (JustDial, Sulekha, TradeIndia, IndiaMART); public company and GST verification where available; tenant-uploaded lists and CRM history | Source switch in `scraperWorker`; business vault cache-first | Source registry with a per-source terms flag and robots check; drop or license the Maps scrape; record **provenance** (source URL, fetched-at) on every field |
| 2. Deduplicate | One business, one record, across sources and runs | `hashBusinessIdentity`, vault | Fuzzy match on name, phone and address; merge rules; never re-sell a lead the tenant already has in the CRM |
| 3. Verify | Contact data that works | Email pattern + MX + disposable checks; website finder | E.164 phone normalisation and line-type check; replace the deprecated WhatsApp contacts check; website liveness; "still operating" signals (recent reviews, posts); a confidence score per field |
| 4. Enrich | Context a salesperson needs | Business-profile audit, competitor gap, lifecycle, seasonal, socials | Run on the `laie-pipeline` queue, not inline in the API; per-module timeouts; cache in the vault with freshness windows |
| 5. Qualify | ICP fit + need + timing | Deterministic composite score and tier | Score against the tenant's ICP (niche, city, size, budget signals); a **"why this lead" explanation** with evidence links; **learn from outcomes:** `lead.deal_won` / `deal_lost` from ERIX tune per-tenant weights |
| 6. Pain points and research | Specific, sourced reasons to talk | Gemini research over site pages + news | Every pain point cites its evidence; no invented facts; metered through the AI gateway on paid Gemini or Vertex in `asia-south1` |
| 7. Outreach kit | Ready-to-send first touch | Gemini kit (English + Telugu) | Channel-aware: **email** and **call script** for cold first contact; WhatsApp only after reply or opt-in; per-language templates; a human approves every send |
| 8. Hand-off | Into the loop | `POST /import/crm` → tenant's own CRM | Export with provenance and score; `laie.lead.qualified` starts an ERIX follow-up flow; demo-page views become a trigger |

**How collection works (as built):** LAIE scrapes public pages through rotating **Geonode residential IPs** and **datacenter IPs**. That covers Google Maps listings, search results, directories and business websites. `proxyKit` provides relay and proxy rotation, plus browser and session pools. Rules for this layer:

- **Proxy credentials:** server-side only (Secret Manager). Never in any client bundle, and never in the public SDK.
- **Cost and politeness:** cache-first through the business vault, so the same business is scraped once and reused. Per-source rate limits, retries with backoff, and a hard cap on pages per run.
- **Pool choice per source:** datacenter IPs where they work (cheaper), residential only where needed. The cost of each run goes on the tenant's run ledger.
- **Terms of service:** residential IPs avoid blocks; they don't change a site's terms. Google's terms prohibit scraping Maps, and the risk sits with ECODrIx whichever IP is used. Keep a per-source flag (`allowed` / `review` / `paid-API`) that the founder signs off. Move a source to its official API if it becomes a dependency the business can't lose.
- **Robots and opt-out:** honour `robots.txt` where the source flag requires it. A business that asks to be removed is suppressed in the vault for every tenant.
- **One stack:** the audit found 3 proxy stacks and 2 browser pools. Consolidate to one of each (P2).

**Quality bar, shown per run and per tenant:**

- Share of leads with a verified phone or email.
- Duplicate rate.
- Bounce rate.
- Reply rate.
- Lead → opportunity rate.

A run that misses the floor (for example, under 70% verified) is flagged, not delivered silently.

**Compliance (built in, not optional):**

- **Suppression:** the DSR suppression list and CRM opt-outs are checked before any export or send.
- **Channels:**
  - Email: unsubscribe in every message, with daily caps and warm-up.
  - Calls: scrubbed against India's Do-Not-Disturb registry, within calling hours.
  - WhatsApp: only to contacts who replied or opted in, using approved templates.
- **Data:** keep only business-contact data, with a retention limit. Document the DPDP basis for processing publicly available business data; the founder signs this off with legal advice.

**Wiring fixes (from the audit):**

- **Console:** call `/v1/api/product/laie` through the SDK, and drop `x-laie-key` so only the user's session is sent.
- **Real-time updates:** fix the events the console listens for.
- **Credits:** a credit check before each run; meter Maps and AI calls.
- **Dead parts:** finish or delete schedules and actor runs.
- **Legacy surfaces:** retire the duplicate LAIE webhooks surface and LAIE's own R2 client; use Storage instead.

### 7.5 Connect — Fix
- **Reliability:**
  - The WhatsApp inbound handler must throw on save or publish errors, so Meta retries.
  - Dedupe `payment.captured` by payment id.
  - Don't swallow trigger-publish failures after the webhook claim.
- **Instagram and Facebook:** fix embedded connect, or use manual-token connect only.
- **Inbox gaps:** Telegram writes to the inbox; web chat gets a reply path.
- **Stripe:** settle invoices, or drop Stripe until a customer needs it.
- **Health:**
  - A health-sweep cron that sets `needs-attention` and emits `connect.connection.degraded`.
  - Handle Meta template-status and quality webhooks.
- **Email:**
  - Suppression checks on the send route.
  - An SES ConfigurationSet that records deliveries, bounces and complaints.
- **Vault:** AES-256-GCM with org and provider as associated data.
- **Cleanup:** delete Gmail OAuth, the dead webhook-log surface and the unused OAuth clients.

### 7.6 Storage — Fix
- **Private by default:** private bucket, random object keys, short signed links; purge the existing public invoice and signed-document URLs.
- **One quota in bytes:** replace the three systems, apply it to every write path, and page the listing past 1,000 files.
- **Upload safety:** file-type allow-list; non-images served as attachments; LAIE writes go through Storage, not its own R2 client.
- **Per-asset table:** key, org, MIME type, size, dimensions, alt text, tags, AI status. It's needed for search, tags and the media agent.
- **Broken paths:** fix the project-documents upload path; attach or link invoice PDFs in invoice sends.

### 7.7 Store — Fix, internal-first
- **Tenant walls:**
  - Only the internal key on `/cache`, `/queue/v2`, `/lock`, `/ratelimit` and `/semantic`.
  - Remove the WebSocket env-key fallback.
  - Move login sessions out of the shared cache.
- **Bugs:** retry slot leak, DLQ duplicate runs, inverted priority, stuck jobs.
- **Durability:** a DLQ that survives restart; no pruning of future-dated jobs.
- **Ops:** run on Node 22 as non-root; per-tenant memory caps; alerting.
- **Tenant offering:** stop selling Store to tenants until the walls hold. Then offer only the KV and pub/sub surface.

### 7.8 Voice agent — Fix and launch inbound first
**What it is (code today):**

- A Python runtime (Pipecat + Sarvam: saaras speech-to-text, bulbul text-to-speech) handles live audio only.
- The TS server owns the call record, the caller context and the tools:
  - Tools: save lead, take message, book appointment, request handoff.
  - Duration billing as `voice_minute`, the transcript to the inbox, and `voice.call.completed` to Flow.
- A browser test call works.
- Nothing is live on a phone line yet.

**Launch order**

1. **Inbound (stage 4).** The business's number forwards unanswered or after-hours calls to the agent. The agent answers in the caller's language, recognises returning callers, takes messages, books appointments and hands off to a person. This is the highest-value, lowest-risk use: the caller rang us.
2. **Outbound to consenting contacts (stage 5).** Appointment reminders, payment reminders and callbacks the customer asked for. No cold calls to numbers on the Do-Not-Disturb registry.
3. **Cold outbound calls stay out of scope** unless legal review clears it. That covers both LAIE prospects and anyone else who hasn't consented.

**Fixes before launch (from the audit):**

- **Config:** correct the runtime's API base URL on the VM (it's missing `/v1/api/infra/connect`, so tool calls and call completion 404).
- **Call integrity:**
  - One media socket per call; a second must not end and bill a live call.
  - A sweeper that completes calls stuck in "connecting".
- **Capacity:** a per-org concurrency cap; purge sessions that never connect; admin role, plan gate and a `voice` key scope on agent settings and test calls.
- **Privacy:** log at warning level only; transcripts and prompts never go to container logs.
- **Billing:** reserve credits before a call; price `voice_minute` (§11).
- **Product:**
  - A console screen for agent settings and test calls.
  - Live transfer to a person.
  - Verify the inbound phone provider's integration (Vobiz is assumed) against its real wire format.
- **Scale:** session state that survives a restart and works across more than one instance.
- **One brain:** voice tools become catalog actions (`crm.lead.create/update`, `crm.appointment.book`, `crm.activity.log`, `flow.ai.handoff`). Voice and chat then share one tool set and one policy check.

**Quality bar:**

- **Speed:** first word within 1.5 seconds of pickup.
- **Live latency:** median turn latency under 1.2 seconds.
- **Outcome:** share of calls ending in a booking, a message or a clean handoff.
- **Escalation:** handoff rate.
- **Reliability:** zero calls left "connecting".

### 7.9 Cut and merge
- **Cut:** Editor; the dead SDK resources (automations, sequences, campaigns, chat, event-log, sessions, `erix.admin`); `/product/erix/chat`; and the unused `ecodrix_org_agents` / `erix_event_logs` tables (each table drop needs a down-path migration).
- **Merge:**
  - Three custom-field surfaces into one.
  - Two audit-log stores into one.
  - Ask AI and the copilot into one operator assistant (the copilot, with role gates).
  - Four inbox surfaces into `/platform/inbox`.

---

## 8. Agent and automation layer

### 8.1 Definition
An **isolated module agent** is a configuration of the one agent loop (`runToolLoop` via Flow's `runAgent`), defined by:

| Part | Meaning |
|---|---|
| Tools | Only its own module's Flow catalog actions, filtered by a per-tenant allow-list |
| Triggers | Its own module's events start it |
| Tenant | Comes from the job, never from the model |
| Budget | Per tenant and per agent: tokens, steps and side-effect count, checked before each model call |
| Approval | Money, outbound messages to third parties, deletes and bulk changes return as *pending* for a person |
| Audit | Every step written to the run log and the module's activity log with `runId` |

### 8.2 What Flow must provide first (shared substrate)
1. **Durable runs, approvals and waits** in Postgres. Replace the 24h Store keys.
2. **Policy at `FlowCatalogController.run`:** consumer → allowed action ids. Add `connect`, `storage`, `store` and `platform` to the consumer union.
3. **Per-tenant, per-agent allow-lists:** generalise `aiAllowedTools`.
4. **An approvals inbox:** pending actions, approve and resume, approver identity and a role check. Reuse `ecodrix_ai_tool_executions`.
5. **Budget enforcement** inside `runAgent` / `AiGateway`.
6. **Idempotency on every side-effect action.**
7. **Trigger hygiene:** no spoofed built-ins; add the missing publishers.
8. **Manifests for Platform, Storage and Store.**

### 8.3 The agents

| Module | Agent | Tools today | Tools to add | Triggers to add | Approval required |
|---|---|---|---|---|---|
| Platform | Workspace agent | none in catalog | `platform.notify.team`, `members.list`, `credits.balance`, `credits.topup_link`, `usage.get`, `support.ticket.reply` | `credits.low`, `credits.cap_alert`, `quota.near_limit`, `subscription.halted`, `payment.failed`, `invitation.accepted`, `trial.expiring` | Invites, top-up links. **Never automated:** key rotation, deletion, plan change, refunds |
| ERIX | Sales & delivery agent | `crm.lead.find/create/update/tag`, `activity.log`, `appointment.slots/book`, `project.create` | fix `lead.move_stage`; `lead.get`, `lead.search`, `pipeline.list_stages`, `invoice.list`, `project.status`, `note.add`, `task.create`, `appointment.reschedule`, `proposal.create`, `invoice.create`, `invoice.payment_link` | `stage.changed`, `form.submitted`, `appointment.booked`, `proposal.accepted`, `invoice.overdue`, `document.signed`, `task.overdue`, `membership.expiring` | Proposals, invoices, payment links, voids, bulk moves |
| Flow | Substrate + channel auto-reply | `flow.ai.reply`, `flow.ai.handoff`, `flow.routine.*` | §8.2 | `run.failed`, `approval.pending` | Whatever a module marks |
| LAIE | Prospecting agent: finds, verifies, scores and explains quality leads for the tenant's ICP within a budget, drafts channel-correct first touches | `laie.leads.discover`, `lead.enrich/score/research/find_email/check_whatsapp/outreach_kit/export`, `contact.suppress` | `laie.intelligence.query`, `lead.list` (filters), `lead.verify`, `lead.explain`, `lead.generate_demo`, `campaign.run`, `quality.report` | `laie.job.discovered`, `laie.lead.demo_viewed`, `laie.lead.signal`, `laie.quality.below_floor` | Every outreach send; exports to CRM in bulk; runs over budget |
| Voice (Connect channel) | Voice agent: answers calls, recognises callers, books, takes messages, hands off | runtime tools: save lead, take message, book, handoff (server routes, not yet catalog) | Route through catalog: `crm.lead.create/update`, `crm.appointment.book`, `crm.activity.log`, `flow.ai.handoff`; add `voice.call.transfer`, `voice.callback.schedule` | `voice.call.started`, `voice.call.completed` (exists), `voice.handoff_requested` (exists), `voice.call.missed` | Outbound calls; any payment or booking change on an existing appointment |
| Connect | Channels agent | 16 send/integration actions | `connection.test`, `whatsapp.templates.sync`, `email.health`, `webhook.replay_failed` | `connect.connection.degraded`, `whatsapp.template.status`, `whatsapp.quality.changed`, `email.bounce_rate.high` | Reconnects, template submissions, all third-party sends |
| Storage | Media agent | none | `storage.media.describe/tag/optimize`, `file.signed_url`, `cleanup.orphans`, `quota.report` | `storage.file.uploaded`, `storage.quota.threshold`, `storage.quota.exceeded` | Deletes, cleanup |
| Store | Ops agent (internal only) | none | `store.queue.metrics`, `queue.replay_dlq`, `queue.retry_job`, `lock.list_stale`, `usage.tenant_report` | `store.queue.dlq_added`, `queue.backlog_high`, `anomaly.detected`, `memory.high` | DLQ replay, lock force-release |

**Build order:**
1. The Flow substrate.
2. ERIX and Connect agents (they drive the loop).
3. LAIE prospecting agent and inbound voice agent (they feed the loop at both ends: new prospects and incoming calls).
4. The Platform agent.
5. The Storage and Store agents (housekeeping).

---

## 9. The foundation: clear, realtime, agentic, versioned, secure

Every module stands on five rules. They make the platform powerful without confusing the people who use it:

1. **One mental model.**
2. **Everything updates live.**
3. **Agents do the work; people approve.**
4. **Features ship as versions behind flags.**
5. **The public SDK stays small and safe.**

### 9.1 One mental model (no confusion)

Users see five nouns, in this order. The UI, the API and the docs use these words and no others.

| Word | Means | Lives in |
|---|---|---|
| **Prospect** | A business LAIE found that is not yet in the CRM | LAIE |
| **Contact** | A person or business in the CRM (replaces lead/client/customer for the same thing) | ERIX |
| **Conversation** | Every message and call with a contact, on any channel, in one thread | Platform inbox |
| **Work** | Deal → project → proposal → invoice → payment | ERIX |
| **Automation / Assistant** | A Flow that runs on events; an agent that acts for you | Flow |

- **One activity timeline per contact and per workspace.** Every change shows who did it: a person, a named assistant, or an automation. Nobody wonders "who changed this?".
- **Assistants work in the open.** They post in the conversation and the timeline like a teammate. Approvals appear inline as a card with **Approve · Edit · Reject**, never in a separate admin screen.
- **One screen per job.** One inbox, one builder, one assistant, as in §7.9.

### 9.2 Realtime-first: nothing waits on a request

**Rule:**

- A command returns immediately: `202 { id }`.
- Progress and the result stream back over the WebSocket, like a chat.
- Reads stay request/response, then live subscriptions keep them fresh.
- Any endpoint that may take longer than about 300 ms follows this pattern. That includes AI, agent runs, LAIE runs, imports, sends and voice.

**Today (from code):**

- **Event names don't match:** socket.io exists with tenant rooms, but each module invents its own names (`new_message`, `laie:*`, `ai_suggestion`, `ai_handoff`, `entitlements:updated` …).
- **Rooms:** each tenant's room is spelled six different ways.
- **Dead listeners:** the console listens for events the server never emits (`campaign:*`, `research:complete`), and the server emits events the console never hears (`ai_handoff`, `message_updated`).
- **No cross-instance delivery:** there is no socket.io adapter, so an event emitted on one of the 3 Cloud Run instances never reaches users on another. The jobs VM has no socket connection at all.
- **Dropped connections:** Cloud Run's `--timeout=300` cuts every WebSocket after 5 minutes, with no session affinity.
- **Only the copilot streams:** it streams over SSE, and even there the gateway's tool turns don't stream tokens.

**Target design:**

```
 change (any module, API or worker)
   └─ same DB transaction ─► platform_events  (append-only: org, seq, type, resource, actor, data, v)
                                   │  Postgres LISTEN/NOTIFY (event id)  — no Redis, per org rule
                                   ▼
                     realtime gateway (every API instance + a dedicated realtime service)
                                   │  socket.io rooms: org:<id> · user:<id> · resource:<type>:<id>
                                   ▼
             console / admin  ──  SDK realtime client: subscribe(resource, lastSeq) → replay + live
```

- **One event envelope:** `{ v: 1, id, seq, org, type, resource, actor, at, data }`. Event types live in one catalog, with TypeScript types generated for the server and the SDK. A contract test fails CI when a listener has no publisher, or a publisher has no listener.
- **Never miss an update:**
  - Every event is written to `platform_events` in the same transaction as the change (a transactional outbox).
  - On reconnect, the client sends `lastSeq` and the gateway replays what it missed.
  - Each event is retained 7 days.
- **Cross-instance fan-out:** Postgres `LISTEN/NOTIFY` wakes every gateway instance, including the jobs VM. erix-store pub/sub is at-most-once and not tenant-walled, so it isn't used for this.
- **Cloud Run:**
  - Run the gateway as its own service: `--timeout=3600`, `--session-affinity`, minimum instances 1 and CPU always allocated.
  - The client reconnects automatically and replays.
  - Alternatively, run the gateway on the jobs VM behind Caddy.
- **Room authorization:** reuse `canJoin`. Collapse the six room spellings to `org:<id>`.
- **Streams that matter:**

| Stream | Events |
|---|---|
| Conversation | `message.created`, `message.status`, `typing`, `assistant.draft.delta` (tokens), `assistant.reply.sent`, `handoff.requested` |
| Agent run | `run.started`, `step.started`, `tool.called`, `tool.result`, `approval.pending`, `approval.decided`, `run.completed` / `run.failed`, `budget.updated` |
| Pipeline board | `contact.created`, `contact.updated`, `stage.changed` |
| LAIE run | `prospect.found`, `prospect.verified`, `prospect.scored`, `run.progress`, `run.quality` |
| Voice call | `call.ringing`, `call.answered`, `transcript.delta`, `tool.called`, `call.ended` |
| Workspace | `credits.updated`, `capabilities.updated`, `notification.created`, `connection.degraded` |

- **AI tokens stream end to end:**
  - Stream at the source: add streaming to `AiGateway.completeWithTools` for OpenAI, Anthropic and Gemini.
  - Then stream through `runToolLoop`, then over the socket.
  - Voice already streams audio; stream its transcript to the console too.
- **Flow control:**
  - Coalesce high-frequency progress to at most 4 updates a second per resource.
  - Rate-limit each socket.
  - On a dropped connection, deliver the final state, not every token.
- **Optimistic UI:** commands carry an idempotency key, the UI updates at once, and the server's event confirms or corrects it.

### 9.3 Agentic by default

- **Agents run as background jobs, never inside a request.** Each run has an id, streams its steps (§9.2) and pauses durably for approval (§8.2).
- **One tool, two callers.** Every user action in the UI is the same Flow catalog action an agent calls. The UI and the agents can't drift apart, and permissions are checked in one place.
- **Autonomy levels, per tenant and per agent:**
  - **Off**
  - **Suggest** (default for new tenants)
  - **Act with approval**
  - **Act and report**
  
  Money, outbound messages to third parties, deletes and bulk changes never go above "Act with approval".
- **Agent identity:** each assistant has a name, an actor id, a live budget meter and a per-tenant kill switch. All of its actions are attributed to it in the timeline.

### 9.4 Versioned launches (not everything in the dashboard at once)

- **Backend ahead of the UI.** The backend can contain more than the UI shows. Each tenant sees what its **version, plan and feature flags** enable. `ecodrix_feature_flags` and plan entitlements already exist.
- **One source of truth for the UI:** `GET /capabilities`, plus a live `capabilities.updated` event.
- **Rollout:** flags flip by cohort (internal → beta tenants → everyone), and rolling back means flipping a flag off.
- **Stable APIs:** `/v1` stays backward compatible, breaking changes go to `/v2`, the SDK follows semver, and events carry `v`.

| Version | Name | What tenants get | Built in stage (§10) |
|---|---|---|---|
| **v1.0** | Inbox to Invoice | WhatsApp + email inbox, AI reply in Suggest mode, contacts and pipeline, proposals, GST invoices, payment links, live updates everywhere | 1–3 |
| **v1.1** | Never miss a call | Inbound voice agent, live call transcript, callback tasks, call summaries on the contact | 3–4 |
| **v1.2** | Quality prospects | LAIE quality pipeline, prospect → contact with evidence, outreach drafts with approval, quality report | 3–4 |
| **v1.3** | Autopilot | Module assistants at "Act with approval": sales & delivery, channels, follow-ups with multi-day waits | 4 |
| **v2.0** | Agency | White-label, multi-workspace, outbound voice to consenting contacts, partner programme | 5 |

### 9.5 Secure by boundary: the public SDK rule

`@ecodrix/erix-api` is **published publicly**. It carries only a few tenant-safe calls, authenticated by the user's session token or a scoped publishable key, plus the realtime subscribe client.

**It must never contain:**

- **Platform credentials:** `coreApiKey` / `x-core-api-key`, `x-internal-secret`.
- **Identity overrides:** `x-user-id`, `x-admin-staff-*`, `x-laie-key`.
- **Privileged surfaces:** admin or staff resources, impersonation.
- **Globals:** a `window.ecodrix` global.

**Today, version 2.1.5 has:**

- the `coreApiKey` option (`packages/erix-api/src/core.ts:42,184`);
- 35 platform-admin resource files (`src/resources/platform/admin/*`, `adminOnboarding.ts`, `services.ts`);
- the `window.ecodrix` global (`core.ts:238-241`).

The `coreApiKey` option is how a client site shipped the platform superadmin key into public JavaScript.

**Where privileged calls go instead:**

- They run **server-side only**, in the admin app's and the SaaS's Next.js server routes, with credentials from server environment variables. They never reach a browser bundle.
- If a shared client helps, it is a **private, unpublished** server-only package, for example `@ecodrix/erix-internal` in the workspace only.

**Release:**

- Publish **SDK 3.0.0** without these, and deprecate 2.x on npm.
- Because old versions are already public, the core key must be rotated (stage 1).

**CI guard:**

- A test fails the SDK build if its source contains any banned header or option name, or an admin path.
- A secret scan runs on the SaaS and admin `.next/static` bundles.

The org rule "the frontend talks only through the SDK" still holds. The browser can do only what the public SDK allows, and anything privileged happens on a server.

## 10. Plan: five stages, each with a gate

A stage starts only when the previous gate passes. **New feature work that is not listed waits** until the founder places it in a stage.

| Stage | Scope | Owner | Gate |
|---|---|---|---|
| **1. Stop the bleeding** (this week) | Rotate the core key and every committed secret; remove keys from browser bundles; purge git history; wall off Store (internal key only, sessions moved out); put erix-store behind the edge; **publish SDK 3.0 without internal options or admin resources and deprecate 2.x** (§9.5); remove unproven site claims ("50+ businesses", "SOC 2", "99.9% uptime") | Founder + ops | No secret in any bundle or git history; erix-store unreachable from the internet; no tenant can touch the shared cache |
| **2. Make the loop safe** (~2 weeks) | Tenant walls (private storage, role gates, per-org custom nodes, mass-assignment allow-lists); exactly-once money and messages (WhatsApp loss, billing holes, recurring invoices, top-up webhook, deletion cancels the subscription, payment dedupe); request-filter fix; Flow durable state; **from the Kiro audit:** storage tenant prefix ends in `/`, disconnect deletes credentials and provider subjects, failed Connect receipts are retryable, custom nodes keyed by org and re-registered on boot, Store cache routes ordered before `/:key`, parallel Flow branches stop overwriting one shared record, one clientCode casing in Storage, commit or vendor `laie/lib/scrap` so a clean clone builds; **realtime foundation** (event log + outbox, Postgres LISTEN/NOTIFY fan-out, replay on reconnect, a dedicated gateway with a long timeout and session affinity, one room scheme) | Engineering | Route-level cross-tenant tests and money-path tests pass in CI; a message sent on one instance reaches a console connected to another within 1 second, and nothing is missed across a reconnect |
| **3. Make the loop work** (2–3 weeks) | Rewire console dead paths (inbox, Flow, AI settings, onboarding, forgot password, proposal page, **LAIE via SDK**); one builder, one assistant; SDK contract test in CI; missing ERIX triggers; AI bounded (pre-call quota, conversation-bound tools, per-sender throttle); Flow substrate §8.2; **LAIE quality pipeline v1** (provenance, dedupe, verify, ICP scoring with explanations, enrichment on the queue, credit gate); **voice fixes** (§7.8); **streaming everywhere** (AI tokens, agent steps, LAIE runs, call transcripts) and one event catalog with a contract test; console shows only `GET /capabilities` features (§9.4) | Engineering | A real-estate test workspace runs LAIE prospect → CRM, and WhatsApp → AI reply → pipeline → proposal → GST invoice → payment → follow-up after 3 days, with no manual DB edit. A LAIE run for one niche and city meets the quality floor (≥70% verified contact, <5% duplicates) |
| **4. Sell it** | One price ladder; honest site; error tracking and alerts; DPDP basics (retention job, complete purge, full export, consent ledger); ERIX, Connect and **LAIE prospecting** agents; **inbound voice live** on beachhead numbers; 10 beachhead customers | Founder-led | 10 paying workspaces; 30 days with no lost message or double charge; LAIE reply rate and lead → opportunity rate tracked per tenant; voice calls ≥90% end in a booking, message or clean handoff |
| **5. Grow on the same brain** | Outbound voice to consenting contacts; LAIE learning from outcomes; agency white-label; Platform, Storage and Store agents | Founder + engineering | Each passes the ten principles before shipping |

---

## 11. Decisions for the founder

- [ ] **ICP.** Recommendation: growing SMBs in real estate and education, with agencies as resellers (vs freelancers and micro-agencies).
- [ ] **One price ladder.** Code shows Free / ₹2,999 / ₹8,999 / ₹19,999, while three docs show others. Plans are INR but add-ons are USD, and seat caps contradict "no per-seat". Pick one and delete the rest.
- [ ] **Credit value.** Decides whether "WhatsApp at cost" is true, and the `voice_minute` price.
- [ ] **Storefront money.** Keep collecting merchants' money in ECODrIx's Razorpay (RBI payment-aggregator rules apply) or route each merchant's own gateway.
- [ ] **Data location and AI providers.** Disclose US hosting and the sub-processors (OpenAI, Anthropic, Google, Sarvam), or move to `asia-south1`.
- [ ] **One operator assistant.** Recommendation: the copilot, with role gates, replacing keyword-based Ask AI.
- [ ] **LAIE sources.** Scraping runs through Geonode residential and datacenter IPs. Decide, per source, between scraping (accepting the terms-of-service risk), the paid official API, or dropping it. Google Maps is the biggest call. Get legal sign-off on the DPDP basis for publicly available business-contact data.
- [ ] **LAIE pricing.** Per verified lead, or credits per run (today: run = 10 credits, lookup = 2, unlock = 1), and the quality floor below which a run is not charged.
- [ ] **Voice scope and price.** Launch inbound first (recommended). Choose the phone provider (Vobiz assumed). Set the `voice_minute` price. Decide whether outbound to consenting contacts joins stage 5.
- [ ] **Targets.** Confirm or replace 10 paying workspaces by March 2027, and replies within 5 minutes.

---

## 12. Docs to correct

The code has moved on and these docs mislead people and AI coding agents. Correct them as part of stage 3.

| Doc | Wrong today | Correct to |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` (workspace root) | `/crm/custom-events`, `ConversationSDK`, `ErixAdapter`, queue registry at `shared/lib/erix/queues` | `/v1/api/product/flow/config/triggers`; `PlatformInboxSDK` / `req.platform.inbox`; `database.*` services (ErixAdapter retiring); `server/src/infrastructure/queue/registry.ts` |
| `server/README.md` | `/api/laie/v1/*` with `x-laie-key`; `src/laie/` | `/v1/api/product/laie/*` with session or `erix_laie_` key; `modules/product/laie` |
| `server/ARCHITECTURE.md` | SMS as a tenant channel; Gmail OAuth; automatic needs-attention lifecycle | SMS is platform OTP only; Gmail OAuth dead; no runtime health detection yet |
| `server/docs/API.md`, `api-inventory.md` | Storage status codes and missing `/storage/self`; `/crm/custom-events` | Regenerate from the route inventory |
| `erix-store/README.md` | "All keys namespaced", "sliding window", shared key "still accepted", Render/Supabase | Cache/queue/lock/ratelimit/semantic are shared (until fixed); fixed window; GCE VM + Cloud SQL |
| `voice-runtime/README.md` | Pipeline "stubbed" | Real Pipecat + Sarvam pipeline; closes 1011 without a key |
| `.Architecture/platform_architecture.md` | A pasted agent transcript | Delete |
| `.Architecture/PLATFORM_ARCHITECTURE.md`, `PLATFORM_DATA_BOUNDARIES.md` | BYO database / per-tenant Mongo | One Postgres (ADR-001) |
| Root `README.md` | `/apps`, `/desktop`, `ECOD_SAAS`, `ECOD_Admin` | Actual layout: `ECOD/{server,saas,admin,erix-store,voice-runtime,packages}` |
| Code comments | MongoDB and old mount paths in LAIE `bootstrap.ts` / `laie.router.ts`; "official Google Places API"; "Claude (Vertex)" in the outreach kit; `/api/saas`, `/api/crm` headers | Current paths and providers |

**Prevent recurrence:**
- **Route inventory:** generate it from code in CI, and add the SDK contract test.
- **Change rule:** any PR that changes a route, trigger or catalog action updates this proposal's §3 or the inventory in the same PR.

---

## 13. Sources

**Second audit.** `SYSTEM_AUDIT_2026-10-11.md` (Kiro, from code) was reconciled with this proposal on 2026-10-11:

- **Agrees** on the three journey breaks, Flow's 24h state, custom-node isolation, Store isolation, the copilot role bug, AI credit metering and storage quotas.
- **Two claims corrected:** Google Maps is a browser scrape, not the Places API; `wrangler-account.json` is not committed.
- **Missing from its P0:** the leaked core key and committed credentials, session forgery, the role-escalation and billing holes, public invoices, the ReDoS filter, WhatsApp message loss, the public SDK, and the console dead paths.
- **Confirmed and added to stage 2:** its new findings.

Where the two documents disagree, this proposal is the one to plan from.

- Module audits from code (Platform, ERIX, Flow, LAIE, Connect, Storage, Store), October 2026.
- **"ECODrIx Capability Map (from code)"**: the per-module tables behind §3, §4 and §8.
- **"Platform & Security Audit — Oct 2026"** (private): full security findings.
- **"ECODrIx Platform Vision"**: the draft vision, principles and scorecard behind §2 and §10.
- `server/GLOBAL.md` (ADR-001, ADR-009) for the engineering rules this proposal keeps.
