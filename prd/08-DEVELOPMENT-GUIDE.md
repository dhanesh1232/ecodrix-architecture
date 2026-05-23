# ECODrIx — Development Execution Guide
## Ready-to-Code Implementation Reference

This document provides EXACT file paths, component names, API routes, queries,
and step-by-step instructions for each development task. Use this to go directly
into implementation without ambiguity.

---

## PHASE 1: FOUNDATION (Weeks 1-4)

### Task 1.1: PostgreSQL Migration (Client → Organization)

**What:** Move tenant identity from MongoDB `Client` model to PostgreSQL `ecodrix_organizations` table.

**Files to create/modify:**

```
ECOD/server/src/shared/db/schema/platform.ts    ← CREATE (Drizzle schema)
ECOD/server/src/shared/db/migrations/           ← CREATE (migration files)
ECOD/server/src/middleware/saasAuth.ts           ← MODIFY (read from PG instead of Mongo)
ECOD/server/src/lib/connectionManager.ts        ← MODIFY (read URI from PG org record)
ECOD/server/scripts/migrate-clients-to-pg.ts    ← CREATE (migration script)
```

**Step-by-step:**

1. Create the Drizzle schema file with `ecodrix_organizations` table (see IMPLEMENTATION_DETAILS.md)
2. Run `drizzle-kit generate` to create migration SQL
3. Run `drizzle-kit push` to apply to Supabase
4. Write migration script that:
   - Reads all MongoDB `Client` documents
   - Reads all `ClientDataSource` documents
   - Inserts into `ecodrix_organizations` (mapping fields)
   - Validates: count matches, no data loss
5. Update `saasAuth.ts`:
   ```typescript
   // BEFORE: const client = await Client.findOne({ apiKey });
   // AFTER:
   const [org] = await db.select().from(ecodrix_organizations)
     .where(eq(ecodrix_organizations.apiKey, apiKey))
     .limit(1);
   if (!org) return res.status(401).json({ error: "Unauthorized" });
   req.orgId = org.id;
   req.clientCode = org.clientCode;
   ```
6. Update `connectionManager.ts` (for "own" mode external DBs):
   ```typescript
   // Read external DB URI from PostgreSQL org record instead of MongoDB ClientDataSource
   const [org] = await db.select().from(ecodrix_organizations)
     .where(eq(ecodrix_organizations.clientCode, code))
     .limit(1);
   const uri = decrypt(org.externalDbUri);
   ```
7. Dual-write phase: keep writing to MongoDB for 2 weeks as backup
8. After validation: remove MongoDB dependency from auth flow

**Verification:** `curl -H "x-api-key: ecod_live_sk_..." http://localhost:4000/api/health` returns org context from PostgreSQL.

---

### Task 1.2: ECOD/saas Console Redesign

**What:** Restructure the Next.js app from flat dashboard to console-style with route groups.

**Files to create:**

```
ECOD/saas/src/app/(console)/layout.tsx           ← Console layout (topbar only, NO sidebar)
ECOD/saas/src/app/(console)/page.tsx             ← Console home (product cards + activity)
ECOD/saas/src/app/(erix)/layout.tsx              ← ERIX layout (own sidebar)
ECOD/saas/src/app/(erix)/erix/page.tsx           ← ERIX home (inbox)
ECOD/saas/src/app/(laie)/layout.tsx              ← LAIE layout (own sidebar)
ECOD/saas/src/app/(laie)/laie/page.tsx           ← LAIE home (audit)
ECOD/saas/src/components/layout/ConsoleTopbar.tsx
ECOD/saas/src/components/layout/ErixSidebar.tsx
ECOD/saas/src/components/layout/LaieSidebar.tsx
ECOD/saas/src/components/layout/ProductTopbar.tsx
ECOD/saas/src/components/console/ProductCard.tsx
ECOD/saas/src/components/console/InfraServiceCard.tsx
ECOD/saas/src/components/console/ActivityFeed.tsx
ECOD/saas/src/components/console/UsageMeters.tsx
ECOD/saas/src/providers/EcodProvider.tsx
```

**Console layout (`(console)/layout.tsx`):**
```typescript
// NO sidebar. Only topbar + content area.
export default function ConsoleLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0A1628]">
      <ConsoleTopbar />
      <main className="pt-16 px-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
```

**ERIX layout (`(erix)/layout.tsx`):**
```typescript
// Own sidebar + "← Console" in topbar
export default function ErixLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0A1628]">
      <ProductTopbar title="ERIX CRM" backLink="/" />
      <div className="flex pt-14">
        <ErixSidebar />
        <main className="flex-1 ml-60 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**EcodProvider (`providers/EcodProvider.tsx`):**
```typescript
"use client";
import { createContext, useContext, useMemo } from "react";
import { ECODrIxAPI } from "@ecodrix/erix-api";
import { useSession } from "next-auth/react";

const EcodContext = createContext<ECODrIxAPI | null>(null);

export function EcodProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const ecod = useMemo(() => {
    if (!session?.user?.tenant) return null;
    return new ECODrIxAPI({
      apiKey: session.user.tenant.apiKey,
      clientCode: session.user.tenant.clientCode,
      baseUrl: process.env.NEXT_PUBLIC_API_URL || undefined,
    });
  }, [session?.user?.tenant]);
  return <EcodContext.Provider value={ecod}>{children}</EcodContext.Provider>;
}

export function useEcod(): ECODrIxAPI {
  const ctx = useContext(EcodContext);
  if (!ctx) throw new Error("useEcod: no active session");
  return ctx;
}
```

---

### Task 1.3: Auth Pages

**Files:**
```
ECOD/saas/src/app/(auth)/auth/login/page.tsx
ECOD/saas/src/app/(auth)/auth/register/page.tsx
ECOD/saas/src/components/auth/LoginForm.tsx
ECOD/saas/src/components/auth/RegisterForm.tsx
ECOD/saas/src/lib/auth.ts                       ← NextAuth config
ECOD/saas/src/middleware.ts                      ← Route protection
```

**NextAuth config (`lib/auth.ts`):**
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenant = user.tenant; // { apiKey, clientCode }
        token.plan = user.plan;
        token.role = user.role;
        token.erixEnabled = user.erixEnabled;
        token.laieEnabled = user.laieEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.tenant = token.tenant as { apiKey: string; clientCode: string };
      session.user.plan = token.plan as string;
      session.user.role = token.role as string;
      session.user.erixEnabled = token.erixEnabled as boolean;
      session.user.laieEnabled = token.laieEnabled as boolean;
      return session;
    },
  },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    Credentials({
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        if (!res.ok) return null;
        return (await res.json()).user;
      },
    }),
  ],
});
```

**Server auth endpoint to create (`ECOD/server/src/routes/auth/login.routes.ts`):**
```typescript
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [user] = await db.select().from(ecodrix_users)
    .where(eq(ecodrix_users.email, email.toLowerCase()))
    .limit(1);
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  
  // Get org membership
  const [member] = await db.select().from(ecodrix_members)
    .where(eq(ecodrix_members.userId, user.id))
    .limit(1);
  const [org] = await db.select().from(ecodrix_organizations)
    .where(eq(ecodrix_organizations.id, member.orgId))
    .limit(1);
  
  await db.update(ecodrix_users).set({ lastLoginAt: new Date() }).where(eq(ecodrix_users.id, user.id));
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      tenant: { apiKey: org.apiKey, clientCode: org.clientCode },
      plan: org.subscriptionStatus,
      role: member.role,
      erixEnabled: org.erixEnabled,
      laieEnabled: org.laieEnabled,
    }
  });
});
```

---

### Task 1.4: Billing Page

**Files:**
```
ECOD/saas/src/app/(console)/billing/page.tsx
ECOD/saas/src/components/billing/PlanCard.tsx
ECOD/saas/src/components/billing/PlanComparison.tsx
ECOD/saas/src/hooks/useBilling.ts
```

**Server endpoint (`ECOD/server/src/routes/saas/billing.routes.ts`):**
```typescript
// GET /api/saas/billing/plans — list all plans
router.get("/plans", async (req, res) => {
  const plans = await db.select().from(ecodrix_plans).where(eq(ecodrix_plans.isActive, true));
  res.json({ success: true, data: plans });
});

// POST /api/saas/billing/subscribe — create Razorpay subscription
router.post("/subscribe", validateClientKey, async (req, res) => {
  const { planId } = req.body;
  const plan = await db.select().from(ecodrix_plans).where(eq(ecodrix_plans.id, planId)).limit(1);
  
  // Create Razorpay subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: plan[0].razorpayPlanId,
    customer_notify: 1,
    total_count: 12,
  });
  
  // Save to DB
  await db.insert(ecodrix_subscriptions).values({
    orgId: req.orgId,
    planId,
    status: "created",
    paymentProvider: "razorpay",
    providerSubscriptionId: subscription.id,
  });
  
  res.json({ success: true, data: { subscriptionId: subscription.id, shortUrl: subscription.short_url } });
});
```

---

## PHASE 2: CORE CRM (Weeks 5-8)

### Task 2.1: CRM Database Tables

**Run this migration in Supabase:**
All `erix_*` table definitions are in `IMPLEMENTATION_DETAILS.md`.
After creating schemas, run: `drizzle-kit push`

### Task 2.2: WhatsApp Inbox

**Files to create:**
```
ECOD/saas/src/app/(erix)/erix/page.tsx              ← Inbox (default ERIX page)
ECOD/saas/src/app/(erix)/erix/inbox/page.tsx        ← Full inbox view
ECOD/saas/src/components/erix/InboxList.tsx          ← Left pane (thread list)
ECOD/saas/src/components/erix/InboxThread.tsx        ← Right pane (messages)
ECOD/saas/src/components/erix/MessageBubble.tsx      ← Single message
ECOD/saas/src/components/erix/MessageComposer.tsx    ← Input + send + template picker
ECOD/saas/src/hooks/useConversations.ts
ECOD/saas/src/hooks/useMessages.ts
ECOD/saas/src/store/erix.store.ts                   ← Active thread state
```

**Hook pattern:**
```typescript
// hooks/useConversations.ts
export function useConversations() {
  const ecod = useEcod();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => ecod.whatsapp.conversations.list(),
    refetchInterval: 10000, // poll every 10s (Socket.io handles real-time)
  });
}

export function useMessages(conversationId: string) {
  const ecod = useEcod();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => ecod.whatsapp.messages.list(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const ecod = useEcod();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { to: string; text: string }) => ecod.whatsapp.messages.send(data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
```

**Real-time (Socket.io via SDK):**
```typescript
// In InboxList component:
useEffect(() => {
  const ecod = useEcod();
  ecod.on("new_message", (msg) => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["messages", msg.conversationId] });
  });
  ecod.on("message_status_update", (update) => {
    // Update message status in cache (optimistic)
  });
  return () => { ecod.off("new_message"); ecod.off("message_status_update"); };
}, []);
```

### Task 2.3: Contacts Table

**Files:**
```
ECOD/saas/src/app/(erix)/erix/contacts/page.tsx
ECOD/saas/src/components/erix/ContactTable.tsx       ← TanStack Table
ECOD/saas/src/components/erix/ContactSheet.tsx       ← Slide-in detail/create
ECOD/saas/src/components/erix/ContactFilters.tsx
ECOD/saas/src/hooks/useContacts.ts
```

**Hook:**
```typescript
export function useContacts(params?: { status?: string; page?: number; search?: string }) {
  const ecod = useEcod();
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: () => ecod.crm.leads.list(params),
  });
}
```

### Task 2.4: Pipeline Kanban

**Files:**
```
ECOD/saas/src/app/(erix)/erix/pipeline/page.tsx
ECOD/saas/src/components/erix/PipelineKanban.tsx     ← @dnd-kit board
ECOD/saas/src/components/erix/PipelineCard.tsx       ← Draggable card
ECOD/saas/src/components/erix/PipelineColumn.tsx     ← Droppable column
ECOD/saas/src/hooks/usePipeline.ts
```

**Drag-and-drop handler:**
```typescript
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;
  const leadId = active.id as string;
  const newStageId = over.id as string;
  // Optimistic update
  queryClient.setQueryData(["pipeline"], (old) => moveCardInCache(old, leadId, newStageId));
  // Server update
  await ecod.crm.leads.move(leadId, newStageId);
}
```

---

## PHASE 3: REVENUE FEATURES (Weeks 9-12)

### Task 3.1: Invoice Module

**Files:**
```
ECOD/saas/src/app/(erix)/erix/invoices/page.tsx          ← Invoice list
ECOD/saas/src/app/(erix)/erix/invoices/new/page.tsx      ← Invoice builder
ECOD/saas/src/app/(erix)/erix/invoices/[id]/page.tsx     ← Invoice detail
ECOD/saas/src/components/erix/InvoiceBuilder.tsx
ECOD/saas/src/components/erix/InvoicePreview.tsx
ECOD/saas/src/components/erix/InvoiceLineItems.tsx
ECOD/saas/src/hooks/useInvoices.ts
```

**Server routes (`ECOD/server/src/routes/saas/invoice.routes.ts`):**
```typescript
// POST /api/saas/invoices — create invoice
router.post("/", validateClientKey, async (req, res) => {
  const { leadId, items, dueDate, notes } = req.body;
  
  // Get org invoice settings
  const [settings] = await db.select().from(erix_invoice_settings)
    .where(eq(erix_invoice_settings.orgId, req.orgId));
  
  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
  const taxAmount = Math.round(subtotal * (settings.taxRate / 100));
  const total = subtotal + taxAmount;
  
  // Generate invoice number
  const invoiceNumber = `${settings.prefix}-${new Date().getFullYear()}-${String(settings.nextNumber).padStart(4, "0")}`;
  
  // Create Razorpay payment link
  const paymentLink = await razorpay.paymentLink.create({
    amount: total * 100, // paise
    currency: "INR",
    description: `Invoice ${invoiceNumber}`,
    customer: { contact: lead.phone, email: lead.email },
    callback_url: `${process.env.APP_URL}/invoices/confirm`,
    callback_method: "get",
  });
  
  // Insert invoice
  const [invoice] = await db.insert(erix_invoices).values({
    orgId: req.orgId,
    invoiceNumber,
    leadId,
    items,
    subtotal,
    taxAmount,
    total,
    dueDate,
    notes,
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.short_url,
    status: "draft",
  }).returning();
  
  // Increment next number
  await db.update(erix_invoice_settings)
    .set({ nextNumber: settings.nextNumber + 1 })
    .where(eq(erix_invoice_settings.orgId, req.orgId));
  
  res.json({ success: true, data: invoice });
});

// POST /api/saas/invoices/:id/send-whatsapp — send via WhatsApp
router.post("/:id/send-whatsapp", validateClientKey, async (req, res) => {
  const [invoice] = await db.select().from(erix_invoices)
    .where(and(eq(erix_invoices.id, req.params.id), eq(erix_invoices.orgId, req.orgId)));
  
  const [lead] = await db.select().from(erix_leads)
    .where(eq(erix_leads.id, invoice.leadId));
  
  // Send WhatsApp message with payment link
  await sendWhatsAppMessage(req.orgId, lead.phone, 
    `Hi ${lead.firstName}, here's your invoice #${invoice.invoiceNumber} for ₹${invoice.total.toLocaleString()}.\n\nPay here: ${invoice.paymentLinkUrl}\n\nThank you!`
  );
  
  await db.update(erix_invoices)
    .set({ status: "sent", sentAt: new Date(), sentVia: "whatsapp" })
    .where(eq(erix_invoices.id, invoice.id));
  
  res.json({ success: true });
});
```

### Task 3.2: LAIE Audit UI

**Files:**
```
ECOD/saas/src/app/(laie)/laie/page.tsx               ← Audit search
ECOD/saas/src/app/(laie)/laie/audit/[id]/page.tsx    ← Audit result
ECOD/saas/src/components/laie/AuditSearchForm.tsx
ECOD/saas/src/components/laie/AuditProgress.tsx
ECOD/saas/src/components/laie/AuditResultCard.tsx
ECOD/saas/src/components/laie/ScoreRadial.tsx
ECOD/saas/src/components/laie/OutreachKit.tsx
ECOD/saas/src/hooks/useLaieAudit.ts
```

**Hook (uses SDK escape hatch since LAIE isn't in typed SDK yet):**
```typescript
export function useRunAudit() {
  const ecod = useEcod();
  return useMutation({
    mutationFn: (data: { businessName: string; city?: string }) =>
      ecod.request("POST", "/api/laie/audit", data),
  });
}

export function useAuditProgress(auditId: string) {
  const ecod = useEcod();
  // Subscribe to SSE for real-time progress
  useEffect(() => {
    if (!auditId) return;
    ecod.on(`audit:${auditId}:progress`, (data) => {
      setProgress(data);
    });
    return () => ecod.off(`audit:${auditId}:progress`);
  }, [auditId]);
}
```

### Task 3.3: AI Auto-Respond

**Files:**
```
ECOD/server/src/services/saas/ai/auto-responder.ts   ← AI response logic
ECOD/server/src/services/saas/ai/confidence.ts       ← Confidence scoring
ECOD/saas/src/app/(erix)/erix/settings/page.tsx      ← AI config UI
```

**Auto-responder (`ECOD/server/src/services/saas/ai/auto-responder.ts`):**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { store } from "@lib/erixStore";

export async function handleInboundWithAI(orgId: string, message: InboundMessage) {
  // 1. Get org AI config
  const [org] = await db.select().from(ecodrix_organizations)
    .where(eq(ecodrix_organizations.id, orgId));
  
  if (!org.aiAgentEnabled || !org.aiAutoReply) return null;
  
  // 2. Check semantic cache first (save API costs)
  const cached = await store.semantic.search(message.body, 0.92);
  if (cached) return { text: cached.value, confidence: 0.95, fromCache: true };
  
  // 3. Get conversation history
  const history = await db.select().from(erix_messages)
    .where(eq(erix_messages.conversationId, message.conversationId))
    .orderBy(desc(erix_messages.createdAt))
    .limit(20);
  
  // 4. Get lead context
  const [lead] = await db.select().from(erix_leads)
    .where(and(eq(erix_leads.orgId, orgId), eq(erix_leads.phone, message.from)));
  
  // 5. Call Claude
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: `You are a sales assistant for ${org.name}. ${org.aiAgentPrompt || "Be helpful and professional."}
Industry: ${org.industry || "general"}
Lead context: ${lead ? `${lead.firstName}, stage: ${lead.stage}, score: ${lead.score}` : "Unknown lead"}`,
    messages: history.reverse().map(m => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.body || "",
    })).concat([{ role: "user", content: message.body }]),
  });
  
  const aiText = response.content[0].type === "text" ? response.content[0].text : "";
  const confidence = estimateConfidence(aiText, message.body, history.length);
  
  // 6. Cache for future similar questions
  await store.semantic.set(`ai:${orgId}:${Date.now()}`, message.body, aiText, { ttlMs: 86400000 });
  
  // 7. Auto-send or queue for review
  if (confidence >= 0.85) {
    await sendWhatsAppMessage(orgId, message.from, aiText);
    await logActivity(orgId, lead?.id, "ai_auto_responded", { confidence, text: aiText });
    return { text: aiText, confidence, sent: true };
  } else {
    // Queue for human review — show as suggestion in inbox
    await store.pubsub.publish(`inbox:${orgId}`, {
      type: "ai_suggestion",
      conversationId: message.conversationId,
      suggestion: aiText,
      confidence,
    });
    return { text: aiText, confidence, sent: false, needsReview: true };
  }
}
```

---

## PHASE 4: POWER FEATURES (Weeks 13-16)

### Task 4.1: Visual Automation Builder

**Dependencies:** `pnpm add @xyflow/react` (React Flow v12)

**Files:**
```
ECOD/saas/src/app/(erix)/erix/automation/page.tsx           ← Workflow list
ECOD/saas/src/app/(erix)/erix/automation/[id]/page.tsx      ← Workflow editor
ECOD/saas/src/components/erix/automation/WorkflowCanvas.tsx  ← React Flow canvas
ECOD/saas/src/components/erix/automation/NodePalette.tsx     ← Draggable node list
ECOD/saas/src/components/erix/automation/NodeProperties.tsx  ← Right panel config
ECOD/saas/src/components/erix/automation/nodes/             ← Custom node components
  TriggerNode.tsx
  ConditionNode.tsx
  ActionNode.tsx
  WaitNode.tsx
  AiNode.tsx
ECOD/saas/src/hooks/useWorkflows.ts
```

**Server execution engine (`ECOD/server/src/services/saas/automation/executor.ts`):**
```typescript
import { ErixWorker } from "@ecodrix/erix-worker";
import { store } from "@lib/erixStore";

const workflowWorker = new ErixWorker(store, "workflow-execute", async (job) => {
  const { workflowId, orgId, triggerData } = job.data;
  
  const [workflow] = await db.select().from(erix_workflows)
    .where(and(eq(erix_workflows.id, workflowId), eq(erix_workflows.orgId, orgId)));
  
  const nodes = workflow.nodes as WorkflowNode[];
  const edges = workflow.edges as WorkflowEdge[];
  
  // Find trigger node (entry point)
  let currentNodeId = nodes.find(n => n.type === "trigger")?.id;
  const context = { ...triggerData, results: {} };
  
  // Create run record
  const [run] = await db.insert(erix_workflow_runs).values({
    orgId, workflowId, triggeredBy: triggerData.source, status: "running",
  }).returning();
  
  while (currentNodeId) {
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) break;
    
    try {
      const result = await executeNode(node, context, orgId);
      context.results[node.id] = result;
      
      // Log node result
      await db.update(erix_workflow_runs)
        .set({ nodeResults: sql`jsonb_set(node_results, '{${node.id}}', ${JSON.stringify(result)})` })
        .where(eq(erix_workflow_runs.id, run.id));
      
      // Find next node
      const outEdges = edges.filter(e => e.source === currentNodeId);
      if (node.type === "condition") {
        // Branch based on condition result
        const branch = result.passed ? "yes" : "no";
        currentNodeId = outEdges.find(e => e.sourceHandle === branch)?.target;
      } else {
        currentNodeId = outEdges[0]?.target;
      }
    } catch (err) {
      await db.update(erix_workflow_runs)
        .set({ status: "failed", error: err.message, completedAt: new Date() })
        .where(eq(erix_workflow_runs.id, run.id));
      break;
    }
  }
  
  await db.update(erix_workflow_runs)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(erix_workflow_runs.id, run.id));
}, { maxConcurrentJobs: 10, pollIntervalMs: 3000 });

workflowWorker.run();
```

---

## DEVELOPMENT COMMANDS

```bash
# Start all services for development:
cd ECOD/erix-store && pnpm dev          # Port 6399 (start first)
cd ECOD/server && pnpm dev              # Port 4000
cd ECOD/saas && pnpm dev                # Port 3000
cd ECOD/admin && pnpm dev               # Port 3001

# Database:
cd ECOD/server && pnpm db:sync          # Push Drizzle schema to Supabase
cd ECOD/server && pnpm db:studio        # Open Drizzle Studio (DB viewer)

# SDK development:
cd ECOD/packages/erix-api && pnpm dev   # Watch mode (auto-rebuild)
cd ECOD/packages/erix-react && pnpm dev # Watch mode (Next.js dev server)

# Testing:
cd ECOD/server && pnpm test             # Run server tests
cd ECOD/erix-store && pnpm test         # Run ErixStore tests

# Build:
cd ECOD/packages/erix-api && pnpm build:final    # Build + types
cd ECOD/packages/erix-react && pnpm build:final  # Build + types
```

---

## VERIFICATION CHECKLIST (Per Phase)

### After Phase 1:
- [ ] `demo@ecodrix.com` / `Demo@2026` can log in
- [ ] Console shows product cards with live stats
- [ ] "Launch ERIX Console" navigates to /erix with own sidebar
- [ ] "← Console" returns to /
- [ ] All API calls go through SDK (no direct fetch in frontend)

### After Phase 2:
- [ ] WhatsApp inbox shows real conversations (or mock data)
- [ ] Contacts table loads, sorts, filters, paginates
- [ ] Pipeline Kanban drag-and-drop updates stage
- [ ] Templates page shows list + create form
- [ ] Billing page shows plans + upgrade button

### After Phase 3:
- [ ] Invoice builder creates invoice with line items + GST
- [ ] "Send via WhatsApp" delivers payment link to lead's phone
- [ ] Razorpay webhook marks invoice as paid
- [ ] LAIE audit runs and shows score card
- [ ] AI auto-responds to WhatsApp (when enabled)

### After Phase 4:
- [ ] Visual automation builder renders canvas with nodes
- [ ] Drag node from palette → drop on canvas → connect edges
- [ ] Activate workflow → triggers fire on events
- [ ] Webhook engine delivers HTTP calls with retry
- [ ] Custom fields appear in contacts table + kanban cards
