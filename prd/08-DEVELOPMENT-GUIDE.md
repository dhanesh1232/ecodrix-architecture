# 08 — Development Guide

> Practical onboarding for an engineer joining the project. Clone → env → run migrations → run
> services → test. Conventions for adapters, Drizzle, queues, and PRs.

## 1. Prerequisites

| Tool         | Version                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| Node         | 20.x (use `nvm use` — there's a `.node-version` file at the monorepo root) |
| pnpm         | 9.x (workspace tool)                                                       |
| Postgres     | 15+ (or use Supabase)                                                      |
| MongoDB      | 6+ (only needed if you'll work on freelance flows)                         |
| Docker       | optional, for ErixStore + worker stacks                                    |
| `gcloud` CLI | required for Vertex AI ADC (Gemini + Claude)                               |

## 2. Clone & Install

```bash
git clone <repo>
cd ecodrix
pnpm install                  # bootstraps the monorepo
```

The monorepo lives under `ECOD/`. Workspace packages:

| Path                       | Purpose                               |
| -------------------------- | ------------------------------------- |
| `ECOD/saas`                | Direct user console (Next.js 15)      |
| `ECOD/admin`               | Freelance / agency panel (Next.js)    |
| `ECOD/server`              | API + workers                         |
| `ECOD/erix-store`          | Cache / queue / locks / pubsub engine |
| `ECOD/packages/erix-api`   | TS SDK                                |
| `ECOD/packages/erix-react` | Embeddable React SDK                  |
| `ECOD/packages/erix`       | Internal CRM types                    |
| `ECOD/packages/chatbot`    | Embeddable chat widget                |
| `ECOD/laie`                | LAIE actor runners                    |

## 3. Environment Variables

Create `.env` (or `.env.local`) per package. Copy from `.env.example` where present.

### `ECOD/server/.env`

See `IMPLEMENTATION_DETAILS.md` § 11 for the full list. Critical ones:

```bash
PORT=4000
DATABASE_URL=postgres://…              # Supabase
MONGO_URI=mongodb://localhost:27017
ERIX_STORE_URL=http://localhost:6399
ERIX_STORE_API_KEY=devkey
CORE_API_KEY=devcore
ENCRYPTION_KEY=base64:32-byte-key      # openssl rand -base64 32

# Vertex AI (Gemini + Claude) — ADC via gcloud, no API keys
GOOGLE_CLOUD_PROJECT=your-gcp-project
CLOUD_ML_REGION=us-central1
GEMINI_API_KEY=                         # leave empty if using ADC

# Externals
META_WA_TOKEN=…
META_WA_PHONE_ID=…
RAZORPAY_KEY_ID=…
RAZORPAY_KEY_SECRET=…
GOOGLE_PLACES_API_KEY=…
```

Auth for Vertex AI:

```bash
gcloud auth application-default login
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

### `ECOD/saas/.env.local`

```bash
NEXTAUTH_SECRET=…
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
```

### `ECOD/erix-store/.env`

```bash
PORT=6399
DATABASE_URL=postgres://…
ERIX_API_KEY=devkey
GOOGLE_API_KEY=…                       # for embeddings (semantic cache)
```

## 4. Database Setup

```bash
# 1. Apply schema (uses one drizzle config covering platform/erix/laie)
cd ECOD/server
pnpm db:generate                # generate migrations from schema/*.ts
pnpm db:push                    # push to dev DB (or db:migrate for versioned)

# 2. Seed plans + add-ons + demo org (if seed script exists)
pnpm tsx scripts/seed-platform.ts

# 3. Inspect with Drizzle Studio
pnpm db:studio
```

For ErixStore tables:

```bash
cd ECOD/erix-store
pnpm db:push
```

## 5. Run Services

Order matters — start ErixStore first.

```bash
# Terminal 1 — ErixStore
cd ECOD/erix-store && pnpm dev          # http://localhost:6399

# Terminal 2 — Backend API + workers
cd ECOD/server && pnpm dev              # http://localhost:4000

# Terminal 3 — Direct UI
cd ECOD/saas && pnpm dev                # http://localhost:3000

# Terminal 4 — Freelance UI
cd ECOD/admin && pnpm dev               # http://localhost:3001

# (Optional) SDK watchers
cd ECOD/packages/erix-api && pnpm dev
cd ECOD/packages/erix-react && pnpm dev
```

## 6. Code Conventions

### 6.1 TypeScript

- `strict: true` everywhere. No `any`, no `ts-ignore`. Use `unknown` and narrow.
- All exports get JSDoc on the public surface.
- Filenames use the convention already in the folder (most use `kebab-case`; LAIE uses `camelCase.schema.ts` — match siblings).

### 6.2 Drizzle Schema

- Lives under `ECOD/server/src/shared/db/schema/{platform,erix,laie}/*.ts`.
- Re-export each new table from the corresponding `index.ts` barrel.
- Every CRM/LAIE row has `org_id` (or `tenant_id` for LAIE — wired to `ecodrix_organizations.id` via `laie_tenants.platform_org_id`).
- Always declare indexes inline — keeps the schema file as single source of truth.

### 6.3 Adapters

- Never call Drizzle/Mongoose directly in services or routes. Always go through `getErixAdapter(orgId)`.
- Add new methods to the `ErixAdapter` interface only when at least one route needs them.
- For tests, use `MockAdapter` (in-memory, deterministic).

### 6.4 Service Layer

```ts
export async function createLead(orgId: string, input: CreateLeadInput) {
  const adapter = await getErixAdapter(orgId);
  const lead = await adapter.leads.create(orgId, input);
  await emit({ type: "lead.created", orgId, leadId: lead.id, lead });
  return lead;
}
```

- Services take `orgId`, never `clientCode` (legacy stays inside `MongoAdapter`).
- Emit domain events via `event-bus.emit` after persistence.
- Never throw raw errors to the user — wrap with `AppError` (status, code, message).

### 6.5 Routes

```ts
router.post(
  "/api/whatsapp/send",
  tenantResolver,
  createQuotaMiddleware({ service: "erix", feature: "whatsappMessages" }),
  async (req, res) => {
    const result = await whatsappService.send(req.org.id, req.body);
    await res.locals.consumeQuota();
    res.json({ success: true, data: result });
  },
);
```

- Stack order: `tenantResolver` → quota / feature gate → `idempotency` (if mutating) → handler.
- Quota is consumed only after the handler succeeds (call `res.locals.consumeQuota()`).

### 6.6 Frontend

- All data through `@ecodrix/erix-api`. No `fetch` / `axios` to backend. No raw API URL strings.
- Hooks shape:
  ```ts
  export function useLeads(filters) {
    const ecod = useEcod();
    return useQuery({
      queryKey: ["leads", filters],
      queryFn: () => ecod.crm.leads.list(filters),
    });
  }
  ```
- Real-time:
  ```ts
  useEffect(() => ecod.on("lead.stage_changed", patcher), [ecod]);
  ```
- Empty / loading / error states required for every list view.
- All form inputs are React Hook Form + Zod.

### 6.7 SDK changes

- Adding a CRM endpoint: implement on server, expose in `@ecodrix/erix-api` namespace, regenerate types, version-bump the package.
- Frontend escape hatch for unstable endpoints: `ecod.request("POST", "/api/...", body)`.

## 7. Useful Scripts

```bash
# Lint + format
pnpm biome:check
pnpm biome:fix

# Typecheck across workspace
pnpm -r typecheck

# Run tests
cd ECOD/server && pnpm test
cd ECOD/erix-store && pnpm test
cd ECOD/packages/erix-api && pnpm test

# Build SDKs (publishable artifacts)
cd ECOD/packages/erix-api && pnpm build:final
cd ECOD/packages/erix-react && pnpm build:final

# Inspect pricing state of an org
cd ECOD/server && pnpm tsx scripts/inspect-pricing-state.ts <orgId>

# Apply a one-off migration script
pnpm tsx scripts/apply-migration.ts
```

## 8. Testing

- Server: Vitest, colocated `*.test.ts` next to source.
- ErixStore: Vitest with WAL replay tests.
- SDK: Vitest with mocked fetch.
- E2E smoke: `scripts/verify-platform-end-to-end.ts` (extends pricing verify with new completion-spec flows).

For property-based tests use the project's existing PBT setup where present.

## 9. Adding a New Feature — Recipe

1. **Spec first.** Create or extend a spec under `saas/.kiro/specs/<feature>/`. Write `requirements.md` (testable bullets) and `design.md` (concrete tables + routes + UI).
2. **Schema.** Add tables to `server/src/shared/db/schema/<family>/`. Re-export from the family `index.ts`. Run `pnpm db:generate` + `pnpm db:push` (dev).
3. **Adapter.** Add methods to `ErixAdapter` types + each implementation (`PostgresAdapter`, `MongoAdapter`, `DualAdapter`).
4. **Service.** Write the service in `server/src/services/saas/<feature>/`. Take `orgId`. Emit events.
5. **Routes.** Add to `server/src/routes/<area>/`. Stack: `tenantResolver` → entitlement gate → handler.
6. **SDK.** Expose in `@ecodrix/erix-api` namespace. Bump package version.
7. **Frontend.** Add hooks under `saas/src/hooks/`, screens under `saas/src/app/<area>/`, components under `saas/src/components/<area>/`. Use `useEcod()` everywhere.
8. **Tests.** Server unit tests with `MockAdapter`; smoke test if it changes a critical path.
9. **Docs.** Update `modules.md` status row. Cross-link from the appropriate PRD section.
10. **PR.** Title format: `[<area>] <verb> <noun>`. Description includes spec link + test plan.

## 10. Debugging Tips

| Symptom                     | Where to look                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| 401 on every API call       | `tenantResolver` — check `apiKey + clientCode` headers; verify org row exists                 |
| 429 quota errors during dev | Use a non-Free plan for the demo org; check `ecodrix_usage` row                               |
| AI auto-respond not firing  | Check `org.ai_agent_enabled`, `org.ai_auto_reply`, queue depth on `ai-respond`, Vertex AI ADC |
| Workflow doesn't trigger    | Confirm `is_active = true` and `trigger_type` matches event; tail `workflow.worker.ts` logs   |
| ErixStore queue stuck       | `GET http://localhost:6399/queues/<name>/stats`; check WAL for orphaned jobs                  |
| Mongo adapter 503           | Connection string in `external_db_uri` (decrypted); check `connectionManager` cache           |
| Drizzle migration fails     | Compare against generated SQL in `migrations/<family>/`; if dev only, drop + push fresh       |

## 11. Conventions Cheat Sheet

| Concern                  | Rule                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Plan slugs               | `free` · `starter` · `growth` · `scale` · `enterprise`                             |
| Acquisition channels     | `freelance` · `direct`                                                             |
| Data modes               | `platform` · `own` · `both`                                                        |
| External DB types        | `mongodb` · `postgresql`                                                           |
| Tenant boundary          | `req.org.id` only                                                                  |
| AI for inbox / workflows | Gemini 2.0 Flash via `@google/genai`                                               |
| AI for outreach kits     | Claude Sonnet 4.5 via `@anthropic-ai/vertex-sdk`                                   |
| Cache / queue            | ErixStore (port 6399). Never Redis / BullMQ / ioredis                              |
| Frontend HTTP            | `@ecodrix/erix-api` only                                                           |
| Forms                    | React Hook Form + Zod                                                              |
| Theme                    | Dark navy, `bg-base #0A1628`, `accent-primary #1E7AFF`, `accent-secondary #FF6B1A` |

## 12. PR Etiquette

- Keep PRs scoped (one spec section ≈ one PR).
- Update relevant docs in this folder when the change is non-trivial (mention which doc in the PR description).
- Include a screenshot for any UI change.
- Tag the related spec in the description: `Spec: saas/.kiro/specs/<name>/`.
- Run `pnpm biome:check` and `pnpm -r typecheck` locally before pushing.

## 13. Where to Ask

- Architecture questions → re-read `00-ARCHITECTURE-BRIEF.md` first; if unclear, raise an issue with the section heading you struggled with.
- Spec ambiguity → comment on the spec file directly.
- Code patterns → `IMPLEMENTATION_DETAILS.md`.

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-completion-end-to-end/`, `IMPLEMENTATION_DETAILS.md`.
