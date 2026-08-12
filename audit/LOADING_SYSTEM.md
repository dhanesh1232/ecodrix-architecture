# SaaS Loading System — Audit & Definition

**Scope:** `ECOD/saas`. How every loading state renders, driven by the AppShell
shell modes. Skeletons everywhere; spinners (`Loader2`) only inside buttons.
**Date:** 2026-07-13

## Audit — shell modes (from `components/layout/AppShell.tsx` `resolveShell`)

| Mode        | Chrome                                  | Routes                                                                                                                                |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`      | none                                    | `/auth/*`, `/erix-003/*`                                                                                                              |
| `console`   | topbar only (`ConsoleTopbar`)           | `/`, `/product/{erix,laie,flow}` (overview/enable), `/infra/connect` (grid), `/infra/connect/{id}` (setup), `/infra/storage`, default |
| `section`   | topbar (`SectionHeader`) + `AppSidebar` | `/product/erix/*`, `/product/laie/*`, `/product/flow/{list,templates}`, `/manage/*`, `/infra/connect/{id}/{view}`                     |
| `fullbleed` | minimal header only                     | `/product/erix/custom-config`, `/product/flow/{id}…` (builder)                                                                        |

Sidebar sections: `erix · laie · flow · manage · connect`.

## Definition — three loading tiers

### Tier 1 — cold workspace boot (shell NOT mounted)

`EcodProvider` returns early while `session.status === "loading"` (SDK not ready)
— nothing real is rendered yet, so we draw the **whole shell as skeleton**:

- topbar skeleton, **sidebar skeleton IF the path resolves to a `section` shell**
  (console/fullbleed paths get no sidebar — matching the real chrome),
- a path-shaped content skeleton,
- a translucent overlay carrying only the **looping brand logo** (no text).
  Component: `components/brand/WorkspaceLoading.tsx` → `FullChromeSkeleton` +
  logo overlay.

### Tier 2 — route/segment navigation (shell IS mounted)

The real `AppShell` (real topbar + real `AppSidebar` with real nav) is already
on screen; Next.js renders the segment's `loading.tsx` into the content slot.
So we render **content-only** `PageSkeleton` (no chrome skeleton, no logo). The
sidebar keeps showing real content. Shape is chosen by path.
Files: `app/**/loading.tsx` per route group.

### Tier 3 — in-component data fetch

Cards/tables/sections render local skeletons while their query is pending. Reuse
`PageSkeleton` shapes or small bespoke `Skeleton` blocks. **Never** a full-page
spinner. **`Loader2` is allowed ONLY inside a button** (submit/pending state).

## Shared toolkit — `components/skeletons/`

Primitives + resolvers (`PageSkeleton.tsx`):

- `Block` — pulse primitive (`bg-foreground/8 rounded-sm animate-pulse`).
- `SkelHeader` / `SkelField` — mirror `AdaptiveHeader` and a labelled field, so
  every page skeleton's header/fields match exactly.
- `normalizePath(pathname)` — **strips the `/{slug}` prefix** so resolvers see
  canonical `/manage/...`. Critical at COLD BOOT (slug unresolved → path still
  carries the slug → wrong shape/sidebar). Mirrors AppShell's slug handling.
- `shapeForPath` / `hasSidebarForPath` — normalize first, then resolve.
- `PageSkeleton({ shape })` — generic content skeleton (fallback).
- `SidebarSkeleton` / `TopbarSkeleton` / `FullChromeSkeleton` — Tier-1 chrome.

Exact per-page skeletons (one file each, matching the real page 1:1):

- `profile-skeleton.tsx`, `security-skeleton.tsx`, `team-skeleton.tsx`,
  `billing-skeleton.tsx`, `addons-skeleton.tsx`, `usage-skeleton.tsx`,
  `credits-skeleton.tsx` — add more the same way.

Dispatch:

- `registry.tsx` → `RouteSkeletonFor({ path })` maps a (slug-prefixed) path to
  its exact skeleton, longest-prefix-first, falling back to `PageSkeleton` by
  shape. Used by both `RouteSkeleton` (Tier 2) and `WorkspaceLoading` (Tier 1
  content), so cold boot and navigation render the SAME exact skeleton.
- `RouteSkeleton.tsx` — the `loading.tsx` default export (Tier 2).

### Adding a page skeleton

1. Create `components/skeletons/<name>-skeleton.tsx` mirroring the real page
   (reuse `SkelHeader`/`SkelField`/`Block`).
2. Register its path prefix in `registry.tsx` (specific paths first).
   That's it — both tiers pick it up.

## Rules

1. Page / card / section loading → **skeleton**, never a spinner.
2. `Loader2` (spin) → **buttons only**.
3. Skeleton visuals: `bg-foreground/8`, `rounded-sm`, `animate-pulse`.
4. Tier 1 chrome skeleton must match the real shell for the path (sidebar only
   when the path is a `section` route).
5. `prefers-reduced-motion` → the brand logo holds still (handled in
   `BrandLoader`).

## Coverage checklist

- [x] Tier 1 — `WorkspaceLoading` (section-aware chrome + exact page skeleton
      inside + logo overlay); cold-boot slug bug fixed via `normalizePath`.
- [x] Toolkit + registry — `components/skeletons/*`.
- [x] Tier 2 — `loading.tsx` for console home, erix, laie, manage, infra.
- [x] Exact page skeletons — profile, security, team, billing, addons, usage,
      credits (manage cluster). In-component `isLoading` on billing/addons/usage
      now render their exact skeleton too.
- [ ] Remaining exact skeletons (erix/laie/flow/connect pages) — add per the
      "Adding a page skeleton" recipe; until then they fall back to the correct
      shape via `shapeForPath`.
- [ ] Tier 3 spinner audit — `grep -rn "Loader2" src --include=*.tsx | grep -vi button`.
