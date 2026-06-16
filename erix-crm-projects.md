# Project Management (ERIX-CRM Feature) — PRD

**Project**: ERIX-CRM  
**Author**: Dhanesh, ECODrIx  
**Version**: 2.0  
**Date**: 2026-06-12  
**Status**: Implementation Ready

---

## 1. Problem Statement

When a deal is marked "Won" in ERIX-CRM, no system exists to track delivery.
Teams lose visibility on tasks, deadlines, and progress after sale closes.
Freelancers and agencies need lightweight project management without leaving
the CRM — tracking deliverables, managing tasks, and sharing progress with
clients from the same platform where the deal was closed.

## 2. Target Users

| Role                 | Description                         | Key Need                                   |
| -------------------- | ----------------------------------- | ------------------------------------------ |
| Agency Owner / Admin | Manages team, oversees all projects | Visibility across all active projects      |
| Team Member          | Executes tasks                      | Clear task list, due dates, status updates |
| Client (Contact)     | The customer in CRM                 | See progress without asking for updates    |
| Freelancer           | Solo operator managing deliverables | Task tracking tied to invoicing            |

## 3. Goals

- Primary: Won deals auto-convert into projects with tasks, zero manual setup
- Primary: Team can manage tasks via Kanban or list view inside CRM
- Secondary: Clients get a read-only portal showing progress
- Secondary: Reduce "any update?" client messages by 80%
- Secondary: Link milestones to invoices for milestone-based billing

## 4. Non-Goals (out of scope v1)

- Gantt/timeline charts
- Resource/capacity planning across team
- Multi-project portfolio analytics dashboard
- Time tracking → invoicing integration (future phase)
- File versioning (use simple upload/attach for v1)

## 5. User Flows

### Flow 1: Project Auto-Creation (Won Deal Hook)

```
Pipeline Stage Change → isWon === true
  │
  ├─ 1. System creates erix_projects record
  │     - linked to deal_id (leadId) + tenant_id (clientCode)
  │     - status = "active"
  │     - startDate = now
  │
  ├─ 2. System looks up erix_task_templates for deal's packageTier
  │     - if template exists → clone tasks into erix_project_tasks
  │     - if no template → project created with 0 tasks (manual setup)
  │
  ├─ 3. progress_pct = 0 (no done tasks yet)
  │
  └─ 4. Project tab becomes visible on deal detail page
        - Activity logged: "Project created from won deal"
```

### Flow 2: Team Task Management

```
Admin/Team opens Project → Views tasks
  │
  ├─ Kanban view (default): 4 columns (Todo → In Progress → Review → Done)
  │   - Drag task between columns → PATCH /api/crm/tasks/:id { status }
  │   - Click "+ Add Task" per column → inline title input → POST
  │   - Click task card → opens Task Detail Drawer
  │
  ├─ List view: Sortable table with bulk actions
  │   - Filter by status / assignee
  │   - Select multiple → bulk status update / bulk assign
  │   - Click row → opens Task Detail Drawer
  │
  └─ On every status change → recalc progress_pct
       done_count / total_count × 100
```

### Flow 3: Client Portal View

```
Admin clicks "Generate Portal Link"
  │
  ├─ POST /api/crm/projects/:id/portal-link
  │   → generates crypto.randomBytes(24).hex token
  │   → stored on project.portalToken (indexed, unique, sparse)
  │   → returns URL: /portal/project/{token}
  │
  └─ Client opens link (no login)
       → GET /api/portal/project/:token
       → Returns FILTERED view:
           ✓ project name, status, progress %
           ✓ milestones with status
           ✓ task titles + status (no assignees, no notes)
           ✗ internal notes, assignees, template info
```

### Flow 4: Manual Project Creation

```
Admin creates project from sidebar → /product/erix/projects
  │
  ├─ "New Project" → name, optional dealId link, optional packageTier
  ├─ If packageTier selected → offer to auto-load template tasks
  └─ Otherwise → blank project, manual task entry
```

## 6. Screens & Routes

| Screen                 | Route (SaaS)                     | Route (API)                             | Access               |
| ---------------------- | -------------------------------- | --------------------------------------- | -------------------- |
| Projects List          | /product/erix/projects           | GET /api/crm/projects                   | Admin, Team          |
| Project Detail + Board | /product/erix/projects/:id       | GET /api/crm/projects/:id               | Admin, Team          |
| Project Kanban         | /product/erix/projects/:id/board | GET /api/crm/projects/:id/tasks         | Admin, Team          |
| Project List View      | /product/erix/projects/:id/list  | GET /api/crm/projects/:id/tasks         | Admin, Team          |
| Proposals              | /product/erix/projects/proposals | GET /api/crm/proposals                  | Admin, Team          |
| Task Detail (drawer)   | — (overlay)                      | GET/PATCH/DELETE /api/crm/tasks/:id     | Admin, Team          |
| Template Manager       | /product/erix/settings/templates | GET/PATCH /api/crm/task-templates/:tier | Admin                |
| Client Portal          | /portal/project/:token           | GET /api/portal/project/:token          | Public (token-based) |

---

## 7. Data Model

### erix_projects (MongoDB collection)

```typescript
{
  _id: ObjectId,
  tenantId: string,              // clientCode (tenant isolation)
  dealId: ObjectId | null,       // FK → leads collection
  name: string,                  // required, max 200
  description: string | null,
  status: "active" | "on-hold" | "completed" | "archived",
  packageTier: "solo" | "starter" | "growth" | "scale" | "custom" | null,
  progressPct: number,           // 0-100, auto-recalculated
  startDate: Date | null,
  dueDate: Date | null,
  portalToken: string | null,    // unique, sparse index
  portalTokenExpiresAt: Date | null,  // null = no expiry (v1 default)
  milestones: [{
    _id: ObjectId,
    title: string,
    status: "pending" | "in-progress" | "completed",
    dueDate: Date | null
  }],
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - { tenantId: 1, status: 1 }
  - { tenantId: 1, dealId: 1 }
  - { portalToken: 1 } (unique, sparse)
```

### erix_project_tasks (MongoDB collection)

```typescript
{
  _id: ObjectId,
  projectId: ObjectId,           // FK → erix_projects
  tenantId: string,              // denormalized for query perf
  title: string,                 // required, max 200
  description: string | null,
  status: "todo" | "in-progress" | "review" | "done",
  assigneeId: string | null,     // user id
  assigneeName: string | null,   // denormalized for display
  dueDate: Date | null,
  orderIndex: number,            // for drag-reorder within column
  isFromTemplate: boolean,       // marks template-cloned tasks
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - { projectId: 1, status: 1 }
  - { projectId: 1, orderIndex: 1 }
  - { tenantId: 1, assigneeId: 1 }
```

### erix_task_templates (MongoDB collection)

```typescript
{
  _id: ObjectId,
  tenantId: string,
  packageTier: "solo" | "starter" | "growth" | "scale" | "custom",
  name: string | null,
  tasks: [{
    _id: ObjectId,
    title: string,               // max 200
    description: string | null,
    orderIndex: number
  }],
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - { tenantId: 1, packageTier: 1 } (unique)
```

### erix_proposals (MongoDB collection)

```typescript
{
  _id: ObjectId,
  tenantId: string,
  projectId: string,             // FK → erix_projects
  title: string,
  content: string | null,        // rich text / markdown
  amount: number | null,         // proposal value
  currency: string,              // default "INR"
  status: "draft" | "sent" | "accepted" | "rejected",
  validUntil: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

## 8. API Endpoints

### Projects

| Method | Endpoint                            | Purpose                           |
| ------ | ----------------------------------- | --------------------------------- |
| GET    | /api/crm/projects                   | List projects (filterable)        |
| GET    | /api/crm/projects/:id               | Get project detail                |
| POST   | /api/crm/projects                   | Create project manually           |
| PATCH  | /api/crm/projects/:id               | Update project (name/status/date) |
| DELETE | /api/crm/projects/:id               | Archive project                   |
| POST   | /api/crm/projects/from-deal/:dealId | Convert won deal → project        |
| POST   | /api/crm/projects/:id/portal-link   | Generate client portal token      |

### Tasks

| Method | Endpoint                    | Purpose                 |
| ------ | --------------------------- | ----------------------- |
| GET    | /api/crm/projects/:id/tasks | List tasks (filterable) |
| POST   | /api/crm/projects/:id/tasks | Create task             |
| GET    | /api/crm/tasks/:id          | Get task detail         |
| PATCH  | /api/crm/tasks/:id          | Update task (drag-drop) |
| DELETE | /api/crm/tasks/:id          | Delete task             |
| PATCH  | /api/crm/tasks/bulk         | Bulk update tasks       |

### Templates

| Method | Endpoint                      | Purpose               |
| ------ | ----------------------------- | --------------------- |
| GET    | /api/crm/task-templates       | List all templates    |
| GET    | /api/crm/task-templates/:tier | Get template for tier |
| PATCH  | /api/crm/task-templates/:tier | Upsert template       |

### Proposals

| Method | Endpoint                        | Purpose         |
| ------ | ------------------------------- | --------------- |
| GET    | /api/crm/proposals              | List proposals  |
| POST   | /api/crm/projects/:id/proposals | Create proposal |
| PATCH  | /api/crm/proposals/:id          | Update proposal |

### Portal (Public — No Auth)

| Method | Endpoint                   | Purpose                     |
| ------ | -------------------------- | --------------------------- |
| GET    | /api/portal/project/:token | Fetch filtered project view |

## 9. Implementation Status

### ✅ Completed

| Component                         | File                                                              | Status |
| --------------------------------- | ----------------------------------------------------------------- | ------ |
| Drizzle schema (PostgreSQL)       | `server/src/shared/db/schema/erix/projects.ts`                    | Done   |
| Mongoose schema (MongoDB)         | `server/src/model/saas/crm/project.model.ts`                      | Done   |
| Schema barrel export              | `server/src/shared/db/schema/erix/index.ts`                       | Done   |
| ProjectSDK (Mongoose path)        | `server/src/sdk/project.sdk.ts`                                   | Done   |
| SDK registration                  | `server/src/sdk/index.ts`                                         | Done   |
| Project routes                    | `server/src/routes/erix/crm/project.routes.ts`                    | Done   |
| CRM router mount                  | `server/src/routes/erix/crm/crm.router.ts`                        | Done   |
| Portal route (public)             | `server/src/routes/public/portal.routes.ts`                       | Done   |
| Express type augmentation         | `server/src/types/express.d.ts`                                   | Done   |
| Sidebar (ERIX redesign)           | `saas/src/components/layout/AppSidebar.tsx`                       | Done   |
| Projects list page                | `saas/src/app/(product)/product/erix/projects/page.tsx`           | Done   |
| Proposals page                    | `saas/src/app/(product)/product/erix/projects/proposals/page.tsx` | Done   |
| Overview page                     | `saas/src/app/(product)/product/erix/overview/page.tsx`           | Done   |
| DB connection fix (platform mode) | `server/src/services/admin/data-source.service.ts`                | Done   |

### 🔲 TODO (Next Sessions)

| Component                                    | Priority | Notes                                       |
| -------------------------------------------- | -------- | ------------------------------------------- |
| Add `projects` to ErixAdapter interface      | P0       | types.ts + postgres-adapter + mongo-adapter |
| Refactor ProjectSDK to use ErixAdapter       | P0       | Replace getTenantConnection with adapter    |
| Project detail page (with board/list toggle) | P0       | Frontend kanban + list                      |
| Task detail drawer component                 | P0       | Auto-save on blur                           |
| Pipeline Won → auto-create project hook      | P0       | Server-side stage change handler            |
| Template manager page                        | P1       | Admin settings screen                       |
| Client portal frontend page                  | P1       | Public Next.js route                        |
| Bulk task operations UI                      | P1       | List view toolbar                           |
| Milestone → Invoice linking                  | P2       | Commerce integration                        |
| Overdue task reminders (WhatsApp/Email)      | P2       | Automation trigger                          |
| Project activity timeline                    | P2       | Activity SDK integration                    |

## 10. Technical Architecture

### Data Source (ERIX-CRM Only)

The data source decision applies **exclusively to ERIX-CRM and its internals**
(leads, pipelines, projects, conversations, invoices, templates, automations).
LAIE, Flow, and Connect always use the platform PostgreSQL.

```
User configures in Connect → Database provider:

  platform mode (default)
    → ErixAdapter = PostgresAdapter(getLaieDb())
    → Data lives in shared PostgreSQL tables: erix_projects, erix_project_tasks, etc.
    → Drizzle ORM with org_id scoping

  own mode (MongoDB)
    → ErixAdapter = MongoAdapter(clientCode)
    → Data lives in tenant's external MongoDB
    → getTenantConnection() → Mongoose collections: erix_projects, etc.

  own mode (PostgreSQL)
    → ErixAdapter = PostgresAdapter(tenantPool)
    → Data lives in tenant's own Postgres
    → Same Drizzle schema, different connection pool

  hybrid mode
    → Not shipped yet, falls back to platform
```

### Resolution Chain

```
Route handler → req.sdk.project.list()
                    │
                    ▼
ProjectSDK → getErixAdapter(orgId)
                    │
                    ├─ platform? → PostgresAdapter (Drizzle → erix_projects table)
                    ├─ own/mongo? → MongoAdapter (Mongoose → erix_projects collection)
                    └─ own/pg? → PostgresAdapter (tenant Drizzle pool)
```

### Schema Locations

| Mode          | Schema Definition                   | ORM      |
| ------------- | ----------------------------------- | -------- |
| Platform (PG) | `shared/db/schema/erix/projects.ts` | Drizzle  |
| Own (MongoDB) | `model/saas/crm/project.model.ts`   | Mongoose |
| Own (PG)      | Same Drizzle schema, tenant pool    | Drizzle  |

### ErixAdapter Contract (projects namespace — TODO)

```typescript
projects: {
  list(orgId: string, query: ListProjectsQuery): Promise<ListResult<Project>>;
  findById(orgId: string, projectId: string): Promise<Project | null>;
  create(orgId: string, input: CreateProjectInput): Promise<Project>;
  update(orgId: string, projectId: string, patch: UpdateProjectInput): Promise<Project>;
  archive(orgId: string, projectId: string): Promise<void>;
};

projectTasks: {
  list(orgId: string, projectId: string, query: ListTasksQuery): Promise<ProjectTask[]>;
  create(orgId: string, projectId: string, input: CreateTaskInput): Promise<ProjectTask>;
  update(orgId: string, taskId: string, patch: UpdateTaskInput): Promise<ProjectTask>;
  delete(orgId: string, taskId: string): Promise<void>;
  bulkUpdate(orgId: string, taskIds: string[], patch: Partial<UpdateTaskInput>): Promise<void>;
};

taskTemplates: {
  list(orgId: string): Promise<TaskTemplate[]>;
  getByTier(orgId: string, tier: PackageTier): Promise<TaskTemplate | null>;
  upsert(orgId: string, tier: PackageTier, tasks: TemplateTask[]): Promise<TaskTemplate>;
};

proposals: {
  list(orgId: string, query: { projectId?: string; status?: string }): Promise<ListResult<Proposal>>;
  create(orgId: string, projectId: string, input: CreateProposalInput): Promise<Proposal>;
  update(orgId: string, proposalId: string, patch: UpdateProposalInput): Promise<Proposal>;
};
```

### Auto-Progress Recalculation

```
Every task status change triggers:
  1. Count total tasks for the project
  2. Count tasks with status === "done"
  3. Update project.progressPct = Math.round(done/total * 100)

Called automatically in:
  - ProjectSDK.createTask()
  - ProjectSDK.updateTask()
  - ProjectSDK.deleteTask()
  - ProjectSDK.bulkUpdateTasks()
```

### Won Deal Hook (TODO — implementation plan)

```
Location: server/src/services/saas/crm/lead.service.ts → moveLead()

When a lead is moved to a stage where isWon === true:
  1. Check if a project already exists for this dealId
  2. If not → call ProjectSDK.convertFromDeal(leadId, { packageTier })
  3. Log activity: "Project auto-created from won deal"
  4. Emit socket event: "project:created" to tenant room
```

### Connect Integration

```
Connect provides credentials internally to ERIX-CRM via hidden keys:
  - Database connection (platform/own/hybrid) → transparent to project code
  - WhatsApp (for overdue reminders) → future phase
  - Email (for portal link delivery) → future phase

No explicit connect setup needed for projects to work.
Projects use the same DB resolution as all other CRM features.
```

## 11. Open Questions (Decisions Needed)

| #   | Question                                           | Recommendation                                                      |
| --- | -------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Client portal: magic link only, or optional login? | Magic link only (v1). Add login in v2 for repeat clients.           |
| 2   | Overdue tasks trigger reminders?                   | Yes, but as ERIX-Flow automation (not hardcoded). P2.               |
| 3   | Templates: tenant-customizable or global defaults? | Tenant-customizable. Provide starter templates on first enable.     |
| 4   | Milestones: auto-derived from tasks or manual?     | Manual for v1. Auto-derive option in v2 (group tasks by milestone). |
| 5   | Time tracking in v1?                               | No. Confirmed phase 2.                                              |
| 6   | Budget/cost tracking?                              | No for v1. Use deal value from lead as project budget reference.    |

## 12. Success Metrics

- 100% of won deals with auto-created project (when hook enabled)
- Avg time-to-first-task-update < 2 hours after project creation
- Client portal link generation rate > 60% per project
- Task completion velocity (tasks done/week) visible in overview
- Reduction in client "status update" messages (qualitative survey)
