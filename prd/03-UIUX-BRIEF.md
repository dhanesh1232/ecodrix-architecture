# 03 — UI / UX Design Brief

> Design philosophy, dark-navy tokens, layout patterns (console root + per-product sidebars),
> the settings tree, the infra dashboard, the onboarding wizard, and the accessibility floor.
> Pair with `04-APP-FLOW.md` for routing.

## 1. Philosophy

ECODrIx is built for Indian SMB owners who use WhatsApp daily but may never have used a CRM. The UI
must:

- Feel **WhatsApp-familiar** for messaging surfaces, **cloud-console-familiar** for the root.
- Have a **zero learning curve** — every action discoverable without docs.
- Be **information-dense without clutter** — show what matters, hide what doesn't.
- Be **AI-first** — AI suggestions are foregrounded, not buried.
- Be **dark-only** — professional, modern, easy on eyes through long sessions. No light toggle.

The platform also has to feel native when **embedded in a third-party site** via `@ecodrix/erix-react`.
Every component must work inside an `ErixContainer` with style isolation.

## 2. Visual Identity

### 2.1 Color tokens

| Token              | Hex       | Usage                               |
| ------------------ | --------- | ----------------------------------- |
| `bg-base`          | `#0A1628` | App background                      |
| `bg-surface`       | `#0F2040` | Cards, sidebars, panels             |
| `bg-elevated`      | `#1A3050` | Hover, dropdowns, modals            |
| `accent-primary`   | `#1E7AFF` | Buttons, links, active states       |
| `accent-secondary` | `#FF6B1A` | AI suggestions, badges, CTAs        |
| `text-primary`     | `#FFFFFF` | Headings, body                      |
| `text-secondary`   | `#8FA8C8` | Labels, descriptions                |
| `text-disabled`    | `#3A5070` | Placeholders, disabled              |
| `success`          | `#22C55E` | Won deals, paid invoices, connected |
| `warning`          | `#F59E0B` | Pending, overdue                    |
| `error`            | `#EF4444` | Failed, lost, disconnected          |
| `border`           | `#1E3A5A` | Card borders, dividers              |

### 2.2 Typography

- Body: **Inter** (400 / 500 / 600)
- Code & metrics: **JetBrains Mono** (400 / 500)
- Headings: **Inter** (600 / 700)
- Default size: 14px body / 13px secondary / 12px metadata.

### 2.3 Density

Console + product modules target **medium density** (24px row height for tables, 12px gap on cards).
The embeddable SDK supports a `compact` density mode for tenant-host pages with limited room.

## 3. Layout Patterns

### 3.1 Console (root, no sidebar)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo] ECODrIx Console        [Search]   [Plan: Growth ●]   [🔔][▾]   │
├────────────────────────────────────────────────────────────────────────┤
│  Welcome back, Dhanesh                                                  │
│                                                                        │
│  ┌── PRODUCTS ──────────────────────────────────────────────────────┐  │
│  │  [ ERIX Card ]    [ LAIE Card ]    [ Editor Card (SDK) ]          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌── INFRASTRUCTURE ────────────────────────────────────────────────┐  │
│  │  [ Cloud Storage ]   [ ErixStore ]   [ Email & SES ]              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌── ACTIVITY  +  USAGE ────────────────────────────────────────────┐  │
│  │  Recent events…              Messages 4.2k / 100k · AI 380 / 1k  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

Console route: `/` (under `(console)` layout). Topbar only. Card grid + activity + usage meters
pulled from `entitlementService.getEntitlements(orgId)` and recent events from `org:${orgId}` Pub/Sub
channel via SDK.

### 3.2 Product modules (own sidebar)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Console    ERIX CRM                              [🔔]   [▾]          │
├──────────────┬─────────────────────────────────────────────────────────┤
│  Inbox (3)   │                                                         │
│  Contacts    │                                                         │
│  Pipeline    │     (active page)                                       │
│  Templates   │                                                         │
│  Broadcasts  │                                                         │
│  Invoices    │                                                         │
│  Automation  │                                                         │
│  Workflows   │                                                         │
│  Segments    │                                                         │
│  Settings    │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

Routes under `(erix)/erix/*` and `(laie)/laie/*`. Each product's settings are scoped under that
product's sidebar — global org settings live elsewhere (see § 5).

### 3.3 Infrastructure dashboard

Routes under `/infra/*` (`platform-completion-end-to-end/`):

```
/infra/dashboard   ErixStore overview (cache hit %, queue depths, lock count, pubsub subs)
/infra/queues      Queue inspector — throughput, retries, DLQ, drill-down
/infra/cache       Key explorer — tag filter, value preview, manual eviction
/infra/pubsub      Live channel subscribers, recent events, manual publish
/infra/storage     Cloud storage usage, file explorer, transform stats
/infra/metrics     Combined real-time chart panel
```

Same product-style layout: own sidebar, "← Console" back link.

## 4. Embeddable SDK Layout

`@ecodrix/erix-react` wraps everything in `ErixContainer` (style isolation via CSS variables and a
scoped class) so the host site's CSS can't leak in.

```
host site
└── <ErixProvider apiKey clientCode>
    └── <ErixContainer density="compact|comfortable">
        └── <ErixDashboard />     // full module router
            └── routes via SDK adapters (Next.js / React Router)
```

Plan-gated views inside the SDK (e.g., editor collaboration on Growth+) detect entitlements via the
provider and surface inline `<UpgradePrompt feature="editor.collaboration" />` cards.

## 5. Settings Tree

Three layers of settings, each scoped:

```
/settings/                        ← org-wide
├── profile             user name, avatar, password, timezone
├── team                members, invitations, roles
├── security            sessions, audit log, 2FA
├── developer           API keys, allowed origins, embed install
├── data-source         data_mode, external DB URI, sync direction
├── fields              dynamic CRM field builder
├── billing             plan, add-ons, payment method, invoices
└── onboarding          re-run wizard

/erix/settings/                   ← ERIX-specific
├── ai-agent            org prompt, auto-reply toggle, confidence threshold
├── pipelines           default pipeline, stage colors, auto-actions
├── invoice             company info, GSTIN, prefix, Razorpay keys
├── templates           WhatsApp template approval status
├── automation          rule list (legacy)
└── workflows           visual workflow list

/laie/settings/                   ← LAIE-specific
├── api-keys            LAIE API keys
├── webhooks            LAIE webhooks
├── schedules           recurring audits
└── workflows           LAIE workflow engine
```

## 6. Onboarding Wizard

First login (`org.onboarding_complete = false`) redirects to `/onboarding`:

1. **Welcome** — confirm org name, industry, team size.
2. **Pipeline** — accept default 5-stage pipeline (New → Contacted → Qualified → Proposal → Won) or customize.
3. **WhatsApp** — connect Meta Cloud API (or skip).
4. **AI agent** — pick a starter prompt template per industry (or skip).
5. **Team** — invite teammates by email (optional).
6. **Done** — confetti, redirect to `/`.

Re-runnable from `/settings/onboarding`.

## 7. Component Patterns

```css
/* Card */
.card {
  @apply bg-[#0F2040] border border-[#1E3A5A] rounded-lg p-4
                 hover:border-[#1E7AFF]/50 transition-colors;
}

/* Primary button */
.btn-primary {
  @apply bg-[#1E7AFF] hover:bg-[#1E7AFF]/90 text-white
                       font-medium rounded-md px-4 py-2;
}

/* AI / orange CTA */
.btn-ai {
  @apply bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white
                  font-medium rounded-md px-4 py-2;
}

/* Input */
.input {
  @apply bg-[#0A1628] border border-[#1E3A5A] text-white
                 placeholder:text-[#3A5070] rounded-md px-3 py-2
                 focus:border-[#1E7AFF] focus:ring-1 focus:ring-[#1E7AFF]/50;
}

/* Sidebar item — active */
.sidebar-active {
  @apply border-l-2 border-[#1E7AFF] bg-[#1E7AFF]/10 text-white;
}
```

Stage badges (kanban + lead detail):

| Stage     | Class                            |
| --------- | -------------------------------- |
| New       | `bg-[#3A5070]/20 text-[#8FA8C8]` |
| Contacted | `bg-[#1E7AFF]/10 text-[#1E7AFF]` |
| Qualified | `bg-[#F59E0B]/10 text-[#F59E0B]` |
| Proposal  | `bg-[#8B5CF6]/10 text-[#8B5CF6]` |
| Won       | `bg-[#22C55E]/10 text-[#22C55E]` |
| Lost      | `bg-[#EF4444]/10 text-[#EF4444]` |

## 8. Key Screen Designs

### 8.1 WhatsApp Inbox (split-pane)

Left 35%: thread list (avatar, name, last message preview, timestamp, unread badge).
Right 65%: conversation (bubbles, composer, contact header). AI suggestions appear above the
composer in an orange-bordered card with "Use", "Edit & Send", and "Dismiss" actions.

### 8.2 Pipeline Kanban

6+ columns (configurable). Cards: name, company, value, last activity, assigned avatar, AI score
badge. Drag-and-drop via `@dnd-kit`. Column header: stage name + count + total value.

### 8.3 Invoice Builder

Split view. Left: form (line items, tax, discount). Right: live PDF preview. Footer actions:
"Generate Payment Link", "Download PDF", "Send via WhatsApp".

### 8.4 Visual Workflow Canvas

Three panes. Left: node palette (Triggers, Conditions, Actions, AI nodes). Center: React Flow canvas
with connected nodes. Right: selected node properties + variable picker. Footer: Test Run, Save,
Activate toggle, Run history link.

### 8.5 LAIE Audit Result

Hero score radial (overall) + 5 mini radials (web, GBP, accessibility, SEO, social). Top weaknesses
list. Outreach kit cards (WhatsApp hook, email sequence, LinkedIn DM) with Copy / Push to ERIX
buttons.

### 8.6 Settings — Data Source

Current `data_mode` shown prominently. "Switch to..." cards for each available mode (`platform`,
`own (Mongo)`, `own (PG)`, `both`). Test Connection button (calls `POST /api/data-source/test`)
before save. If switching, shows migration plan + progress.

### 8.7 Infra Dashboard

Four tiles for cache / queue / locks / pubsub with live counters. Click into each for detailed view.
Real-time SSE-driven via ErixStore Pub/Sub; falls back to 5s polling.

## 9. State Patterns

Every list view has all four:

| State   | When          | What it shows                                    |
| ------- | ------------- | ------------------------------------------------ |
| Loading | Initial fetch | Skeleton cards matching layout (pulse animation) |
| Empty   | No items      | Illustration + headline + description + CTA      |
| Error   | Fetch failed  | Red-bordered card + message + Retry button       |
| Loaded  | Items         | The actual content                               |

Every async button has a `loading` state with disabled interaction.

Every gated feature has an `<UpgradePrompt feature="path" />` fallback rendered inline (not modal).

## 10. Retention UX

- Onboarding checklist (5 steps, dismissible after completion).
- Daily AI briefing notification (planned — Tier "Coaches").
- Streak counter ("You've responded to all leads for 7 days").
- Usage milestones ("You've sent 1,000 messages! 🎉").
- Smart notifications: only actionable items, never noisy.

## 11. Accessibility Minimum Bar

- WCAG 2.1 AA compliance for all shipped surfaces.
- Color contrast ≥ 4.5:1 for text.
- Every interactive element keyboard-navigable; visible focus rings.
- Touch targets ≥ 44×44 px on mobile.
- ARIA labels on all icon-only buttons.
- Screen-reader-friendly drag-and-drop fallbacks for kanban.

Note: full WCAG validation requires manual testing with assistive tech. We commit to AA in design and
auditing component-by-component as they ship.

## 12. Embeddable SDK Considerations

- All components must work without a global `body` class.
- All colors come from CSS variables on the `ErixContainer` element so consumers can theme.
- Modal portals attach to a known root inside `ErixContainer` (not `document.body`).
- The SDK ships a tree-shakeable index so partial consumers don't pay full bundle cost.

## 13. Mobile / PWA (planned)

- All flagship surfaces are mobile-responsive today.
- Native PWA shell + offline queue (via ErixStore) is on the long-tail roadmap (`06-ROADMAP.md` Phase 5).
- Offline behavior priority: inbox read + outbound message queue + lead view; everything else gracefully degrades.

## 14. Assumptions

- Dark mode is preferred by the target audience.
- Indian SMB users are familiar with WhatsApp UI patterns.
- shadcn/ui covers ~90% of needs; we accept a small set of bespoke components (kanban card, workflow canvas, score radial, AI suggestion card).
- React Flow handles 100-node workflows comfortably; we cap UI at 200 nodes per workflow.

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/console-dashboard-redesign/`, `saas/.kiro/specs/erix-crm-module/`, `saas/.kiro/specs/laie-audit-ui/`, `saas/.kiro/specs/editor-pro-features/`.
