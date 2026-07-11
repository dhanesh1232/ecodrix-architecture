# ECODrIx Design System

### Version 2.0 · ECODrIx Digital Studio · Tirupati, AP

### MSME: UDYAM-AP-23-0027846 · Meta Tech Provider · GST: 37GHCPM6574C1Z5

---

## Changelog

| Version | Date    | Changes                                                                                                                                                  |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-01 | Initial doc — colors, type, layout, components, responsive                                                                                               |
| 2.0     | 2026-01 | + Token JSON file · + Per-product color table · + Component state matrix · + Contrast ratio table (GIGW 3.0) · + Motion system · + Dark-mode delta table |

---

## Overview

ECODrIx's marketing and product surface runs on a **dual-mode canvas** — white (`{colors.canvas-light}` — #FFFFFF) for daylight and near-black (`{colors.canvas-dark}` — #0B1120) for dark mode — both carrying identical component structure. Only CSS token values flip between modes. No layout changes. No component restructuring.

The brand's three logo-extracted colors — **Primary Blue** (`{colors.primary-500}` — #2563EB from the E/X letters), **Accent Purple** (`{colors.accent-500}` — #7C3AED from the arc/swish), and **Fire Red** (`{colors.fire-500}` — #DC2626 from the i dot) — carry all brand signal. No fourth brand color is ever introduced. Every button, gradient, badge, active state, and hover effect traces back to exactly one of these three hexes or a gradient between them.

The **brand gradient** (`{colors.gradient-brand}` — #2563EB → #7C3AED → #DC2626) mirrors the color arc in the ECODrIx logo and appears exclusively as a **foreground signal**: gradient CTA button fill, headline word-highlight, card top-stripe reveal, and stripe divider. Never as a background fill.

Type runs **Syne** (800/700) for display + **Inter** (600/500/400) for all UI chrome and body. The boundary is strict and non-negotiable.

**Key Characteristics:**

- Dual-mode canvas. Pure white light / blue-undertoned dark. Identical structure both modes.
- Three logo-extracted brand colors. No additions.
- Brand gradient on CTAs and accents — foreground only, never background fill.
- Syne 800/700 display. Inter 400/500/600 body/UI. Boundary strict.
- `{rounded.lg}` (12px) dominant card radius. `{rounded.md}` (10px) dominant button/input radius. `{rounded.full}` for pills/badges.
- `{spacing.section}` (96px) between every major page band.
- Six products, each with an assigned brand color. Same three-color family, differentiated by assignment.
- Full token system: `ecodrix-tokens.json` → `ecodrix-tokens.css` → `ecodrix-tailwind.config.js`.

---

## Token System

### Source of Truth

```
ecodrix-tokens.json          ← Single source. Edit only here.
  └── ecodrix-tokens.css     ← Generated CSS custom properties
  └── ecodrix-tailwind.config.js  ← Generated Tailwind config
```

All three files ship together. No inline hex values in components — always `var(--color-primary-500)` or `bg-primary-500`. When a hex needs to change, it changes in `ecodrix-tokens.json` only and regenerates downstream.

### Token Naming Convention

```
{category}.{family}.{shade}

color.primary.500        → #2563EB
color.accent.500         → #7C3AED
color.fire.500           → #DC2626
color.gradient.brand     → linear-gradient(135deg, #2563EB, #7C3AED, #DC2626)
color.surface.light.card → #FFFFFF
color.surface.dark.card  → #111E33
color.text.light.ink     → #0F172A
color.text.dark.ink      → #F1F5F9
color.semantic.error     → #EF4444
color.product.crm        → #2563EB
spacing.section          → 96px
borderRadius.lg          → 12px
motion.duration.base     → 200ms
motion.easing.standard   → cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Colors

### Brand (Logo-Extracted — Never Change)

- **Primary 500** (`{colors.primary-500}` — #2563EB): From E/X letters. CTA buttons, links, active nav, focus rings, gradient first-stop.
- **Primary 600** (`{colors.primary-600}` — #1D4ED8): Hover/pressed on primary buttons only.
- **Primary 800** (`{colors.primary-800}` — #1E3A8A): Dark surface tint, card borders on dark canvas.
- **Accent 500** (`{colors.accent-500}` — #7C3AED): From arc/swish. Early access, premium badges, accent CTA, gradient mid-stop.
- **Accent 600** (`{colors.accent-600}` — #6D28D9): Hover/pressed on accent buttons only.
- **Fire 500** (`{colors.fire-500}` — #DC2626): From i dot. Gradient end-stop, urgency callouts, erix-connect product color.
- **Fire 600** (`{colors.fire-600}` — #B91C1C): Hover/pressed on fire elements only.

Full 50–900 scales exist for all three — see `ecodrix-tokens.json`.

### Gradients

| Token                          | Value                       | Use                                                                          |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------- |
| `{colors.gradient-cosmic}`     | #2563EB → #7C3AED           | Stat numbers, eyebrow accents, nav hover                                     |
| `{colors.gradient-phoenix}`    | #7C3AED → #DC2626           | Early access, urgency callouts                                               |
| `{colors.gradient-brand}`      | #2563EB → #7C3AED → #DC2626 | Primary CTA fill, hero word-highlight, card top-stripe, brand-stripe divider |
| `{colors.gradient-brand-dark}` | #1D4ED8 → #6D28D9 → #B91C1C | Hover/pressed state of gradient-brand via `::after` overlay                  |

### Surface Tokens

| Token                  | Light                 | Dark               |
| ---------------------- | --------------------- | ------------------ |
| `{colors.bg}`          | #FFFFFF               | #0B1120            |
| `{colors.bg-subtle}`   | #F8FAFF               | #111827            |
| `{colors.bg-card}`     | #FFFFFF               | #111E33            |
| `{colors.bg-elevated}` | #F1F5FF               | #162040            |
| `{colors.bg-overlay}`  | rgba(255,255,255,0.9) | rgba(11,17,32,0.9) |

### Border Tokens

| Token                          | Light               | Dark                 |
| ------------------------------ | ------------------- | -------------------- |
| `{colors.border}`              | #E2E8F0             | #1E2D4A              |
| `{colors.border-brand}`        | rgba(37,99,235,0.2) | rgba(37,99,235,0.25) |
| `{colors.border-brand-strong}` | rgba(37,99,235,0.4) | rgba(37,99,235,0.45) |

### Text Tokens

| Token                  | Light   | Dark           |
| ---------------------- | ------- | -------------- |
| `{colors.text-ink}`    | #0F172A | #F1F5F9        |
| `{colors.text-body}`   | #334155 | #CBD5E1        |
| `{colors.text-muted}`  | #64748B | #64748B (same) |
| `{colors.text-subtle}` | #94A3B8 | #334155        |

### Semantic (System Feedback — Not Brand)

| Token              | Value   | Use                                  | Critical Note                                    |
| ------------------ | ------- | ------------------------------------ | ------------------------------------------------ |
| `{colors.success}` | #16A34A | Live status, confirmations           | Not brand                                        |
| `{colors.warning}` | #D97706 | Quota alerts, billing overdue        | Not brand                                        |
| `{colors.error}`   | #EF4444 | Form validation, destructive confirm | **DISTINCT from `{colors.fire-500}` #DC2626**    |
| `{colors.info}`    | #0EA5E9 | Onboarding tips, banners             | **DISTINCT from `{colors.primary-500}` #2563EB** |

---

## Per-Product Color Assignment

Each product maps to one of the three brand colors. No new colors introduced. Icon and top-stripe visually differentiate products sharing the same color family.

| Product          | Color Token                | Hex             | Rationale                                                    |
| ---------------- | -------------------------- | --------------- | ------------------------------------------------------------ |
| **erix-crm**     | `{colors.primary-500}`     | #2563EB         | Blue = trust, communication. WhatsApp CRM primary product.   |
| **erix-laie**    | `{colors.accent-500}`      | #7C3AED         | Purple = intelligence, insight. Lead discovery engine.       |
| **erix-flow**    | `{colors.gradient-cosmic}` | #2563EB→#7C3AED | Gradient = movement, pipeline. Automation flows.             |
| **erix-connect** | `{colors.fire-500}`        | #DC2626         | Red = energy, broadcast, reach. Meta Cloud API gateway.      |
| **erix-store**   | `#475569` (slate)          | Slate neutral   | Infrastructure — should recede, not compete with product UI. |
| **erix-storage** | `{colors.primary-500}`     | #2563EB         | Shares blue with CRM. Icon (🗄️ vs 💬) differentiates.        |

### Product Color Usage Rules

- Card top-stripe → use product color
- Product icon container → 15% opacity tint of product color
- Badge → product-color tinted bg + product-color text
- In product detail pages → product color dominates the hero; other brand colors recede
- In cross-product landing (homepage) → all three colors appear; no single product dominates

---

## Typography

### Font Family

**Syne** (variable, 400–800) — display typeface. Used at weights 700 and 800 only. Never at 400 (blurs display/body boundary). Fallback: `system-ui, -apple-system, sans-serif`.

**Inter** (variable, 100–900) — UI and body typeface. Used at 400, 500, 600. Never 700+ (that's Syne's territory for display). Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

**JetBrains Mono** — code typeface. Used at 400 only. For SDK docs, API examples, erix-buddy CLI output.

### Hierarchy

| Token                | Size | Weight | Family         | LH   | LS       | Use                               |
| -------------------- | ---- | ------ | -------------- | ---- | -------- | --------------------------------- |
| `{type.display-xl}`  | 72px | 800    | Syne           | 1.0  | -0.025em | Hero h1                           |
| `{type.display-lg}`  | 52px | 800    | Syne           | 1.05 | -0.02em  | Section heads                     |
| `{type.display-md}`  | 40px | 700    | Syne           | 1.1  | -0.02em  | Product names, subsection leaders |
| `{type.display-sm}`  | 32px | 700    | Syne           | 1.15 | -0.015em | CTA heads, pricing headers        |
| `{type.title-lg}`    | 24px | 700    | Syne           | 1.3  | -0.01em  | Card titles 3-up grid             |
| `{type.title-md}`    | 20px | 600    | Inter          | 1.4  | 0        | Card sub-titles, modal heads      |
| `{type.title-sm}`    | 18px | 600    | Inter          | 1.4  | 0        | Spec callouts, intro paragraphs   |
| `{type.label-upper}` | 13px | 700    | Inter          | 1.3  | 0.08em   | Eyebrows, badges — UPPERCASE      |
| `{type.body-lg}`     | 18px | 400    | Inter          | 1.75 | 0        | Hero sub-copy, lead text          |
| `{type.body-md}`     | 16px | 400    | Inter          | 1.65 | 0        | Default body                      |
| `{type.body-sm}`     | 14px | 400    | Inter          | 1.6  | 0        | Footer, legal, metadata           |
| `{type.caption}`     | 12px | 500    | Inter          | 1.4  | 0.02em   | Timestamps, credits               |
| `{type.button}`      | 14px | 600    | Inter          | 1.0  | 0.02em   | All button labels                 |
| `{type.nav-link}`    | 14px | 500    | Inter          | 1.4  | 0.01em   | Nav items                         |
| `{type.code}`        | 13px | 400    | JetBrains Mono | 1.6  | 0        | Code, API refs                    |

### Principles

Syne 800 at `{type.display-xl}` (72px) is the loudest voice. Body runs Inter 400 — the gap is the signature. Never introduce weight 500 Syne or 700 Inter; both blur the hierarchy.

`{type.label-upper}` uses 0.08em tracking — the "machined label" quality. All section eyebrows use this UPPERCASE.

Gradient text applies only at `{type.display-*}` and `{type.title-lg}` — illegible at body sizes.

Mobile hero: `{type.display-xl}` 72px collapses to 40px at < 768px.

---

## Layout

### Spacing

| Token               | Value | Primary Use                 |
| ------------------- | ----- | --------------------------- |
| `{spacing.xxs}`     | 4px   | Icon gap, dot spacing       |
| `{spacing.xs}`      | 8px   | Inline element gap          |
| `{spacing.sm}`      | 12px  | Tag row gap, tight stacks   |
| `{spacing.md}`      | 16px  | Standard gap, footer column |
| `{spacing.lg}`      | 24px  | Card padding, grid gutter   |
| `{spacing.xl}`      | 40px  | Modal padding, btn-xl       |
| `{spacing.xxl}`     | 64px  | Hero band internal          |
| `{spacing.section}` | 96px  | Between every major band    |

### Grid

- Max container: 1100px centered
- Hero: `grid-template-columns: 1.1fr 0.9fr` → single col mobile
- Products/Pricing: `repeat(3, 1fr)` → 2-up tablet → 1-up mobile
- Stats: `1fr auto 1fr auto 1fr auto 1fr` (4 values + 3 dividers)
- Footer: 3-col desktop → 1-col mobile

---

## Elevation & Depth

| Level    | Treatment                         | Use                                |
| -------- | --------------------------------- | ---------------------------------- |
| Flat     | No shadow, no border              | Page floor, nav, footer            |
| Hairline | 1px `{colors.border}`             | Card outlines, table rows, inputs  |
| Card     | `{colors.bg-card}` + hairline     | Product cards, pricing cards       |
| Hover    | hairline-brand + `{shadow.hover}` | Card hover state                   |
| Featured | `{shadow.featured}` (brand glow)  | Featured pricing card, hero mockup |

---

## Dark-Mode Delta Table

Only the tokens that change between `[data-theme="light"]` and `[data-theme="dark"]`. Everything else stays identical.

| Token                   | Light Value                      | Dark Value                   |
| ----------------------- | -------------------------------- | ---------------------------- |
| `--bg`                  | #FFFFFF                          | #0B1120                      |
| `--bg-subtle`           | #F8FAFF                          | #111827                      |
| `--bg-card`             | #FFFFFF                          | #111E33                      |
| `--bg-elevated`         | #F1F5FF                          | #162040                      |
| `--bg-overlay`          | rgba(255,255,255,0.9)            | rgba(11,17,32,0.9)           |
| `--border`              | #E2E8F0                          | #1E2D4A                      |
| `--border-brand`        | rgba(37,99,235,0.2)              | rgba(37,99,235,0.25)         |
| `--border-brand-strong` | rgba(37,99,235,0.4)              | rgba(37,99,235,0.45)         |
| `--text-ink`            | #0F172A                          | #F1F5F9                      |
| `--text-body`           | #334155                          | #CBD5E1                      |
| `--text-subtle`         | #94A3B8                          | #334155                      |
| `--nav-bg`              | rgba(255,255,255,0.9)            | rgba(11,17,32,0.9)           |
| `--nav-border`          | rgba(37,99,235,0.12)             | rgba(37,99,235,0.15)         |
| `--shadow-hover`        | 0 20px 40px rgba(37,99,235,0.12) | 0 20px 40px rgba(0,0,0,0.4)  |
| `--shadow-mockup`       | 0 24px 60px rgba(37,99,235,0.1)… | 0 24px 60px rgba(0,0,0,0.4)… |
| `--badge-blue-bg`       | var(--color-primary-100)         | rgba(37,99,235,0.12)         |
| `--badge-blue-text`     | var(--color-primary-700)         | var(--color-primary-400)     |
| `--badge-purple-bg`     | var(--color-accent-100)          | rgba(124,58,237,0.12)        |
| `--badge-purple-text`   | var(--color-accent-700)          | var(--color-accent-400)      |
| `--badge-fire-bg`       | var(--color-fire-100)            | rgba(220,38,38,0.12)         |
| `--badge-fire-text`     | var(--color-fire-600)            | var(--color-fire-400)        |
| `--icon-blue-bg`        | rgba(37,99,235,0.1)              | rgba(37,99,235,0.15)         |
| `--icon-purple-bg`      | rgba(124,58,237,0.1)             | rgba(124,58,237,0.15)        |
| `--icon-fire-bg`        | rgba(220,38,38,0.1)              | rgba(220,38,38,0.15)         |
| `--hero-glow`           | rgba(37,99,235,0.07)…            | rgba(37,99,235,0.1)…         |
| `--line-opacity`        | 0.1                              | 0.15                         |

**Tokens that do NOT change between modes** (same value both themes):
`--color-primary-*` (all 10 shades) · `--color-accent-*` · `--color-fire-*` · `--gradient-*` · `--color-success/warning/error/info` · `--text-muted` (#64748B) · `--font-*` · `--text-*` (scale) · `--weight-*` · `--space-*` · `--radius-*` · `--duration-*` · `--ease-*`

---

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                                |
| ---------------- | ------ | -------------------------------------------------- |
| `{rounded.none}` | 0px    | Spec cells, horizontal rules                       |
| `{rounded.xs}`   | 4px    | Micro tags, status dots                            |
| `{rounded.sm}`   | 6px    | Dropdown items, small chips                        |
| `{rounded.md}`   | 10px   | **DEFAULT INTERACTIVE** — all buttons, all inputs  |
| `{rounded.lg}`   | 12px   | **DEFAULT CARD** — product, pricing, feature cards |
| `{rounded.xl}`   | 16px   | Dashboard mockup, modals, hero card                |
| `{rounded.2xl}`  | 24px   | Large feature panels, CTA containers               |
| `{rounded.full}` | 9999px | Badges, pills, avatar chips, icon buttons          |

---

## Motion System

### Duration Scale

| Token                        | Value     | Use                                         |
| ---------------------------- | --------- | ------------------------------------------- |
| `{motion.duration.instant}`  | 80ms      | Focus rings, checkbox toggles               |
| `{motion.duration.fast}`     | 150ms     | Button fills, badge color shifts            |
| `{motion.duration.base}`     | **200ms** | **DEFAULT** — card hover, borders, shadows  |
| `{motion.duration.moderate}` | 300ms     | Dropdown open, tooltip fade, modal backdrop |
| `{motion.duration.slow}`     | 500ms     | Page section reveals, hero entrance         |
| `{motion.duration.float}`    | 6000ms    | Dashboard mockup float cycle                |

### Easing Scale

| Token                      | Value                             | Use                                              |
| -------------------------- | --------------------------------- | ------------------------------------------------ |
| `{motion.ease.standard}`   | cubic-bezier(0.4, 0, 0.2, 1)      | **DEFAULT** — all unless specified               |
| `{motion.ease.decelerate}` | cubic-bezier(0, 0, 0.2, 1)        | Elements entering (dropdown open, modal appear)  |
| `{motion.ease.accelerate}` | cubic-bezier(0.4, 0, 1, 1)        | Elements leaving (dropdown close, modal dismiss) |
| `{motion.ease.spring}`     | cubic-bezier(0.34, 1.56, 0.64, 1) | Tactile bounce on button press, badge pop        |

### Keyframe Library

| Name               | Pattern                                          | Used On                                  |
| ------------------ | ------------------------------------------------ | ---------------------------------------- |
| `float`            | translateY(0) → translateY(-8px) → translateY(0) | Dashboard mockup. 6s. Desktop only.      |
| `pulse-dot`        | opacity 1→0.3→1, scale 1→0.6→1                   | Hero eyebrow live dot. 2s.               |
| `fade-up`          | opacity 0→1, translateY(16px→0)                  | Section content reveal on scroll. 500ms. |
| `scale-in`         | opacity 0→1, scale 0.95→1                        | Modal open, dropdown appear. 300ms.      |
| `skeleton-shimmer` | backgroundPosition 200%→-200%                    | Skeleton loading cards. 1.5s.            |
| `spin`             | rotate 0→360deg                                  | Button loading spinner. 0.7s linear.     |

### Reduced Motion Rules

```css
@media (prefers-reduced-motion: reduce) {
  /* All transitions: 0ms */
  /* float keyframe: disabled (hero mockup stays static) */
  /* pulse-dot: static at opacity: 1 */
  /* fade-up / scale-in: instant (no animation) */
  /* skeleton-shimmer: disabled (static bg color) */
}
```

**Decision:** ECODrIx respects `prefers-reduced-motion` on all keyframe animations. The `float` animation is additionally disabled on touch devices (battery consideration via `@media (hover: none)`).

---

## Component State Matrix

Every interactive component must implement all states below. No component ships without the full matrix.

### Button States

| State              | Visual Treatment                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **Default**        | Brand color fill / border / label. No shadow.                                                       |
| **Hover**          | Color darkens (600 variant). `translateY(-1px)`. Brand shadow appears. Transition: 150ms fast.      |
| **Active/Pressed** | Color darkens further (700 variant). `translateY(0)` — returns to baseline. Spring easing.          |
| **Focus-visible**  | 2px `{colors.primary-500}` outline, 2px offset. Required for keyboard nav (WCAG 2.4.7).             |
| **Disabled**       | `opacity: 0.45`. `cursor: not-allowed`. `pointer-events: none`. No hover/shadow effects.            |
| **Loading**        | Label hidden (`color: transparent`). Centered 16px spinning border circle overlaid. `cursor: wait`. |

### Input States

| State        | Border                             | Shadow                          | Label Color            | Helper Text                 |
| ------------ | ---------------------------------- | ------------------------------- | ---------------------- | --------------------------- |
| **Default**  | `{colors.border}` 1.5px            | None                            | `{colors.text-body}`   | `{colors.text-muted}`       |
| **Focus**    | `{colors.primary-500}` 1.5px       | `0 0 0 3px rgba(37,99,235,0.1)` | `{colors.text-ink}`    | `{colors.text-muted}`       |
| **Filled**   | `{colors.border}` 1.5px            | None                            | `{colors.text-body}`   | `{colors.text-muted}`       |
| **Error**    | `{colors.error}` (#EF4444) 1.5px   | `0 0 0 3px rgba(239,68,68,0.1)` | `{colors.text-body}`   | `{colors.error}` + ⚠ icon   |
| **Success**  | `{colors.success}` (#16A34A) 1.5px | `0 0 0 3px rgba(22,163,74,0.1)` | `{colors.text-body}`   | `{colors.success}` + ✓ icon |
| **Disabled** | `{colors.border}` 1.5px            | None                            | `{colors.text-subtle}` | `{colors.text-subtle}`      |

### Card States

| State               | Border                       | Shadow              | Transform               |
| ------------------- | ---------------------------- | ------------------- | ----------------------- |
| **Default**         | `{colors.border}` 1px        | None                | None                    |
| **Hover**           | `{colors.border-brand}` 1px  | `{shadow.hover}`    | `translateY(-3px)`      |
| **Active/Selected** | `{colors.primary-500}` 1.5px | `{shadow.featured}` | None                    |
| **Skeleton**        | `{colors.border}` 1px        | None                | Shimmer animation on bg |
| **Disabled**        | `{colors.border}` 1px        | None                | `opacity: 0.5`          |

### Badge States

| State                        | Treatment                                        |
| ---------------------------- | ------------------------------------------------ |
| **Default**                  | Tinted bg + matching text + `{rounded.full}`     |
| **Interactive (clickable)**  | Hover: border appears at `{colors.border-brand}` |
| **Active (filter selected)** | Full `{colors.primary-500}` bg + white text      |
| **Disabled**                 | `opacity: 0.4`                                   |

### Pricing Card States

| State                       | Treatment                                                            |
| --------------------------- | -------------------------------------------------------------------- |
| **Default**                 | `{colors.border}` hairline, flat bg                                  |
| **Featured (Most Popular)** | `{colors.primary-500}` border, gradient tint bg, `{shadow.featured}` |
| **Early Access**            | `{colors.accent-500}` border, purple tint bg                         |
| **Hover (any card)**        | `translateY(-2px)` + `{shadow.hover}`                                |
| **CTA button inside**       | Follows button state matrix above                                    |

### Nav States

| State                     | Treatment                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| **Default**               | `{colors.text-muted}` label                                      |
| **Hover**                 | `{colors.primary-500}` label. Transition: 150ms                  |
| **Active (current page)** | `{colors.text-ink}` label + 2px `{colors.primary-500}` underline |
| **Mobile open**           | Full-height overlay. `{colors.bg-card}` bg. Brand stripe at top. |

---

## Accessibility & Contrast

### Contrast Ratio Matrix

All ratios calculated per WCAG 2.1 relative luminance formula. Standard: **GIGW 3.0** (India) requires AA minimum (4.5:1 text, 3:1 UI components).

| Foreground                 | Background          | Ratio  | AA Text    | AAA Text | UI Component | Status                                 |
| -------------------------- | ------------------- | ------ | ---------- | -------- | ------------ | -------------------------------------- |
| #2563EB primary            | #FFFFFF white       | 4.65:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Use at 600+ weight                     |
| #7C3AED accent             | #FFFFFF white       | 5.91:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Comfortable margin                     |
| #DC2626 fire               | #FFFFFF white       | 4.55:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Borderline — 600+ weight required      |
| #FFFFFF white              | #2563EB primary     | 4.65:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Button label — 600 weight min          |
| #FFFFFF white              | #7C3AED accent      | 5.91:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Button label — comfortable             |
| #FFFFFF white              | #DC2626 fire        | 4.55:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Button label — 600 weight min          |
| #0F172A ink                | #FFFFFF white       | 18.1:1 | ✅ Pass    | ✅ Pass  | ✅ Pass      | Primary text — always passes           |
| #F1F5F9 ink-dark           | #0B1120 canvas-dark | 17.2:1 | ✅ Pass    | ✅ Pass  | ✅ Pass      | Dark mode primary text — always        |
| #334155 body-light         | #FFFFFF white       | 9.73:1 | ✅ Pass    | ✅ Pass  | ✅ Pass      | Body text — always passes              |
| #CBD5E1 body-dark          | #0B1120 canvas-dark | 9.18:1 | ✅ Pass    | ✅ Pass  | ✅ Pass      | Dark body — always passes              |
| #64748B muted              | #FFFFFF white       | 5.74:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Secondary text — passes AA             |
| #64748B muted              | #0B1120 canvas-dark | 4.61:1 | ✅ Pass    | ❌ Fail  | ✅ Pass      | Dark muted — borderline AA             |
| #94A3B8 subtle             | #FFFFFF white       | 2.85:1 | ❌ FAIL    | ❌ Fail  | ✅ Pass      | **Placeholder/disabled only**          |
| #334155 subtle-dark        | #0B1120 canvas-dark | 2.12:1 | ❌ FAIL    | ❌ Fail  | ❌ Fail      | **Disabled states only, never text**   |
| Gradient (#2563EB→#DC2626) | #FFFFFF white       | varies | ⚠️ Partial | ❌ Fail  | ✅ Pass      | Only at display-xl/lg/md. 700+ weight. |

### Action Items from Contrast Audit

1. **Fire red (#DC2626) on white** — borderline. Always enforce `font-weight: 600` minimum on any fire-colored text. Never use fire as body-size text.
2. **Subtle tokens** (#94A3B8 light / #334155 dark) — fail AA for text. Restricted to placeholders and disabled states only. Never for readable content.
3. **Gradient text** — use exclusively at `{type.display-xl}` and `{type.display-lg}` (72px/52px at weight 800). At smaller sizes gradient text fails both aesthetically and on contrast.
4. **GIGW 3.0 compliance** — all non-subtle text tokens pass AA minimum. Primary, accent, fire on their respective backgrounds pass UI component threshold (3:1). System is GIGW compliant as specified.

### Touch Targets

| Component                  | Size                                   | WCAG 2.5.5                                     |
| -------------------------- | -------------------------------------- | ---------------------------------------------- |
| `{component.btn-sm}`       | 36px height                            | ⚠️ Below 44px — pad vertical container to 44px |
| `{component.btn-md}`       | 40px height                            | ⚠️ Below 44px — pad vertical container to 44px |
| `{component.btn-lg}`       | 48px height                            | ✅ Pass                                        |
| `{component.btn-xl}`       | 52px height                            | ✅ Pass                                        |
| `{component.text-input}`   | 44px height                            | ✅ Pass                                        |
| `{component.button-icon}`  | 48×48px                                | ✅ Pass                                        |
| `{component.category-tab}` | 12px v-padding → ~44px effective       | ✅ Pass                                        |
| `{component.nav-link}`     | 68px nav height → full-height hit area | ✅ Pass                                        |

**Note on btn-sm and btn-md:** These are below 44px height but appear in nav clusters and card footers where surrounding whitespace creates an effective 44px touch zone. If used in isolation (e.g., standalone inline button), add `min-height: 44px` to the element or its wrapper.

---

## Components

### Top Navigation (`{component.top-nav}`)

68px fixed bar. `{colors.bg-overlay}` + `backdrop-filter: blur(20px)`. Bottom border: 1px `{colors.nav-border}`. Left: logo pill (gradient bg, "ECODrIx" white). Center: menu links. Right: ghost login + fire CTA.

**States:** Default / Mobile collapsed / Mobile overlay open (full-height, brand stripe at top).

### Buttons

**`{component.btn-primary}`** — Blue. `{colors.primary-500}` fill. White text. `{rounded.md}`. See state matrix.
**`{component.btn-accent}`** — Purple. `{colors.accent-500}` fill. White text. Early access contexts only.
**`{component.btn-fire}`** — Gradient. `{colors.gradient-brand}` fill. White text. Max one per section. Hero CTA.
**`{component.btn-outline}`** — Transparent. `{colors.primary-500}` border + text. Hover: fills primary.
**`{component.btn-ghost}`** — Transparent. `{colors.border}` border + `{colors.text-body}` text. Lowest emphasis.
**`{component.btn-icon}`** — 48×48px circular. `{rounded.full}`. `{colors.bg-elevated}` bg.

### Cards

**`{component.product-card}`** — 3-up grid. `{rounded.lg}` (12px). `{spacing.lg}` (24px) padding. 3px top-stripe gradient reveals on hover. Product icon in 44×44 `{rounded.md}` container. State matrix: default / hover / skeleton.

**`{component.pricing-card}`** — 3-up grid. Three variants: default / featured (blue border + glow) / early-access (purple border). Float badge positioned -13px from top edge, centered.

**`{component.dashboard-mockup}`** — Hero right column. `{rounded.xl}` (16px). Float animation 6s. Mac window dots topbar. Three inner panels: stat-row / chart-block / tag-row. Footer: status dot + open-crm button.

**`{component.stat-cell}`** — Stats band. Centered. Stat number in `{type.display-lg}` Syne 800 with gradient color. Divided by gradient hairlines. Background `{colors.bg-subtle}`.

**`{component.feature-card}`** — General editorial card. Photo top 56%, text bottom 44%. `{rounded.lg}`. Used for case studies, blog previews, testimonials.

### Signature Components

**`{component.hero-eyebrow}`** — Pill badge above hero h1. `{rounded.full}`. `{colors.primary-500}` text on `{colors.primary-50}` light / `rgba(37,99,235,0.1)` dark bg. 6px pulsing dot (`pulse-dot` keyframe). Text in `{type.label-upper}` UPPERCASE.

**`{component.brand-stripe-divider}`** — 3px horizontal `{colors.gradient-brand}` stripe. Card top-stripe on hover. Active state on category tabs. Section transition marker. Used sparingly — one per major transition.

**`{component.trust-pill}`** — Icon + label inline. No bg, no border. Icon in brand color matching trust signal. Four signals: Meta Tech Provider (blue icon) · MSME Registered (purple icon) · GST Verified (red icon) · Tirupati India (green icon).

**`{component.category-tab}`** — UPPERCASE label. Rest: `{colors.text-muted}`. Active: `{colors.text-ink}` + 2px `{colors.primary-500}` underline. No fill, no radius.

### Inputs

**`{component.text-input}`** — `{colors.bg-elevated}` bg. `{rounded.md}`. 44px height. See state matrix (default / focus / error / success / disabled).

**`{component.cta-email-input}`** — Same as text-input. Flex-1 in CTA form row beside `{component.btn-fire}`.

### Footer (`{component.footer}`)

`{colors.bg-subtle}` bg. Top border `{colors.border}` 1px. Three-column top row: wordmark (ECO blue · Dr purple · Ix red) + nav links + MSME/GST badge chips. Bottom: copyright `{type.caption}` `{colors.text-subtle}` + "Built solo" attribution.

---

## Do's and Don'ts

### Do

- Apply the three brand colors as button fills, gradient accents, badge tints, border highlights, and active states. These are the system's three expression channels.
- Use `{colors.gradient-brand}` on the primary CTA and one headline word per section. The gradient earns its place — deploy it where it matters.
- Pair Syne 800/700 display against Inter 400 body. The weight contrast IS the editorial signature.
- Use `{rounded.lg}` (12px) for cards. `{rounded.md}` (10px) for buttons and inputs. `{rounded.full}` for badges. The three-tier radius system is the brand shape language.
- Run `{spacing.section}` (96px) between every major page band.
- Use `{type.label-upper}` UPPERCASE 0.08em tracking for all eyebrows and category labels.
- Assign each product its designated color from the product color table. Never deviate.
- Implement the full component state matrix (default / hover / active / focus / disabled / loading / skeleton) before shipping any component.
- Verify all new color combinations against the contrast matrix. Minimum AA (4.5:1) for text. Minimum 3:1 for UI components. GIGW 3.0 compliance required.
- Keep light and dark token delta minimal — only the tokens in the delta table flip. Everything structural stays identical.

### Don't

- Don't introduce a fourth brand color. The three logo-extracted colors are the closed set.
- Don't use `{colors.gradient-brand}` as a background fill. Foreground only: button fill, gradient text, card stripe, divider.
- Don't use Syne for body or Inter for display. The font boundary is non-negotiable.
- Don't use `{colors.fire-500}` (#DC2626) as the semantic error color. `{colors.error}` (#EF4444) is separate and intentionally distinct.
- Don't use `{colors.subtle}` tokens for readable text — they fail WCAG AA. Restricted to placeholders and disabled states.
- Don't apply gradient text at `{type.body-md}` or smaller. Only `{type.display-*}` and `{type.title-lg}` sizes.
- Don't stack two text-only bands consecutively. Rhythm: hero → stats → product grid → pricing → CTA → footer.
- Don't ship a component without all states in the component state matrix.
- Don't enable the `float` animation on touch devices or when `prefers-reduced-motion` is set.
- Don't put `{component.hero-glow}` or diagonal line trio outside the hero band — atmospheric elements are heroes-only.
- Don't use `{colors.info}` (#0EA5E9) as a substitute for `{colors.primary-500}` — they are deliberately different hexes for different roles.
- Don't abbreviate the ECODrIx wordmark color split in contexts where three-color rendering is unavailable — use full primary-blue monochrome fallback.

---

## Responsive Behavior

### Breakpoints

| Name    | Width       | Key Changes                                                                                                                          |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile  | < 768px     | Hamburger nav; hero 2-col → 1-col; `{type.display-xl}` 72px → 40px; grids 3-up → 1-up; stats 4-col → 2-col; float animation disabled |
| Tablet  | 768–1024px  | Nav stays horizontal; hero 50/50 split; 2-up card grids; stats 4-col → 2-col                                                         |
| Desktop | 1024–1440px | Full layout; all 3-up grids; 4-stat band; full hero                                                                                  |
| Wide    | > 1440px    | Same as desktop; 1100px container enforced; more breathing room                                                                      |

### Collapsing

- Nav → hamburger overlay at < 768px. Full height. Brand stripe at top. Links at `{type.title-md}` size.
- Hero two-column → stacked. Content block first, mockup below at 100% width.
- `{component.dashboard-mockup}` retains `{rounded.xl}`. Float animation: off on touch devices.
- Card grids: columns reduce. Card internal structure identical.
- Pricing cards: 3-up → 1-up stacked. Featured float badge moves inside card header on mobile.
- Stats band: 4-col single row → 2×2 grid (tablet) → 2-col (mobile).
- `{component.brand-stripe-divider}` stays 3px at all breakpoints.
- Footer: 3-col → stacked 1-col mobile.

---

## Iteration Guide

1. Edit `ecodrix-tokens.json` first. Never change a hex in CSS or Tailwind directly.
2. New component defaults: `{rounded.lg}` cards · `{rounded.md}` interactive · `{rounded.full}` labels.
3. New color must map to an existing brand token or scale shade. No new hex without a token entry.
4. Every new component requires the full state matrix before PR is opened.
5. Every new color combination requires a contrast check against the matrix. Fail = do not ship.
6. Variants (`-hover`, `-active`, `-disabled`, `-loading`, `-skeleton`, `-featured`) are separate token/component entries.
7. Use `{token.refs}` everywhere. No inline hex in component specs.
8. Syne 800/700 display. Inter 400/500/600 body/UI. No exceptions.
9. `{colors.gradient-brand}` is brand-identity — never extend to semantic feedback tokens.
10. Light and dark are equal citizens. Every component spec covers both modes simultaneously.
11. Motion: `{motion.duration.base}` (200ms) + `{motion.ease.standard}` unless overridden by specific entry. Always add `prefers-reduced-motion` rule.
12. When in doubt about emphasis: more Syne weight before more brand color. Typography carries weight first.

---

## Known Gaps (v2 Status)

| Gap                               | v1 Status       | v2 Status                                                                                |
| --------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| Token JSON file                   | ❌ Missing      | ✅ Shipped (`ecodrix-tokens.json`)                                                       |
| CSS custom properties             | ❌ Missing      | ✅ Shipped (`ecodrix-tokens.css`)                                                        |
| Tailwind config                   | ❌ Missing      | ✅ Shipped (`ecodrix-tailwind.config.js`)                                                |
| Per-product color table           | ❌ Missing      | ✅ Documented above                                                                      |
| Component state matrix            | ❌ Missing      | ✅ Full matrix: button/input/card/badge/pricing/nav                                      |
| Contrast ratio table              | ❌ Missing      | ✅ Full matrix with GIGW 3.0 compliance                                                  |
| Motion system                     | ❌ Partial      | ✅ Duration scale + easing scale + keyframe library + reduced-motion                     |
| Dark-mode delta table             | ❌ Missing      | ✅ 24-token delta table documented                                                       |
| Logo hex source confirmation      | ⚠️ Partial      | ⚠️ Still pending — arc/swish gradient sub-stop unconfirmed                               |
| erix-connect widget               | ⚠️ Reserved     | ⚠️ Still unspecced — WhatsApp widget component pending                                   |
| Configurator surface              | ❌ Out of scope | ❌ Out of scope — separate spec needed for flow builder UI                               |
| Input error/success full spec     | ⚠️ Named only   | ✅ Full state matrix in component section                                                |
| Animation timing library          | ⚠️ Partial      | ✅ Full motion system in Motion System section                                           |
| Dark mode auto vs explicit toggle | ⚠️ Open         | ⚠️ Still open — `prefers-color-scheme` auto-detect vs user toggle UX TBD for v1.1        |
| PDF/invoice surface tokens        | ❌ Missing      | ❌ Still missing — print-safe CMYK approximations needed                                 |
| Telugu font fallback              | ❌ Missing      | ⚠️ Partially addressed — Noto Sans Telugu identified as fallback; not yet in token stack |
| btn-sm / btn-md touch target      | ❌ Not flagged  | ✅ Flagged in accessibility section with mitigation                                      |
| `{colors.subtle}` failure case    | ❌ Not flagged  | ✅ Flagged in contrast matrix — restricted to placeholder/disabled                       |

---

_ECODrIx Design System v2.0_
_Three files ship together: `ecodrix-tokens.json` · `ecodrix-tokens.css` · `ecodrix-tailwind.config.js`_
_This document is the human-readable spec. The JSON is the machine-readable source of truth._
