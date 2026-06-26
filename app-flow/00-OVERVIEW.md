# ECODrIx — App Flow Blueprint (Overview)

> Structured, implementation-ready app-flow design for the two frontends —
> **`saas/`** (customer product) and **`admin/`** (control panel) — derived from
> the live backends **`server/`** and **`erix-store/`**.
>
> This folder is the source of truth for _what screens exist, what each screen
> does, and which backend endpoint each screen calls_. It reflects the **current
> implementation** and flags **gaps** to close.

| Doc                              | Scope                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| `00-OVERVIEW.md`                 | System map, identity/auth, data boundary, app-to-server wiring |
| `01-SAAS-APP-FLOW.md`            | Customer app: every route, flow, and endpoint mapping          |
| `02-ADMIN-APP-FLOW.md`           | Control panel: every section, flow, and endpoint mapping       |
| `03-IMPLEMENTATION-STRUCTURE.md` | Target route/folder structure, nav IA, build order, gaps       |

---

## 1. The four apps

```
                            ┌───────────────────────────────────────────┐
                            │             server/ (Express + Hono)      │
   saas/  ───session────►   │                                           │
   (Next.js customer)       │ /api/auth/*        public auth            │
        │  @ecodrix/        │ /api, /api/platform/*   control plane     │
        │  erix-api         │ /api/saas/*, /api/crm   tenant product    │
        │  (x-api-key)      │ /api/laie/v1/*     leadgen                │
        ▼                   │ /api/flow/v1/*     no-code orchestration  │
   admin/ ──x-core-api-key► │ /api/connect/v1/*  channels               │
   (Next.js control)        │ /api/admin/*       admin control plane    │
                            │ /webhooks/*        third-party callbacks  │
                            └───────────────┬───────────────────────────┘
                                          │ enqueues jobs / KV / locks
                                          ▼
                          ┌────────────────────────────────────────────┐
                          │   erix-store/  (Redis-like sidecar, :6399) │
                          │   KV·hash·list·set·zset·jobs·locks·pub/sub │
                          │   rate-limit·cache·usage-meter  (PG WAL)   │
                          └────────────────────────────────────────────┘
```

- **`saas/`** — the multi-tenant customer app. A workspace lives at `/{slug}/…`.
  Surfaces five product areas: **ERIX** (CRM/automation), **LAIE** (lead-gen),
  **Flow** (no-code), **Infra** (Connect / Storage / Store), and **Manage**
  (billing, credits, usage, support, settings).
- **`admin/`** — the internal control plane for ECODrIx staff. Manages tenants,
  plans, credits, billing/revenue, monitoring, comms, compliance, tickets, and
  the legacy agency services.
- **`server/`** — single Express app; every router is mounted in
  `src/routes/index.ts` (the top-of-file comment block is the authoritative
  URL-prefix → folder map). Hono powers the `/api/erix/v1` gateway.
- **`erix-store/`** — standalone in-memory data-structure server (`@ecodrix/erix-store`,
  port 6399) with Postgres WAL+snapshot persistence. The server is its primary
  client (job queue, locks, cache, usage meter); tenants get a read/console view
  via the SaaS **Infra → Store** pages.

---

## 2. Data boundary (platform vs tenant)

This boundary is **load-bearing** — it dictates which app and which auth gate a
screen uses. Do not cross it.

| Plane                  | Code                  | Storage                                                                                                 | URL prefixes                                             | Owns                                                                 |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| **Platform / control** | `server/src/platform` | Postgres `ecodrix_organizations`, `ecodrix_members`, plans, entitlements, credits, billing, admin-staff | `/api`, `/api/platform/*`, `/api/admin/*`, `/api/auth/*` | identity, orgs, members, plans, subscriptions, credit wallet, admin  |
| **Tenant / product**   | `server/src/erix`     | per-tenant CRM data (Postgres tenant adapter + Mongo legacy)                                            | `/api/saas/*`, `/api/crm`                                | leads, pipelines, projects, automation, marketing, invoices, persona |
| **LAIE**               | `server/src/laie`     | LAIE Postgres                                                                                           | `/api/laie/v1/*`                                         | lead discovery, datasets, runs, compliance                           |
| **Flow**               | `server/src/flow`     | flow tables                                                                                             | `/api/flow/v1/*`                                         | no-code workflow graphs                                              |
| **Infra**              | `server/src/infra`    | connect/storage tables + erix-store                                                                     | `/api/connect/v1/*`, `/api/saas/{whatsapp,storage,…}`    | channels, media, KV store                                            |

> **Rule:** Connect/Flow/LAIE never import each other's internals; they integrate
> only through the ERIX SDK / platform routes. Free-tier hard caps are enforced
> in `quota` middleware and must never be bypassed by the credit wallet.

---

## 3. Identity & auth model

### SaaS (customer)

- **Browser → SaaS:** NextAuth session cookie (`src/middleware.ts` guards routes,
  redirects `/` → `/{slug}`, enforces subdomain routing + module flags).
- **SaaS server → `server/`:** `src/lib/api/external.ts` builds a per-request
  `ECODrIxAPI` (`@ecodrix/erix-api`) using the **tenant creds on the session**
  (`tenant.apiKey` + `tenant.clientCode`), base URL `BACKEND_URL`; falls back to
  master env creds. First-party Next API routes proxy catch-alls for
  `connect/v1`, `flow/v1`, `laie/v1`, `portal/v1`, `admin/clients`.
- **`server/` tenant gate:** `tenantResolver()` resolves an org from
  (1) `x-api-key` + `x-client-code`, (2) `x-api-key` alone, or (3) a NextAuth
  session → member → org. Legacy `validateClientKey` bridges the same way.
  Suspended orgs → `403 ORG_SUSPENDED`.
- **LAIE gate:** `x-laie-key` (static operator key or DB-backed per-tenant SHA-256).
- **Portal:** `(portal)/portal` is a separate client-portal area with its own JWT.

### Admin (control panel)

- **Browser → Admin:** NextAuth with a **dedicated cookie namespace**
  (`__Secure-ecodrix_admin.session-token`, see `admin/src/proxy.ts`).
- **Admin server → `server/`:** the catch-all `app/api/admin/[...path]/route.ts`
  proxies to `${CORE_API_URL}/api/admin/*`, injecting `x-core-api-key` plus the
  forwarded staff identity (`x-admin-staff-{id,email,role}`).
- **`server/` admin gate:** `requirePlatformAdmin()` accepts the matching
  `x-core-api-key` (S2S) **or** a forwarded role of `superadmin`/`admin`
  (`staff` is rejected — privilege-escalation guard).

---

## 4. Conventions used in 01/02

- **Route** = the frontend path (Next.js `app/` segment).
- **Calls** = the backend endpoint(s) the screen depends on (wire path).
- **State** = empty / loading / error / quota-hit (402 `INSUFFICIENT_CREDITS`) where relevant.
- **Gap** = screen or endpoint that should exist for a complete flow but is missing today.
