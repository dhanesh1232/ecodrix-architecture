# Proposal: Cross-Subdomain Navigation & the Production "Hot Reload"

**Status:** ✅ Decided & implemented (code) — DNS/env pending
**Decision:** Two-origin model — `accounts.` (auth) + `console.` (whole dashboard)
**Scope:** `ECOD/saas` (Next.js 15 App Router)
**Owner decision required:** DNS + env (`NEXT_PUBLIC_SUBDOMAIN_ROUTING`, host CNAMEs)
**Author:** engineering
**Date:** 2026-07-12

---

## 0. Decision (chosen)

Collapse the dashboard to a **single origin** and keep auth separate:

- `accounts.ecodrix.com` → auth only.
- `console.ecodrix.com` → the **entire** authenticated dashboard (console,
  onboarding, manage, erix, laie, flow, connect, storage, cache).
- `portal.ecodrix.com` → client portal (separate app, unchanged).

Because the whole dashboard is one origin, **every in-app navigation is a
smooth SPA transition — no reload.** The only full-page load is the one-time
post-login hop `accounts → console`, which is accepted (auth is a separate
origin by design). This is Option A applied with a two-origin split.

**Code changes shipped (flag-gated on `NEXT_PUBLIC_SUBDOMAIN_ROUTING`):**

- `src/lib/domains.ts` — all dashboard sections point at one `APP_HOST`
  (`console.*`); added `APP_HOST`; updated module docs.
- `src/lib/workspace.ts` — `useWorkspaceHref()` now returns **relative** paths
  in prod too, so `<Link>` does client-side navigation.
- `src/middleware.ts` — subdomain gate now compares **current host vs target
  host** (not section vs section), so collapsed sections never self-redirect /
  loop.

**Still required (ops / human):**

- DNS: point `console.ecodrix.com` at the app deployment; keep
  `accounts.ecodrix.com` for auth. Legacy per-section subdomains
  (`manage.`/`erix.`/…) can be dropped or CNAME'd to `console.` (they now
  resolve there logically via `SECTION_HOST`).
- Env: `NEXT_PUBLIC_SUBDOMAIN_ROUTING=on` in production.
- Auth cookie stays `*.ecodrix.com`-scoped (already is) so the session
  survives the accounts → console hop.

The analysis below is retained for context.

---

## 1. Problem

In **production**, moving between platform sections triggers a full-page
reload ("hot reload") instead of a smooth in-app transition:

```
https://console.ecodrix.com/{slug}/              →  (click "Manage")
https://manage.ecodrix.com/{slug}/manage/...      →  full document reload
```

In **development** the exact same click is a smooth SPA transition, because
everything is served from a single origin (`localhost:3000`).

The user expectation: production should feel like dev — instant, no white
flash, no reload — when jumping from Console to Manage (or any section).

---

## 2. Root cause (why this is not a patchable bug)

Each section is served on its **own subdomain** (see `src/lib/domains.ts`):

| Section                   | Host                                          |
| ------------------------- | --------------------------------------------- |
| Console                   | `console.ecodrix.com`                         |
| Manage                    | `manage.ecodrix.com`                          |
| ERIX CRM                  | `erix.ecodrix.com`                            |
| LAIE                      | `laie.ecodrix.com`                            |
| Flow                      | `flow.ecodrix.com`                            |
| Connect / Storage / Cache | `connect.` / `storage.` / `cache.ecodrix.com` |
| Accounts / Portal         | `accounts.` / `portal.ecodrix.com`            |

To a browser, **every subdomain is a different **origin\***\*. Client-side SPA
navigation (`<Link>`, `router.push`) only works **within a single origin**.
The instant a link points to another subdomain, the browser **must\*\* discard
the current document and load a fresh one — a real navigation, not a client
transition.

Two things in the codebase make this concrete today:

1. **`useWorkspaceHref()`** (`src/lib/workspace.ts`) intentionally emits an
   **absolute cross-subdomain URL** in production
   (`https://manage.ecodrix.com/{slug}/manage/...`).
2. **Middleware subdomain gate** (`src/middleware.ts`) redirects any request
   whose path belongs to a different section to that section's canonical
   subdomain.

Both are working as designed. **The reload is inherent to "one subdomain per
section," not a defect.**

> **Bottom line:** You cannot have _both_ "a separate subdomain per section"
> _and_ "no reload when moving between sections." They are mutually exclusive
> at the browser level. This proposal is about which one to keep.

---

## 3. Options

### Option A — Single app origin (SPA everywhere) ✅ _Recommended_

Serve **all sections from one host**, e.g. `app.ecodrix.com`, using the
path-based routing that already exists (`/{slug}/manage/...`,
`/{slug}/product/erix/...`). Internal navigation stays same-origin →
**zero reloads, identical to dev.**

The pretty section subdomains can be **kept as 301 entry-redirects** into the
single host (see Option C) so bookmarks/marketing links still work.

|                   |                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pros**          | Smooth SPA between all sections; simplest mental model; one deploy target; shared RSC/router cache; no cross-origin latency; matches dev exactly.                         |
| **Cons**          | URL bar no longer shows the section subdomain during in-app nav; loses per-section origin isolation (rarely needed for a first-party app); requires a routing/DNS change. |
| **Effort**        | Medium — mostly deletions (relax middleware gate, make link helpers relative).                                                                                            |
| **Reversibility** | High — behind the existing `NEXT_PUBLIC_SUBDOMAIN_ROUTING` flag.                                                                                                          |

### Option B — Keep per-section subdomains, make the reload fast

Accept that cross-section navigation is a full load (unavoidable), but make it
**near-instant and flash-free**:

- `preconnect` + `dns-prefetch` to the likely-next section hosts so the
  TCP/TLS handshake is already warm on click.
- Server-render the destination shell so it paints immediately.
- Shared `*.ecodrix.com` auth cookie already avoids any re-auth on hop.

|                   |                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Pros**          | Keeps the subdomain-per-section product design intact; low-risk, additive; within-section nav already smooth. |
| **Cons**          | **Does not eliminate the reload** — only softens it; still a visible document swap between sections.          |
| **Effort**        | Low — head hints + prefetch tuning.                                                                           |
| **Reversibility** | Trivial.                                                                                                      |

### Option C — Hybrid: single app host + subdomains as canonical redirects

Run the app on one origin (Option A) for all _in-app_ navigation, but keep the
section subdomains alive as **canonical entry points that 301 into the app
host**:

```
manage.ecodrix.com/{slug}/manage/x  →  301  →  app.ecodrix.com/{slug}/manage/x
```

Direct links / bookmarks / marketing still use the friendly subdomain; once
inside the app, everything is same-origin SPA.

|                   |                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Pros**          | Best of both — smooth SPA in-app **and** friendly section URLs as entry points; graceful migration path.              |
| **Cons**          | The first hop from a subdomain entry link still redirects once (one-time, cached); slightly more DNS/redirect config. |
| **Effort**        | Medium.                                                                                                               |
| **Reversibility** | High.                                                                                                                 |

---

## 4. Recommendation

**Adopt Option C** (single app origin for in-app nav, subdomains as 301 entry
redirects). It delivers the dev-like smoothness the user wants while preserving
the friendly section URLs the current design invested in.

If keeping friendly URLs is not important, **Option A** is the leanest.

**Option B alone is not sufficient** — it cannot remove the reload the user is
complaining about; it only makes it cheaper. Ship B's `preconnect` hints
regardless (they help entry loads and the first hybrid hop), but do not treat
it as the fix.

---

## 5. Implementation sketch (Option A / C)

All gated behind the existing `NEXT_PUBLIC_SUBDOMAIN_ROUTING` flag so dev and
rollback are unaffected.

**1. Link helpers → relative, same-origin** (`src/lib/workspace.ts`,
`src/lib/domains.ts`)

- `useWorkspaceHref()` returns `/{slug}/...` (relative) instead of an absolute
  cross-subdomain URL, so `<Link>` performs a client transition.
- `sectionUrl()` returns a relative path for in-app callers.

**2. Middleware — relax the subdomain gate** (`src/middleware.ts`)

- Stop redirecting authenticated internal navigations to a different section's
  subdomain when already on the app host.
- (Option C only) On a **section subdomain**, 301 to the app host, preserving
  `/{slug}/...` path + query.

**3. App host + DNS**

- Point `app.ecodrix.com` (or reuse `console.ecodrix.com` as the app host) at
  the single deployment.
- Keep section subdomains as CNAMEs that resolve to the same app; middleware
  handles the 301.

**4. Cookies / auth** — already `*.ecodrix.com`-scoped; no change.

**5. Option B hint (ship now, low-risk)** — add to the root layout head when
subdomain routing is on:

```html
<link rel="preconnect" href="https://app.ecodrix.com" crossorigin />
<link rel="dns-prefetch" href="https://api.ecodrix.com" />
```

**6. Verify** — `tsc --noEmit`; click-through Console → Manage → ERIX with no
reload; confirm bookmarks to old subdomain URLs still land correctly (301).

---

## 6. Risks & mitigations

| Risk                                                  | Mitigation                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Breaks existing bookmarks to `manage.ecodrix.com/...` | Option C 301s them to the app host; keep for ≥1 release.                             |
| Redirect loop between app host and subdomains         | Reuse the existing middleware **circuit breaker** (`__ecodrix_rg`, `MAX_HOPS`).      |
| SEO / marketing links assume section hosts            | Option C preserves them as canonical entry points.                                   |
| Production routing regression                         | Flag-gated (`NEXT_PUBLIC_SUBDOMAIN_ROUTING`); dev untouched; staged rollout.         |
| Origin-isolation loss (Option A)                      | First-party app; low concern. Keep CSP/security headers already in `next.config.ts`. |

---

## 7. Decision checklist

- [ ] Do we keep friendly section subdomains as entry URLs? → **Option C**
- [ ] Or drop them for the leanest setup? → **Option A**
- [ ] Or accept the reload and only soften it? → **Option B** (not recommended alone)
- [ ] Approve DNS change (`app.ecodrix.com` + CNAMEs) — _ops/human_
- [ ] Approve middleware gate relaxation — _engineering_
- [ ] Ship `preconnect` hints now regardless — _low-risk, immediate_

---

_Once a direction is approved, implementation is a focused, flag-gated change
to `workspace.ts`, `domains.ts`, and `middleware.ts` plus DNS. No component
code changes required._
