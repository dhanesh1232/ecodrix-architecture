# 06 — Implementation Roadmap

> Five phases, each anchored to a real spec under `saas/.kiro/specs/`. Each line item is either
> ✅ shipped, 🟡 in flight, or ⬜ planned. Status reflects May 30, 2026.

## How this roadmap works

- Each phase ends with something deployable and revenue-relevant.
- Each item maps to a spec where one exists. New items land in new specs; we don't ship code without a spec.
- Plan slugs are canonical: `free` / `starter` / `growth` / `scale` / `enterprise`. Old slugs are gone.

## Phase 1 — Foundation (DONE)

Goal: pricing + entitlements live, schemas reorganized, AI auto-respond on Gemini, visual workflow
builder shipped. Channel onboarding works enough to start direct signups.

| #    | Item                                                                                               | Status | Spec                             |
| ---- | -------------------------------------------------------------------------------------------------- | :----: | -------------------------------- |
| 1.1  | Three-family Postgres schema (`ecodrix_*`, `erix_*`, `laie_*`) under one Drizzle config            |   ✅   | `postgresql-migration/`          |
| 1.2  | Plan + add-on catalog, atomic usage meter, entitlement service                                     |   ✅   | `platform-pricing-entitlements/` |
| 1.3  | Subscription lifecycle worker (free signup, upgrade, downgrade-on-period-end, past_due grace)      |   ✅   | `platform-pricing-entitlements/` |
| 1.4  | AI auto-respond on Gemini 2.0 Flash (Vertex AI) with semantic cache + confidence threshold         |   ✅   | `ai-auto-respond/`               |
| 1.5  | Visual Automation Builder (React Flow + Postgres engine + EventBus + per-execution log)            |   ✅   | `visual-automation-builder/`     |
| 1.6  | Console dashboard redesign (cloud-console pattern)                                                 |   ✅   | `console-dashboard-redesign/`    |
| 1.7  | Editor pro features in `@ecodrix/erix-react` (collab, comments, versions, exports) — gated by plan |   🟡   | `editor-pro-features/`           |
| 1.8  | Invoice module (builder + PDF + Razorpay link + WhatsApp delivery + paid webhook)                  |   ✅   | `invoice-module/`                |
| 1.9  | ERIX CRM frontend (inbox, contacts, pipeline, templates, broadcasts, segments)                     |   ✅   | `erix-crm-module/`               |
| 1.10 | LAIE audit UI (search → progress → result card → push to ERIX)                                     |   🟡   | `laie-audit-ui/`                 |

## Phase 2 — Differentiate (mostly DONE; completion in flight)

Goal: every metered route is gated, both acquisition channels create the same `ecodrix_organizations`
row, public registration works end-to-end, full settings + infra dashboards.

| #    | Item                                                                                                        | Status | Spec                              |
| ---- | ----------------------------------------------------------------------------------------------------------- | :----: | --------------------------------- |
| 2.1  | `ErixAdapter` interface + `PostgresAdapter` + `MongoAdapter` (legacy bridge) + `DualAdapter` + factory      |   🟡   | `platform-completion-end-to-end/` |
| 2.2  | `tenantResolver` middleware reading from `ecodrix_organizations`; `saasAuth` rewritten on top               |   🟡   | `platform-completion-end-to-end/` |
| 2.3  | Public `POST /api/auth/register` for direct signups                                                         |   ⬜   | `platform-completion-end-to-end/` |
| 2.4  | Admin onboarding bridge: `POST /api/admin/clients` writes both Mongo `Client` and `ecodrix_organizations`   |   ⬜   | `platform-completion-end-to-end/` |
| 2.5  | Mongo Atlas provisioner — admin "Provision MongoDB" button, encrypted URI storage, BYO URI fallback         |   ⬜   | `platform-completion-end-to-end/` |
| 2.6  | Backfill script for existing freelance Clients → `ecodrix_organizations`                                    |   ⬜   | `platform-completion-end-to-end/` |
| 2.7  | Quota enforcement on every metered route (WA send, AI calls, PDF export, broadcasts, workflow runs, audits) |   🟡   | `platform-completion-end-to-end/` |
| 2.8  | Boolean feature gates (broadcasts, webhooks, custom branding, white-label, priority support)                |   🟡   | `platform-completion-end-to-end/` |
| 2.9  | `/settings/{profile,team,security,developer,data-source,fields}` in saas                                    |   ⬜   | `platform-completion-end-to-end/` |
| 2.10 | `/infra/{dashboard,queues,cache,pubsub}` in saas                                                            |   ⬜   | `platform-completion-end-to-end/` |
| 2.11 | Onboarding wizard (`/onboarding`) for both channels                                                         |   ⬜   | `platform-completion-end-to-end/` |
| 2.12 | Forgot password flow (`/auth/forgot` + `/auth/reset` + `ecodrix_password_resets`)                           |   🟡   | `platform-completion-end-to-end/` |
| 2.13 | Sync engine for `data_mode="both"` (ErixStore `erix-sync` queue + worker + divergence alerts)               |   ⬜   | `platform-completion-end-to-end/` |
| 2.14 | E2E smoke tests: direct signup, freelance onboarding, mode switch                                           |   ⬜   | `platform-completion-end-to-end/` |

## Phase 3 — Power (in flight, immediately after Phase 2)

Goal: dynamic field builder, embeddable SDK developer experience, AI inbox suggestions, additional
multi-channel inbox.

| #   | Item                                                                                                             | Status | Spec                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------- | :----: | ------------------------------------------------------------- |
| 3.1 | Dynamic CRM field builder (`erix_field_configs` + UI at `/settings/fields`)                                      |   ⬜   | `platform-completion-end-to-end/` (Req 26)                    |
| 3.2 | Webhook engine (`erix_webhooks` table + delivery worker with HMAC + retry + DLQ)                                 |   ⬜   | new spec planned                                              |
| 3.3 | Developer page polish (`/settings/developer` — keys, origins, embed install snippets)                            |   ⬜   | `platform-completion-end-to-end/`                             |
| 3.4 | Multi-channel inbox v1 — Instagram DMs (Meta Business API), email inbound (SES → webhook)                        |   ⬜   | new spec planned                                              |
| 3.5 | LAIE batch audit UI + scheduled enrichment workflows                                                             |   ⬜   | `laie-audit-ui/` extension                                    |
| 3.6 | Cloud Storage frontend (file explorer, signed URLs UI, transform tester)                                         |   ⬜   | spec under `platform-pricing-entitlements/` (Req 8) extension |
| 3.7 | `@ecodrix/erix-react` editor pro features ship complete (collab, comments, versions, mentions, AI menu, exports) |   🟡   | `editor-pro-features/`                                        |

## Phase 4 — AI Moat (months 4–6)

Goal: AI tiers "Learns" and "Predicts" come online. Adaptive cadence, predictive forecasting,
morning briefings, lead score reactivity.

| #   | Item                                                                               | Status | Spec             |
| --- | ---------------------------------------------------------------------------------- | :----: | ---------------- |
| 4.1 | AI lead qualification flow (multi-turn conversation → score → route)               |   ⬜   | new spec planned |
| 4.2 | Adaptive cadence per industry (best send time, template retirement, scoring drift) |   ⬜   | new spec planned |
| 4.3 | Predictive pipeline forecast (revenue + at-risk deals + optimal contact time)      |   ⬜   | new spec planned |
| 4.4 | AI-generated follow-ups + template suggestions (Tier "Creates")                    |   ⬜   | new spec planned |
| 4.5 | Daily AI briefing (Tier "Coaches", part 1)                                         |   ⬜   | new spec planned |
| 4.6 | Reactive scoring on stage moves + activity (more granular than today's snapshot)   |   ⬜   | new spec planned |

## Phase 5 — Platform / Network (months 6–12)

Goal: white-label, plugin API, marketplace, conversational commerce, voice AI, mobile PWA.

| #   | Item                                                                                        | Status | Spec             |
| --- | ------------------------------------------------------------------------------------------- | :----: | ---------------- |
| 5.1 | Agency white-label mode — sub-org hierarchy via `agency_id`, brand config, custom domain    |   🟡   | new spec planned |
| 5.2 | Plugin API + marketplace — third-party extensions sandboxed                                 |   ⬜   | new spec planned |
| 5.3 | Conversational commerce — WhatsApp catalog, cart, order status via `erix_conversations`     |   ⬜   | new spec planned |
| 5.4 | Voice AI v1 — Exotel inbound + ElevenLabs TTS + transcript → activity timeline              |   ⬜   | new spec planned |
| 5.5 | Mobile PWA — offline queue (ErixStore), GPS check-in, business card OCR                     |   ⬜   | new spec planned |
| 5.6 | Vertical-specific personas — clinic / real estate / ed-tech / services starter packs        |   ⬜   | new spec planned |
| 5.7 | Pre-built workflow + outreach template marketplace (UGC + curated)                          |   ⬜   | new spec planned |
| 5.8 | Sales coaching (Tier "Coaches" full) — weekly performance digest with concrete improvements |   ⬜   | new spec planned |

## Spec → Phase Map (reverse lookup)

| Spec                              | Phases it spans                         |
| --------------------------------- | --------------------------------------- |
| `postgresql-migration/`           | Phase 1                                 |
| `platform-pricing-entitlements/`  | Phase 1 (+ Cloud Storage UI in Phase 3) |
| `console-dashboard-redesign/`     | Phase 1                                 |
| `erix-crm-module/`                | Phase 1                                 |
| `invoice-module/`                 | Phase 1                                 |
| `ai-auto-respond/`                | Phase 1                                 |
| `visual-automation-builder/`      | Phase 1                                 |
| `editor-pro-features/`            | Phase 1–3                               |
| `laie-audit-ui/`                  | Phase 1–3                               |
| `platform-completion-end-to-end/` | Phase 2 (+ touches Phase 3 surfaces)    |

## Risk Register

| Risk                                | Impact        | Mitigation                                                                          |
| ----------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Solo or small team velocity         | High          | Per-service feature flags; spec-first to keep shippable atoms                       |
| Vertex AI quota / cost spike        | Medium        | Semantic cache + per-org `editor.aiCalls` quota + cheaper models for classification |
| Mongo Atlas provisioning rate limit | Medium        | Queue provisioning; allow BYO URI fallback                                          |
| `data_mode="both"` divergence       | Medium        | Postgres canonical; divergence alerts; "rebuild from platform" admin tool           |
| Meta WhatsApp policy change         | High          | Adapter pattern at WA layer too; keep templates approved across categories          |
| ErixStore single instance           | High (latent) | WAL + snapshot replay; horizontal sharding planned for Year 2                       |

## Sprint Cadence

Two-week sprints. Phase 2 expected to wrap in ~3 sprints (6 weeks) once committed. Phase 3 stretches
4–6 sprints. Phases 4–5 are quarter-scale.

| Sprint           | Focus                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Current (May 30) | Platform completion: adapters, tenantResolver, public registration, settings + infra UI |
| Next             | Onboarding wizard + smoke tests + bring quota enforcement to 100% coverage              |
| +1               | Dynamic field builder + webhook engine MVP                                              |
| +2               | Multi-channel inbox v1 (Instagram DMs)                                                  |
| +3               | LAIE batch audits + scheduled enrichment                                                |
| +4               | AI Tier "Learns" foundations (adaptive cadence + scoring drift)                         |

## Success Gates Per Phase

| Phase | Gate to consider it "done"                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| 1     | Direct signup → first lead works on platform Postgres; pricing live; visual workflow runs                  |
| 2     | Both channels produce identical orgs; every metered route gated; smoke tests green                         |
| 3     | Three custom field types work end-to-end; webhook delivery succeeds 99%+; Instagram inbox merges into ERIX |
| 4     | At least two AI Tier-2/3 features in production with measurable lift                                       |
| 5     | At least one paying agency on white-label; PWA shell shipped; voice AI POC handles 100 calls               |

## Assumptions

- Direct signup conversion (visit → signup) ≥ 5% in first 60 days of public launch.
- Freelance ARPU stays > 2× direct ARPU through Year 1.
- Vertex AI pricing for Gemini 2.0 Flash remains within budget.
- We can hire one frontend engineer by Phase 3 to keep velocity.
- Our customers will tolerate a 3–5 day backfill window when migrating freelance accounts to Postgres.

Last updated: 2026-05-30 · Cross-references: every spec under `saas/.kiro/specs/`.
