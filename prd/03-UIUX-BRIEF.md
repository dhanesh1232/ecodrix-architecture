# ECODrIx — UI/UX Design Brief
**Version:** 1.0 | **Date:** May 2026

---

## 1. Design Philosophy

ECODrIx is designed for Indian SMB owners who are NOT tech-savvy. They use WhatsApp daily but may never have used a CRM. The UI must be:
- **Instantly familiar** — WhatsApp-like patterns for messaging, Google-like for search
- **Zero learning curve** — every action discoverable without documentation
- **Dark by default** — professional, modern, reduces eye strain for all-day use
- **Information-dense but not cluttered** — show what matters, hide what doesn't
- **AI-first** — AI suggestions are prominent, not buried in menus

---

## 2. Visual Identity

| Token | Value | Usage |
|-------|-------|-------|
| Background Base | `#0A1628` | Main app background |
| Background Surface | `#0F2040` | Cards, sidebar, panels |
| Background Elevated | `#1A3050` | Hover, dropdowns, modals |
| Accent Primary | `#1E7AFF` | Buttons, links, active states |
| Accent Secondary | `#FF6B1A` | Alerts, badges, CTAs, AI suggestions |
| Text Primary | `#FFFFFF` | Headings, body text |
| Text Secondary | `#8FA8C8` | Labels, descriptions |
| Text Disabled | `#3A5070` | Placeholder, disabled |
| Success | `#22C55E` | Won deals, paid invoices, connected |
| Warning | `#F59E0B` | Pending, overdue, attention needed |
| Error | `#EF4444` | Failed, lost, disconnected |
| Border | `#1E3A5A` | Card borders, dividers |

**Typography:**
- Body: Inter (400, 500, 600)
- Code/Metrics: JetBrains Mono (400, 500)
- Headings: Inter (600, 700)

**Dark mode is the ONLY mode.** No light mode toggle.

---

## 3. Layout Patterns

### Console (Main Hub) — NO Sidebar
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] ECODrIx Console    [Search]  [🔔 3]  [Avatar ▾]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, Dhanesh              Plan: Pro ●             │
│                                                             │
│  ┌─── PRODUCTS ─────────────────────────────────────────┐  │
│  │  [ERIX Card]        [LAIE Card]                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─── INFRASTRUCTURE ───────────────────────────────────┐  │
│  │  [Email]  [Storage]  [ErixStore]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─── ACTIVITY + USAGE ─────────────────────────────────┐  │
│  │  Recent events...        Usage meters...             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Product Module (ERIX/LAIE) — Own Sidebar
```
┌─────────────────────────────────────────────────────────────┐
│  ← Console    ERIX CRM                [🔔]  [Avatar ▾]     │
├───────────┬─────────────────────────────────────────────────┤
│ Inbox (3) │                                                 │
│ Contacts  │  (page content)                                 │
│ Pipeline  │                                                 │
│ Templates │                                                 │
│ Invoices  │                                                 │
│ Automation│                                                 │
│ Settings  │                                                 │
└───────────┴─────────────────────────────────────────────────┘
```

---

## 4. Component Patterns

**Cards:**
```css
bg-[#0F2040] border border-[#1E3A5A] rounded-lg p-4
hover:border-[#1E7AFF]/50 transition-colors
```

**Primary Button:**
```css
bg-[#1E7AFF] hover:bg-[#1E7AFF]/90 text-white font-medium rounded-md px-4 py-2
```

**Orange CTA:**
```css
bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-medium rounded-md px-4 py-2
```

**Input:**
```css
bg-[#0A1628] border border-[#1E3A5A] text-white placeholder:text-[#3A5070] rounded-md px-3 py-2
focus:border-[#1E7AFF] focus:ring-1 focus:ring-[#1E7AFF]/50
```

**Sidebar Active:**
```css
border-l-2 border-[#1E7AFF] bg-[#1E7AFF]/10 text-white
```

**Badge (stage colors):**
- New: `bg-[#3A5070]/20 text-[#8FA8C8]`
- Contacted: `bg-[#1E7AFF]/10 text-[#1E7AFF]`
- Qualified: `bg-[#F59E0B]/10 text-[#F59E0B]`
- Proposal: `bg-[#8B5CF6]/10 text-[#8B5CF6]`
- Won: `bg-[#22C55E]/10 text-[#22C55E]`
- Lost: `bg-[#EF4444]/10 text-[#EF4444]`

---

## 5. Key Screen Designs

### WhatsApp Inbox (Split-Pane)
- Left (35%): Thread list with avatar, name, last message preview, timestamp, unread badge
- Right (65%): Conversation with message bubbles, composer, contact header
- Inbound bubbles: left-aligned, surface color
- Outbound bubbles: right-aligned, primary blue
- AI suggestions: orange-bordered card above composer

### Pipeline Kanban
- 6 columns (configurable stages)
- Cards: name, company, value, last activity, assigned avatar
- Drag-and-drop with visual feedback
- Column headers: stage name + count + total value
- Swimlanes option (group by assignee)

### Invoice Builder
- Split view: form (left) + live preview (right)
- Line items table with add/remove
- Auto-calculate subtotal, tax, total
- Action buttons: Download PDF, Send WhatsApp, Copy Payment Link

### Automation Builder (React Flow)
- Left sidebar: node palette (triggers, conditions, actions)
- Center: canvas with connected nodes
- Right panel: selected node properties
- Bottom: test run button, save, activate toggle

---

## 6. Empty / Loading / Error States

**Loading:** Skeleton cards matching the layout shape (pulsing animation)
**Empty:** Illustration + headline + description + CTA button
**Error:** Red-bordered card with error message + "Retry" button

Every data-fetching component MUST have all three states.

---

## 7. Retention UX Strategy

- **Onboarding checklist** (5 steps, dismissible after completion)
- **Daily AI briefing** notification (pulls user back every morning)
- **Streak counter** ("You've responded to all leads for 7 days straight")
- **Usage milestones** ("You've sent 1,000 messages! 🎉")
- **Waitlist combo banner** (urgency: "77 spots remain")
- **Smart notifications** (only notify for actionable items, never spam)

---

## 8. Accessibility Standards

- WCAG 2.1 AA minimum
- All interactive elements: keyboard navigable
- Color contrast: 4.5:1 minimum for text
- Focus indicators: visible ring on all focusable elements
- Screen reader: proper ARIA labels on all components
- Touch targets: minimum 44x44px on mobile

---

## 9. Assumptions Made

- Dark mode is preferred by the target audience (professional, modern perception)
- Indian SMB users are familiar with WhatsApp UI patterns (leverage for inbox design)
- Mobile-responsive is sufficient for Year 1 (dedicated mobile app in Year 2)
- shadcn/ui provides enough component coverage (no need for custom design system from scratch)
- React Flow is performant enough for automation builders with <100 nodes
