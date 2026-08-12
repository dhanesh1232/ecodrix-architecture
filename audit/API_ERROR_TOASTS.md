# API Errors → Toasts — Audit & Convention

**Goal:** API-request failures surface as `toast.*` everywhere, not as inline red
error elements scattered across pages. `Scope`: `ECOD/saas`.
**Date:** 2026-07-13

## The mechanism (one place, covers everything)

`components/providers/QueryProvider.tsx` now installs a global
**`QueryCache.onError`** → every failed **query** (GET) fires a de-duped
`toast.error` automatically. React Query v5 `useQuery` has no per-call
`onError`, so there's no double-toast risk. Opt a query out with
`meta: { silent: true }` (best-effort background reads).

- De-dupe + message extraction live in `lib/notify.ts`
  (`notifyError(err, fallback?)`, `messageFromError(err)`), so a page whose
  queries all fail at once shows ONE toast, not five.
- `MutationCache.onError` keeps the existing 402 "out of credits" handler.
- Mutations keep their own `onError` toasts (most already do); use
  `notifyError(err)` in new/converted `catch` blocks + mutation `onError`.

**Net:** every query failure is toasted app-wide from a single handler — the
"everywhere toast" requirement — without editing every file.

## Inline-element cleanup (redundant red banners → neutral state)

Because the message now always toasts, the loud red "Failed to load …" banners
are redundant. Replaced with `components/shared/LoadError.tsx` — a neutral
"Couldn't load / Try again" state (keeps recoverability, no alarming element):

- [x] `manage/billing` — entitlements load error → `LoadError` (retry).
- [x] `manage/usage` — usage load error → `LoadError` (retry).
- [x] `manage/credits` — balance error → neutral muted text.
- [x] `manage/settings/developer` — credentials load error → `LoadError`.
- [x] `manage/settings/developer/data-source` — load error → `LoadError`.
- [x] `manage/settings/workspace/team` — members load error → `LoadError`.

Other sections' query-load banners (laie/erix/flow) are now ALSO toasted by the
global handler, so their remaining red banners are redundant (not harmful) and
can be swapped to `LoadError` incrementally — no message is lost in the meantime.

## Convention (do this going forward)

1. **Query load failure** → nothing to do; the global handler toasts it. For the
   on-page state use a skeleton (loading) then `LoadError` (error), never a red
   banner.
2. **Mutation / action failure** → `onError: (e) => notifyError(e)` (or in a
   `catch`). One toast, deduped, consistent message extraction.
3. **`Loader2`** → buttons only (pending state). Never a page/section spinner.
4. **Keep inline** only for true **field-level validation feedback** (e.g. a
   wrong OTP code, a duplicate workspace name) — that's form UX sitting next to
   the input, not a scattered error banner. Everything else → toast.

## Not converted (deliberate — field feedback)

- `developer` OTP step-up: `verify/requestOtp` inline `<p>` sits under the OTP
  input — correct contextual feedback, kept.
- `workspace` rename conflict inline `<p>` — same rationale.
