# ECODrIx Universal MVP Designer Prompt

Use this prompt whenever a new product, module, workflow, or internal tool needs to be designed inside the ECODrIx ecosystem.

This prompt is meant to generate a practical MVP plan, not vague startup advice. It should force clear scope, reusable architecture, and tight alignment with existing ECODrIx products.

## Purpose

ECODrIx is not a single tool. It is a product ecosystem with reusable internal infrastructure. New products should be designed as modules that either extend existing ECODrIx products or orchestrate them into a stronger workflow.[1][2]

A strong MVP should focus on one clear user outcome, one primary user type, 3 to 5 core flows, explicit out-of-scope items, and enough detail that engineering can start implementation without guessing.[3][1][2]

## ECODrIx product map

Use the following modules as fixed system context when writing any MVP or product specification.

| Module           | What it does                                                                                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **erix-crm**     | CRM automation, conversational workflows, event-based automation, email marketing, WhatsApp marketing, contact timelines, and customer engagement infrastructure. It depends on connected delivery providers such as AWS SES and Meta WhatsApp before email or WhatsApp execution is enabled. |
| **erix-laie**    | Lead generation, lead enrichment, business research, contact validation, social profile discovery, pain-point generation, lead scoring inputs, and outreach-kit preparation.                                                                                                                  |
| **erix-storage** | Asset and media storage layer, similar to Cloudinary or ImageKit, for files, images, artifacts, transformations, and AI-assisted asset workflows.                                                                                                                                             |
| **erix-store**   | Redis-like caching, queues, rate limiting, temporary state, and fast key-value infrastructure.                                                                                                                                                                                                |
| **erix-connect** | Connection hub for Meta platforms and other social or external platforms. It exposes linked accounts and permissions to other ECODrIx modules, especially erix-crm and erix-flow.                                                                                                             |
| **erix-sender**  | Direct API-based email delivery layer inspired by SES-style transactional sending and products such as Resend or Bravo, without SMTP dependence.                                                                                                                                              |
| **erix-flow**    | No-code / low-code flow builder that connects internal ECODrIx modules and external services into automations and agents.                                                                                                                                                                     |

## Default product principles

Every output generated from this prompt must follow these principles:

1. Design for **one primary user persona** first.[1][2]
2. Define **one core outcome** the MVP must deliver end-to-end.[4][2]
3. Reuse existing ECODrIx modules before inventing new infrastructure.
4. Treat new ideas as orchestration, packaging, or UX opportunities unless a real infrastructure gap exists.
5. Prefer shipping a narrow usable product over a broad platform.[4][1]
6. Make internal dependencies explicit, especially provider connections, queues, storage, compliance, and delivery constraints.[3][1]
7. Separate **must-have**, **should-have**, and **later** features.
8. Include both user-facing UX and internal execution architecture.
9. State what should be built now versus simulated manually for MVP speed.[4][2]
10. Assume the product may later become a standalone ECODrIx module, but the first release only needs to validate the main loop.

## When to use this prompt

Use this prompt for:

- New ECODrIx product ideas.
- Internal module upgrades.
- Verticalized versions of ECODrIx for niches.
- AI-agent workflows.
- CRM automation concepts.
- Lead-generation and outreach systems.
- Storage or asset workflows.
- Platform-connection products.
- End-to-end automation products that combine multiple ECODrIx modules.

---

# Copy-paste master prompt

```md
# Role

You are a senior SaaS product strategist, systems architect, workflow designer, and technical product manager.

# Context

Design an MVP inside the **ECODrIx** ecosystem.

ECODrIx already has these internal products/modules:

- **erix-crm**: CRM automation, conversational workflows, event-based automation, email and WhatsApp marketing. Before using WhatsApp or email services in erix-crm, the system must connect delivery providers such as AWS SES, Meta WhatsApp, and other relevant providers.
- **erix-laie**: lead generation, lead enrichment, business research, contact validation, social media/profile discovery, pain-point generation, and outreach-kit preparation.
- **erix-storage**: storage provider similar to Cloudinary/ImageKit.
- **erix-store**: Redis-like cache / queue / temporary infra layer.
- **erix-connect**: connection layer for Meta platforms and other social / external platforms. It is used by erix-crm and erix-flow.
- **erix-sender**: direct API email delivery service, similar in spirit to SES API / Resend / Bravo, without SMTP dependency.
- **erix-flow**: flow designer for connecting internal and external platforms into automations.

# Product idea

[INSERT YOUR IDEA HERE IN 3 TO 10 BULLETS]

# Optional example use case

[INSERT A REAL USER STORY OR WORKFLOW EXAMPLE]

# Your task

Turn this rough idea into a **practical MVP specification** that fits the ECODrIx ecosystem.

Do not treat this as a generic startup brainstorm. Treat this as a real product that must be built by a small technical team using existing ECODrIx modules wherever possible.

# Design rules

- Use existing ECODrIx modules as building blocks first.
- Clearly identify which parts are reused from existing modules and which parts are net-new.
- Focus on one primary persona and one main outcome.
- Keep the MVP narrow but fully usable.
- Cut anything that does not support the core value loop.
- Make data flow, dependencies, and execution order explicit.
- If external providers are required, explain where they connect through erix-connect, erix-sender, or erix-crm.
- If AI is used, define where human review is required.
- If scraping / enrichment is used, define failure cases, quality checks, and confidence levels.
- Prefer implementation-ready detail over inspirational language.

# Required output format

Write the answer in markdown using exactly these sections.

## 1. Product summary

Include:

- one-paragraph product explanation
- primary user
- core pain solved
- why this should exist inside ECODrIx rather than as a disconnected product

## 2. Core outcome

Define the single core outcome the MVP must deliver.
State the “aha moment” for the user.

## 3. Primary persona

Define:

- who the first ideal user is
- what they currently do manually
- what tools/workarounds they use now
- why they would switch

## 4. Problem breakdown

List the operational pains, inefficiencies, and current fragmentation.

## 5. MVP scope

Create 3 lists:

- must-have
- should-have
- out-of-scope

Be strict. Ruthlessly cut anything not required for the main value loop.

## 6. ECODrIx module mapping

Create a table with these columns:

- capability
- module used
- reused or new
- notes

Map the idea across:

- erix-crm
- erix-laie
- erix-storage
- erix-store
- erix-connect
- erix-sender
- erix-flow

Only use modules that are actually relevant.

## 7. Core user flows

Describe the 3 to 5 most important end-to-end flows.
For each flow include:

- trigger
- user actions
- system actions
- final output

## 8. Data model

Define the minimum viable schema/entities required.
Include core entities, key fields, and relationships.
Explain shared data ownership between ECODrIx modules.

## 9. Workflow / execution logic

If the product involves automations, define:

- execution steps in order
- conditions / branching
- retries
- queues
- manual approval points
- logging
- failure recovery

## 10. UX surfaces

List the minimum screens / panels / tables / builders needed.
Do not design a huge app. Include only what is necessary for MVP usability.

## 11. Integrations and provider dependencies

Explain:

- which external providers are required
- how they connect
- what must be configured before the product works
- what fallback behavior exists if a provider is missing or fails

## 12. AI usage

If AI is involved, define:

- which tasks AI handles
- which prompts or outputs are generated
- confidence / quality controls
- hallucination risks
- where human review is needed in MVP

## 13. Technical architecture

Recommend a practical architecture using the existing ECODrIx stack.
Include frontend, backend, jobs/queues, storage, data layer, and provider abstractions.

## 14. Acceptance criteria

Write specific acceptance criteria for the MVP.
Use bullet points or checklist format.
The criteria must be testable.

## 15. Success metrics

Define:

- product usage metrics
- workflow performance metrics
- business validation metrics

## 16. Risks and edge cases

List key risks, failure modes, and trade-offs.
Include operational, UX, provider, data-quality, and compliance risks.

## 17. 30-day MVP plan

Break the MVP into weekly milestones.
Make it realistic for a small team.

## 18. V2 roadmap

List what should come next only after MVP validation.

# Output quality bar

The answer must:

- be specific and execution-oriented
- avoid generic startup phrases
- avoid bloated platform thinking
- use tables where helpful
- make trade-offs explicit
- identify what can be manual in V1
- clearly distinguish reusable ECODrIx capabilities from new build work
```

---

## Fast-fill version

Use this shorter version when you only want a quick MVP definition.

```md
Design a practical MVP inside the ECODrIx ecosystem.

Available modules:

- erix-crm = CRM automation + email/WhatsApp marketing
- erix-laie = lead gen + enrichment + validation + pain points + outreach kit
- erix-storage = Cloudinary/ImageKit-style storage
- erix-store = Redis-like cache/queue
- erix-connect = social/external platform connector
- erix-sender = direct API email delivery
- erix-flow = no-code flow designer

Idea:
[PASTE IDEA]

Create a markdown MVP spec with:

1. product summary
2. primary persona
3. core outcome
4. must-have / should-have / out-of-scope
5. ECODrIx module mapping
6. core user flows
7. minimum data model
8. workflow logic
9. required screens
10. integrations/dependencies
11. AI usage
12. technical architecture
13. acceptance criteria
14. success metrics
15. 30-day build plan
16. V2 roadmap

Rules:

- reuse ECODrIx modules first
- define what is new vs reused
- keep MVP narrow
- make data flow explicit
- make provider setup explicit
- prefer execution detail over vision language
```

## Example use case framing

Here is a good way to describe ideas before pasting them into the prompt:

- Target user: freelancer / agency / sales team / recruiter / ecommerce brand
- Main outcome: book meetings / close deals / automate support / recover abandoned carts / enrich leads / centralize conversations
- Trigger: lead imported / form submitted / campaign launched / message received / deal stage changed
- ECODrIx modules involved: erix-laie + erix-flow + erix-crm + erix-sender + erix-connect
- Output: CRM record + outreach + follow-ups + conversation + appointment booked

## Example idea input

```md
Target user: freelancer
Problem: they need leads and outreach but do not have time for manual research
Outcome: automatically generate qualified leads and send personalized follow-up campaigns until an appointment is booked
Modules likely involved: erix-laie, erix-flow, erix-crm, erix-sender, erix-connect

Workflow idea:

- find leads from the internet
- research company and decision-maker
- enrich contact data
- validate email and social/contact channels
- generate pain points and outreach kit
- store record in CRM
- send email via erix-sender
- continue follow-ups via erix-crm
- use connected channels from erix-connect
- book appointment when a reply/conversation reaches qualified stage
```

## Notes for best results

A good MVP spec should make it obvious:

- what the product does in one sentence
- who it serves first
- what is reused from ECODrIx
- what new work must be built
- what the first usable flow is
- what can be left manual in V1
- what metrics prove the product is worth expanding

This matches current MVP guidance that emphasizes one clear outcome, one main user type, a small number of critical flows, and an explicit out-of-scope list to avoid building too much too early.[4][1][2]
