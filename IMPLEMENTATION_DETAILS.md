# ECODrIx — Implementation Details

> Code-level reference. Patterns, snippets, and file paths an engineer needs to ship a feature
> without reading the whole codebase. Pair with `KIRO_AGENT_PROMPT.md` (mental model) and
> `prd/05-SCHEMA.md` (table reference).

---

## 1. Tenant Resolution

The single tenant boundary on every API request. Lives at `server/src/middleware/saasAuth.ts`
today; being rewritten as `tenantResolver` per `platform-completion-end-to-end/`.

```ts
// server/src/middleware/tenantResolver.ts
import { eq, and } from "drizzle-orm";
import { ecodrix_organizations, ecodrix_members } from "@/shared/db/schema";

export async function tenantResolver(req, res, next) {
  let org;

  // Path 1 — SDK / direct API
  const apiKey = req.headers["x-api-key"] ?? req.headers["x-erix-api-key"];
  const clientCode =
    req.headers["x-client-code"] ?? req.headers["x-erix-client-code"];
  if (apiKey && clientCode) {
    [org] = await db
      .select()
      .from(ecodrix_organizations)
      .where(
        and(
          eq(ecodrix_organizations.apiKey, apiKey),
          eq(ecodrix_organizations.clientCode, clientCode),
        ),
      )
      .limit(1);
  }

  // Path 2 — NextAuth session (saas dashboard)
  else if (req.session?.user?.id) {
    const [member] = await db
      .select({ orgId: ecodrix_members.orgId })
      .from(ecodrix_members)
      .where(eq(ecodrix_members.userId, req.session.user.id))
      .limit(1);
    if (member) {
      [org] = await db
        .select()
        .from(ecodrix_organizations)
        .where(eq(ecodrix_organizations.id, member.orgId))
        .limit(1);
    }
  }

  if (!org) return res.status(401).json({ error: "TENANT_NOT_FOUND" });
  if (org.status !== "active")
    return res.status(403).json({ error: "ORG_SUSPENDED" });

  req.org = org; // canonical
  req.orgId = org.id;
  next();
}
```

Admin routes still use `verifyCoreToken` (env `CORE_API_KEY`) for the operator side, then
attach the _target_ org via `tenantResolver` for tenant-scoped operations.

---

## 2. ErixAdapter Pattern (Multi-Source DB Layer)

Every CRM operation goes through one interface, regardless of where the tenant's data lives.

```ts
// server/src/lib/erix-adapter/types.ts
export interface ErixAdapter {
  leads: {
    create(orgId: string, input: CreateLeadInput): Promise<Lead>;
    update(
      orgId: string,
      leadId: string,
      patch: UpdateLeadInput,
    ): Promise<Lead>;
    findById(orgId: string, leadId: string): Promise<Lead | null>;
    findByPhone(orgId: string, phone: string): Promise<Lead | null>;
    list(
      orgId: string,
      query: ListLeadsQuery,
    ): Promise<{ items: Lead[]; total: number }>;
    moveStage(orgId: string, leadId: string, stageId: string): Promise<Lead>;
    /* ... */
  };
  pipelines: {
    /* ... */
  };
  conversations: {
    /* ... */
  };
  messages: {
    /* ... */
  };
  templates: {
    /* ... */
  };
  broadcasts: {
    /* ... */
  };
  automationRules: {
    /* ... */
  };
  sequenceEnrollments: {
    /* ... */
  };
  meetings: {
    /* ... */
  };
  notifications: {
    /* ... */
  };
  segments: {
    /* ... */
  };
  scoring: {
    /* ... */
  };
}
```

```ts
// server/src/lib/erix-adapter/factory.ts
const cache = new Map<string, { adapter: ErixAdapter; expiresAt: number }>();
const TTL_MS = 60_000;

export async function getErixAdapter(orgId: string): Promise<ErixAdapter> {
  const cached = cache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) return cached.adapter;

  const [org] = await db
    .select()
    .from(ecodrix_organizations)
    .where(eq(ecodrix_organizations.id, orgId))
    .limit(1);
  if (!org) throw new Error(`Org ${orgId} not found`);

  let adapter: ErixAdapter;
  if (org.dataMode === "platform") {
    adapter = new PostgresAdapter(getDefaultPool());
  } else if (org.dataMode === "own" && org.externalDbType === "mongodb") {
    adapter = new MongoAdapter(org.clientCode); // wraps getCrmModels
  } else if (org.dataMode === "own" && org.externalDbType === "postgresql") {
    const pool = await getTenantPgPool(orgId, decrypt(org.externalDbUri!));
    adapter = new PostgresAdapter(pool);
  } else if (org.dataMode === "both") {
    adapter = new DualAdapter(
      new PostgresAdapter(getDefaultPool()),
      org.externalDbType,
      decrypt(org.externalDbUri!),
    );
  } else {
    throw new Error(`Unknown data_mode ${org.dataMode}`);
  }

  cache.set(orgId, { adapter, expiresAt: Date.now() + TTL_MS });
  return adapter;
}

export function invalidateAdapter(orgId: string) {
  cache.delete(orgId);
}
```

`DualAdapter` writes to Postgres synchronously, then enqueues a sync job to ErixStore
(`erix-sync`). Reads always come from primary Postgres.

---

## 3. Entitlement Middleware

Two flavors. Both rely on `tenantResolver` running first.

### 3.1 Quota meter (numeric)

```ts
// server/src/middleware/quotaGuard.ts
import {
  incrementUsage,
  getRemaining,
} from "@/services/platform/usage.service";

export function createQuotaMiddleware(opts: {
  service:
    | "erix"
    | "laie"
    | "editor"
    | "cloud_storage"
    | "ai"
    | "workflows"
    | "erix_store";
  feature: string; // e.g. "whatsappMessages", "aiCalls", "auditsPerMonth"
  countFn?: (req) => number; // default 1
}) {
  return async (req, res, next) => {
    const count = opts.countFn?.(req) ?? 1;
    const remaining = await getRemaining(
      req.org.id,
      opts.service,
      opts.feature,
    );
    if (remaining !== "unlimited" && remaining < count) {
      return res.status(429).json({
        error: "QUOTA_EXCEEDED",
        feature: `${opts.service}.${opts.feature}`,
        remaining: Math.max(0, remaining),
      });
    }
    res.locals.consumeQuota = () =>
      incrementUsage(req.org.id, opts.service, opts.feature, count);
    next();
  };
}
```

The handler is responsible for calling `await res.locals.consumeQuota()` after a successful
operation — keeps quota consistent with actual work done.

### 3.2 Boolean feature gate

```ts
// server/src/middleware/planGuard.ts
import { getEntitlements } from "@/services/platform/entitlements.service";

export function requireFeature(path: string) {
  // path like "erix.broadcasts" or "platform.whiteLabel"
  return async (req, res, next) => {
    const ent = await getEntitlements(req.org.id);
    const enabled = path.split(".").reduce<any>((o, k) => o?.[k], ent.features);
    if (!enabled) {
      return res.status(402).json({
        error: "FEATURE_NOT_AVAILABLE",
        feature: path,
        upgradeUrl: ent.upgradeUrl,
      });
    }
    next();
  };
}
```

Usage:

```ts
router.post(
  "/api/whatsapp/send",
  tenantResolver,
  createQuotaMiddleware({ service: "erix", feature: "whatsappMessages" }),
  whatsappSendHandler,
);

router.post(
  "/api/broadcasts",
  tenantResolver,
  requireFeature("erix.broadcasts"),
  broadcastsHandler,
);
```

---

## 4. Encryption Helper

Used for every external secret stored in Postgres (DB URIs, third-party tokens).

```ts
// server/src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "base64"); // 32 bytes
const IV_LEN = 16;

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-cbc", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, dataHex] = ciphertext.split(":");
  const decipher = createDecipheriv(
    "aes-256-cbc",
    KEY,
    Buffer.from(ivHex, "hex"),
  );
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
```

Generate the key once: `openssl rand -base64 32` and put in `ENCRYPTION_KEY`.

---

## 5. EventBus + Workflow Triggers

Visual workflows fire from a central EventBus. Anywhere in the codebase that emits a domain
event also calls `triggerWorkflows`, which checks `erix_workflows` for active matching triggers.

```ts
// server/src/services/saas/automation/event-bus.ts
import { erixStore } from "@/lib/erixStore";

export type DomainEvent =
  | { type: "lead.created"; orgId: string; leadId: string; lead: Lead }
  | {
      type: "lead.stage_changed";
      orgId: string;
      leadId: string;
      from: string;
      to: string;
    }
  | {
      type: "message.received";
      orgId: string;
      conversationId: string;
      message: Message;
    }
  | { type: "deal.won"; orgId: string; leadId: string; value: number }
  | { type: "deal.lost"; orgId: string; leadId: string; reason?: string }
  | { type: "invoice.paid"; orgId: string; invoiceId: string };

export async function emit(event: DomainEvent) {
  // Synchronous in-process listeners (notifications, scoring updates)
  await runListeners(event);

  // Visual workflow execution (queued)
  await triggerWorkflows(event);

  // External webhooks (queued)
  await dispatchWebhooks(event);

  // Pub/sub for SSE / Socket.io live UI
  await erixStore.pubsub.publish(`org:${event.orgId}`, event);
}

async function triggerWorkflows(event: DomainEvent) {
  const matches = await db
    .select()
    .from(erix_workflows)
    .where(
      and(
        eq(erix_workflows.orgId, event.orgId),
        eq(erix_workflows.isActive, true),
        eq(erix_workflows.triggerType, mapEventToTriggerType(event.type)),
      ),
    );
  for (const wf of matches) {
    await erixStore.queue.add(
      "workflow-execute",
      {
        workflowId: wf.id,
        orgId: event.orgId,
        triggerData: event,
      },
      { attempts: 3 },
    );
  }
}
```

Workers consume `workflow-execute` from `server/src/workers/workflow.worker.ts` and walk the
React Flow graph (`nodes` + `edges`) stored on `erix_workflows`.

---

## 6. AI Auto-Respond (Gemini 2.0 Flash on Vertex AI)

```ts
// server/src/services/saas/ai/auto-responder.ts (excerpt)
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_MAX_OUTPUT_TOKENS = 300;
const SEMANTIC_CACHE_THRESHOLD = 0.92;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function handleInboundWithAI(
  orgId,
  conversationId,
  messageFrom,
  body,
) {
  const cached = await erixStore.semantic.search(
    body,
    SEMANTIC_CACHE_THRESHOLD,
  );
  if (cached) return { text: cached.value, confidence: 0.95, source: "cache" };

  const ctx = await buildContext(orgId, conversationId, messageFrom);
  const sys = buildSystemPrompt({
    orgConfig: ctx.orgConfig,
    leadProfile: ctx.leadProfile,
  });
  const user = buildUserMessage({
    recentMessages: ctx.recentMessages,
    latest: body,
  });

  const text = await callGemini(sys, user);
  const confidence = estimateConfidence(text, body, ctx.recentMessages.length);

  await erixStore.semantic.set(`ai:${orgId}:${Date.now()}`, body, text, {
    ttlMs: CACHE_TTL_MS,
  });

  if (
    confidence >= ctx.orgConfig.confidenceThreshold &&
    ctx.orgConfig.aiAutoReply
  ) {
    await sendWhatsAppMessage(orgId, messageFrom, text);
    await logActivity(orgId, ctx.leadProfile?.id, "ai_auto_responded", {
      confidence,
      source: "ai-agent",
      model: GEMINI_MODEL,
    });
    return { text, confidence, sent: true };
  }
  // queue suggestion for human review
  await erixStore.pubsub.publish(`inbox:${orgId}`, {
    type: "ai_suggestion",
    conversationId,
    suggestion: text,
    confidence,
  });
  return { text, confidence, sent: false, needsReview: true };
}
```

Vertex AI auth: `GOOGLE_CLOUD_PROJECT` + ADC. No API key.

LAIE outreach kits use `@anthropic-ai/vertex-sdk` (Claude Sonnet 4.5) — different model, same
Vertex tenant. See `server/src/lib/laie/claudeClient.ts`.

---

## 7. ErixStore Usage

Single import everywhere:

```ts
// server/src/lib/erixStore.ts
import { createErixClient } from "@ecodrix/erix-client";
export const erixStore = createErixClient({
  url: process.env.ERIX_STORE_URL ?? "http://localhost:6399",
  apiKey: process.env.ERIX_STORE_API_KEY!,
  tenantId: "platform", // workers re-scope per-tenant when needed
});
```

Common operations:

```ts
// Cache
await erixStore.cache.get(key);
await erixStore.cache.set(key, value, {
  ttlMs,
  tags: ["leads", `org:${orgId}`],
});
await erixStore.cache.invalidateByTag(`org:${orgId}`);

// Queue
await erixStore.queue.add("whatsapp-send", payload, {
  attempts: 3,
  delayMs: 0,
  priority: 8,
});

// Pub/Sub (server emits, SDK subscribes via Socket.io adapter)
await erixStore.pubsub.publish(`org:${orgId}`, event);

// Locks
const lock = await erixStore.locks.acquire(`broadcast:${broadcastId}`, {
  ttlMs: 60_000,
});
try {
  /* exclusive section */
} finally {
  await lock.release();
}

// Rate limit
const allowed = await erixStore.rateLimit.check(`api:${orgId}`, {
  maxPerMinute: 100,
});

// Semantic cache (Google embeddings)
await erixStore.semantic.set(key, query, value, { ttlMs });
const hit = await erixStore.semantic.search(query, 0.92);
```

Persistence: WAL → `store_job_wal`, snapshots → `store_snapshots`, usage → `store_usage_events`.

---

## 8. Service Layer Conventions

```ts
// server/src/services/saas/crm/leads.service.ts
import { getErixAdapter } from "@/lib/erix-adapter";
import { emit } from "@/services/saas/automation/event-bus";

export async function createLead(orgId: string, input: CreateLeadInput) {
  const adapter = await getErixAdapter(orgId);
  const lead = await adapter.leads.create(orgId, input);
  await emit({ type: "lead.created", orgId, leadId: lead.id, lead });
  return lead;
}
```

Rules:

- Service signatures take `orgId`, never `clientCode` (legacy `clientCode` lives behind the adapter).
- Service methods emit via `event-bus.emit` after persistence — never before.
- Service tests use a mock adapter (`server/src/lib/erix-adapter/mock-adapter.ts`).

---

## 9. SDK-First Frontend

```tsx
// saas/src/providers/EcodProvider.tsx
"use client";
import { ECODrIxAPI } from "@ecodrix/erix-api";
import { useSession } from "next-auth/react";

const Ctx = createContext<ECODrIxAPI | null>(null);
export function EcodProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const ecod = useMemo(() => {
    if (!session?.user?.tenant) return null;
    return new ECODrIxAPI({
      apiKey: session.user.tenant.apiKey,
      clientCode: session.user.tenant.clientCode,
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
    });
  }, [session?.user?.tenant]);
  return <Ctx.Provider value={ecod}>{children}</Ctx.Provider>;
}
export function useEcod() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEcod outside EcodProvider");
  return v;
}
```

Hooks always go through the SDK:

```ts
export function useLeads(filters) {
  const ecod = useEcod();
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => ecod.crm.leads.list(filters),
  });
}
```

Real-time:

```ts
useEffect(() => {
  const off = ecod.on("message.received", (m) =>
    qc.invalidateQueries(["messages", m.conversationId]),
  );
  return off;
}, [ecod]);
```

---

## 10. Drizzle Patterns

```ts
// server/src/shared/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 10 });
export const db = drizzle(pool, { schema });
```

Querying with org isolation:

```ts
import { and, eq, desc } from "drizzle-orm";
import { erix_leads } from "@/shared/db/schema";

const leads = await db
  .select()
  .from(erix_leads)
  .where(and(eq(erix_leads.orgId, orgId), eq(erix_leads.isArchived, false)))
  .orderBy(desc(erix_leads.scoreTotal))
  .limit(50);
```

Migrations: one `drizzle.config.ts` at `ECOD/server/drizzle.config.ts` covers `platform/`, `erix/`,
and `laie/` schemas. Run `pnpm db:generate` then `pnpm db:push` (or use `pnpm db:migrate` for the
versioned migrations under `server/src/shared/db/migrations/{platform,erix,laie}/`).

---

## 11. Environment Variables

### `ECOD/server/.env`

```bash
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://...                     # Supabase
MONGO_URI=mongodb://localhost:27017             # legacy + freelance tenants
ERIX_STORE_URL=http://localhost:6399
ERIX_STORE_API_KEY=...
CORE_API_KEY=...                                # admin-only operator key
ENCRYPTION_KEY=base64:32-byte-key

GOOGLE_CLOUD_PROJECT=...                        # Vertex AI (Gemini + Claude)
CLOUD_ML_REGION=us-central1
ANTHROPIC_VERTEX_PROJECT_ID=...                 # optional override
GEMINI_API_KEY=                                 # only if NOT using Vertex ADC

AWS_ACCESS_KEY_ID=...                           # SES + R2 (R2 uses S3-compatible)
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
R2_ACCOUNT_ID=...
R2_BUCKET=ecodrix-platform

META_WA_TOKEN=...
META_WA_PHONE_ID=...
META_WA_VERIFY_TOKEN=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

GOOGLE_PLACES_API_KEY=...
MONGO_ATLAS_PUBLIC_KEY=...                      # provisioning freelance tenants (optional)
MONGO_ATLAS_PRIVATE_KEY=...
MONGO_ATLAS_CLUSTER=...
```

### `ECOD/saas/.env.local`

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### `ECOD/erix-store/.env`

```bash
PORT=6399
DATABASE_URL=postgres://...                     # same Supabase, separate `store_*` tables
ERIX_API_KEY=...                                # what server hits us with
GOOGLE_API_KEY=...                              # embeddings for semantic cache
```

---

## 12. Plan Slug Map (Canonical)

```
free       — defaults for unpaid users
starter    — entry tier, $29/mo
growth     — most popular, $79/mo
scale      — power users, $199/mo
enterprise — custom pricing, white-label, 99.99% SLA
```

Old slugs (`erix_starter`, `laie_starter`, `ecodrix_pro`, `ecodrix_growth`) are retired. If you find
them in code or docs, replace.

---

Last updated: 2026-05-30 · Cross-references: `saas/.kiro/specs/platform-pricing-entitlements/`, `saas/.kiro/specs/platform-completion-end-to-end/`, `saas/.kiro/specs/ai-auto-respond/`.
