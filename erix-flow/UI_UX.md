# ERIX-FLOW

> No-code automation canvas that orchestrates every ECODrIx module into one intelligent pipeline.

## UI/UX Brief

**Version:** 1.0  
**Generated:** 2026-06-08

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Visual Identity](#visual-identity)
3. [Layout and Grid System](#layout-and-grid-system)
4. [Node Visual Design](#node-visual-design)
5. [Navigation Patterns](#navigation-patterns)
6. [Empty, Loading, and Error States](#empty-loading-and-error-states)
7. [Node Config Panel UX](#node-config-panel-ux)
8. [Retention UX Strategy](#retention-ux-strategy)
9. [Typography Scale](#typography-scale)
10. [Accessibility Standards](#accessibility-standards)
11. [Animation Principles](#animation-principles)
12. [Assumptions Made](#assumptions-made)

---

## Design Philosophy

ERIX-FLOW's canvas should feel like a professional tool, not a toy. The design draws from Linear, Raycast, and Retool — dark, dense, and powerful. Every pixel serves function. The visual metaphor is a circuit board: nodes as components, edges as wires, execution as current flowing through the system.

The canvas is the product. All secondary UI — sidebars, panels, modals — must recede so the canvas commands full attention. Colour is used only for meaning: green for success, red for failure, purple for AI nodes, blue for outreach nodes, grey for logic nodes.

---

## Visual Identity

| Key                    | Value                                                           |
| ---------------------- | --------------------------------------------------------------- |
| Primary Color          | #6366f1 (Indigo/Purple) — used for CTAs, AI nodes, active state |
| Accent Color           | #4f46e5 — hover states on primary elements                      |
| Background (Canvas)    | #0f0f13 — near-black, dot-grid pattern                          |
| Background (App Shell) | #111118 — consistent with ECODrIx console dark theme            |
| Surface                | #1a1a24 — node card backgrounds, panels, drawers                |
| Border                 | #2e2e3e — subtle node outlines and panel borders                |
| Success                | #22c55e — completed node glow, success badge                    |
| Error                  | #ef4444 — failed node outline, error tooltip                    |
| Warning                | #f59e0b — partial success, quota approaching                    |
| Text Primary           | #f1f5f9 — node labels, panel text                               |
| Text Muted             | #6b7280 — node descriptions, secondary info                     |
| Font                   | Inter (body, labels) + JetBrains Mono (code, IDs, log output)   |

---

## Layout and Grid System

- Full-screen canvas layout: top toolbar (80px) + left node library sidebar (280px, collapsible) + canvas (remaining) + right config panel (360px, slides in on node click)
- Canvas uses React Flow default viewport with custom dot-grid background (#0f0f13 with subtle #1a1a24 dots)
- Mini-map: bottom-right corner, 200x140px, dark themed — shows workflow topology at a glance
- Workflow list page: CSS grid, 3 columns on desktop, 1 on mobile, cards with run status badge
- All modals: centred overlay, max-width 480px, dark glass morphism (backdrop-blur + #1a1a24/90)

---

## Node Visual Design

| Node Category     | Color Accent     | Icon Style     | Handle Color |
| ----------------- | ---------------- | -------------- | ------------ |
| Trigger           | #f59e0b (amber)  | Lightning bolt | #f59e0b      |
| Data / Scrape     | #3b82f6 (blue)   | Database       | #3b82f6      |
| AI / Enrichment   | #6366f1 (purple) | Sparkle star   | #6366f1      |
| Validation        | #06b6d4 (cyan)   | Shield check   | #06b6d4      |
| Outreach (WA)     | #22c55e (green)  | WhatsApp logo  | #22c55e      |
| Outreach (Email)  | #84cc16 (lime)   | Envelope       | #84cc16      |
| CRM Push          | #8b5cf6 (violet) | Person + arrow | #8b5cf6      |
| Logic / Condition | #6b7280 (grey)   | Branch fork    | #6b7280      |
| Delay             | #6b7280 (grey)   | Clock          | #6b7280      |
| Storage           | #f97316 (orange) | Cloud upload   | #f97316      |

- Node anatomy: 48px icon container (left accent border in category color) + node name + status badge + lead count chip
- Running state: node border pulses with a glow in category color (CSS animation, 1.5s loop)
- Completed state: top-right green checkmark badge + lead count chip shows N leads passed through
- Failed state: red border + X badge + hover tooltip with error message (max 120 chars)
- Edges: 2px stroke in source node category color, animated marching ants during active run

---

## Navigation Patterns

- ERIX-FLOW entry point: ECODrIx Console Hub top-level tile (consistent with ERIX-CRM and ERIX-LAIE entry)
- Within FLOW: top-level tabs — Workflows | Templates | Run History | Settings
- Canvas breadcrumb: ECODrIx > ERIX-FLOW > [Workflow Name] — always visible in top toolbar
- Back to workflow list: Escape key or breadcrumb click (canvas state auto-saves every 30s)
- No sidebar in canvas view — node library is a floating panel, collapsible to left edge

---

## Empty, Loading, and Error States

- Empty canvas: centered illustration (circuit board with dotted connection lines) + 'Drag a node to start' + 'Or install a template' CTA button in purple
- No workflows yet: workflow list shows centered onboarding card with 3-step graphic: Add nodes > Connect > Run
- Loading canvas: skeleton shimmer on node positions from last saved state while React Flow hydrates
- Node loading (running): spinning ring in category color inside node icon container
- Run failed: red banner below toolbar: 'Run #4 failed at WhatsApp node. View details.' with link to log drawer
- Quota exceeded: amber banner: 'You have used 980/1,000 credits. Top up to continue.' with Razorpay CTA

---

## Node Config Panel UX

- Right drawer slides in at 360px when user clicks any node — canvas does not resize, drawer overlaps right edge
- Panel header: node icon + node type name + Delete node button (destructive, requires confirm)
- Form fields auto-generated from per-node-type Zod schema: text inputs, dropdowns, toggle switches, code editors for webhook payloads
- Inline field help: question-mark icon opens tooltip with field explanation — no separate docs needed
- Save is implicit: every field change debounced 500ms and auto-saved to canvas state
- Test button: available on Scrape, Enrichment, and Outreach nodes — runs node in isolation with 1 sample lead

---

## Retention UX Strategy

- Run streak: console home shows 'FLOW has run X times this week' with a small bar chart — dopamine loop for power users
- Template recommendations: after first successful run, suggest 2 related templates based on workflow category
- Credit nudge: at 80% credit usage, show non-blocking amber chip in toolbar — not a modal interrupt
- Workflow achievement badges: 'First run', '100 leads processed', '1,000 WhatsApps sent' — shown in tenant profile
- Last run summary email: weekly digest via ErixSender showing total leads processed, messages sent, credits used across all workflows

---

## Typography Scale

| Level                | Font           | Size | Weight | Use                                                      |
| -------------------- | -------------- | ---- | ------ | -------------------------------------------------------- |
| Canvas Node Label    | Inter          | 13px | 500    | Node type name inside canvas node card                   |
| Node Lead Count      | Inter          | 11px | 600    | Lead count chip on node corner                           |
| Config Panel Heading | Inter          | 15px | 600    | Right drawer section title                               |
| Config Field Label   | Inter          | 12px | 500    | Form field labels in node config panel                   |
| Run History Table    | Inter          | 13px | 400    | Table row text in run history view                       |
| Log Output           | JetBrains Mono | 12px | 400    | Node execution log entries, error messages               |
| Page Title           | Inter          | 22px | 700    | Workflow list page heading, template marketplace heading |
| Toolbar Breadcrumb   | Inter          | 13px | 400    | ECODrIx > ERIX-FLOW > [Workflow Name]                    |
| Credit Balance       | Inter          | 14px | 600    | Credit balance chip in top toolbar                       |
| Empty State          | Inter          | 16px | 500    | Empty canvas and empty list state headings               |

---

## Accessibility Standards

- WCAG 2.1 AA compliance target for all non-canvas UI (config panels, run history, modals)
- Canvas itself is exempt from keyboard-only navigation in MVP — mouse/trackpad required for node drag
- All interactive elements: minimum 44x44px touch target for future mobile expansion
- Color not used as sole error indicator: failed nodes show red border + X icon + text label
- Focus ring visible on all form fields in config panel (2px purple outline on focus)
- Screen reader support for run history table: aria-labels on status badges (e.g. aria-label='Run completed')
- Contrast ratio minimum 4.5:1 for all text on dark backgrounds — verified with #f1f5f9 text on #1a1a24 surface

---

## Animation Principles

- Canvas node running state: border glow pulse, 1.5s ease-in-out loop, category color at 60% opacity
- Edge animation during active run: marching-ants dash pattern, 0.5s loop, source node color
- Config panel slide-in: 240ms ease-out translateX from right edge — fast enough to feel instant
- Node completion flash: 300ms green flash on node background, fades to normal — confirms success without distraction
- Credit deduction toast: slides in from bottom-right, 200ms, auto-dismiss after 3s
- No animations exceeding 500ms — canvas must feel responsive, not theatrical
- Respect prefers-reduced-motion: all animations disabled, static states shown instead

---

## Assumptions Made

- ECODrIx Console uses dark theme as default — FLOW dark canvas is consistent, not jarring
- React Flow v12 permits full custom node rendering with Tailwind classes
- Inter font is already loaded in ECODrIx console — no additional font load for FLOW
- Mobile users are in view-only mode — no canvas editing on phones (screen too small for node manipulation)
- shadcn/ui component library is already installed in the Next.js console — FLOW reuses existing components

---
