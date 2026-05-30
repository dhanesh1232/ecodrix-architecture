# ECODrIx — Architecture Documentation

> **AI-Native Business Operating System for Indian SMBs.** Two acquisition channels, one platform.
> WhatsApp CRM · AI Agent · Lead Intelligence · Invoicing · Visual Workflows · Embeddable SDKs.

This folder is the source of truth for the platform's architecture. Every doc is plain markdown,
designed to be fed directly into Kiro or read by an engineer joining the project.

## Read in this order

| #   | File                            | Read when                                                                                      |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| —   | `KIRO_AGENT_PROMPT.md`          | You're starting a new feature with an AI agent — paste this as system context.                 |
| 00  | `prd/00-ARCHITECTURE-BRIEF.md`  | You need a 1-page mental model: stack, channels, AI tiers, moats.                              |
| 01  | `prd/01-PRD.md`                 | You need to know what the product does and for whom.                                           |
| 02  | `prd/02-TRD.md`                 | You're making infra decisions — services, queues, observability, deploys.                      |
| 03  | `prd/03-UIUX-BRIEF.md`          | You're building or reviewing any frontend screen.                                              |
| 04  | `prd/04-APP-FLOW.md`            | You need the end-to-end user journeys (signup, onboarding, plan upgrade, embed).               |
| 05  | `prd/05-SCHEMA.md`              | You're writing migrations or queries — reference the `ecodrix_*` / `erix_*` / `laie_*` tables. |
| 06  | `prd/06-ROADMAP.md`             | You're planning a sprint — every line maps to a real spec.                                     |
| 07  | `prd/07-VISUAL-ARCHITECTURE.md` | You need text diagrams of request flow, adapter pattern, sync engine, entitlement gate.        |
| 08  | `prd/08-DEVELOPMENT-GUIDE.md`   | You're cloning the repo, running migrations, starting services.                                |
| —   | `IMPLEMENTATION_DETAILS.md`     | You're writing code — middleware patterns, adapter usage, EventBus, encryption.                |
| —   | `modules.md`                    | You need a working index of every module with status, owner, and related spec.                 |

## Platform at a glance

| Dimension              | Value                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Target market          | Indian micro / small businesses (1–50 employees)                                                          |
| Verticals served       | Clinics, real estate, ed-tech, services, D2C, agencies                                                    |
| Primary channel        | WhatsApp (Meta Cloud API)                                                                                 |
| Acquisition channels   | `freelance` (managed via `ECOD/admin`) and `direct` (self-serve via `ECOD/saas`)                          |
| Pricing tiers          | `free` · `starter` · `growth` · `scale` · `enterprise` (+ 8 add-ons)                                      |
| Data modes             | `platform` (our Postgres) · `own` (tenant DB) · `both` (dual-write + sync)                                |
| AI provider            | Gemini 2.0 Flash (Vertex AI) for inbox + automation; Claude Sonnet 4.5 (Vertex AI) for LAIE outreach kits |
| Cache · queue · pubsub | ErixStore (port 6399) — replaces Redis + BullMQ                                                           |

## Where the code lives

```
ECOD/
├── saas/                    Direct self-serve console (Next.js 15)
├── admin/                   Freelance / agency panel (Next.js)
├── server/                  API + workers (Express + Hono, TypeScript)
├── erix-store/              In-memory engine (cache, queue, locks, pubsub)
├── packages/
│   ├── erix-api/            TS SDK (@ecodrix/erix-api)
│   ├── erix-react/          Embeddable React SDK (@ecodrix/erix-react)
│   ├── erix/                Internal CRM types
│   └── chatbot/             Embeddable chat widget
├── laie/                    LAIE actor runners (lead-gen)
└── .Architecture/           These docs
```

## What just shipped (May 30, 2026)

- **Unified pricing & entitlements** — 5 plans + 8 add-ons, atomic usage metering, subscription lifecycle worker. Spec: `saas/.kiro/specs/platform-pricing-entitlements/`.
- **Visual workflow automation builder** — React Flow front-end plus a Postgres execution engine wired into EventBus. Spec: `saas/.kiro/specs/visual-automation-builder/`.
- **Schema reorganisation** — `ecodrix_*` (platform), `erix_*` (CRM), `laie_*` (lead-gen) split into per-table modules under `server/src/shared/db/schema/`. Single `drizzle.config.ts` covers all three.
- **AI auto-respond on Gemini 2.0 Flash** — `services/saas/ai/auto-responder.ts`, with semantic cache and confidence thresholding.
- **Editor pro features** — SDK-only, plan-gated. Spec: `saas/.kiro/specs/editor-pro-features/` (in `erix-react`).

## What is in flight

- **Platform Completion (End-to-End)** — multi-source DB layer (`platform/own/both`), service migration from `getCrmModels` (Mongoose) to `getErixAdapter`, public registration, admin → Postgres bridge, full settings + infra dashboards. Spec: `saas/.kiro/specs/platform-completion-end-to-end/`.

## Conventions

- Plan slugs are `free`, `starter`, `growth`, `scale`, `enterprise`. Old slugs (`erix_starter`, `laie_starter`, `ecodrix_pro`, `ecodrix_growth`) are retired.
- Tables follow the prefix scheme `ecodrix_*` (platform), `erix_*` (CRM), `laie_*` (lead-gen).
- Every CRM query passes through the `ErixAdapter` (`server/src/lib/erix-adapter/`). Frontend never calls the DB or `fetch` directly — it goes through `@ecodrix/erix-api`.
- The single tenant boundary is `req.org.id`, attached by `middleware/tenantResolver.ts` (rolling out as part of platform-completion).

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-pricing-entitlements/`, `saas/.kiro/specs/platform-completion-end-to-end/`.
