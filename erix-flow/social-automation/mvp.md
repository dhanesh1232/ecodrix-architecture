# ERIX Flow — AI Social Media Publishing — MVP + PRD

**Project**: ECO-2026-SM01
**Author**: Dhanesh, ECODrIx
**Version**: 1.0
**Date**: 30 June 2026
**Status**: Draft

---

## 1. Problem Statement

Agencies and SMBs juggle 3-5 tools to create, schedule, and publish social content. No AI-native, India-priced, WhatsApp-first tool exists for this market.

---

## 2. Target Users

| Role                    | Description                      | Key Need                       |
| ----------------------- | -------------------------------- | ------------------------------ |
| Agency owner            | Manages content for 5-20 clients | Bulk scheduling, approval flow |
| In-house social manager | Single brand, daily posting      | AI captions, fast publish      |
| Coach/consultant        | Solo personal brand              | Cheap, simple, AI-heavy        |

---

## 3. Goals

- Primary: 10 paying clients at ₹2,999–4,999/month within 8 weeks of launch
- Secondary: Validate AI caption + scheduling as core retention driver

---

## 4. Non-Goals (MVP — explicitly OUT)

- Video/image AI generation
- TikTok, Pinterest, Reddit, Discord, Medium, WordPress connectors
- Analytics dashboard
- Team roles/permissions beyond Owner+Editor
- AI trend discovery, competitor analysis, viral prediction

---

## 5. MVP Scope (Ship in 6 weeks)

### Platforms (3 only)

- Instagram
- LinkedIn
- Facebook

### Core Features

1. Connect accounts (via ERIX Connect — read only, no new OAuth build)
2. Create post — manual text + image upload
3. AI caption generator (one-shot, platform-tone aware)
4. AI hashtag generator
5. Schedule post — single time, timezone aware
6. Calendar view (month grid, list of scheduled posts)
7. Publish worker — queue + retry (ERIX-Store)
8. Post status: Draft → Scheduled → Published → Failed
9. Basic approval: Editor submits → Owner approves → publishes

### Explicitly Deferred to v2

- Bulk/recurring scheduling
- Video generation
- Multi-platform content variants (auto-rewrite per platform)
- Analytics
- Notifications (email/push)
- Content library/templates

---

## 6. User Flows

**Flow 1 — Create & Schedule Post**

1. User clicks "New Post"
2. Selects platform(s)
3. Writes topic → clicks "Generate Caption" (AI)
4. Edits caption, uploads image
5. Picks date/time
6. Submits for approval (if Editor) or schedules directly (if Owner)

**Flow 2 — Approval**

1. Owner opens Approval Queue
2. Reviews pending posts
3. Approve → moves to Scheduler
4. Reject → returns to Draft with comment

**Flow 3 — Publish**

1. Scheduler triggers job at scheduled time
2. Publish Worker picks from ERIX-Store queue
3. Platform Connector sends to API
4. Success → status Published, store post ID
5. Failure → retry 3x → status Failed, log error

---

## 7. Screens & Features

| Screen             | Purpose                                     |
| ------------------ | ------------------------------------------- |
| Dashboard          | Overview: upcoming posts, pending approvals |
| Calendar View      | Month grid of scheduled/published posts     |
| New Post           | Compose, AI generate, attach media          |
| Approval Queue     | List pending posts, approve/reject          |
| Connected Accounts | Read-only list from ERIX Connect            |
| Settings           | Brand voice (tone, emoji on/off)            |

---

## 8. Technical Considerations

**Backend**: Node.js, TypeScript, Express/Fastify, Prisma, PostgreSQL
**Queue**: ERIX-Store (not Redis)
**Frontend**: Next.js App Router, Tailwind, shadcn/ui
**AI**: Claude API for captions/hashtags (single call, no agent chain for MVP)
**Storage**: Cloudflare R2 for media
**Auth**: Existing ECODrIx platform auth, multi-tenant

**New DB tables**: campaigns (optional v2), posts, assets, schedules, publish_logs, connected_accounts (read from ERIX Connect, cached)

---

## 9. Success Metrics

- 10 paying customers, ₹30K+ MRR within 8 weeks
- Publish success rate >95%
- AI caption used in >70% of posts (validates AI value)
- Median time-to-publish (draft → live) under 10 minutes

---

## 10. Open Questions

- Confirm ERIX Connect token refresh is production-stable before connector build
- Pricing: bundle with existing CRM tiers or sell standalone?
- Which 3 existing agency clients to pilot with first?

---

## 11. Build Timeline

| Week | Deliverable                                   |
| ---- | --------------------------------------------- |
| 1    | DB schema, ERIX Connect account fetch, auth   |
| 2    | Instagram + LinkedIn + Facebook connectors    |
| 3    | Publish worker, queue, retry logic            |
| 4    | AI caption + hashtag generator                |
| 5    | Calendar UI, New Post screen, Approval Queue  |
| 6    | Pilot with 3 agency clients, fix bugs, launch |

---

## 12. Post-MVP Roadmap (v2+)

- Bulk/recurring scheduling
- Multi-platform AI content variants
- Image generation
- Analytics dashboard
- Notifications
- Content library + templates
- Remaining platforms (TikTok, YouTube, Pinterest, etc.)

---

## 13. Differentiation Strategy (vs Buffer/Hootsuite/Later)

Generic schedulers compete on features. ECODrIx competes on moat — things big players can't or won't localize for India.

### 13.1 AI Agent, Not AI Button

Competitors offer single-shot "generate caption."
ERIX Flow: one prompt → agent researches topic, checks trends, writes captions, picks hashtags, drafts full multi-platform campaign — ready for approval.

### 13.2 WhatsApp-Native Approval (Priority Build)

No competitor has this.
Approval Queue pushes draft posts to WhatsApp via ERIX Connect.
Client/owner approves or rejects by replying — no login required.
Direct fit for Indian SMB owners who run their business from WhatsApp.

### 13.3 Local-Market AI — Telugu/Hindi Mix (Priority Build)

Generic tools generate English-only content.
ERIX AI generates natural Telugu+English mixed captions for AP/Telangana market — culturally accurate, not translated.
Hard moat: requires market-specific tuning competitors won't invest in.

### 13.4 Cross-Product Integration (CRM + LAIE)

Standalone schedulers stop at "post published."
ERIX Flow connects to LAIE (lead gen) and erix-crm: lead comes in → nurtured via social content → closed in CRM.
One subscription across three products — increases stickiness, raises switching cost.

### 13.5 Outcome-Based AI Suggestions

Beyond generating content, AI tracks performance and recommends next topics.
Example: "Service posts get 3x engagement — want 3 more this week?"
Turns the tool from content factory into a growth advisor.

### 13.6 Tiered AI Autonomy

User selects trust level:

- **Manual** — user writes, AI polishes
- **Assisted** — AI drafts, user approves
- **Autonomous** — AI plans + posts full monthly calendar, user reviews only

No competitor offers a trust dial — this is a UX moat, not just a feature.

### 13.7 Pricing Wedge

Buffer/Hootsuite: $15–100/month, no India-specific value.
ERIX Flow: ₹2,999/month with WhatsApp approval + Telugu AI — unmatched for Tier 2/3 India SMBs.

### 13.8 Build Priority (Cheapest to Build, Hardest to Copy)

| Priority | Feature                              | Why First                                                              |
| -------- | ------------------------------------ | ---------------------------------------------------------------------- |
| 1        | WhatsApp-native approval             | Low build cost (ERIX Connect already exists), zero competitor coverage |
| 2        | Telugu/Hindi mixed AI captions       | Prompt-engineering only, no new infra, strong local moat               |
| 3        | Tiered AI autonomy                   | UX layer on existing AI generator, differentiates pricing tiers        |
| 4        | Cross-product CRM/LAIE link          | Needs both products stable first — sequence after MVP traction         |
| 5        | Outcome-based AI suggestions         | Needs analytics data first — v2/v3 feature                             |
| 6        | Full AI agent (campaign-from-prompt) | Highest complexity — v3 once core loop proven                          |

**Recommendation**: Add 13.1 (WhatsApp approval) and 13.2 (Telugu AI) to MVP scope — both are low-cost, high-moat, and ship-able within the existing 6-week timeline without delaying launch.
