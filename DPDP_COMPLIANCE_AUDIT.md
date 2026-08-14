# ECODrIx — DPDP Act Compliance Audit & Implementation

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Active — audit of current compliance + gaps + execution plan  
**Regulatory reference:** Digital Personal Data Protection Act, 2023 (DPDP Act) + DPDP Rules 2025  
**Enforcement deadline:** Full enforcement May 13, 2027

---

## DPDP Act Requirements Summary (For SaaS Platforms)

| #   | Requirement                                                                           | Deadline | Penalty (max) |
| --- | ------------------------------------------------------------------------------------- | -------- | ------------- |
| 1   | **Informed consent** — notice before collection, purpose-limited                      | May 2027 | ₹50 Cr        |
| 2   | **Purpose limitation** — process only for stated purpose                              | May 2027 | ₹50 Cr        |
| 3   | **Data minimization** — collect only what's necessary                                 | May 2027 | ₹50 Cr        |
| 4   | **Storage limitation** — retain only as long as needed, then erase                    | May 2027 | ₹50 Cr        |
| 5   | **Right to access** — data principal can see what you hold                            | May 2027 | ₹50 Cr        |
| 6   | **Right to correction** — data principal can fix their data                           | May 2027 | ₹50 Cr        |
| 7   | **Right to erasure** — data principal can request deletion                            | May 2027 | ₹200 Cr       |
| 8   | **Right to nominate** — nominate someone to exercise rights on death/incapacity       | May 2027 | ₹50 Cr        |
| 9   | **Grievance redressal** — respond to complaints within prescribed time                | May 2027 | ₹50 Cr        |
| 10  | **Breach notification** — notify DPB India + affected data principals within 72 hours | May 2027 | ₹250 Cr       |
| 11  | **Children's data** — verifiable parental consent for under-18                        | May 2027 | ₹200 Cr       |
| 12  | **Cross-border transfer** — only to permitted jurisdictions                           | May 2027 | ₹250 Cr       |
| 13  | **Reasonable security** — implement appropriate technical + organizational measures   | May 2027 | ₹250 Cr       |
| 14  | **Consent withdrawal** — easy mechanism to withdraw, as easy as giving consent        | May 2027 | ₹50 Cr        |
| 15  | **Data Processing Agreement** — binding terms with processors                         | May 2027 | ₹50 Cr        |

---

## Current Compliance Status (Audit)

### ✅ ALREADY COMPLIANT (Built & Working)

| #   | Requirement                             | Implementation                                                   | Location                                                               |
| --- | --------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 5   | **Right to access (data export)**       | Full org JSON export with all CRM data                           | `server/src/platform/routes/data-export.routes.ts`                     |
| 5   | **Data export UI**                      | "Export Data" button in settings                                 | `saas/src/components/platform/DataExportButton.tsx`                    |
| 7   | **Right to erasure (account deletion)** | Soft delete → 30-day grace → hard purge (daily cron)             | `server/src/platform/services/tenant-deletion.service.ts`              |
| 7   | **Self-serve delete**                   | "Delete Account" danger zone in workspace settings               | `saas/src/app/[slug]/manage/settings/workspace/danger/page.tsx`        |
| 7   | **Admin delete/restore**                | Admin can soft delete, restore, or hard purge tenants            | `server/src/platform/routes/tenant-deletion.routes.ts`                 |
| 10  | **Breach notification infrastructure**  | Admin compliance routes + request tracking                       | `server/src/platform/routes/admin/compliance.routes.ts`                |
| 12  | **Data location**                       | GCP asia-south1 (Mumbai), no restricted country transfers        | Infrastructure config                                                  |
| 13  | **Encryption at rest**                  | Cloud SQL encryption, R2 encryption, AES-256 secrets vault       | Multiple                                                               |
| 13  | **Encryption in transit**               | TLS 1.3 everywhere, HTTPS-only                                   | Infrastructure                                                         |
| 13  | **Tenant isolation**                    | `org_id` scoping on every query, row-level security              | ErixAdapter pattern                                                    |
| 13  | **Access controls**                     | JWT auth, role-based access, API key scoping                     | Auth middleware                                                        |
| 13  | **Audit logs**                          | Full activity trail per tenant + admin actions                   | `platform/routes/admin/audit-logs.routes.ts`                           |
| 13  | **Rate limiting**                       | Per-tenant, per-endpoint throttling                              | `shared/middleware/rate-limit.ts`                                      |
| 14  | **LAIE opt-out/suppression**            | Data Subject Request API — suppresses from all outreach          | `server/src/product/laie/sdk/laie.sdk.ts` (compliance.submitDSR)       |
| 14  | **Flow compliance**                     | Stateful consent handling, opt-out suppression, hard-bounce stop | `server/src/product/flow/engine/compliance.ts`                         |
| 14  | **Email unsubscribe**                   | RFC-8058 one-click + list-unsubscribe header                     | `server/src/infra/connect/channels/email/routes/unsubscribe.routes.ts` |
| 14  | **LAIE data classifier**                | Distinguishes business/public data from personal data            | `server/src/product/laie/lib/dataClassifier.ts`                        |
| 14  | **Flow eligibility gate**               | DPDP lawful-sourcing confirmation gate (R14.4) — fail-closed     | `server/src/product/flow/engine/eligibility.ts`                        |
| 15  | **DPA published**                       | Data Processing Agreement on website                             | `ecodrix/src/lib/legal/docs/dpa.ts`                                    |
| —   | **Privacy Policy**                      | Comprehensive, DPDP-aligned, published                           | `ecodrix/src/lib/legal/docs/privacy.ts`                                |
| —   | **Sub-processors list**                 | Published with change notification mechanism                     | `ecodrix/src/lib/legal/docs/subprocessors.ts`                          |
| —   | **Security page**                       | Technical measures documented publicly                           | `ecodrix/src/lib/legal/docs/security.ts`                               |
| —   | **Grievance officer contact**           | Named + published on privacy page                                | `ecodrix/src/lib/legal/config.ts` (grievanceOfficer)                   |
| —   | **DPO contact**                         | dpo@ecodrix.com published                                        | `ecodrix/src/lib/legal/config.ts`                                      |

---

### 🔴 GAPS (Must Fix Before May 2027)

| #       | Requirement                                  | Gap                                                                                                                                                                                                       | Severity                          | Fix                                                                                                                |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **G1**  | **Informed consent (notice)**                | No consent capture UI at signup. User signs up but never explicitly consents to data processing. No itemized notice showing WHAT data is collected for WHAT purpose.                                      | 🔴 Critical                       | Consent modal at signup + privacy notice with purpose list                                                         |
| **G2**  | **Consent record storage**                   | No audit trail of WHEN consent was given, for WHAT purposes, and the version of privacy policy consented to.                                                                                              | 🔴 Critical                       | `ecodrix_consent_records` table + API                                                                              |
| **G3**  | **Consent withdrawal**                       | No self-serve "withdraw consent" mechanism. Email unsubscribe exists but there's no general "I withdraw consent for data processing" flow that triggers account freeze.                                   | 🔴 Critical                       | Settings page: "Manage Consent" → withdraw → account freeze → 30-day deletion                                      |
| **G4**  | **Purpose limitation enforcement**           | Data collected at signup is used broadly (CRM, AI persona, analytics, marketing). No per-purpose consent granularity.                                                                                     | 🟡 Medium                         | Itemized consent (required: service delivery / optional: AI personalization, analytics, marketing)                 |
| **G5**  | **Data retention policy (automated)**        | No automated data cleanup. Inactive org data sits forever. DPDP requires deletion when purpose is fulfilled.                                                                                              | 🟡 Medium                         | Retention policy: auto-delete inactive orgs after 12 months warning. Clean stale lead data after retention period. |
| **G6**  | **Right to correction (self-serve)**         | Users can edit their own profile but there's no formal "request correction of data we hold about you" mechanism for data principals who are NOT platform users (i.e., leads/contacts stored by a tenant). | 🟡 Medium                         | Public correction request form + tenant notification                                                               |
| **G7**  | **Children's data gate**                     | No age verification. No parental consent mechanism. No restriction on under-18 data processing.                                                                                                           | 🟡 Medium (low risk for B2B SaaS) | Age declaration at signup. Block under-18 accounts. Mark children's data in CRM leads.                             |
| **G8**  | **Cookie consent banner**                    | Marketing site (`ecodrix.com`) has no cookie consent banner. DPDP requires consent before non-essential cookies.                                                                                          | 🟡 Medium                         | Cookie consent banner with accept/reject + preferences                                                             |
| **G9**  | **Breach notification process (formalized)** | Infrastructure exists (compliance routes) but no formal incident response playbook, no auto-notification template, no 72-hour timer.                                                                      | 🟡 Medium                         | Documented playbook + auto-notification templates + deadline tracking                                              |
| **G10** | **Data principal rights for LEADS**          | A person whose data is stored as a "lead" in someone's CRM has DPDP rights too. Currently no mechanism for them to discover/correct/delete their data across all tenants.                                 | 🟡 Medium                         | Public "My Data" portal: enter phone/email → see which orgs hold your data → request deletion                      |
| **G11** | **Consent for WhatsApp marketing**           | Tenant sends broadcasts to leads who messaged first (implied consent for service replies). But marketing templates require explicit opt-in per DPDP + Meta policy.                                        | 🟡 Medium                         | Opt-in flag per lead. Marketing broadcasts only to opted-in leads.                                                 |
| **G12** | **Privacy notice in non-English**            | DPDP requires notice in language understood by data principal. No Hindi/Telugu privacy notice available.                                                                                                  | 🟢 Low (for now)                  | Translate privacy notice to Hindi/Telugu.                                                                          |

---

## Implementation Plan

### Phase 1: Critical Compliance (Week 1-3)

#### G1 + G2: Consent Capture at Signup

**Server:**

```
File: server/src/shared/db/schema/platform/consent.ts
Table: ecodrix_consent_records
  - id: uuid PK
  - userId: uuid FK → ecodrix_users
  - orgId: uuid FK (nullable — for org-level consent)
  - consentType: text (signup | marketing | ai_personalization | analytics)
  - granted: boolean
  - grantedAt: timestamp
  - withdrawnAt: timestamp (nullable)
  - policyVersion: text (privacy policy version consented to)
  - ipAddress: text
  - userAgent: text
  - metadata: jsonb

File: server/src/platform/routes/consent.routes.ts
  - POST /consent/grant   — record consent (called at signup + settings)
  - POST /consent/withdraw — withdraw consent (triggers account freeze)
  - GET  /consent/status  — current consent state for the user
  - GET  /consent/history — full consent audit trail
```

**SaaS Frontend:**

```
File: saas/src/components/auth/ConsentModal.tsx
  - Shown at signup BEFORE account activation
  - Itemized purposes:
    ✅ Required: Service delivery (storing your CRM data, processing messages)
    ☐ Optional: AI personalization (using your data to improve AI suggestions)
    ☐ Optional: Analytics (anonymized usage data for product improvement)
    ☐ Optional: Marketing (product updates, feature announcements)
  - Links to full Privacy Policy
  - "I consent" button records to consent_records
  - Cannot proceed without required consent

File: saas/src/app/[slug]/manage/settings/account/privacy/page.tsx
  - "Manage Consent" section
  - Toggle each optional consent on/off
  - "Withdraw All Consent" → warning → account freeze → 30-day deletion
  - View consent history with timestamps
```

#### G3: Consent Withdrawal Mechanism

**Server:**

```
File: server/src/platform/services/consent.service.ts
  - withdrawConsent(userId, type) → marks withdrawn, triggers:
    - If 'all': freeze account, start 30-day deletion countdown
    - If 'marketing': stop all marketing emails/WA
    - If 'ai_personalization': disable AI features for this org
    - If 'analytics': opt out of usage tracking
  - Enforcement: middleware checks consent before processing
```

#### G8: Cookie Consent Banner (Marketing Site)

**Marketing site:**

```
File: ecodrix/src/components/legal/CookieBanner.tsx
  - Shows on first visit (check localStorage)
  - Three options: "Accept All" | "Reject Non-Essential" | "Manage Preferences"
  - Preferences: Essential (always on) | Analytics | Marketing
  - Store preference in cookie + respect in GA/analytics scripts
  - Don't load analytics/marketing scripts until consent given

File: ecodrix/src/app/layout.tsx
  - Conditionally load analytics based on cookie consent
```

---

### Phase 2: Data Subject Rights (Week 4-5)

#### G6 + G10: Rights for Non-Users (Leads/Contacts)

**Server:**

```
File: server/src/platform/routes/public/data-rights.routes.ts (no auth required)
  - POST /data-rights/lookup  — { phone or email } → checks if data exists across platform
  - POST /data-rights/request — { phone, email, type: 'access'|'correction'|'erasure' }
    → Creates compliance request
    → Notifies affected tenant(s)
    → 72-hour response SLA tracking
  - GET  /data-rights/status/:requestId — check request status

File: server/src/platform/services/data-rights.service.ts
  - lookupDataPrincipal(phone|email) → list of orgs holding this data
  - processErasureRequest(phone|email) → delete from all orgs + suppress list
  - processCorrectionRequest(phone|email, corrections) → notify tenant to correct
```

**Public page (marketing site):**

```
File: ecodrix/src/app/legal/data-rights/page.tsx
  - "Your Data Rights" page
  - Form: Enter phone/email → request type (access/correct/delete)
  - Tracks request status
  - No account needed — open to any person whose data might be stored
```

#### G11: WhatsApp Marketing Opt-In

**Server:**

```
File: server/src/shared/db/schema/erix/leads.ts (extend)
  - Add column: marketingOptIn: boolean DEFAULT false
  - Add column: marketingOptInAt: timestamp (nullable)
  - Add column: marketingOptInSource: text (nullable) — 'form'|'whatsapp_reply'|'manual'

File: server/src/product/erix/services/crm/broadcast-eligibility.ts
  - Before sending marketing broadcast → filter leads where marketingOptIn = true
  - Log rejection reason for non-opted-in leads
```

**SaaS Frontend:**

```
- Lead detail: "Marketing opt-in" toggle (manual override by tenant)
- Broadcast wizard: shows "X leads opted in" count
- Warning if broadcast targets non-opted-in leads
- Form builder: "Opt-in to marketing" checkbox field auto-added
```

---

### Phase 3: Retention & Process (Week 6-7)

#### G5: Automated Data Retention

**Server:**

```
File: server/src/platform/services/data-retention.service.ts
  - Policy per data type:
    - Inactive orgs (no login 12 months): notify → 30-day grace → soft delete
    - Stale leads (no activity 24 months): archive → notify tenant → purge after 30 days
    - Conversation messages: retain while lead active, purge 6 months after lead archived
    - Audit logs: retain 3 years (regulatory minimum)
    - Payment records: retain 8 years (tax law)

File: server/src/platform/jobs/data-retention.cron.ts
  - Daily job: check retention policies, send warnings, execute purges
  - Audit trail for every deletion (what, when, why, policy applied)
```

**SaaS Frontend:**

```
File: saas/src/app/[slug]/manage/settings/workspace/data-retention/page.tsx
  - Show current retention policies
  - Allow tenant to set SHORTER retention (never longer than platform default)
  - "How long do you keep my data?" — transparent answer
```

#### G9: Breach Notification Playbook

**Server:**

```
File: server/src/platform/services/breach-notification.service.ts
  - detectBreach(details) → creates incident record
  - startNotificationTimer(incidentId) → 72-hour countdown
  - notifyDPB(incidentId) → formatted notification to Data Protection Board
  - notifyAffectedPrincipals(incidentId) → WhatsApp + email to all affected users
  - Templates: pre-written breach notification messages (DPB format + user-friendly)

File: server/src/platform/routes/admin/breach.routes.ts
  - POST /breach/declare — admin declares a breach
  - GET  /breach/:id/timer — time remaining for notification
  - POST /breach/:id/notify-dpb — send to Data Protection Board
  - POST /breach/:id/notify-users — notify affected data principals
```

#### G7: Children's Data Protection

**Server:**

```
File: server/src/platform/routes/auth/signup.ts (extend)
  - Add DOB/age declaration: "I confirm I am 18 or older"
  - If under 18: require parental consent flow (guardian email verification)
  - Store ageVerifiedAt timestamp in user record

File: server/src/product/erix/services/crm/lead.service.ts (extend)
  - If lead is tagged as minor → restrict processing
  - No marketing broadcasts to minors
  - Special retention rules (delete on request, no archive)
```

---

### Phase 4: Operational (Week 8)

#### G4: Purpose Limitation Middleware

**Server:**

```
File: server/src/shared/middleware/purpose-check.ts
  - Middleware that logs processing purpose per API call
  - If user withdrew consent for a purpose → block API calls for that purpose
  - Example: consent withdrawn for 'ai_personalization' → AI routes return 403

File: server/src/platform/services/consent.service.ts (extend)
  - getPurposeAllowed(orgId, purpose) → boolean
  - Used by: AI middleware, analytics tracking, marketing send
```

#### G12: Multilingual Privacy Notice

**Marketing site:**

```
File: ecodrix/src/app/legal/privacy/hi/page.tsx (Hindi)
  - Full Hindi translation of privacy policy
  - Link from main privacy page: "हिंदी में पढ़ें"
```

---

## Schema Changes Required

```sql
-- Consent records (Phase 1)
CREATE TABLE ecodrix_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ecodrix_users(id),
  org_id UUID REFERENCES ecodrix_organizations(id),
  consent_type TEXT NOT NULL, -- 'service'|'marketing'|'ai_personalization'|'analytics'
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  policy_version TEXT NOT NULL, -- e.g. '2026-08-13'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_consent_user ON ecodrix_consent_records(user_id);
CREATE INDEX idx_consent_org ON ecodrix_consent_records(org_id);

-- Data subject requests (Phase 2)
CREATE TABLE ecodrix_data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_phone TEXT,
  requester_email TEXT,
  request_type TEXT NOT NULL, -- 'access'|'correction'|'erasure'|'portability'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'processing'|'completed'|'rejected'
  affected_orgs JSONB DEFAULT '[]', -- [{orgId, orgName}]
  details JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ, -- submitted_at + 72 hours
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_dsr_phone ON ecodrix_data_subject_requests(requester_phone);
CREATE INDEX idx_dsr_email ON ecodrix_data_subject_requests(requester_email);
CREATE INDEX idx_dsr_status ON ecodrix_data_subject_requests(status);

-- Lead marketing opt-in (Phase 2)
ALTER TABLE erix_leads ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT false;
ALTER TABLE erix_leads ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;
ALTER TABLE erix_leads ADD COLUMN IF NOT EXISTS marketing_opt_in_source TEXT;

-- Breach incidents (Phase 3)
CREATE TABLE ecodrix_breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL, -- 'low'|'medium'|'high'|'critical'
  description TEXT NOT NULL,
  affected_data_types TEXT[], -- ['email','phone','name','payment']
  estimated_affected_count INTEGER DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL,
  notification_deadline TIMESTAMPTZ NOT NULL, -- detected_at + 72 hours
  dpb_notified_at TIMESTAMPTZ,
  users_notified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'detected', -- 'detected'|'investigating'|'notifying'|'resolved'
  declared_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Compliance Checklist (Pre-Launch)

### Platform-Level (ECODrIx as Data Fiduciary)

| #   | Item                                    | Status   | Action      |
| --- | --------------------------------------- | -------- | ----------- |
| 1   | Privacy Policy published (DPDP-aligned) | ✅ Done  | —           |
| 2   | DPA published                           | ✅ Done  | —           |
| 3   | Sub-processors list published           | ✅ Done  | —           |
| 4   | Security practices documented           | ✅ Done  | —           |
| 5   | DPO appointed + contact published       | ✅ Done  | —           |
| 6   | Grievance officer named + published     | ✅ Done  | —           |
| 7   | Consent capture at signup               | 🔴 Build | Sprint 1    |
| 8   | Consent records stored + auditable      | 🔴 Build | Sprint 1    |
| 9   | Consent withdrawal mechanism            | 🔴 Build | Sprint 1    |
| 10  | Cookie consent banner (marketing site)  | 🔴 Build | Sprint 1    |
| 11  | Data export (self-serve)                | ✅ Done  | —           |
| 12  | Account deletion (self-serve)           | ✅ Done  | —           |
| 13  | Data retention policy (automated)       | 🔴 Build | Sprint 3    |
| 14  | Breach notification process             | 🔴 Build | Sprint 3    |
| 15  | Age verification at signup              | 🔴 Build | Sprint 3    |
| 16  | Data rights for non-users (leads)       | 🔴 Build | Sprint 2    |
| 17  | Marketing opt-in enforcement            | 🔴 Build | Sprint 2    |
| 18  | Purpose limitation middleware           | 🟡 Build | Sprint 4    |
| 19  | Multilingual privacy notice             | 🟢 Later | Post-launch |

### Product-Level (Where tenants store THEIR customers' data)

| #   | Item                                            | Status   | Notes                     |
| --- | ----------------------------------------------- | -------- | ------------------------- |
| 1   | Tenant isolation (no cross-org data access)     | ✅ Done  | org_id scoping everywhere |
| 2   | Lead data encryption at rest                    | ✅ Done  | Cloud SQL encryption      |
| 3   | WhatsApp opt-out handling (STOP keyword)        | ✅ Done  | Flow compliance engine    |
| 4   | Email unsubscribe (RFC-8058)                    | ✅ Done  | One-click unsubscribe     |
| 5   | LAIE data classification (personal vs business) | ✅ Done  | dataClassifier.ts         |
| 6   | LAIE DSR suppression (opt-out)                  | ✅ Done  | compliance.submitDSR      |
| 7   | Flow lawful-sourcing gate                       | ✅ Done  | eligibility.ts R14.4      |
| 8   | Credential encryption (tenant secrets)          | ✅ Done  | AES-256 vault             |
| 9   | Audit trail per org                             | ✅ Done  | Activity logs             |
| 10  | Lead marketing opt-in flag                      | 🔴 Build | Sprint 2                  |
| 11  | Broadcast eligibility filter (opt-in only)      | 🔴 Build | Sprint 2                  |

---

## Timeline Summary

| Week | What                                                     | DPDP Requirement Addressed                     |
| ---- | -------------------------------------------------------- | ---------------------------------------------- |
| 1-3  | Consent capture + withdrawal + cookie banner             | §5 (Consent), §8 (Withdrawal), §6 (Notice)     |
| 4-5  | Data subject rights (non-users) + marketing opt-in       | §11 (Access), §12 (Correction), §13 (Erasure)  |
| 6-7  | Retention automation + breach playbook + children's gate | §8(3) (Retention), §9 (Breach), §10 (Children) |
| 8    | Purpose limitation middleware + multilingual notice      | §4 (Purpose limitation), §6 (Notice language)  |

**Total: 8 weeks to full DPDP compliance** — well ahead of May 2027 deadline.

---

## What This Means Competitively

| Competitor  | DPDP Compliance Status                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| WATI        | Basic privacy policy, no self-serve deletion, no consent management                                  |
| Interakt    | Owned by Jio/Haptik — likely compliant but not documented publicly                                   |
| AiSensy     | Privacy policy exists, no visible DSR mechanism                                                      |
| Zoho        | Most compliant (global company), but enterprise-priced                                               |
| **ECODrIx** | Will be **demonstrably compliant** with public data-rights portal + consent UI + automated retention |

**The marketing angle:** "Your data, your control. ECODrIx is DPDP-compliant from Day 1 — your customers' data is handled exactly as Indian law requires."

---

## Document Governance

| Version | Date     | Change                        |
| ------- | -------- | ----------------------------- |
| 1.0     | Aug 2026 | Initial DPDP compliance audit |

**Cross-references:**

- Legal docs: `ecodrix/src/lib/legal/docs/` (privacy, dpa, security, cookie)
- Server compliance: `server/src/platform/routes/admin/compliance.routes.ts`
- Flow compliance: `server/src/product/flow/engine/compliance.ts`
- LAIE compliance: `server/src/product/laie/sdk/laie.sdk.ts`
