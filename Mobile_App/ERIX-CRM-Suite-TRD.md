# ERIX CRM Suite — Technical Requirements Document
**Version 1.0 | ECODrIx Technologies**

---

## 1. System Architecture Overview

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router) + TailwindCSS + shadcn/ui + TanStack Query + Zustand |
| Backend | Node.js + TypeScript, Hono, Zod validation, Drizzle ORM |
| Primary DB | Supabase PostgreSQL (Drizzle) — platform, CRM, pipelines, projects, inbox |
| Queue/Realtime | ErixStore (custom, port 6399, replaces Redis+BullMQ) |
| Integration Gateway | erix-connect (Meta Cloud API — WhatsApp + Instagram, AWS SES for Email) |
| Storage | Cloudflare R2 via erix-storage (cdn.ecodrix.com) |
| SDK | @ecodrix/erix-api — all frontend-to-server calls |

MongoDB is **not used**. All CRM, pipeline, project, and inbox data lives on Supabase PostgreSQL.

---

## 2. High-Level Infrastructure Diagram

```
[WhatsApp/IG/Email] --webhook--> [erix-connect :api.ecodrix.com]
                                        |
                                        v
                          [ErixStore :6399] <--events--> [erix-crm server (Hono)]
                                        |                         |
                                        v                         v
                          [Supabase PostgreSQL]        [Cloudflare R2 :cdn.ecodrix.com]
                                        |
                                        v
                     [Next.js 15 Frontend via @ecodrix/erix-api SDK]
                                        |
                          [Web] --- [PWA] --- [Native App (Phase 2)]
```

---

## 3. Frontend Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand (client), TanStack Query (server cache) |
| Realtime | WebSocket to ErixStore for live inbox/pipeline updates |
| PWA | next-pwa or manual service worker, Web Push API |

---

## 4. Backend Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Hono |
| Validation | Zod on every route |
| ORM | Drizzle (PostgreSQL) |
| Auth | JWT (15min access) + httpOnly refresh (30d) |

---

## 5. Database Strategy

Single PostgreSQL database (Supabase), multi-tenant via `tenant_id` row-level scoping on every table. No per-tenant schema or database split at MVP scale — simplifies migrations and backups. Revisit schema-per-tenant only if a single large tenant needs dedicated isolation (Scale tier).

- All writes validated against tenant ownership before commit
- Drizzle migrations versioned in repo, applied via CI/CD
- Read replicas considered only post-500-tenant threshold

---

## 6. API Architecture

| Property | Value |
|---|---|
| Style | REST, versioned under /v1 |
| Auth | Bearer JWT, tenant resolved from token claim |
| Rate limiting | Per-tenant token bucket at gateway |
| SDK | @ecodrix/erix-api wraps all endpoints — no direct fetch from frontend |

| Endpoint | Purpose |
|---|---|
| POST /v1/contacts | Create/update contact |
| GET /v1/inbox/threads | List unified inbox threads |
| POST /v1/inbox/threads/:id/reply | Send reply (routes to correct channel) |
| POST /v1/pipelines/:id/deals | Create deal |
| PATCH /v1/deals/:id/stage | Move deal stage (triggers automation) |
| POST /v1/projects | Create project (manual or auto from deal) |
| POST /v1/automations | Create automation rule |
| POST /v1/webhooks/erix-connect | Inbound channel webhook receiver |

---

## 7. Authentication and Authorization

- JWT access token (15 min) + httpOnly refresh token (30 days)
- Role-based access control: Owner, Admin, Agent, Viewer
- Tenant membership checked on every request middleware layer

> **Critical:** Refresh tokens never exposed to client-side JS — httpOnly cookie only, rotated on use.

---

## 8. Storage

| Type | Solution |
|---|---|
| Media attachments (inbox) | Cloudflare R2 via erix-storage |
| Exported reports | Cloudflare R2, signed URLs, 7-day expiry |
| Avatars/branding | Cloudflare R2, public CDN path |

---

## 9. Queue and Async Infrastructure

| Job Type | Handler |
|---|---|
| Inbound webhook processing | ErixStore queue, erix-connect → erix-crm |
| Automation rule evaluation | ErixStore delayed jobs (stage-change triggers) |
| WhatsApp template sends | ErixStore queue with retry/backoff |
| Notification dispatch | ErixStore pub/sub to connected clients |

---

## 10. Realtime Infrastructure

- WebSocket connection per active session to ErixStore
- Inbox new-message events pushed live to open threads
- Pipeline stage changes broadcast to all viewers of that pipeline
- Fallback: polling every 15s if WebSocket unavailable (PWA background)

---

## 11. AI/LLM Infrastructure

| Use Case | Approach |
|---|---|
| Telugu/Hindi AI captions (broadcast) | Anthropic Claude API |
| Next-best-action suggestions (Phase 2) | Claude API + deal context prompt |
| Auto-tagging inbound leads | Claude API classification call on webhook receipt |

---

## 12. Caching Strategy

- Pipeline board data cached client-side via TanStack Query, invalidated on WebSocket event
- Contact search results cached 60s server-side
- No dedicated cache layer (Redis) — ErixStore handles hot-path state

---

## 13. Search Infrastructure

- Postgres full-text search (tsvector) on contacts, deals, project tasks at MVP
- Upgrade path: pgvector-backed semantic search for contact/notes search if volume demands

---

## 14. Logging and Monitoring

| Signal | Tool |
|---|---|
| Application errors | Sentry |
| API request logs | Structured JSON logs to Cloud Logging |
| Webhook delivery failures | Dedicated alert channel (WhatsApp/Slack) |

---

## 15. Observability Stack

| Layer | Tool |
|---|---|
| Errors | Sentry |
| Metrics | Cloud Run built-in + custom ErixStore dashboards |
| Uptime | External uptime pinger on api.ecodrix.com |

---

## 16. Rate Limiting Strategy

- Per-tenant API rate limit (token bucket), tier-based ceiling
- Webhook endpoint rate-limited separately from user-facing API to prevent Meta retry storms from affecting UX

---

## 17. Failover and Redundancy

- Cloud Run auto-restarts on crash, min-instance=1 for erix-crm server
- ErixStore SQLite-backed persistence survives restarts
- Supabase managed backups (point-in-time recovery)

---

## 18. Security Layers

- Tenant isolation via row-level tenant_id filtering on all queries
- API keys SHA-256 hashed at rest
- Webhook payloads HMAC-signed (Stripe/Resend-style)
- Input validation via Zod on every mutation endpoint

> **Critical:** Every automated WhatsApp send must verify the 24-hour session window server-side before dispatch — client-side checks are not trusted.

---

## 19. CI/CD Pipeline

- GitHub Actions: lint → typecheck → test → build → deploy
- Deploy target: GCP Cloud Run (server), Vercel (frontend)
- Migrations run as a pre-deploy step, gated on staging success

---

## 20. Cloud Architecture

| Environment | Stack |
|---|---|
| MVP | GCP Cloud Run + Vercel + GitHub Actions |
| Scale | GCP Cloud Run auto-scale + Cloud SQL + Cloudflare + Terraform |

---

## 21. Scaling Strategy

Start on shared Cloud Run instance with ErixStore as the concurrency buffer. Scale triggers: tenant count > 500, inbox message volume > 50K/day, or p95 API latency > 500ms sustained.

- Horizontal scale erix-crm server instances behind Cloud Run autoscaler
- Move to dedicated Cloud SQL with read replicas at scale threshold

---

## 22. Performance Optimization

- Paginate all list endpoints (contacts, deals, threads) — cursor-based
- Lazy-load pipeline board cards beyond viewport
- Debounce automation rule evaluation to avoid redundant triggers on rapid stage flips

---

## 23. Third-Party Integrations

| Service | Purpose | SDK/API | Called By |
|---|---|---|---|
| Meta Cloud API | WhatsApp + Instagram messaging | erix-connect wrapper | Inbox module |
| AWS SES | Email channel in unified inbox | erix-connect wrapper | Inbox module |
| Anthropic Claude API | AI captions, classification | Direct API | Automation engine |
| Razorpay | Billing, subscriptions | Razorpay SDK | Platform billing |
| Cloudflare R2 | Media/asset storage | erix-storage | Inbox, projects |

---

## 24. Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta API rate limits during broadcast spikes | Medium | High | Queue with backoff via ErixStore, tier-based send caps |
| WhatsApp 24hr window violations breaking automation | Medium | High | Server-side window check before every automated send |
| Single Postgres instance becomes bottleneck at scale | Low (MVP) | High | Scaling triggers defined, read replica plan ready |
| Realtime WebSocket drops on mobile networks | Medium | Medium | Polling fallback in PWA client |

---

## Assumptions Made

- No MongoDB anywhere in this stack — corrected per current architecture
- ErixStore already handles queue/pub-sub needs; no separate Redis introduced
- Multi-tenancy is row-level on shared Postgres, not schema-per-tenant, at MVP
- Native mobile app (Phase 2) will consume the same REST API as PWA — no separate backend
