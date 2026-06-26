# Admin App Flow — `admin/` (control panel)

> Route tree, operator journeys, and endpoint mapping for the internal control
> plane. Filesystem routing: `src/app/`. All backend calls go through the
> catch-all proxy `app/api/admin/[...path]/route.ts` →
> `${CORE_API_URL}/api/admin/*` (injects `x-core-api-key` + forwarded staff
> identity). Gate on the server: `requirePlatformAdmin()`.

## Top-level route groups

```
src/app/
├─ auth/{login,register,error}      operator sign-in (own cookie namespace)
├─ admin/…                          platform control plane (new convention)
├─ saas/…                           tenant ops + monetization + onboarding
├─ services/…                       legacy agency (blogs/clients/leads/waitlist)
├─ templates/{email,whatsapp}       message template management
└─ api/admin/[...path]              proxy to server /api/admin/*
```

---

## 1. Operator auth (`auth/*`)

| Route            | Purpose                 | Calls                                             |
| ---------------- | ----------------------- | ------------------------------------------------- |
| `/auth/login`    | staff sign-in           | NextAuth (admin cookie); server `/api/admin/auth` |
| `/auth/register` | provision staff (gated) | `/api/admin/auth`                                 |
| `/auth/error`    | auth failure            | —                                                 |

Roles: `superadmin`, `admin` (full), `staff` (rejected by `requirePlatformAdmin`
for platform routes). Forwarded as `x-admin-staff-role`.

---

## 2. Platform control (`admin/*`)

| Route                                 | Purpose                                                                  | Calls (`/api/admin/*`)                                    |
| ------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `admin/tenants`, `admin/tenants/[id]` | tenant list + deep view (org, members, usage, **Wallet** tab, suspend)   | `tenants/*` (`tenants-deep`), `credits/*` (wallet adjust) |
| `admin/plans`, `admin/plans/[id]`     | plan catalog + **credit-overage editor** (`{limit, overage, creditKey}`) | `plans/*` (`plans-admin`)                                 |
| `admin/credits`                       | credit-pack CRUD + rate card                                             | `credits/*`                                               |
| `admin/billing`                       | invoices, transactions, disputes                                         | `billing/*`                                               |
| `admin/revenue`                       | MRR/ARR, revenue analytics                                               | `revenue/*`                                               |
| `admin/payments`                      | payment ops, reconciliation                                              | `payments/*` (`payment-ops`)                              |
| `admin/analytics`                     | API usage analytics                                                      | `analytics/*` (`api-analytics`)                           |
| `admin/health`                        | service health                                                           | `health/*`                                                |
| `admin/logs`, `admin/audit`           | activity + audit logs                                                    | `logs/*`, `audit/*`                                       |
| `admin/flags`                         | feature flags                                                            | `flags/*`                                                 |
| `admin/flow`                          | flow run monitor                                                         | `flow/*` (`flow-monitor`)                                 |
| `admin/email`                         | email monitor (deliverability)                                           | `email/*` (`email-monitor`)                               |
| `admin/comms`                         | announcements/broadcasts to tenants                                      | `comms/*` (`announcements`)                               |
| `admin/compliance`                    | compliance ops                                                           | `compliance/*`                                            |
| `admin/tickets`                       | support ticket queue                                                     | `tickets/*`                                               |
| `admin/waitlist`                      | pre-launch waitlist                                                      | `waitlist/*`                                              |
| `admin/partners`                      | partner/agency mgmt                                                      | `partners/*`                                              |
| `admin/pipelines`                     | pipeline templates (from DB)                                             | `pipelines/*`                                             |
| `admin/storage`                       | storage ops                                                              | `storage/*`                                               |
| `admin/templates`                     | template control                                                         | `templates/*` (`templates-admin`)                         |
| `admin/agents`                        | AI agent config                                                          | `agents/*`                                                |
| `admin/laie`                          | LAIE control plane                                                       | `laie/*` (`laie-control`)                                 |
| `admin/whatsapp`                      | WhatsApp control                                                         | `whatsapp/*` (`whatsapp-control`)                         |
| `admin/relays`                        | relay fabric                                                             | (relay control)                                           |
| `admin/persona-history`               | persona audit trail                                                      | `persona-history/*`                                       |

**Key operator journeys**

- _Onboard/adjust a tenant:_ `admin/tenants/[id]` → Wallet tab → grant/deduct
  credits (`POST /api/admin/credits/tenants/:id/adjust`) → suspend/reactivate.
- _Launch a plan:_ `admin/plans/[id]` → set tier limits + credit-overage config →
  publish → SaaS `manage/billing/upgrade` reflects it; Razorpay plan sync.
- _Sell credits:_ `admin/credits` → create/edit pack → SaaS `manage/credits` lists it.

---

## 3. Tenant ops & monetization (`saas/*`)

| Route                                                  | Purpose                      | Calls                                               |
| ------------------------------------------------------ | ---------------------------- | --------------------------------------------------- |
| `saas/leads`, `saas/leads/[id]`, `saas/leads/pipeline` | cross-tenant lead ops        | `/api/admin/*`, legacy `/api/leads`                 |
| `saas/monetization/invoices`                           | agency invoices              | `/api/admin/billing`, legacy `/api/agency-invoices` |
| `saas/onboarding/funnel`                               | onboarding funnel analytics  | onboarding/analytics                                |
| `saas/onboarding/niche-packs`                          | niche-pack CRUD              | `/api/admin/onboarding/*`                           |
| `saas/laie/relays`, `saas/laie/vault`                  | LAIE relays + business vault | `/api/admin/laie`, legacy `/api/laie-vault`         |
| `saas/cors`                                            | CORS allowlist               | `/api/admin/cors`                                   |

---

## 4. Legacy agency (`services/*`)

Predates the `/api/admin/*` convention; still on bare `/api/*`.

| Route                                               | Calls (legacy)                                             |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `services/blogs`                                    | `/api/blogs`                                               |
| `services/clients`, `services/clients/[clientCode]` | `/api/clients` (+ admin integrations `/api/admin/clients`) |
| `services/leads`                                    | `/api/leads`                                               |
| `services/waitlist`, `services/contact`             | `/api/waitlist`, dashboard                                 |

---

## 5. Templates (`templates/*`)

| Route                | Purpose            | Calls                                         |
| -------------------- | ------------------ | --------------------------------------------- |
| `templates/email`    | email templates    | `/api/admin/templates`, `/api/admin/email`    |
| `templates/whatsapp` | WhatsApp templates | `/api/admin/templates`, `/api/admin/whatsapp` |

---

## 6. Gaps / cleanup (Admin)

- **Legacy bare-`/api` routes** (`blogs`, `leads`, `clients`, `dashboard`,
  `agency-invoices`, `auth`, `laie-vault`) predate `/api/admin/*`. Migrate the
  `services/*` pages onto `/api/admin/*` and retire the bare routes.
- Ensure every `admin/*` mutation writes an **audit row** (`req.adminStaff`
  actor) — surface in `admin/audit`.
- `admin/relays` needs its server control surface confirmed/wired.
- Standardize a single admin table/detail shell (filters, pagination, CSV export)
  so all list pages share UX.
