# 00 — ECODrIx Architecture Brief

One-page mental model: what the platform is, where the code lives, and why.

## Product

**ECODrIx is an AI-native business operating system for Indian SMBs.** It runs on two go-to-market
channels and one backend, gates access through a unified entitlements system, and exposes the same
capabilities to direct customers, freelance-managed clients, and embedded SDK users.

| Dimension       | Value                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Target buyer    | Indian SMB owner / agency operator (1–50 employees)                                    |
| Verticals       | Clinics, real estate, ed-tech, services, D2C, agencies                                 |
| Primary channel | WhatsApp (Meta Cloud API) + email + voice (planned)                                    |
| Acquisition     | `freelance` (managed via `ECOD/admin`) and `direct` (self-serve via `ECOD/saas`)       |
| Pricing         | `free` · `starter` · `growth` · `scale` · `enterprise` (+ 8 add-ons)                   |
| Data residency  | India (ap-south-1) primary; tenant DBs in tenant region when `data_mode != "platform"` |

## System Topology

```
Direct user           Freelance team         Client website (embed)
     │                       │                      │
     ▼                       ▼                      ▼
ECOD/saas              ECOD/admin            @ecodrix/erix-react
     │                       │                      │
     └───────────┬───────────┴───────────┬──────────┘
                 │                       │
                 ▼                       ▼
       ┌───────────────────────────────────────┐
       │  @ecodrix/erix-api  (TS SDK)          │
       └────────────────┬──────────────────────┘
                        │ HTTP + Socket.io
                        ▼
       ┌───────────────────────────────────────┐
       │  ECOD/server  (Express + Hono)         │
       │   tenantResolver → entitlement gate    │
       │   getErixAdapter(orgId) → service      │
       └────┬─────────────┬────────────────────┘
            │             │
   ┌────────▼──┐   ┌──────▼────────────┐   ┌──────────────┐
   │ Supabase  │   │ Tenant Mongo / PG │   │  ErixStore    │
   │ ecodrix_* │   │ (data_mode=own)   │   │  port 6399    │
   │ erix_*    │   │                   │   │  WAL → PG     │
   │ laie_*    │   │                   │   │               │
   └───────────┘   └───────────────────┘   └──────────────┘
```

## Tech Stack (current versions)

| Layer                          | Choice                                                | Why                                                                                                       |
| ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Frontend                       | Next.js 15 + Tailwind 4 + shadcn/ui (dark navy)       | App Router + RSC for the console patterns                                                                 |
| Server state                   | TanStack Query v5                                     | Standard, integrates with the SDK                                                                         |
| Visual automation              | `@xyflow/react` v12                                   | React Flow successor                                                                                      |
| Backend                        | Node 20 + TypeScript strict                           | Express 5 + Hono dual routing                                                                             |
| ORM                            | Drizzle ORM                                           | Type-safe Postgres, three schema families (`ecodrix_*`, `erix_*`, `laie_*`) under one `drizzle.config.ts` |
| Cache / queue / locks / pubsub | ErixStore (port 6399)                                 | Replaces Redis + BullMQ; persists to Postgres                                                             |
| Real-time                      | Socket.io + ErixStore Pub/Sub                         | Shared event spine between server, workers, and SDKs                                                      |
| AI (inbox + workflows)         | Gemini 2.0 Flash via `@google/genai` (Vertex AI mode) | Latency, cost, India region                                                                               |
| AI (LAIE outreach kits)        | Claude Sonnet 4.5 via `@anthropic-ai/vertex-sdk`      | Long-form structured generation                                                                           |
| WhatsApp                       | Meta Cloud API                                        | India market default                                                                                      |
| Email                          | AWS SES (`@aws-sdk/client-sesv2`)                     | Cheap, region available                                                                                   |
| Storage                        | Cloudflare R2 (S3 SDK)                                | India PoPs, low egress                                                                                    |
| Payments                       | Razorpay                                              | India-first                                                                                               |
| Lint / format                  | Biome                                                 | One tool, fast                                                                                            |

## Two Acquisition Channels, One Backend

| Concern               | Freelance                                                          | Direct                              |
| --------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| Created by            | `POST /api/admin/clients` (CORE_API_KEY)                           | `POST /api/auth/register` (public)  |
| `acquisition_channel` | `"freelance"`                                                      | `"direct"`                          |
| Default `data_mode`   | `"own"` (Mongo provisioned by us)                                  | `"platform"` (shared Supabase)      |
| Pricing               | Setup fee + discounted monthly                                     | Standard self-serve                 |
| Operates from         | `ECOD/admin`                                                       | `ECOD/saas`                         |
| Auth header           | `x-core-api-key` (admin) + `x-api-key` + `x-client-code` (proxied) | `x-api-key` + `x-client-code` (SDK) |
| Result                | One unified `ecodrix_organizations` row + isolated data            | Same                                |

## The Six Moats

1. **ErixStore** — owned cache/queue/locks/pubsub stack. No Redis or BullMQ bills, full control of the latency curve.
2. **Embeddable SDKs** (`@ecodrix/erix-react`, `@ecodrix/erix-api`) — agencies embed our CRM in their clients' sites.
3. **LAIE intelligence** — research actors + Gemini synthesis create proprietary lead data over time.
4. **WhatsApp + CRM + Invoice in one flow** — competitors are point tools; we own the chain end-to-end.
5. **Visual automation builder** — high switching cost once tenants build workflows on us.
6. **Freelance training data** — managed clients across verticals make our AI smarter than horizontal SaaS, then direct customers benefit.

## Five AI Tiers (the ladder)

| Tier         | What AI does                                                       | Status                                                                     |
| ------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Operates** | Auto-respond, qualify, move pipeline, generate invoices            | 🟡 Auto-respond live (Gemini 2.0 Flash); pipeline ops via workflows        |
| **Learns**   | Adapts timing, retires bad templates, refines scoring per industry | ⬜ Planned                                                                 |
| **Creates**  | Templates, sequences, workflows, reports                           | 🟡 LAIE outreach kit generation live (Claude); template generation pending |
| **Predicts** | Revenue forecasts, at-risk deals, optimal contact timing           | ⬜ Planned                                                                 |
| **Coaches**  | Post-conversation feedback, weekly performance digests             | ⬜ Planned                                                                 |

## Pricing Bundle (5 plans)

See `saas/.kiro/specs/platform-pricing-entitlements/requirements.md` for the full matrix.

| Slug         | USD/mo | Headline limits                                                                   |
| ------------ | -----: | --------------------------------------------------------------------------------- |
| `free`       |      0 | 100 contacts · 1k WA msgs · 5 audits · 1 workflow · 1 GB                          |
| `starter`    |     29 | 2k contacts · 10k WA msgs · 50 audits · 100 AI calls · webhooks                   |
| `growth`     |     79 | 25k contacts · 100k WA msgs · 500 audits · 1k AI calls · custom branding + domain |
| `scale`      |    199 | 100k contacts · 500k WA msgs · 2k audits · 10k AI calls · 99.9% SLA               |
| `enterprise` | custom | Unlimited · white-label · 99.99% SLA                                              |

Add-ons (storage, bandwidth, AI calls, audits, WA msgs, branding, white-label, priority support)
override specific feature paths via `ecodrix_organizations.add_ons` and merge at entitlement-check time.

## Status snapshot (May 30, 2026)

| Area                                             | Status | Notes                                                     |
| ------------------------------------------------ | :----: | --------------------------------------------------------- |
| Pricing & entitlements                           |   ✅   | Plans + add-ons + atomic usage + lifecycle worker shipped |
| Visual automation builder                        |   ✅   | React Flow + Postgres execution engine + EventBus         |
| Schema reorg (`ecodrix_*`/`erix_*`/`laie_*`)     |   ✅   | Single `drizzle.config.ts` covers all three               |
| AI auto-respond on Gemini 2.0 Flash              |   ✅   | `services/saas/ai/auto-responder.ts`                      |
| Editor pro features (collab, comments, versions) |   🟡   | SDK-only, plan-gated                                      |
| Multi-source DB layer (`platform`/`own`/`both`)  |   🟡   | In flight (`platform-completion-end-to-end/`)             |
| Public registration + admin → Postgres bridge    |   🟡   | In flight                                                 |
| Settings + infra dashboard frontend              |   🟡   | In flight                                                 |
| Mobile PWA, voice AI, conversational commerce    |   ⬜   | Long-tail roadmap                                         |

## Where to go next

| Question                                     | Doc                            |
| -------------------------------------------- | ------------------------------ |
| What does the product do, for whom, and why? | `01-PRD.md`                    |
| What are the infra & service decisions?      | `02-TRD.md`                    |
| What does the UI look like?                  | `03-UIUX-BRIEF.md`             |
| What journeys does a user take?              | `04-APP-FLOW.md`               |
| What tables and FKs are there?               | `05-SCHEMA.md`                 |
| What ships in which phase?                   | `06-ROADMAP.md`                |
| Show me the diagrams                         | `07-VISUAL-ARCHITECTURE.md`    |
| How do I run the project?                    | `08-DEVELOPMENT-GUIDE.md`      |
| How do I write the code?                     | `../IMPLEMENTATION_DETAILS.md` |

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-pricing-entitlements/`, `saas/.kiro/specs/platform-completion-end-to-end/`.
