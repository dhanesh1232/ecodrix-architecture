# Implementation Structure — target route trees, nav IA, build order

> The "structured version" to implement. Codifies the canonical route trees,
> navigation information architecture, the per-product client layer, and the
> sequenced build order to close the gaps in 01/02.

---

## 1. SaaS route tree (canonical)

```
src/app/
├─ (auth)/auth/{login,signup,forgot-password,reset-password,verify-email,
│                google,success,claim-org}
├─ (portal)/portal/…                         # client portal, own JWT
├─ [slug]/
│   ├─ layout.tsx                             # workspace shell: sidebar + topbar + product switcher
│   ├─ onboarding/                            # adaptive (retire legacy-onboarding)
│   ├─ (product)/product/
│   │   ├─ erix/{overview,pipeline,contacts,inbox,broadcasts,templates,
│   │   │        automation,invoices,projects,custom-config,settings}
│   │   ├─ laie/{overview,leads,datasets,batches,runs,schedules,campaigns,
│   │   │        outreach,analytics,intelligence,usage,validation,compliance,
│   │   │        dataops,proxy,capabilities,templates,webhooks,settings}
│   │   └─ flow/{(list),[id],templates}
│   ├─ (infra)/infra/
│   │   ├─ connect/[providerId]
│   │   ├─ storage/{overview,usage,folders,api-key,docs}
│   │   └─ store/{console,keys,slowlog,usage,api-key}
│   └─ manage/
│       ├─ billing/{(plan),upgrade,addons}
│       ├─ credits/  usage/  support/
│       └─ settings/
│           ├─ account/{profile,security}
│           ├─ workspace/{organization,team,fields}
│           ├─ developer/{data-source,storage}
│           └─ persona/{confidence,timeline}
└─ api/
    ├─ (proxy) connect/v1/[...path], flow/v1/[...path], laie/v1/[...path],
    │          portal/v1/[...path], admin/clients/[[...path]]
    └─ (first-party) auth/[...nextauth], sessions, account/password,
                     store/*, billing, marketing, whatsapp, analytics, support, user
```

### SaaS navigation IA (sidebar)

```
Workspace ▸ {slug}
  Products
    ERIX   → /product/erix         (Overview·Pipeline·Contacts·Inbox·Broadcasts·
                                     Templates·Automation·Invoices·Projects·Config·Settings)
    LAIE   → /product/laie
    Flow   → /product/flow
  Infra
    Connect · Storage · Store
  Manage
    Billing · Credits · Usage · Support · Settings
```

---

## 2. Admin route tree (canonical)

```
src/app/
├─ auth/{login,register,error}
├─ admin/
│   ├─ layout.tsx                             # control-plane shell: nav groups below
│   ├─ (dashboard)/                           # landing: revenue + health + ticket KPIs
│   ├─ tenants/{(list),[id]}                  # [id]: Org·Members·Usage·Wallet·Plan·Suspend
│   ├─ plans/{(list),[id]}                    # [id]: limits + credit-overage editor
│   ├─ credits/  billing/  revenue/  payments/
│   ├─ analytics/  health/  logs/  audit/  flags/
│   ├─ flow/  email/  comms/  compliance/  tickets/  waitlist/
│   ├─ partners/  pipelines/  storage/  templates/  agents/
│   └─ laie/  whatsapp/  relays/  persona-history/
├─ saas/{leads,monetization/invoices,onboarding/{funnel,niche-packs},
│        laie/{relays,vault},cors}
├─ services/{blogs,clients/[clientCode],leads,waitlist,contact}   # legacy → migrate
├─ templates/{email,whatsapp}
└─ api/admin/[...path]                         # proxy (core-key + staff identity)
```

### Admin navigation IA (grouped)

```
Overview
Tenants ▸ Tenants · Plans · Credits · Partners · Onboarding
Money   ▸ Revenue · Billing · Payments
Product ▸ Pipelines · Templates · Agents · LAIE · WhatsApp · Flow · Relays
Ops     ▸ Health · Analytics · Logs · Audit · Flags · Email · Storage
Support ▸ Tickets · Comms · Compliance · Waitlist
Legacy  ▸ Services (blogs/clients/leads)
```

---

## 3. Per-product client layer (SaaS)

Hide the split backend (`/api/crm` + `/api/saas/*`) behind one typed module per
product so pages never hand-build URLs.

```
src/lib/products/
├─ erix.client.ts     # leads, pipelines, projects, automation, invoices, inbox, templates
├─ laie.client.ts     # → /api/laie/v1/*   (proxy)
├─ flow.client.ts     # → /api/flow/v1/*   (proxy)
├─ infra.client.ts    # connect / storage / store
└─ platform.client.ts # me, members, plans, subscription, credits, support, usage
```

- Server components: use `src/lib/api/external.ts` `erix` proxy (tenant creds from session).
- Client components: call same-origin first-party/proxy routes (`src/lib/api/internal.ts`).
- One shared `QueryProvider` handles the global `402 INSUFFICIENT_CREDITS` →
  "Buy credits" → `/{slug}/manage/credits`.

---

## 4. Shared shells

- **SaaS workspace shell** (`[slug]/layout.tsx`): product switcher, slug-aware
  nav, plan/credit badge, suspended-org banner.
- **Admin shell** (`admin/layout.tsx`): grouped nav, global tenant search,
  staff-role-aware visibility, audit-actor stamping on every mutation.
- **Admin list/detail primitives**: one `<DataTable>` (filters, pagination,
  CSV export) + one `<DetailShell>` (tabs) reused by every list/detail page.

---

## 5. Build order (close the gaps)

> One app at a time; build the server one-at-a-time with
> `NODE_OPTIONS=--max-old-space-size=6144` to avoid OOM. Verify `tsc` + tests + build per app.

1. **Foundations**
   - SaaS: typed per-product client layer (§3) + workspace shell.
   - Admin: shared `<DataTable>` / `<DetailShell>` + grouped nav shell.
2. **Money path (highest value)**
   - SaaS `manage/{billing,credits,usage}` complete with empty/error/quota states.
   - Admin `plans/[id]` credit-overage editor, `credits` pack CRUD, `tenants/[id]` Wallet tab.
   - Reconcile plan seed vs `SDK_PLATFORM_REDESIGN.md §8` pricing (decision pending — do not seed money tables unprompted).
3. **Core product (ERIX)**
   - Wire every `product/erix/*` page to the client layer; confirm lead→deal→invoice→paid journey end-to-end (incl. `/webhooks/razorpay`).
4. **Adjacent products**
   - LAIE + Flow pages onto their proxies; enforce Connect/Flow/LAIE isolation (SDK-only).
   - Infra Connect/Storage/Store consoles.
5. **Admin depth + legacy retirement**
   - Migrate `services/*` off bare `/api/*` onto `/api/admin/*`; retire legacy routers.
   - Audit-row coverage for all admin mutations; `admin/relays` server surface.
6. **Polish**
   - Retire `legacy-onboarding`; persona pages; consistent empty/error states everywhere.

---

## 6. Acceptance per screen

A screen is "done" when it has: real data wired to the mapped endpoint(s),
loading + empty + error states, quota/permission handling where applicable,
and (admin) an audit trail for mutations. Free-tier hard caps are enforced in
`quota` middleware and are **never** bypassed by the credit wallet.
