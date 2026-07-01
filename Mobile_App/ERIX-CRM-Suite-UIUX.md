# ERIX CRM Suite — UI/UX Brief
**Version 1.0 | ECODrIx Technologies**

---

## 1. Design Philosophy

Fast, mobile-first, WhatsApp-familiar. Every screen should feel as light to use as a chat app, not as heavy as an enterprise CRM. Reduce clicks-to-action everywhere — the founder using this on a phone between customer calls has no patience for nested menus.

---

## 2. Product Experience Vision

The product should feel like WhatsApp Business had a baby with Trello. Inbox is the home screen. Pipelines and projects are one tap away. Nothing requires a desktop to operate day-to-day.

---

## 3. Brand Direction

Inherits ECODrIx's "Cosmic Eagle" identity — driving digital revolution through intelligence and execution. Clean, confident, technical-but-approachable. No corporate stiffness; visual tone matches the Tier 2 India founder narrative — grounded, direct, no fluff.

---

## 4. Visual Identity

| Token | Value |
|---|---|
| Primary Blue | #2563EB |
| Accent Purple | #7C3AED |
| Fire Red (alerts) | #DC2626 |
| Success Green | #16A34A |
| Neutral Background | #F8FAFC |
| Text Primary | #0F172A |

---

## 5. UI Style Direction

Minimalist card-based layout, generous whitespace on desktop, dense-but-legible on mobile. Rounded corners (8px default), soft shadows only on interactive surfaces (cards, modals). Avoid gradient overload — use accent purple sparingly for CTAs only.

- Inbox threads styled like chat bubbles, channel icon badge top-left of each thread
- Pipeline cards show avatar, deal value, days-in-stage at a glance
- Project boards mirror Trello-familiar column layout

---

## 6. Layout and Grid System

- Desktop: 12-column grid, max content width 1440px
- Sidebar navigation collapses to bottom tab bar on mobile/PWA
- Inbox: 3-pane on desktop (thread list / conversation / contact context), single-pane stack on mobile

---

## 7. Typography Scale

| Level | Font | Size | Weight | Use |
|---|---|---|---|---|
| Display | Inter | 32px | 700 | Dashboard headers |
| H1 | Inter | 24px | 600 | Page titles |
| H2 | Inter | 18px | 600 | Section headers |
| Body | Inter | 14px | 400 | Default text |
| Caption | Inter | 12px | 400 | Timestamps, metadata |

---

## 8. Color System

| Token | Hex | Usage |
|---|---|---|
| Primary | #2563EB | Primary buttons, active nav, links |
| Accent | #7C3AED | Automation/AI feature highlights |
| Danger | #DC2626 | Overdue tasks, failed sends, destructive actions |
| Success | #16A34A | Closed-won deals, delivered messages |
| Muted | #64748B | Secondary text, placeholders |

---

## 9. Component Library

- Chat bubble thread component (inbox core unit)
- Kanban card + column (shared by pipeline and project boards)
- Stage/status pill badges
- Slide-over contact detail panel
- Command palette (Cmd+K) for quick contact/deal search
- Toast notification system for realtime events

---

## 10. Design Tokens

| Token | Value |
|---|---|
| Radius (default) | 8px |
| Radius (pill) | 999px |
| Spacing unit | 4px base scale |
| Shadow (card) | 0 1px 3px rgba(0,0,0,0.08) |
| Transition | 150ms ease-out |

---

## 11. Navigation Patterns

- Desktop: left sidebar — Inbox, Pipelines, Projects, Contacts, Reports, Settings
- Mobile/PWA: bottom tab bar — Inbox, Pipelines, Projects, More
- Global Cmd+K search accessible everywhere on desktop

---

## 12. Dashboard Architecture

Console home shows: unread inbox count, deals needing attention (stuck > 7 days), overdue project tasks, today's activity feed. AWS-style no-sidebar hub pattern consistent with existing ECODrIx console.

- Widget-based, reorderable in future version
- Role-aware: agents see only their assigned items, admins see team-wide

---

## 13. Mobile Responsiveness

- PWA installable from browser, add-to-homescreen prompt on second visit
- Touch targets minimum 44px
- Kanban boards scroll horizontally with snap-to-column on mobile
- Inbox optimized as primary mobile screen — opens directly on app launch

---

## 14. Accessibility Standards

- WCAG AA color contrast minimum across all text/background pairs
- All interactive elements keyboard-navigable on desktop
- Screen-reader labels on icon-only buttons (send, assign, archive)

---

## 15. Empty / Loading / Error States

- Inbox empty state: "No conversations yet — connect WhatsApp to get started" with CTA
- Pipeline empty state: template pipeline suggestion based on business type
- Skeleton loaders for inbox thread list and pipeline board on initial load
- Error toast with retry action on failed sends, never silent failure

---

## 16. Notification System

- Push notifications (PWA Web Push) for new inbox messages, deal stage changes assigned to user, overdue tasks
- In-app notification bell with unread count
- Digest option: daily summary WhatsApp message (dogfooding own product)

---

## 17. Modal and Overlay Guidelines

- Contact detail opens as slide-over panel, not full-page navigation
- Destructive actions (delete deal, remove contact) require confirmation modal
- Automation rule builder opens as full-screen modal on mobile, side panel on desktop

---

## 18. Animation Principles

- Micro-interactions only — card drag, toast slide-in, tab switch
- No decorative animation that delays task completion
- Drag-drop on pipeline board uses spring physics for natural feel

---

## 19. Interaction Design

- Drag-and-drop primary interaction for pipeline/project stage changes
- Swipe actions on mobile inbox threads (archive, assign)
- Inline editing on contact fields — no separate edit mode

---

## 20. Design Inspirations

Linear (speed, keyboard-first), WhatsApp Business App (familiarity), Trello (kanban simplicity), Notion (lightweight flexibility) — combined, not copied, into a WhatsApp-native CRM identity.

---

## 21. Design System Rules

- Never introduce a new color outside the defined token set without design review
- Every new component must have empty, loading, and error states defined before build
- Mobile-first: design the PWA screen before the desktop screen for every new feature

---

## 22. Retention UX Strategy

- Daily-active loop: inbox is the reason to open the app every day, not just pipeline review
- Weekly digest WhatsApp message drives founders back in even without opening the app
- Streak-style "response time" badge to gamify fast replies (SLA under 5 min)

---

## Assumptions Made

- Brand colors inherited directly from existing ECODrIx brand system, no new palette introduced
- Inbox is treated as the primary daily-use surface, driving all navigation priority decisions
- PWA-first design approach; native app UI will largely mirror PWA patterns for consistency
