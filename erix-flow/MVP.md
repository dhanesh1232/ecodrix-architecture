# ECODrIx ERIX Automation MVP Spec

## Product definition

`ERIX-Flow` is a no-code automation builder inside ECODrIx that lets users create outbound and lead-workflow automations by connecting ECODrIx modules as drag-and-drop nodes. The core product idea is a unified visual layer over scraping, enrichment, validation, CRM sync, storage, and multichannel outreach so users do not need to stitch together separate tools for each step.[1][2][3]

The strongest product opportunity is not inventing a brand-new category, but combining existing fragmented layers into one workflow system: lead discovery, enrichment, AI scoring or summaries, channel validation, CRM updates, and outreach already exist in parts across current platforms and published workflow examples.[1][2]

## Problem

Current GTM and outbound stacks are fragmented. Teams often use separate products for scraping, enrichment, email finding, email validation, CRM sync, storage, email delivery, and WhatsApp automation, then connect them manually or through generic workflow tools.[1][2][3]

That fragmentation creates five predictable issues:

- Data moves between tools with exports, imports, and brittle automations.[1]
- Validation and enrichment quality becomes inconsistent because each provider has a different schema.[2]
- Outreach timing breaks when channels are not validated before send.[2]
- CRM records drift because enrichment and outreach results do not sync back cleanly.[1]
- Teams pay for overlapping tools when they really want one workflow surface.[3]

## MVP goal

The MVP should prove one core promise: a user can visually build a complete lead-generation and outreach workflow using ECODrIx-native modules, then run it on a target segment with minimal manual work.[1][2]

The MVP does not need to cover every ECODrIx module deeply. It only needs enough capability to demonstrate a reliable end-to-end loop from lead source to validated outreach and CRM update.[1][2]

## Target users

### Primary user

- Agency operators running outbound for clients.
- Solo founders and SMB operators doing prospecting and outreach.
- Sales ops / GTM operators who currently combine Clay-like enrichment, Apollo-like prospecting, Hunter-like verification, and separate sending tools.[1][2]

### Secondary user

- Developers who want an API-first layer beneath the visual builder.
- Internal teams that want ECODrIx as a self-hostable growth automation system.

## Core workflow

The MVP workflow should follow this path:

1. Select or upload a lead source.
2. Scrape or import companies / people.
3. Enrich each lead with firmographic and contact data.
4. Validate email and available WhatsApp/mobile data.
5. Generate AI summary, likely pain points, and personalization notes.
6. Save lead record into ERIX-CRM.
7. Send email via ERIX-Sender if validation passes.
8. Queue or send WhatsApp after email validation and rule checks.
9. Write run logs and outcomes back into the lead timeline.[1][2][4]

## MVP modules

### 1. Builder canvas

The visual builder is the heart of the MVP. Users should be able to drag nodes, connect them, configure each node, test with sample data, and publish a workflow.

Required builder capabilities:

- Drag-and-drop canvas.
- Node connection lines.
- Sidebar config for each node.
- Run test with one lead.
- Save draft / publish workflow.
- Run history and basic logs.
- Conditional branches: pass / fail only.

### 2. Node system

Each existing ECODrIx module becomes a node category.

| Node category | MVP node examples                                     | Backed by                 |
| ------------- | ----------------------------------------------------- | ------------------------- |
| Source        | Import CSV, Web scrape, API input                     | ERIX-LAIE / scraper layer |
| Enrichment    | Find company data, find person data, generate summary | ERIX-LAIE                 |
| Validation    | Validate email, classify phone/WhatsApp status        | ERIX-LAIE                 |
| AI            | Pain points, personalization, first-line generation   | LLM layer                 |
| CRM           | Create lead, update lead, create activity             | ERIX-CRM                  |
| Storage       | Store enrichment artifact, raw page, attachment       | ERIX-Storage              |
| Cache / jobs  | Queue run, cache source output                        | ERIX-Store                |
| Outreach      | Send email, queue WhatsApp, follow-up step            | ERIX-Sender               |

### 3. Unified lead record

The MVP needs one canonical lead schema so every node reads and writes the same structure. This is critical because fragmented tools usually break at the schema layer, not the UI layer.[1][2]

Suggested top-level schema:

```json
{
  "leadId": "uuid",
  "person": {
    "fullName": "",
    "firstName": "",
    "lastName": "",
    "title": "",
    "linkedinUrl": "",
    "email": "",
    "emailValidationStatus": "unknown|valid|risky|invalid",
    "phone": "",
    "whatsappStatus": "unknown|possible|valid|invalid"
  },
  "company": {
    "name": "",
    "domain": "",
    "website": "",
    "industry": "",
    "size": "",
    "location": "",
    "linkedinUrl": ""
  },
  "enrichment": {
    "summary": "",
    "painPoints": [],
    "signals": [],
    "techStack": [],
    "sourceConfidence": 0,
    "notes": ""
  },
  "outreach": {
    "emailTemplateId": "",
    "emailStatus": "pending|sent|failed|replied",
    "whatsappTemplateId": "",
    "whatsappStatus": "pending|queued|sent|failed",
    "lastContactedAt": null
  },
  "crm": {
    "ownerId": "",
    "stage": "new|qualified|contacted|interested|closed",
    "tags": []
  },
  "audit": {
    "workflowId": "",
    "runId": "",
    "createdAt": "",
    "updatedAt": ""
  }
}
```

### 4. Enrichment table

The MVP should expose an enrichment table after every run. This is one of the most important surfaces because users need to review lead quality before and after outreach.

Recommended columns:

- Lead name
- Company
- Role
- Source
- Email
- Email validation status
- Phone / WhatsApp status
- Pain points summary
- Personalization note
- Outreach eligibility
- Email sent status
- WhatsApp queued status
- CRM stage
- Last updated

### 5. Outreach rules

The MVP should enforce simple eligibility rules before send:

- Email can send only if validation is `valid` or approved `risky`.
- WhatsApp can queue only if number exists and workflow rule marks it allowed.
- WhatsApp should generally run after enrichment and email validation are complete.
- Every send action should write status back into CRM and logs.[2][4][5]

## What to exclude from MVP

To keep the first version realistic, exclude these from V1:

- Complex multi-branch logic editor.
- Marketplace of third-party nodes.
- Full sequence builder with advanced branching.
- Deep analytics attribution dashboard.
- Team permissions matrix.
- Full self-host installer.
- Full template marketplace.
- Voice agent layer.

## Recommended MVP feature list

### Must-have

- Workflow canvas.
- 8 to 12 core nodes.
- Test run with sample lead.
- Unified lead schema.
- Enrichment table view.
- ERIX-CRM sync.
- ERIX-Sender email send.
- WhatsApp queue/send action.
- Run logs and error state.
- Workflow publish toggle.

### Should-have

- Retry failed nodes.
- Manual review checkpoint before outreach.
- Prompt editor for AI enrichment.
- Template variables for email / WhatsApp.
- Basic usage counters.

### Not now

- Full marketplace.
- Complex RBAC.
- Billing engine.
- Mobile app.
- Browser extension.

## Suggested UX

The MVP should feel like a focused blend of a workflow builder and a lead-ops cockpit.

Primary screens:

- Workflow list.
- Workflow builder canvas.
- Lead preview / sample test drawer.
- Enrichment table.
- Run logs panel.
- CRM lead detail view.

The builder should optimize for one high-value template first: `Find leads -> enrich -> validate -> personalize -> send email -> queue WhatsApp -> sync CRM`.[1][2]

## Technical approach

### Frontend

- Next.js app router.
- React Flow for builder canvas.
- Zustand or Redux Toolkit for local graph state.
- TanStack Table for enrichment table.
- Monaco or simple textarea for prompt editing.

### Backend

- Node.js / Next.js API routes or a separate NestJS service.
- Queue system using BullMQ or equivalent with Redis.
- MongoDB for lead records and workflow definitions.
- Object storage via ERIX-Storage on top of Cloudflare R2.
- Email delivery through ERIX-Sender.
- Provider abstraction for enrichment and validation.

### Execution model

- Each node executes as a job step.
- Workflow run gets a `runId`.
- Each node writes input, output, status, error, duration.
- Failed runs can retry from the failed node rather than rerun everything.

## Success metrics

The MVP is successful if it achieves these outcomes in pilot usage:

- A user can publish a workflow without developer help.
- A workflow can process a batch of leads from source to outreach eligibility.
- CRM records remain synchronized with enrichment and send states.
- The operator can review all lead context in one enrichment table.
- The product replaces at least two external tools in one workflow.[1][2][3]

## Ideal MVP tagline

**Build outbound automation visually on top of your own scraping, enrichment, CRM, storage, and sender stack.**

## Suggested module naming

Possible names:

- `ERIX-Flow`
- `ERIX-Automate`
- `ERIX-Orchestrate`
- `ERIX-Canvas`
- `ERIX-Studio`

Best MVP name: **ERIX-Flow** because it is short, clear, and fits drag-and-drop workflow orchestration.

---

# Prompt to generate full product specs

Copy the prompt below into ChatGPT / Claude / Gemini / Perplexity to generate a more complete product specification.

```md
# Role

You are a senior SaaS product architect, workflow automation designer, and technical product manager.

# Task

Prepare a complete product specification for a new ECODrIx module called **ERIX-Flow**.

ERIX-Flow is a no-code drag-and-drop automation builder that unifies existing ECODrIx modules into one workflow system for lead generation, enrichment, validation, CRM sync, storage, and multichannel outreach.

# Existing ECODrIx modules

- erix-crm: CRM and lead/deal management
- erix-laie: lead acquisition + enrichment engine, inspired by Apify + Clay + Apollo + Hunter
- erix-store: Redis-like cache, queues, and transient workflow state
- erix-storage: storage layer on Cloudflare R2, similar to Cloudinary/ImageKit with AI support
- erix-sender: email sending platform with template designer, similar to GrapesJS + Bravo

# Product idea

Users should be able to visually build automations by dragging ECODrIx modules as workflow nodes onto a canvas.

Example flow:

1. scrape or import leads from the internet
2. enrich each lead with company/person/contact data
3. validate email and WhatsApp/mobile availability
4. generate pain points, summaries, and personalization using AI
5. save/update lead in CRM
6. store raw artifacts or enrichment data
7. send personalized email outreach
8. then queue or send WhatsApp outreach after validation rules pass
9. update timeline, status, and logs in the same system

# Core product thesis

The product should replace a fragmented stack where users otherwise combine separate tools for scraping, enrichment, validation, CRM, storage, and outreach. The advantage is that the full automation loop runs inside one product instead of many stitched tools.

# What the specification must include

Prepare the output in markdown with the following sections:

## 1. Product summary

- one-paragraph explanation
- who it is for
- why now
- key differentiation

## 2. Jobs to be done

- primary user jobs
- secondary jobs
- pains with current tools
- desired outcomes

## 3. MVP scope

- must-have features
- should-have features
- out-of-scope items
- assumptions and constraints

## 4. User roles

- admin
- operator
- reviewer
- optional developer/API user

## 5. Workflow builder

- canvas behavior
- node categories
- node configuration
- input/output mapping
- conditions and branching
- test mode
- publish mode
- run history

## 6. Data model

Design a canonical lead schema and workflow schema.
Include:

- lead
- company
- person
- enrichment
- validation
- outreach state
- CRM state
- workflow
- run
- node execution log

## 7. MVP nodes

Define a first batch of nodes, such as:

- source/import
- web scrape
- enrich lead
- validate email
- validate WhatsApp
- AI summarize
- AI pain points
- create/update CRM lead
- store artifact
- send email
- queue WhatsApp
- delay/wait
- pass/fail condition

For each node include:

- purpose
- inputs
- outputs
- settings
- failure handling

## 8. UX flows

Describe key user journeys:

- create workflow from template
- test workflow with sample lead
- review enrichment table
- approve outreach
- inspect failed run
- edit and republish workflow

## 9. Enrichment table

Design the table structure, filters, bulk actions, and review workflow.

## 10. Outreach logic

Specify:

- send order
- eligibility rules
- personalization variables
- compliance / consent notes
- retry rules

## 11. System architecture

Recommend a practical architecture using:

- Next.js
- React Flow
- Node.js/NestJS or API routes
- MongoDB
- Redis/BullMQ
- Cloudflare R2
- provider abstraction layers
- job execution engine

## 12. API design

Define key internal APIs for:

- workflows
- runs
- leads
- enrichment
- validations
- outreach
- logs

## 13. Metrics

Define product metrics, workflow metrics, and business metrics.

## 14. Risks and edge cases

Include:

- duplicate leads
- bad enrichment
- false email validation
- WhatsApp unavailability
- provider downtime
- anti-bot / scraping failures
- prompt hallucination in pain points
- CRM sync mismatch

## 15. 30-day MVP build plan

Break into weekly milestones with engineering priorities.

## 16. Future roadmap

Suggest V2 and V3 evolution.

# Output requirements

- Write in clear markdown.
- Be specific, practical, and implementation-ready.
- Avoid vague startup language.
- Assume the reader is technical and building this with a small product team.
- Make trade-offs explicit.
- Favor shipping a narrow but strong MVP.
```
