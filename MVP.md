# ECODrIx Advanced MVP Spec: Freelancer Outbound Autopilot Plus

## 1. Product summary

Freelancer Outbound Autopilot Plus is an advanced but still shippable MVP inside ECODrIx for freelancers and micro-agencies that need a repeatable outbound engine instead of manual prospecting. It combines lead discovery and enrichment, qualification logic, AI-assisted messaging, multichannel sequencing, CRM state transitions, follow-up orchestration, and provider-aware execution using existing ECODrIx modules rather than separate point tools.[1][2][3]

This version is “advanced MVP” because it goes beyond single-send automation and adds a controlled multistep system: lead scoring, approval queues, basic branching, sequence execution, reply-aware pausing, and operational analytics. It still stays within MVP discipline by focusing on one primary user, one main business outcome, and a narrow set of critical workflows rather than trying to become a full outbound platform on day one.[4][5][6]

## 2. Core outcome

The single core outcome is: **a freelancer can activate a reusable outbound playbook that turns a target niche into qualified prospects, personalized outreach, tracked follow-ups, and appointment-ready conversations inside ECODrIx**.[1][7]

The aha moment is not just sending the first email. It is seeing a lead move from sourced to enriched to approved to sequenced to replied, with the system handling the next-step logic and CRM updates automatically.[2][1]

## 3. Primary persona

The first ideal user is a freelancer or 1-5 person agency selling digital services to SMBs, such as website work, SEO, automation, paid ads, WhatsApp setup, lead-gen systems, or CRM implementation. This user usually handles prospecting personally, cannot afford enterprise sales tooling, and needs a practical way to keep pipeline creation active while continuing delivery work.[8][9][10]

Today this user often uses a fragmented stack: directories or Google for discovery, Apollo-like or manual enrichment, spreadsheet tracking, cold email tools, ad hoc WhatsApp follow-up, and a lightweight CRM if they use one at all. They would switch if one product could reduce manual research, improve personalization quality, and automate the repetitive parts of outreach and follow-up without requiring a RevOps team.[11][2][10]

## 4. Problem breakdown

- Prospecting is inconsistent because it depends on daily manual effort.
- Research depth collapses when batch size increases.
- Valid contact discovery and send readiness are often mixed together too late.
- Generic outreach copy reduces reply rates.
- Follow-up execution is inconsistent once client work gets busy.
- Existing multichannel tools are optimized for sales teams, not solo operators.[2][3]
- Most tools split the value chain into separate databases, enrichers, sequencers, and CRMs.[1][7]
- Users need a guided system that helps them decide which leads are worth sending, not just a firehose of contacts.[7][6]

## 5. MVP scope

### Must-have

- One advanced outbound playbook template in `erix-flow`.
- ICP setup: niche, geography, company size, service type, exclusion filters.
- Lead discovery and enrichment via `erix-laie`.
- Email validation and contact-confidence scoring.
- AI-generated business summary, pain points, outreach angles, and first-touch copy.
- Lead review queue with approval, reject, snooze, and edit actions.
- CRM sync into `erix-crm` with stages and activity timeline.
- Multistep email sequence through `erix-sender`.
- Optional WhatsApp follow-up branch via `erix-connect` when channel is connected and allowed.
- Sequence state machine: pending, active, paused, replied, bounced, completed.
- Reply-aware pause/stop logic.
- Run logs and basic performance analytics.
- Retry logic for enrichment and transient provider failures.[2][1][6]

### Should-have

- Inbox event ingestion for simple reply detection.
- Lead scoring formula combining validation, relevance, and AI confidence.
- Saved playbooks by service type.
- Follow-up delay editor.
- Bulk approve / bulk reject actions.
- A/B test support for subject lines or first lines.

### Out-of-scope

- Full drag-and-drop builder for all users.
- LinkedIn automation or browser session automation.
- Shared team inbox.
- Advanced deliverability warmup tooling.
- Full proposal creation and e-sign.
- Calendar-native scheduling assistant.
- AI voice calling.
- Enterprise permissions and audit framework.
- Marketplace or public integrations catalog.

## 6. ECODrIx module mapping

| Capability                    | Module used                         | Reused or new                  | Notes                                                    |
| ----------------------------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------- |
| Prospect discovery            | erix-laie                           | Reused                         | Existing lead-gen and business research capabilities     |
| Contact validation            | erix-laie                           | Reused                         | Email + social/contact validation with confidence        |
| Pain points + outreach kit    | erix-laie                           | Reused + new formatter         | Needs structured, reusable output contract               |
| Workflow orchestration        | erix-flow                           | Reused + new advanced template | Start with one curated playbook                          |
| Sequence scheduling / retries | erix-store                          | Reused                         | Queue, delay, lock, retry, state transitions             |
| CRM pipeline / timeline       | erix-crm                            | Reused                         | Lead stages, activity events, next actions               |
| Email execution               | erix-sender                         | Reused                         | Direct API-based send infrastructure                     |
| Channel connection state      | erix-connect                        | Reused                         | Meta / WhatsApp and other connected channels             |
| Asset or artifact persistence | erix-storage                        | Reused optional                | Research snapshots, generated assets, template artifacts |
| Approval queue UI             | New app surface                     | New                            | Thin product surface on top of modules                   |
| Playbook analytics            | New app surface + reused event data | New                            | MVP-grade metrics only                                   |

## 7. Core user flows

### Flow 1: Configure playbook

- **Trigger:** User selects “Autopilot Plus”.
- **User actions:** Set service type, ICP filters, brand voice, sender identity, follow-up cadence, and optional channel preferences.
- **System actions:** Validate SES sender readiness, detect connected WhatsApp/social channels, save playbook config, and create run template.
- **Final output:** A ready-to-run outbound playbook.

### Flow 2: Source, enrich, and qualify leads

- **Trigger:** User launches a playbook run.
- **User actions:** Choose batch size and optionally upload exclusions.
- **System actions:** Discover leads, enrich records, validate contacts, estimate fit score, generate pain points and outreach kit, then route records into review states.
- **Final output:** Qualified lead queue with confidence and send readiness indicators.

### Flow 3: Review and approve sequence entry

- **Trigger:** Review queue is populated.
- **User actions:** Approve, reject, edit, or snooze leads; optionally adjust copy.
- **System actions:** Create/update CRM record, assign stage, store outreach artifacts, and queue approved leads into sequence engine.
- **Final output:** Approved leads move into active sequence state.

### Flow 4: Execute multistep outreach

- **Trigger:** Sequence scheduler reaches send time.
- **User actions:** No action required unless manual hold is enabled.
- **System actions:** Send step 1 email, wait configured delay, stop or continue based on reply events, optionally branch into WhatsApp follow-up if connected and eligible.
- **Final output:** Outreach events logged, next step scheduled, CRM updated.

### Flow 5: Convert reply into opportunity

- **Trigger:** Reply or manual conversation update.
- **User actions:** Mark as interested, disqualified, or booked.
- **System actions:** Pause sequence, update CRM stage, create follow-up tasks, and preserve conversation context.
- **Final output:** Lead becomes active sales opportunity or exits the campaign.

## 8. Data model

### Core entities

#### `playbook`

- `id`
- `name`
- `personaType`
- `serviceType`
- `icpRules`
- `channelRules`
- `sequenceConfig`
- `aiPromptProfile`
- `createdBy`

#### `playbook_run`

- `id`
- `playbookId`
- `userId`
- `status`
- `batchSize`
- `runMetrics`
- `startedAt`
- `completedAt`

#### `lead_candidate`

- `id`
- `runId`
- `sourceType`
- `sourceUrl`
- `businessName`
- `domain`
- `industry`
- `location`
- `sizeBand`
- `contactName`
- `contactRole`
- `email`
- `emailValidationStatus`
- `phone`
- `whatsappStatus`
- `socialProfiles`
- `fitScore`
- `confidenceScore`

#### `lead_research_profile`

- `leadCandidateId`
- `businessSummary`
- `painPoints`
- `serviceFitReason`
- `offerAngle`
- `personalizationLines`
- `outreachKit`
- `aiConfidence`
- `humanReviewStatus`

#### `crm_lead`

- `id`
- `externalRef`
- `sourceLeadCandidateId`
- `pipelineStage`
- `ownerId`
- `campaignState`
- `lastActivityAt`
- `nextActionAt`
- `replyState`

#### `sequence_enrollment`

- `id`
- `crmLeadId`
- `playbookId`
- `status`
- `currentStep`
- `nextStepAt`
- `stopReason`

#### `sequence_step_event`

- `id`
- `sequenceEnrollmentId`
- `stepIndex`
- `channel`
- `templateVersion`
- `provider`
- `status`
- `providerMessageId`
- `sentAt`
- `errorCode`

#### `reply_event`

- `id`
- `crmLeadId`
- `channel`
- `detectedAt`
- `classification`
- `rawMessageRef`
- `needsHumanReview`

### Ownership model

- `erix-flow` owns playbook and run orchestration metadata.
- `erix-laie` owns discovery, enrichment, validation, and research outputs.
- `erix-crm` owns canonical opportunity state and sales timeline.
- `erix-sender` owns outbound email execution.
- `erix-connect` owns connected channel identities and permissions.
- `erix-store` owns queueing, delayed execution, locks, retries, and transient state.
- `erix-storage` stores optional supporting artifacts.

## 9. Workflow / execution logic

### Step sequence

1. Verify connected sender and optional channels.
2. Launch run and split batch jobs.
3. Discover businesses and candidate contacts.
4. Enrich business and contact data.
5. Validate email and channel readiness.
6. Generate research profile and outreach kit.
7. Score and queue for review.
8. Human approves or edits.
9. Create CRM lead and sequence enrollment.
10. Execute step 1.
11. Wait based on schedule.
12. Check for reply state.
13. Continue, pause, or stop.
14. Branch to WhatsApp if configured and valid.
15. Mark outcome and update analytics.

### Branching rules

- Invalid email -> reject or hold.
- Low confidence -> manual review required.
- No sender configured -> no send enrollment.
- Reply detected -> pause/stop sequence immediately.
- Hard bounce -> stop sequence and flag sender risk.
- WhatsApp path only if `erix-connect` channel exists and the lead is marked eligible.

### Retry logic

- Discovery/enrichment: retry twice with exponential backoff.
- Email send: retry once only for transient provider errors.
- Reply sync: retry polling/webhook handling with idempotent event processing.

### Manual approval points

- First message before enrollment.
- Any AI output below threshold.
- Ambiguous contact selection.
- Any step flagged by provider compliance or low validation confidence.

### Logging

- Job-level logs.
- Lead-level audit trail.
- Sequence-level event stream.
- Provider response logs.
- Human review actions.

### Failure recovery

- Re-run failed leads without reprocessing approved leads.
- Requeue sequence from last good step.
- Preserve human edits on regenerated content.

## 10. UX surfaces

Minimum advanced-MVP surfaces:

- Playbook list.
- Playbook setup/config page.
- Run dashboard.
- Qualification/review queue table.
- Lead research drawer.
- Outreach editor and preview panel.
- Sequence timeline panel.
- CRM opportunity view.
- Analytics summary screen.
- Provider readiness/settings screen.

This is more advanced than the earlier MVP, but still controlled because the workflow is delivered as an opinionated playbook instead of a blank-canvas system.[5][6]

## 11. Integrations and provider dependencies

### Required

- `erix-sender` connected to AWS SES or supported email provider.
- Verified sending identity and domain.
- Basic webhook or event ingestion for delivery and bounce events if available.

### Optional

- `erix-connect` Meta/WhatsApp connection.
- External enrichment source providers behind `erix-laie`.
- Inbox reply sync connector if available.

### Preconditions

- User must complete sender onboarding.
- Sequence templates must be saved.
- Compliance notes and suppression rules must be configured.

### Fallback behavior

- If sender is missing, runs stop at reviewed outreach-kit stage.
- If reply sync is missing, user can manually mark replies.
- If WhatsApp is unavailable, sequence remains email-only.
- If enrichment is weak, lead is downgraded to review-only.

## 12. AI usage

### AI tasks

- Summarize the business.
- Infer probable pain points.
- Generate reason-for-fit explanation.
- Produce personalized opener and follow-up angle.
- Suggest best contact when multiple candidates exist.
- Optionally classify replies into interested / not now / not relevant / unclear.

### Output controls

- Pain points must be labeled as inferred hypotheses.
- Every AI block should expose source snippets or source count where possible.
- Confidence score must be persisted.
- Human edits override future regenerated content.

### Human review

- Required before enrollment.
- Required for low-confidence outputs.
- Required for AI reply classification in MVP if the result would change CRM stage.

### Risks

- Hallucinated business pain points.
- Overconfident personalization based on sparse data.
- Misclassification of replies.
- Repetitive messaging patterns that reduce authenticity.[7][12]

## 13. Technical architecture

### Frontend

- Next.js app with authenticated ECODrIx shell.
- Review table and analytics dashboard.
- Playbook config UI.
- Reused CRM views from `erix-crm`.
- Shared component library for status chips, timelines, and approval actions.

### Backend

- API orchestration layer for playbook CRUD and run management.
- `erix-flow` template engine for orchestration metadata.
- `erix-laie` service interface for source, enrich, validate, and research-kit generation.
- `erix-sender` send adapter for email steps.
- `erix-connect` channel capability resolver.
- `erix-store` queue workers for delayed and retryable jobs.

### Storage and state

- MongoDB for persistent entities.
- Redis-like runtime state in `erix-store`.
- `erix-storage` for raw research captures and generated assets where useful.

### Observability

- Step-level logs.
- Event metrics per run.
- Provider failure counters.
- Sequence state transitions.

### Delivery strategy

- Soft-launch to 5-10 users.
- Small batches first, such as 25 leads per run.
- Manual support for setup and early debugging.

## 14. Acceptance criteria

- User can configure a playbook with ICP, sender identity, and follow-up cadence.
- System validates sender readiness before allowing live sends.
- System can discover and enrich a lead batch.
- Every reviewed lead shows fit score, validation state, and outreach kit.
- User can bulk approve or reject leads.
- Approved leads are enrolled into a multistep sequence.
- Sequence pauses automatically on detected reply.
- Email send events update CRM timeline correctly.
- Optional WhatsApp branch is only shown when an eligible connected channel exists.
- Failed leads can be retried independently.
- User can view run metrics and sequence outcomes without leaving the product.

## 15. Success metrics

### Product usage

- Provider setup completion rate.
- Playbook activation rate.
- Percentage of users launching 2+ runs in the first week.
- Lead approval rate.

### Workflow performance

- Discovery-to-approved-lead conversion rate.
- Valid email rate.
- AI content acceptance rate without major edits.
- Sequence completion rate.
- Bounce rate.
- Reply-detected pause accuracy.

### Business validation

- Qualified replies per 100 enrolled leads.
- Appointment-ready conversations per run.
- Median time saved versus manual outbound.
- Retention of early users after 14 and 30 days.[6][4]

## 16. Risks and edge cases

- High-volume users pushing weak sender domains.
- Duplicate leads across playbooks.
- Wrong contact chosen as best decision-maker.
- Low-quality enrichment for local or poorly indexed businesses.
- WhatsApp compliance or permission issues.
- Manual review becoming the bottleneck.
- Over-complexity reducing first-run success.
- User expectation mismatch if they expect fully autonomous closing.
- Reply detection gaps if inbox connectivity is partial.
- Building too much sequencing logic before validating conversion gains.[2][6][13]

## 17. 30-day MVP plan

### Week 1: Product skeleton

- Finalize persona, playbook structure, and success criteria.
- Define schemas, event model, and module contracts.
- Build provider readiness screen and playbook config UI.
- Implement playbook CRUD and run creation.

### Week 2: Qualification engine

- Integrate `erix-laie` discovery, enrichment, validation, and research outputs.
- Build fit scoring and review queue.
- Add lead detail drawer and edit controls.
- Persist approved/rejected decisions.

### Week 3: Sequence engine

- Build sequence enrollment model and delayed execution via `erix-store`.
- Integrate `erix-sender` for step sends.
- Add CRM stage/timeline sync.
- Implement pause/stop logic for replies and failures.

### Week 4: Analytics + pilot hardening

- Add run dashboard and analytics summary.
- Add optional WhatsApp branch checks through `erix-connect`.
- Improve retries, logging, and idempotency.
- Pilot with a small user cohort and measure approval, send, and reply outcomes.

## 18. V2 roadmap

- Blank-canvas flow customization in `erix-flow`.
- More persona-specific playbooks.
- Reply classifier with assisted drafting.
- Auto-booking flow when qualified reply is detected.
- Deliverability health layer.
- Learning loop from accepted vs rejected leads.
- Shared agency/team workspace.
- Creative outreach assets generated and stored through `erix-storage`.
