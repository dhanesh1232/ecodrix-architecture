# Future Plans

Features that were designed and (partially) built, then deliberately
un-mounted from the running server to reduce surface area for the
waitlist launch. Each subfolder preserves:

- **`DESIGN.md`** — the mental model + intended shape when the feature
  comes back
- **`src-archive/`** — the original code files verbatim (paths mirror
  where they'd live in `src/` when re-hydrated). These are NOT built —
  they sit outside `tsconfig.build.json`'s `include` glob

## Index

| Folder              | Feature                   | Rationale for deferral                                                                                                                                                                                                                |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant-as-agency/` | A tenant can be an agency | Waitlist launch is admin-invite of direct SMBs. Tenant-as-agency (a customer manages sub-tenants under their own account) is a follow-on offer once the direct book is stable. Schema hooks already exist on `ecodrix_organizations`. |

## How to bring one back

1. Read the folder's `DESIGN.md` — check whether the plan still fits
   the current architecture (SDK layout, tenant scope, auth model may
   have evolved).
2. Move the archived files back under `src/` at their original paths.
3. Wire the route mount in `src/routes/v1/platform/*` and expose the
   service surface via a new SDK sub-module (never as a direct import
   from a route).
4. Update this README's index row so it's clear the feature is live.

## What NOT to do

- **Don't blindly copy the archived code**. It was written against an
  older SDK shape (pre-`req.platform.admin.*` migration) and may have
  stale imports. Treat it as a design artefact + reference impl, not a
  drop-in.
- **Don't add features here that were never built**. This folder is for
  code that landed and then got pulled. Pure design docs go under
  `ECOD/.Architecture/prd/` or the spec directories.
