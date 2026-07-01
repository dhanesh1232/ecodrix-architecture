# ERIX CRM Suite — Implementation Roadmap
**Version 1.0 | ECODrIx Technologies**

---

## 1. Product Development Strategy

Build MVP-lean, ship to existing agency clients as design partners first, then open pan-India. PWA before native app — validate mobile usage patterns before committing to React Native build cost. Solo-founder execution pace: 6-week MVP window per existing ECODrIx sprint discipline.

---

## 2. MVP Scope

| Feature | In MVP? | Rationale | Effort (S/M/L) |
|---|---|---|---|
| Unified Inbox (WA+IG+Email) | Y | Core differentiator | L |
| Contacts & Custom Fields | Y | Foundation for everything | M |
| Pipeline / Deal Board | Y | Core CRM value | M |
| Automation Rules (basic) | Y | Reduces manual follow-up | M |
| Projects & Tasks | Y | Delivery tracking, agency use case | M |
| Roles & Permissions | Y | Multi-user teams need this day 1 | S |
| PWA install + push | Y | Mobile-first requirement | M |
| Native App | N | Phase 2, gated by user count | L |
| Public API | N | Post-MVP | L |
| ERIX-SIGN integration | N | Separate module, later | M |

---

## 3. Phase 1: Foundation

**Goals:** Environment, auth, core DB schema, CI/CD live

- [ ] Provision Supabase Postgres, run initial Drizzle migrations — Owner: Dhanesh — Priority: P0
- [ ] Set up JWT auth (access + refresh) on erix-crm server — Owner: Dhanesh — Priority: P0
- [ ] Wire erix-connect webhook receiver for WhatsApp inbound — Owner: Dhanesh — Priority: P0
- [ ] Scaffold Next.js 15 frontend with @ecodrix/erix-api SDK — Owner: Dhanesh — Priority: P0
- [ ] GitHub Actions CI/CD to Cloud Run + Vercel — Owner: Dhanesh — Priority: P1
- [ ] Seed roles_permissions table with default RBAC matrix — Owner: Dhanesh — Priority: P1

---

## 4. Phase 2: Core Features

**Goals:** Inbox, pipelines, projects functional end-to-end

- [ ] Build unified inbox thread list + conversation view — Owner: Dhanesh — Priority: P0
- [ ] Implement reply routing back through erix-connect — Owner: Dhanesh — Priority: P0
- [ ] Build pipeline board with drag-drop stage changes — Owner: Dhanesh — Priority: P0
- [ ] Build contact detail slide-over panel — Owner: Dhanesh — Priority: P0
- [ ] Build project/task board linked to deals — Owner: Dhanesh — Priority: P0
- [ ] Implement realtime updates via ErixStore WebSocket — Owner: Dhanesh — Priority: P1

---

## 5. Phase 3: Monetization

**Goals:** Billing, plan limits, webhooks live

- [ ] Integrate Razorpay checkout + subscription webhooks — Owner: Dhanesh — Priority: P0
- [ ] Enforce plan-based contact/user limits server-side — Owner: Dhanesh — Priority: P0
- [ ] Build billing settings page (invoices, plan change) — Owner: Dhanesh — Priority: P1
- [ ] GST-compliant invoice generation — Owner: Dhanesh — Priority: P1
- [ ] Dunning flow for failed renewals — Owner: Dhanesh — Priority: P2
- [ ] Early-access ₹999 tier lock-in for pilot clients — Owner: Dhanesh — Priority: P0

---

## 6. Phase 4: Growth Features

**Goals:** Automation, PWA polish, analytics

- [ ] Automation rule builder UI (trigger → condition → action) — Owner: Dhanesh — Priority: P0
- [ ] Server-side 24hr WhatsApp window enforcement — Owner: Dhanesh — Priority: P0
- [ ] PWA install prompt + Web Push notifications — Owner: Dhanesh — Priority: P0
- [ ] Reporting dashboard (pipeline velocity, response SLA) — Owner: Dhanesh — Priority: P1
- [ ] Telugu/Hindi AI caption generation via Claude API — Owner: Dhanesh — Priority: P1
- [ ] Deal aging alerts and stuck-deal flags — Owner: Dhanesh — Priority: P2

---

## 7. Phase 5: Scale and Polish

**Goals:** Observability, performance, accessibility, native app evaluation

- [ ] Sentry + Cloud Logging observability wired end-to-end — Owner: Dhanesh — Priority: P0
- [ ] Load test inbox + pipeline endpoints to 500-tenant target — Owner: Dhanesh — Priority: P1
- [ ] WCAG AA accessibility pass on core screens — Owner: Dhanesh — Priority: P2
- [ ] Evaluate PWA usage data to decide native app trigger — Owner: Dhanesh — Priority: P1
- [ ] React Native app scaffold (if trigger met) — Owner: Dhanesh — Priority: P2
- [ ] Public API + webhook docs for third-party integrations — Owner: Dhanesh — Priority: P2

---

## 8. Sprint Structure

| Sprint | Duration | Focus | Key Deliverable |
|---|---|---|---|
| Sprint 1 | Week 1-2 | Foundation | Auth + DB + webhook receiver live |
| Sprint 2 | Week 3-4 | Core Features | Inbox + Pipeline + Projects functional |
| Sprint 3 | Week 5 | Monetization | Razorpay billing live, plan limits enforced |
| Sprint 4 | Week 6 | Growth + Launch | Automation, PWA push, pilot client onboarding |

---

## 9. Feature Prioritization Matrix

| Feature | Business Value | Dev Effort | Priority |
|---|---|---|---|
| Unified Inbox | Very High | High | P0 |
| Pipeline Board | High | Medium | P0 |
| Automation Rules | High | Medium | P0 |
| Projects/Tasks | High | Medium | P0 |
| PWA + Push | High | Medium | P0 |
| Reporting Dashboard | Medium | Medium | P1 |
| Native App | Medium | High | P2 (gated) |
| Public API | Low (at MVP) | High | P2 |

---

## 10. Engineering Team Requirements

| Role | Headcount | Responsibility |
|---|---|---|
| Founder/Full-stack | 1 (Dhanesh) | End-to-end build, solo execution |
| Growth/Ops Associate | 1 (Gagana, trial) | Client onboarding, feedback loop, content |
| Future hire (Phase 3+ per roadmap) | TBD | Backend or frontend support once SaaS MRR > service revenue |

---

## 11. Folder / Repo Structure

```
ecodrix-platform/
├── apps/
│   ├── saas/                # Next.js 15 frontend
│   ├── server/               # Hono backend (erix-crm module lives here)
│   ├── admin/                 # Admin console
│   └── erix-connect/          # Meta Cloud API gateway
├── packages/
│   ├── erix-api/              # @ecodrix/erix-api SDK
│   ├── erix-store/            # Queue/pubsub engine
│   └── erix-storage/          # R2 storage wrapper
├── db/
│   └── drizzle/                # Migrations + schema
└── .github/workflows/          # CI/CD
```

---

## 12. Environment Setup

| Environment | Stack | URL Pattern |
|---|---|---|
| Local | Docker Compose (Postgres + ErixStore) | localhost:3000 |
| Staging | Cloud Run + Vercel preview | staging.ecodrix.com |
| Production | Cloud Run + Vercel + Supabase | app.ecodrix.com, api.ecodrix.com |

---

## 13. CI/CD Plan

**Flow: Deploy Pipeline**
1. Push to main
   - Trigger GitHub Actions workflow
2. Lint + typecheck + test
   - Fail fast on any error
3. Run migrations on staging
   - Verify against staging DB
4. Deploy to Cloud Run (server) + Vercel (frontend)
   - Health check before traffic cutover

---

## 14. QA Strategy

Manual QA on every pilot client's real workflow before wider rollout — inbox reply routing and automation windowing are the highest-risk areas since a bug here directly breaks customer communication.

- Test WhatsApp 24hr window edge cases explicitly before every release touching automation
- Pilot clients act as real-world QA for first 2 weeks post-launch

---

## 15. Testing Strategy

| Test Type | Tool | Coverage Target | Notes |
|---|---|---|---|
| Unit | Vitest | 60% core logic | Focus on automation rule engine, RBAC |
| Integration | Vitest + test DB | Key API routes | Inbox reply routing, deal stage triggers |
| E2E | Playwright | Critical paths only | Signup → connect WA → send/receive message |
| Manual | Pilot clients | Real-world | Weeks 1-2 post-launch |

---

## 16. Security Testing

- Verify tenant_id isolation with cross-tenant access attempt tests
- Confirm API key hashing and webhook HMAC signature validation
- Penetration test on auth flow before public launch (post-pilot)

---

## 17. Performance Testing

| Metric | Target |
|---|---|
| Inbox thread list load | < 500ms p95 |
| Pipeline board render (100 deals) | < 800ms |
| Webhook processing latency | < 2s end-to-end |

---

## 18. Release Pipeline

**Flow: Staged Rollout**
1. Deploy to staging
   - Automated tests pass
2. Deploy to production, feature-flagged
   - Waitlist gate via .env toggle, existing pattern
3. Enable for pilot clients only
   - 2 existing agency clients first
4. Gradual open to remaining waitlist
   - Monitor error rates before each expansion

---

## 19. Beta Rollout Plan

- Closed beta: 2 existing agency clients (Week 5)
- Open beta: remaining ECODrIx service clients + LinkedIn waitlist signups (Week 7)
- GA: public launch with LinkedIn "built in public" announcement (Week 8-9)

---

## 20. Monitoring and Alerting

| Signal | Tool | Threshold | Alert Destination |
|---|---|---|---|
| API error rate | Sentry | > 2% over 5min | WhatsApp/Slack alert |
| Webhook delivery failure | Custom log alert | Any failure | WhatsApp alert |
| Cloud Run instance crash | Cloud Monitoring | Any restart | Email + Slack |

---

## 21. Post-Launch Strategy

1. Weekly client health check (existing client-health-check skill) applied to pilot tenants
2. Collect activation funnel data — identify where founders drop off in onboarding
3. Iterate automation templates based on real pilot usage patterns
4. Begin LinkedIn content series documenting the build ("Tier 2 India founder" narrative)

---

## 22. Technical Debt Prevention

- No shortcuts on tenant_id scoping — every new table reviewed against isolation checklist
- Automation rule engine built with clear trigger/condition/action separation from day 1, not bolted on later
- Document every schema change in migration commit messages for solo-founder continuity

---

## 23. Scaling Triggers and Plan

| Trigger Metric | Threshold | Scaling Action |
|---|---|---|
| Active tenants | > 500 | Move to dedicated Cloud SQL, add read replica |
| Inbox messages/day | > 50,000 | Horizontal scale erix-crm server instances |
| PWA daily active users | > 300 concurrent mobile sessions | Begin React Native native app build |

---

## 24. Risk Register

| Risk | Likelihood | Impact | Owner | Mitigation |
|---|---|---|---|---|
| Solo-founder bandwidth bottleneck | High | High | Dhanesh | Strict MVP scope discipline, defer P2 items |
| WhatsApp automation policy violation | Medium | High | Dhanesh | Server-side window checks, template pre-approval |
| Pilot clients slow to adopt new tool | Medium | Medium | Dhanesh/Gagana | White-glove onboarding for first 2 clients |
| Native app scope creep before PWA validated | Medium | Medium | Dhanesh | Hard gate: native app only after usage-threshold trigger |

---

## 25. Complexity and Timeline Estimate

| Phase | Scope | Complexity (1-10) | Weeks |
|---|---|---|---|
| Phase 1: Foundation | Auth, DB, webhook base | 5 | 1-2 |
| Phase 2: Core Features | Inbox, pipeline, projects | 8 | 3-4 |
| Phase 3: Monetization | Billing, limits | 5 | 5 |
| Phase 4: Growth | Automation, PWA, reporting | 7 | 6 |
| Phase 5: Scale | Observability, native app eval | 6 | Ongoing |

---

## 26. Future Version Roadmap

| Version | Theme | Key Features | Estimated ETA |
|---|---|---|---|
| v1.1 | Native App | React Native app (iOS/Android) | Post user-count trigger |
| v1.2 | AI-Native | Next-best-action suggestions, voice agent inbox | +3 months post-GA |
| v1.3 | Open Platform | Public API, Zapier-style integrations | +5 months post-GA |
| v2.0 | ERIX-SIGN | E-signature integrated into project close-out | +6 months post-GA |

---

## Assumptions Made

- 6-week MVP timeline assumes solo-founder execution pace consistent with existing ECODrIx sprint history
- Pilot clients (existing agency relationships) are available and willing to be design partners
- Native app build is explicitly deferred and gated — not started until PWA usage data justifies it
- No additional engineering hire assumed within this roadmap window; Gagana's role stays growth/ops, not engineering
