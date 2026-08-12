# Instagram Connector — Phase Completion Plan

> Ship in phases, not specs. Each phase is deployable on its own.

---

## Phase 1: Polish & Ship (Current → Production-Ready)

**Goal**: What we built today works end-to-end without rough edges.

| #   | Item                               | Where                                                                  | Effort |
| --- | ---------------------------------- | ---------------------------------------------------------------------- | ------ |
| 1.1 | Calendar edit/delete planned posts | `DELETE /calendar/:id`, `PUT /calendar/:id` + UI inline edit           | 1h     |
| 1.2 | Error toasts on failed mutations   | All Instagram views — wrap mutations with toast on error               | 30m    |
| 1.3 | Empty states that guide action     | "Connect IG" CTA when not connected, "Create automation" when no rules | 30m    |
| 1.4 | Confirm before reply/send          | "Send this reply?" dialog on public comment replies (irreversible)     | 20m    |
| 1.5 | Tunnel test end-to-end             | Meta Console → webhook → automation → DM → inbox shows message         | Manual |
| 1.6 | Rate-limit guards on AI endpoints  | Max 10 AI calls/min per org (prevent runaway summarize clicks)         | 30m    |

**Outcome**: Ship-ready for beta users with Instagram connected.

---

## Phase 2: Engagement Engine

**Goal**: Turn the inbox from read-only into a power tool.

| #   | Item                                  | Where                                                                                      | Effort |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| 2.1 | Quick-reply templates in Inbox        | Saved reply snippets → one-click send (e.g. "Check your DMs!", "Thanks for the love!")     | 2h     |
| 2.2 | AI auto-reply toggle per conversation | "Auto-respond to this contact" → AI handles replies until human takes over                 | 3h     |
| 2.3 | Comment-to-Lead one-click             | Button on comment row → creates CRM lead from commenter (username → name, IGSID → contact) | 2h     |
| 2.4 | Bulk reply on posts                   | Select 5+ comments → reply all with a template                                             | 2h     |
| 2.5 | Inbox unread badge in sidebar         | Real-time unread count next to "Inbox" nav item                                            | 1h     |
| 2.6 | Read receipts + delivery status       | Show ✓ ✓✓ on outbound messages using Meta's message status webhooks                        | 1h     |

**Outcome**: Users can manage 50+ DM conversations/day without leaving ECODrIx.

---

## Phase 3: Content Intelligence

**Goal**: Strategy view becomes the brain — users stop guessing what to post.

| #   | Item                                   | Where                                                                                            | Effort |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| 3.1 | Hashtag performance tracker            | Track which hashtags → highest reach/engagement across your posts                                | 3h     |
| 3.2 | Competitor post scraping (public data) | Scrape public profile media counts + posting frequency (LAIE web scraper already exists)         | 4h     |
| 3.3 | AI caption generator                   | Calendar quick-add → "Generate caption" → full hook + body + CTA + hashtags from a one-line idea | 2h     |
| 3.4 | Content recycling suggestions          | AI identifies top-performing old posts → suggests repurposed versions (image → Reel script)      | 3h     |
| 3.5 | Engagement rate trending               | Sparkline in Overview: your ER% over last 30/60/90 days                                          | 2h     |
| 3.6 | Follower growth chart                  | Graph followers over time (requires storing daily snapshots from /profile)                       | 2h     |

**Outcome**: Strategy tab becomes a mini "content marketing suite" — know what works, generate what's next.

---

## Phase 4: Automation Visibility

**Goal**: Connect the dots between automations (CRM) and channel activity (Connect).

| #   | Item                      | Where                                                                                     | Effort |
| --- | ------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| 4.1 | Follow-gate analytics     | "45 prompted → 32 followed → 71% conversion" from automation runs                         | 3h     |
| 4.2 | Automation activity log   | "Which automation fired on this comment?" — link from comment sheet to the rule execution | 2h     |
| 4.3 | Webhook event log viewer  | Last 50 inbound IG webhooks with status (processed/skipped/error) — debug surface         | 3h     |
| 4.4 | Per-post automation badge | Posts grid shows "⚡ Active" when a comment rule is watching that post                    | 1h     |
| 4.5 | Quota alerts              | Notification when approaching 80% of IG message/DM automation quota                       | 2h     |

**Outcome**: Users know exactly what's automated, what fired, and what's left in their quota — no black boxes.

---

## Phase 5: Publishing & Scheduling

**Goal**: Calendar goes from "plan-only" to "post automatically."

| #   | Item                                    | Where                                                                             | Effort |
| --- | --------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| 5.1 | Meta Content Publishing API integration | Actually publish scheduled IMAGE/CAROUSEL posts at the planned time               | 6h     |
| 5.2 | Reel upload (video)                     | Upload short video + cover image for Reels via API                                | 4h     |
| 5.3 | Carousel planner                        | Multi-slide content planner with per-slide caption notes                          | 3h     |
| 5.4 | A/B caption testing                     | Plan 2 variants → publish variant A → measure → optionally swap to B on a re-post | 4h     |
| 5.5 | Post queue (drip schedule)              | "Post one from my queue every Tue/Thu at 10am" — queue-based scheduling           | 4h     |
| 5.6 | Cross-post to Stories                   | Publish to both feed + story simultaneously                                       | 2h     |

**Outcome**: Full publish-and-forget content calendar — users never open the Instagram app to post.

---

## Phase 6: Multi-Channel Unification

**Goal**: Apply the Instagram pattern to WhatsApp, Telegram, Facebook.

| #   | Item                                     | Where                                                       | Effort |
| --- | ---------------------------------------- | ----------------------------------------------------------- | ------ |
| 6.1 | WhatsApp Inbox view (same pattern as IG) | Conversations + messages + send in WhatsApp connector       | 3h     |
| 6.2 | Telegram Inbox view                      | Same pattern, Telegram bot messages                         | 2h     |
| 6.3 | Unified Inbox (all channels, one view)   | Cross-channel conversation list with channel badge + filter | 5h     |
| 6.4 | Channel-agnostic AI auto-reply           | Same auto-respond logic across IG/WA/Telegram/Email         | 3h     |
| 6.5 | Cross-channel analytics                  | "Total messages in/out across all channels" dashboard       | 3h     |

**Outcome**: ERIX Connect becomes a true omni-channel engagement hub — one inbox, every channel.

---

## Priority Order (if time is limited)

```
Phase 1 (must-do before beta)
  → Phase 2 (makes the beta sticky)
    → Phase 3 (upgrades beta to "wow")
      → Phase 4 (ops visibility for power users)
        → Phase 5 (premium/growth feature)
          → Phase 6 (platform play)
```

## What's Already Done (this session)

- ✅ Overview: profile + metrics + quota gauge + best-time heatmap
- ✅ Posts: grid + comments sheet + reply + AI suggest + sentiment + keyword alerts + summarize + create-lead
- ✅ Inbox: DM conversations + messages + send + quick-reply templates + delivery ticks
- ✅ Strategy: competitors + AI ideation + pillars + keyword alerts
- ✅ Calendar: month view + published/planned + quick-add + strategy link + edit/delete
- ✅ Settings: connection config (pre-existing)
- ✅ Sidebar: full nav wiring (Overview → Posts → Inbox → Strategy → Calendar → Settings)
- ✅ Backend: 20+ endpoints on `/connect/instagram/*`
- ✅ ConnectorDetail: AdaptivePage with title/description/back/action
- ✅ Phase 1: error toasts, confirm dialogs, rate limits, calendar edit/delete
- ✅ Phase 2: quick-reply templates, comment-to-lead, delivery status
- ✅ Phase 3: AI caption generator, engagement rate sparkline, hashtag performance
- ✅ Phase 4: webhook logs, per-post automation badges, quota alerts
- ✅ Phase 5: Content Publishing API (image + reel + carousel), calendar publish flow
- ✅ Phase 6: WhatsApp Inbox, Unified Cross-Channel Inbox, advanced conversation routes

---

_Phase 1 is the only blocker. Everything else ships when it ships._
