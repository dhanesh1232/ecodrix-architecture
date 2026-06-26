# SaaS App Flow — `saas/` (customer product)

> Route tree, user journeys, and endpoint mapping for the customer-facing app.
> Filesystem routing: `src/app/`. A workspace is `/{slug}/…`.
> Server comms via `@ecodrix/erix-api` (tenant creds from session) + same-origin
> Next API proxies.

## Top-level route groups

```
src/app/
├─ (auth)/auth/…            unauthenticated identity flows
├─ (portal)/portal/…        client portal (own JWT)
├─ [slug]/                  the workspace (authenticated)
│   ├─ onboarding/          adaptive onboarding
│   ├─ (product)/product/…  erix · laie · flow
│   ├─ (infra)/infra/…      connect · storage · store
│   └─ manage/…             billing · credits · usage · support · settings
└─ api/…                    first-party + proxy routes
```

---

## 1. Auth & entry (`(auth)/auth/*`)

| Route                                           | Purpose                         | Calls                                     |
| ----------------------------------------------- | ------------------------------- | ----------------------------------------- |
| `/auth/login`                                   | email/password + Google         | NextAuth `signIn`; `POST /api/auth/login` |
| `/auth/signup`                                  | create account + org            | `POST /api/auth/register`                 |
| `/auth/google`, `/auth/success`                 | OAuth start/return              | `/api/auth/google`, `/api/auth/callback`  |
| `/auth/forgot-password`, `/auth/reset-password` | recovery                        | `POST /api/auth/*`                        |
| `/auth/verify-email`                            | email verification              | `GET/POST /api/auth/verify-email`         |
| `/auth/claim-org`                               | join an existing org via invite | `POST /api/members/*`                     |

**Flow:** signup → org created (`ecodrix_organizations` row + `clientCode` + `apiKey`)
→ session carries `tenant` creds → redirect to `/{slug}/onboarding`.

---

## 2. Onboarding (`[slug]/onboarding`, `legacy-onboarding`)

Adaptive, persona-driven onboarding.

| Step                                | Calls                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| Resolve session config / experiment | `GET /api/onboarding/*`, persona/onboarding services                         |
| Pick product + niche pack           | `GET /api/admin/onboarding/*` (niche packs), `GET /api/products/:id/details` |
| Provision workspace                 | `POST /api/onboarding/*` → seeds pipelines/fields per niche pack             |
| Persona bootstrap                   | `/api/persona/:productId/*`                                                  |

**Exit:** lands on the chosen product overview (`/{slug}/product/erix` by default).

---

## 3. Product → ERIX CRM (`[slug]/(product)/product/erix/*`)

The core CRM/automation surface. Server: `/api/crm` (composed router) + `/api/saas/*`.

| Route                  | Purpose                        | Calls                                                                  |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `…/erix` (overview)    | KPIs, recent activity          | `GET /api/crm/analytics`, `/api/saas/events`                           |
| `…/erix/pipeline`      | kanban pipelines & stages      | `/api/crm/pipeline`, `/api/crm/pipeline/:id/stages`                    |
| `…/erix/contacts`      | leads list + profile           | `/api/crm/lead`, `/api/crm/lead-profile/:id`                           |
| `…/erix/inbox`         | unified conversations          | `/api/saas/chat`, `/api/saas/social`, `/api/saas/portal-inbox`         |
| `…/erix/broadcasts`    | WhatsApp/email broadcasts      | `/api/saas/whatsapp`, `/api/saas/marketing`                            |
| `…/erix/templates`     | message/email templates        | `/api/saas/whatsapp` (templates), `/api/saas/email`                    |
| `…/erix/automation`    | rules & workflows              | `/api/crm/automation*`, `/api/saas/workflows`                          |
| `…/erix/invoices`      | invoices & payments            | `/api/saas/invoices`, `/api/saas/invoice-settings`, `/api/v1/checkout` |
| `…/erix/projects`      | project mgmt + portal          | `/api/saas/projects`, `/api/crm/project`                               |
| `…/erix/custom-config` | custom fields / views / events | `/api/crm/custom-field`, `/api/crm/crm-view`, `/api/crm/custom-event`  |
| `…/erix/settings`      | product-scoped settings        | `/api/settings/*`, `/api/saas/ai`                                      |

**Key journeys**

- _Lead → deal → invoice:_ create lead → drag through pipeline → generate invoice → checkout pays → payment webhook (`/webhooks/razorpay`) marks paid → automation fires.
- _Automation:_ trigger (event/segment/schedule) → rule executor → action (email/whatsapp/webhook/task) via `/api/saas/workflows` + worker handlers.

---

## 4. Product → LAIE (`[slug]/(product)/product/laie/*`)

Lead-generation platform. Server: `/api/laie/v1/*` (gate: `x-laie-key`).
Proxy: `app/api/laie/v1/[...path]`.

| Route                                                        | Purpose                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| `overview`                                                   | run/usage summary                                             |
| `leads`, `datasets`, `batches`                               | discovered leads, saved datasets, batch jobs                  |
| `runs`, `schedules`                                          | scraper runs + scheduled jobs (`POST /api/laie/session/jobs`) |
| `campaigns`, `outreach`                                      | outreach sequencing                                           |
| `analytics`, `intelligence`, `usage`                         | metrics, enrichment, metering                                 |
| `validation`, `compliance`, `dataops`                        | data quality + governance                                     |
| `proxy`, `capabilities`, `templates`, `webhooks`, `settings` | infra & config                                                |

---

## 5. Product → Flow (`[slug]/(product)/product/flow/*`)

No-code orchestration. Server: `/api/flow/v1/*`. Proxy: `app/api/flow/v1/[...path]`.

| Route                      | Purpose                         |
| -------------------------- | ------------------------------- |
| `flow` (list), `flow/[id]` | workflow graphs (canvas editor) |
| `flow/templates`           | starter templates               |

> **Boundary:** Flow integrates with ERIX only via the SDK — never imports
> `@erix/*` internals.

---

## 6. Infra (`[slug]/(infra)/infra/*`)

| Area        | Routes                                          | Calls                                                                                                        |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Connect** | `connect/[providerId]`                          | `/api/connect/v1/*` (proxy `app/api/connect/v1/[...path]`); OAuth + webhooks `/webhooks/{meta,telegram,ses}` |
| **Storage** | `storage/{overview,usage,folders,api-key,docs}` | `/api/saas/storage`, `/api/saas/images`                                                                      |
| **Store**   | `store/{console,keys,slowlog,usage,api-key}`    | erix-store via server; usage from `store_usage_events`                                                       |

---

## 7. Manage (`[slug]/manage/*`)

Account, billing, and configuration. Server: `/api/platform/*` + `/api/settings/*`.

| Route                                                  | Purpose                                            | Calls                                                   |
| ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| `manage/billing`                                       | plan + subscription                                | `GET /api/platform/subscription`, `/api/platform/plans` |
| `manage/billing/upgrade`                               | change plan                                        | `POST /api/platform/checkout` (Razorpay)                |
| `manage/billing/addons`                                | add-ons                                            | `/api/platform/entitlements`                            |
| `manage/credits`                                       | wallet: balance, packs, top-up, auto-topup, ledger | `GET/POST /api/platform/credits/*`                      |
| `manage/usage`                                         | metered usage                                      | `/api/platform/billing`, usage meter                    |
| `manage/support`                                       | tickets                                            | `/api/platform/support`                                 |
| `manage/settings/account/{profile,security}`           | user account                                       | `GET /api/me`, `/api/account/password`, `/api/sessions` |
| `manage/settings/workspace/{organization,team,fields}` | org/members/fields                                 | `/api/members`, `/api/fields`, `/api/me` (org)          |
| `manage/settings/developer/{data-source,storage}`      | API keys, data export                              | `/api/api-key`, `/api/data-export`, `/api/console`      |
| `manage/settings/persona/{confidence,timeline}`        | AI persona                                         | `/api/persona/:productId/*`                             |

**Quota-hit flow (global):** any product call returning `402 INSUFFICIENT_CREDITS`
surfaces a toast → **"Buy credits"** CTA → `/{slug}/manage/credits`.

---

## 8. First-party & proxy API routes (`src/app/api/*`)

- **Proxies (catch-all):** `connect/v1/[...path]`, `flow/v1/[...path]`,
  `laie/v1/[...path]`, `portal/v1/[...path]`, `admin/clients/[[...path]]`.
- **First-party:** `auth/[...nextauth]`, `sessions`, `account/password`,
  `store/*`, `billing`, `marketing`, `whatsapp`, `analytics`, `support`, `user`.
- Server-side SDK calls go through `src/lib/api/external.ts` (`erix` proxy);
  same-origin calls through `src/lib/api/internal.ts`.

---

## 9. Gaps / cleanup (SaaS)

- CRM surface is split across `/api/crm` and many `/api/saas/*` routers — the
  frontend should hide this behind one typed client module per product.
- `legacy-onboarding` should be retired once adaptive onboarding is the default.
- Confirm every `manage/*` page has empty/error/quota states wired (credits page
  has the 402 CTA; replicate for usage/billing).
