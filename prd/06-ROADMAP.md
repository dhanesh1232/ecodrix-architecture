# ECODrIx — Implementation Roadmap
**Version:** 1.0 | **Date:** May 2026

---

## 1. Product Development Strategy

**Approach:** Ship fast, iterate based on real usage. Service clients (managed by you) are the beta testers. Direct users get the polished version.

**Principle:** Every phase must end with something DEPLOYABLE and REVENUE-GENERATING. No phase is "just infrastructure."

---

## 2. MVP Scope

| Feature | In MVP? | Rationale | Effort |
|---------|---------|-----------|--------|
| Console dashboard | Yes | First thing users see | M |
| User registration + auth | Yes | Required for everything | S |
| WhatsApp inbox | Yes | Core value prop | L |
| CRM contacts table | Yes | Basic lead management | M |
| Pipeline Kanban | Yes | Visual deal tracking | M |
| Invoice builder + WhatsApp send | Yes | Revenue differentiator | M |
| Billing (Razorpay) | Yes | Collect money | M |
| LAIE audit (basic) | Yes | Unique differentiator | M |
| AI auto-respond | Yes | Key selling point | M |
| Templates + broadcasts | Yes | WhatsApp marketing | M |
| Dynamic field builder | No | Nice-to-have, not blocking | M |
| Visual automation builder | No | Complex, Phase 3 | L |
| Multi-channel inbox | No | WhatsApp-only is fine for MVP | L |
| Agency white-label | No | Existing admin panel works | L |
| Voice AI | No | Future, not core | XL |

---

## 3. Phase 1: Foundation (Weeks 1-4)

| # | Task | Owner | Priority | Effort |
|---|------|-------|----------|--------|
| 1 | Create ecodrix_organizations table in Supabase | Backend | P0 | S |
| 2 | Migration script: MongoDB Client → PostgreSQL org | Backend | P0 | M |
| 3 | Update saasAuth middleware to read from PostgreSQL | Backend | P0 | S |
| 4 | Restructure ECOD/saas to console layout (route groups) | Frontend | P0 | M |
| 5 | Build ConsoleTopbar + console home page | Frontend | P0 | M |
| 6 | Build auth pages (login, register) with NextAuth v5 | Frontend | P0 | M |
| 7 | Set up EcodProvider (SDK context) | Frontend | P0 | S |
| 8 | Build ProductCard + InfraServiceCard components | Frontend | P1 | S |
| 9 | Wire up TanStack Query hooks with SDK | Frontend | P0 | M |
| 10 | Deploy: Vercel (frontend) + Render (backend) | DevOps | P0 | S |

**Deliverable:** User can register, log in, see console dashboard with live stats.

---

## 4. Phase 2: Core CRM (Weeks 5-8)

| # | Task | Owner | Priority | Effort |
|---|------|-------|----------|--------|
| 11 | Build ErixLayout (sidebar + product topbar) | Frontend | P0 | M |
| 12 | Build WhatsApp inbox (split-pane, thread list, messages) | Frontend | P0 | L |
| 13 | Build contacts page (DataTable + Sheet + filters) | Frontend | P0 | L |
| 14 | Build pipeline Kanban (@dnd-kit) | Frontend | P0 | L |
| 15 | Build templates page (grid + form) | Frontend | P1 | M |
| 16 | Build broadcasts page (list + wizard) | Frontend | P1 | M |
| 17 | Create erix_* CRM tables in PostgreSQL | Backend | P0 | M |
| 18 | Build CRM API routes (leads CRUD, pipeline, messages) | Backend | P0 | L |
| 19 | Wire Socket.io for real-time inbox updates | Backend | P0 | M |
| 20 | Build billing page + Razorpay subscription integration | Full-stack | P0 | M |

**Deliverable:** Full CRM working — inbox, contacts, pipeline, templates, billing.

---

## 5. Phase 3: Revenue Features (Weeks 9-12)

| # | Task | Owner | Priority | Effort |
|---|------|-------|----------|--------|
| 21 | Build invoice module (builder UI + live preview) | Frontend | P0 | L |
| 22 | Create erix_invoices + erix_invoice_settings tables | Backend | P0 | S |
| 23 | Razorpay payment link API integration | Backend | P0 | M |
| 24 | PDF generation (React-PDF or server-side) | Backend | P0 | M |
| 25 | Send invoice via WhatsApp (one-click) | Backend | P0 | S |
| 26 | Payment webhook → mark invoice paid | Backend | P0 | S |
| 27 | Build LAIE audit UI (search + progress + result card) | Frontend | P0 | L |
| 28 | Build LAIE leads table + push-to-ERIX | Frontend | P1 | M |
| 29 | Build AI auto-respond (per-org config page) | Full-stack | P0 | M |
| 30 | Build basic automation (trigger → action, no visual) | Backend | P1 | M |

**Deliverable:** Invoicing works end-to-end. LAIE audit works. AI responds to WhatsApp.

---

## 6. Phase 4: Power Features (Weeks 13-16)

| # | Task | Owner | Priority | Effort |
|---|------|-------|----------|--------|
| 31 | Build visual automation builder (React Flow canvas) | Frontend | P1 | XL |
| 32 | Build workflow execution engine (ErixStore workers) | Backend | P1 | L |
| 33 | Create erix_workflows + erix_workflow_runs tables | Backend | P1 | S |
| 34 | Build dynamic CRM field builder UI | Frontend | P1 | L |
| 35 | Build webhook engine (erix_webhooks + delivery queue) | Backend | P1 | M |
| 36 | Build ErixStore dashboard (queue inspector, metrics) | Frontend | P2 | M |
| 37 | Build developer settings page (SDK config, origins) | Frontend | P2 | M |
| 38 | Build settings pages (profile, org, team, security) | Frontend | P1 | M |

**Deliverable:** Visual automation builder working. Custom fields. Webhooks. Developer page.

---

## 7. Phase 5: AI & Scale (Months 5-6)

| # | Task | Owner | Priority | Effort |
|---|------|-------|----------|--------|
| 39 | AI qualification flow (conversation → score → route) | Backend | P1 | L |
| 40 | AI-generated follow-ups + template suggestions | Backend | P1 | M |
| 41 | Predictive pipeline (revenue forecast) | Backend | P2 | L |
| 42 | Morning briefing (daily AI digest) | Backend | P2 | M |
| 43 | Adaptive learning (track what works, auto-adjust) | Backend | P3 | L |
| 44 | White-label agency mode (custom branding) | Full-stack | P2 | L |
| 45 | Multi-channel inbox (Instagram DMs, email inbound) | Full-stack | P2 | L |
| 46 | Pre-built automation templates (marketplace) | Full-stack | P3 | M |
| 47 | Mobile PWA (offline-first) | Frontend | P3 | L |
| 48 | Conversational commerce (WhatsApp storefront) | Full-stack | P3 | XL |

**Deliverable:** AI is smart and adaptive. Agency mode. Multi-channel. Platform feels complete.

---

## 8. Sprint Structure

| Sprint | Duration | Focus | Key Deliverable |
|--------|----------|-------|-----------------|
| Sprint 1-2 | 2 weeks | Foundation + Auth | Console dashboard live |
| Sprint 3-4 | 2 weeks | CRM Backend + Inbox | WhatsApp inbox working |
| Sprint 5-6 | 2 weeks | CRM Frontend | Contacts + Pipeline + Templates |
| Sprint 7-8 | 2 weeks | Invoicing + Billing | Invoice → WhatsApp → Payment flow |
| Sprint 9-10 | 2 weeks | LAIE + AI | Audit engine + AI auto-respond |
| Sprint 11-12 | 2 weeks | Automation | Basic automation + webhook engine |
| Sprint 13-14 | 2 weeks | Visual Builder | React Flow automation canvas |
| Sprint 15-16 | 2 weeks | Polish + Launch | Field builder + settings + deploy |

---

## 9. Engineering Team Requirements

| Role | Headcount | Responsibility |
|------|-----------|----------------|
| Full-stack Lead (you) | 1 | Architecture, backend, AI, DevOps |
| Frontend Developer | 1 | Console, CRM UI, automation builder |
| AI/ML Engineer | 0.5 (part-time) | Prompt engineering, scoring models |
| Designer | 0.5 (part-time) | UI polish, component design |
| QA | 0 (automated) | Vitest + E2E via Playwright |

**Minimum viable team: 1 person (you) for Phase 1-3. Hire frontend help for Phase 4+.**

---

## 10. Folder Structure

```
ECOD/
├── saas/                    → User-facing console (Next.js 15)
├── admin/                   → Agency management panel (Next.js 16)
├── server/                  → Backend API (Express + Hono)
├── erix-store/              → In-memory engine (cache, queue, locks)
├── packages/
│   ├── erix-api/            → TypeScript SDK (@ecodrix/erix-api)
│   └── erix-react/          → React SDK (@ecodrix/erix-react)
└── .Architecture/
    ├── KIRO_AGENT_PROMPT.md → Main architecture overview
    ├── IMPLEMENTATION_DETAILS.md → Schemas + env vars
    └── prd/                 → This PRD document set
```

---

## 11. Complexity & Timeline Estimate

| Phase | Scope | Complexity | Weeks | Cumulative |
|-------|-------|-----------|-------|-----------|
| Phase 1: Foundation | Auth, console, deploy | 4/10 | 4 | Week 4 |
| Phase 2: Core CRM | Inbox, contacts, pipeline, billing | 7/10 | 4 | Week 8 |
| Phase 3: Revenue | Invoicing, LAIE, AI respond | 7/10 | 4 | Week 12 |
| Phase 4: Power | Automation builder, webhooks, fields | 8/10 | 4 | Week 16 |
| Phase 5: AI & Scale | Predictive AI, agency, multi-channel | 9/10 | 8 | Week 24 |

**Total to full platform: ~24 weeks (6 months)**
**Total to MVP (revenue-ready): ~12 weeks (3 months)**

---

## 12. Risk Register

| Risk | Likelihood | Impact | Owner | Mitigation |
|------|-----------|--------|-------|------------|
| Solo developer burnout | High | Critical | Self | Hire frontend dev by Week 8 |
| WhatsApp API policy change | Medium | High | Backend | Abstract behind SDK, support alternatives |
| Claude API cost exceeds budget | Medium | Medium | Backend | Semantic cache, Haiku for cheap ops, budget caps |
| Supabase limits hit early | Low | Medium | DevOps | Monitor connections, upgrade plan proactively |
| Users don't activate (low conversion) | Medium | High | Product | Onboarding checklist, daily AI briefing, service channel |
| Competitors copy features | Medium | Low | Product | Speed of execution + AI training data moat |
| ErixStore data loss on crash | Low | Critical | Backend | WAL persistence, snapshot every 5min, auto-restart |

---

## 13. Assumptions Made

- One developer (you) can ship Phase 1-3 in 12 weeks working full-time
- Service clients (existing admin panel users) will beta-test without complaint
- Razorpay test mode is sufficient for development (switch to live at launch)
- Supabase free tier handles development; Pro ($25/mo) handles first 500 users
- React Flow is the right choice for visual automation (vs custom canvas)
- The market won't shift dramatically in the next 6 months
- WhatsApp remains free for business-reply messages (24h window)
- Existing @ecodrix/erix-api and @ecodrix/erix-react packages are stable enough to build on
