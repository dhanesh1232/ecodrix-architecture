# Tenant-as-Agency

Future offering: **a paying tenant can be flagged as an agency and manage
sub-tenants under their own account** — brand-white-labelled, dashboard
rolled up, invite flow scoped to the agency.

## Business context

- Primary ECODrIx acquisition path is admin-invite of direct SMBs (freelance
  service model). This runs on `req.platform.admin.*`.
- Some tenants will themselves be freelance agencies serving multiple
  SMB clients. They want to onboard THEIR clients through THEIR own
  ECODrIx account rather than through us.
- Both models coexist. The tenant-as-agency features are additive — a
  regular tenant sees no change, an agency-flagged tenant gets a new
  section in their console.

## Model (already reflected in schema)

`ecodrix_organizations` already carries the fields:

| Column        | Type      | Purpose                                                                               |
| ------------- | --------- | ------------------------------------------------------------------------------------- |
| `is_agency`   | `boolean` | This tenant can create sub-tenants and see the agency section.                        |
| `agency_id`   | `uuid`    | If non-null, this tenant is a sub-tenant of the referenced agency org.                |
| `agency_code` | `text`    | Mirror of the parent agency's `client_code` for fast filtered listing without a join. |

One level deep only. An agency's sub-tenant CANNOT itself be an agency in
this iteration. If two-level nesting is ever needed, revisit.

```
Platform (ECODrIx)
├── Tenant "SmartMarketing"      (is_agency = true)
│   ├── Sub-tenant "AcmeClinic"  (agency_id = SmartMarketing.id)
│   ├── Sub-tenant "BetaCafe"    (agency_id = SmartMarketing.id)
│   └── Sub-tenant "CharlieGym"  (agency_id = SmartMarketing.id)
├── Tenant "DirectSMB1"          (is_agency = false)
└── Tenant "DirectSMB2"          (is_agency = false)
```

## How an org becomes an agency

Two possible paths:

1. **Admin-flagged** (recommended for MVP) — ECODrIx admin toggles
   `is_agency=true` from the admin panel. Manual, controllable, keeps
   quota policy simple.
2. **Plan-gated** (later) — subscribing to an "Agency" plan tier flips
   the flag automatically. Requires plan-tier design, quotas (how many
   sub-tenants), and billing implications (does the agency pay for sub-
   tenant seats or does each sub-tenant pay their own subscription?).

Ship path 1 first.

## SDK surface (target shape)

Bound by `scope.orgId = <the agency's own org>`. Every method filters
by `agency_code = scope.clientCode` so an agency can never see another
agency's clients — enforced at the SDK layer, not just the route.

```
req.platform.agency
├── me()                                     → this agency's info + sub-tenant counts
├── clients
│   ├── list()                               → my sub-tenants
│   ├── get(codeOrId)                        → one sub-tenant (403 if not mine)
│   ├── create({ name, ownerEmail, plan? }) → create sub-tenant + send invite
│   ├── suspend(codeOrId)                    → suspend a sub-tenant
│   └── remove(codeOrId)                     → soft delete
├── portfolio
│   ├── stats()                              → rollup of leads / pipeline / won / conversion
│   └── health()                             → per-sub-tenant health flags (WA disconnect, missing pipelines, …)
└── blueprints
    ├── list()                               → my saved blueprints (agency-owned)
    ├── save(fromClientCode)                 → snapshot a sub-tenant's config as a blueprint
    └── deploy(toClientCode, id)             → stamp a blueprint onto a sub-tenant
```

## Auth guard

Small middleware:

```ts
export function requireAgency() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.org?.isAgency) {
      return res.status(403).json({ error: "AGENCY_ROLE_REQUIRED" });
    }
    next();
  };
}
```

Mount:

```ts
// src/routes/v1/platform/agency/index.ts
router.use("/agency", tenantResolver(), requireAgency(), createAgencyRouter());
```

## Sub-tenant invite flow

Reuses `platform/services/admin/invitations.service.ts` — no new invite
system, just an extra field on the invite row.

1. Agency calls `POST /v1/api/platform/agency/clients` with
   `{ name, ownerEmail, plan? }`.
2. Handler:
   - Creates `ecodrix_organizations` row with
     `agency_id = req.org.id, agency_code = req.org.clientCode`.
   - Calls `invitations.service.createInvitation({ orgId: <new>, email: ownerEmail, role: "owner", invitedBy: req.userId })`.
3. Sub-tenant clicks the invite link, sets password, lands in their own
   workspace. Their org has `agency_id` set, which flips branding /
   feature-access rules server-side.

## Sub-tenant experience

- **URLs / UI**: identical to a direct tenant. Same login, same console,
  same product surface.
- **Branding**: agency's `brand_config` JSONB (already on
  `ecodrix_organizations`) is inherited by sub-tenants — logo, colours,
  domain the agency configured.
- **Billing**: MVP — sub-tenants pay their own subscriptions (agency
  gets discovery / management value, not seat resale). Later —
  agency-plan seat pooling if the market wants it.

## What to reuse from the archived code

- **`portfolio.service.ts`** — the paging + folding logic is the right
  shape. Move it to `platform/services/agency/portfolio.service.ts`
  and wrap in `AgencySDK.portfolio.stats()`.
- **`health.service.ts::checkPortfolioHealth`** — same, wrap in
  `AgencySDK.portfolio.health()`.
- **`health.service.ts::checkClientReadiness`** — useful independent of
  agency work. If admin support tooling ever wants a single-tenant
  readiness check, resurrect this under `AdminSDK.clients.readiness(codeOrId)`.
- **`orchestrator.service.ts::deployBlueprint`** — the pipeline + rule
  cloning logic is the meat. When you build blueprint deploy for admin
  onboarding (before agency mode ships), lift this into
  `AdminSDK.blueprints.deploy(toClientCode, blueprintId)`.
- **`usage.service.ts`** (legacy Mongo shim) — likely OBSOLETE by the
  time agency mode ships. The typed pair (`createQuotaMiddleware`) is
  the canonical API now. Only rescue this if you find surviving legacy
  callers.

## What DOESN'T carry over

- The old `admin/agency.routes.ts` mount — it ran under
  `requirePlatformAdmin()` and served the agency dashboard TO ECODrIx.
  The tenant-as-agency version runs under `requireAgency()` and serves
  the dashboard TO the agency tenant. Completely different auth.
- The concept of "agency admin" as a separate actor role — the agency
  IS the tenant, so the tenant's owner IS the agency admin. No new role.

## Prereqs before shipping

1. Decide the billing model (agency-pays-for-seats vs sub-tenants-pay-own).
2. Plan tier design — quota on sub-tenants per agency plan.
3. Admin toggle UI in the admin panel to flip `is_agency=true`.
4. Sub-tenant-count enforcement — must reject the `POST /agency/clients`
   call once the quota is hit.
5. UI in the tenant console — new sidebar section "Agency" visible only
   when `is_agency=true`.
