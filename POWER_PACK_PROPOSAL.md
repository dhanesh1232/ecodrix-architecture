# ECODrIx "Power Pack" — Uniqueness & Go-To-Market Proposal

> Date: 2026-07-07 · Grounded in **already-built** capabilities (see
> `AUDIT_BETA_LAUNCH_2026-07.md`). Every "Power Pack" feature below maps to a
> real primitive already in the codebase — this is packaging + a few small
> connective additions, **not** new product scope.

---

## 1. The positioning thesis

Most SMB tools do **one slice**:

- **ManyChat / Chatfuel** → social DM automation, no real CRM.
- **GoHighLevel** → all-in-one but heavy, US-centric, expensive, steep setup.
- **Zapier / Make** → glue between apps, no CRM/inbox of their own.
- **Apollo / Lusha** → lead data, no execution.

**ECODrIx already has all four slices in one tenant:** lead discovery (LAIE) +
omnichannel inbox & automation (Connect + rules) + CRM/invoices/portal + an
event bus your own website can call. That combination is the moat.

> **One-line positioning:** _"The client-operations OS for freelancers &
> micro-agencies — discover leads, run WhatsApp/Instagram/email automations,
> manage the whole pipeline, and wire it to your own website — in one place, at
> SMB pricing."_

---

## 2. Three wedge differentiators (all built)

These are the "why ECODrIx, not X" hooks — each is real code today:

### Wedge 1 — "Your website talks to your CRM automations, no code"

`POST /v1/api/product/erix/events/trigger` + custom events + the builder's
**"Call from your website"** panel (copy-paste cURL, shown in the node).
A tenant fires `product_purchased` / `appointment_booked` from their site → an
automation runs (WhatsApp confirm, tag, sequence). _Zapier makes you glue apps;
ECODrIx is the destination AND the engine._
→ **Evidence:** `workflows/trigger.routes.ts`, `NodeConfigPanel.tsx`
(`WebsiteTriggerSnippet`).

### Wedge 2 — "Social comment → DM → CRM lead → sequence, in one flow"

Instagram comment/DM automation (ManyChat's core) **plus** it lands as a CRM
lead and enters a real pipeline + sequence — with a lead-capture policy toggle
for engagement-only posts. ManyChat can't do the CRM half; GHL's social is weak.
→ **Evidence:** `meta.webhook.ts`, `ruleExecutor.service.ts`, `leadPolicy.ts`,
automation builder templates.

### Wedge 3 — "Built-in prospecting, not a separate Apollo bill"

LAIE discovers + enriches leads and generates AI outreach kits (business
summary, pain points, first-touch copy) — feeding the same CRM + automation.
→ **Evidence:** `modules.md` LAIE (discovery/enrich/outreach-kits ✅), Claude/
Vertex outreach kits.

---

## 3. The "Power Pack" bundle

A curated tier that packages the highest-"wow" combinations of built primitives
into one sellable story. Nothing here is net-new product — it's the assembly +
templates + gating.

| Power Pack capability                                         | Built primitive                                        | Add needed                                 |
| ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| **Website Automations** (site event → rules)                  | `/events/trigger` + custom events + builder URL panel  | none (shipped)                             |
| **Social Growth Autopilot** (IG/WA comment→DM→lead→sequence)  | Meta webhooks + rules + sequences                      | template pack                              |
| **Omnichannel Inbox** (WA/IG/email/Telegram in one)           | Connect channels + `ConversationSDK`                   | unify social→ConversationSDK (P1 in audit) |
| **AI Copilot** (auto-reply, smart replies, summaries)         | Gemini auto-responder + smart replies                  | gate to Power Pack                         |
| **Lead Finder** (LAIE discovery + enrichment + AI kits)       | LAIE                                                   | finish LAIE→CRM push (P2)                  |
| **Embed Anywhere** (dashboard + chat widget in tenant's site) | `@ecodrix/erix-react`, `@ecodrix/chatbot`, scoped keys | polish + docs                              |
| **Client Portal + e-Sign**                                    | `portal.routes`, `project-documents`                   | UI verification + nav surface              |
| **Metered credits** (pay for AI/sends as you grow)            | credit wallet + Razorpay                               | none                                       |

**Packaging:** sell Power Pack as the **top self-serve tier** that unlocks AI +
Lead Finder + Website Automations + Embed, on top of the base CRM/Connect plan,
with a **credit wallet** for usage-based AI/sends. This matches the existing
entitlements + credit infrastructure.

---

## 4. Uniqueness features to attract users (built-first, low-build)

Ranked by attract-power ÷ effort. Each ties to a real primitive.

1. **Niche "recipe" gallery** _(low build — extend existing templates)_.
   You already have `AUTOMATION_TEMPLATES` + the Templates gallery. Expand into
   niche playbooks ("Salon: DM 'PRICE' → catalog + book", "Coach: webinar joined
   → nurture", "D2C: purchase → review request + upsell"). One-click import →
   instant value. _This is the #1 activation lever._
2. **60-second channel connect** _(shipped — polish)_.
   WhatsApp/Instagram embedded-signup + manual-token is built. Make it the
   onboarding centerpiece: "connect a channel, import a recipe, see it fire."
3. **Free LAIE audit as a lead magnet** _(built — repackage)_.
   LAIE's GBP/SEO/accessibility audits → a public "Get your free business audit"
   funnel that converts into signup. Prospecting engine doubles as marketing.
4. **"Website trigger" as a headline feature** _(shipped)_.
   Market the copy-paste event URL as "connect any website to automations in 2
   minutes." Developer-friendly = word-of-mouth.
5. **Embeddable dashboard + chat widget** _(partial — polish)_.
   Agencies embed ECODrIx in _their_ client sites under scoped keys → sticky,
   viral (their clients see it).
6. **AI copilot everywhere** _(built — gate)_.
   Auto-reply + smart replies + lead summaries as the "it feels alive" moment.

---

## 5. Competitive framing (the pitch)

| Job                        | ManyChat | GoHighLevel | Zapier | **ECODrIx Power Pack**  |
| -------------------------- | -------- | ----------- | ------ | ----------------------- |
| Social DM automation       | ✅       | ~           | ✗      | ✅                      |
| Real CRM + pipeline        | ✗        | ✅          | ✗      | ✅                      |
| Omnichannel inbox          | ~        | ✅          | ✗      | ✅                      |
| Website event → automation | ~        | ~           | ✅     | ✅ (native destination) |
| Built-in lead discovery    | ✗        | ✗           | ✗      | ✅ (LAIE)               |
| AI outreach + auto-reply   | ~        | ~           | ✗      | ✅                      |
| SMB price + simplicity     | ✅       | ✗ (pricey)  | ~      | ✅                      |

**Wedge to lead with:** _social + website automation that actually feeds a real
CRM, with built-in lead finding and AI — without the GoHighLevel price or the
Zapier duct-tape._

---

## 6. Packaging & pricing sketch (uses existing billing)

- **Base (Starter/Growth):** CRM, 1–2 channels, basic automations.
- **Power Pack (Pro):** all channels + AI copilot + Lead Finder + Website
  Automations + Embed + Portal/e-Sign. Everything gated via existing
  entitlements.
- **Credits wallet** for metered AI/sends/enrichment (already built:
  packs + overage 402 + top-up).
- **Land-and-expand:** free audit → free CRM+1 channel → upgrade to Power Pack
  when they hit AI/lead-finder/website-automation value.

---

## 7. Execution order (respect the audit's P0s first)

1. **Stabilize (audit P0):** migrations/schema drift, live money-path smoke
   test, security checklist. _No GTM until these are green._
2. **Ship the beta wedge:** CRM + Connect + Automations + Website Triggers +
   billing. (All built.)
3. **Activation build (small):** niche recipe gallery + onboarding "connect →
   import → fire" + LAIE free-audit funnel.
4. **Power Pack packaging:** gate AI + Lead Finder + Embed via entitlements;
   wire credit costs.
5. **Unify inbox (audit P1)** so "omnichannel inbox" is a truthful claim.
6. **Finish LAIE→CRM push + approval queue** to unlock the outbound story
   (audit P2) — then add "Lead Finder" to the Power Pack headline.

---

## 8. What makes it defensible

- **Data gravity:** leads + conversations + pipeline + invoices in one tenant →
  switching cost.
- **The event bus:** once a customer wires their website to `/events/trigger`,
  they've integrated their business into ECODrIx.
- **Recipes + templates:** accumulate niche playbooks competitors don't have.
- **Credits + entitlements:** flexible monetization already in place.

> **Bottom line:** ECODrIx doesn't need new scope to be a "power pack." It needs
> to **assemble and name** the combinations it already runs — social + website
> automation feeding a real CRM, with built-in lead discovery and AI — then lead
> GTM with recipes and frictionless channel connect.
