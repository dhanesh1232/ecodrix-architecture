# ECODrIx — Pricing Model & Unit Economics

**Version:** 1.0  
**Author:** Dhanesh, ECODrIx  
**Date:** August 2026  
**Status:** Active — defines pricing, economics, and revenue architecture.  
**Depends on:** `MARKET_RESEARCH.md`, `PRODUCT_SPECIFICATION.md`

---

## Table of Contents

1. [Pricing Philosophy](#1-pricing-philosophy)
2. [Plan Structure](#2-plan-structure)
3. [Usage-Based Components](#3-usage-based-components)
4. [Unit Economics](#4-unit-economics)
5. [Revenue Model](#5-revenue-model)
6. [Competitive Pricing Analysis](#6-competitive-pricing-analysis)
7. [Discount & Offer Strategy](#7-discount--offer-strategy)
8. [Partner Economics](#8-partner-economics)
9. [Billing Infrastructure](#9-billing-infrastructure)
10. [Pricing Experiments](#10-pricing-experiments)

---

## 1. Pricing Philosophy

### Core Principles

| Principle                        | Rationale                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| **No per-seat pricing**          | Indian SMBs share logins, hate per-user charges. Value is in leads managed, not seats. |
| **Flat platform fee + usage**    | Predictable base cost, pay more only when getting more value                           |
| **WhatsApp at cost**             | Pass through Meta's rates with zero markup — builds trust, removes comparison anxiety  |
| **Value metric = leads managed** | Aligns pricing with what customers care about (more leads = more business)             |
| **Annual discount**              | Reward commitment, improve cash flow, reduce churn                                     |

### Pricing Anchors (What competitors charge for LESS)

| Competitor | What they offer     | Price     |
| ---------- | ------------------- | --------- |
| WATI       | WhatsApp inbox only | ₹2,199/mo |
| Interakt   | WhatsApp + Shopify  | ₹1,999/mo |
| AiSensy    | WhatsApp broadcast  | ₹1,500/mo |
| Gallabox   | WhatsApp D2C        | ₹999/mo   |

**ECODrIx offers CRM + pipeline + automation + invoicing + payments + multi-channel for the same price or less.** This is the positioning.

---

## 2. Plan Structure

### 2.1 Plan Tiers

|                         | **Starter**               | **Growth**                | **Business**               | **Enterprise**     |
| ----------------------- | ------------------------- | ------------------------- | -------------------------- | ------------------ |
| **Price (monthly)**     | ₹999/mo                   | ₹2,499/mo                 | ₹4,999/mo                  | Custom             |
| **Price (annual)**      | ₹799/mo (₹9,588/yr)       | ₹1,999/mo (₹23,988/yr)    | ₹3,999/mo (₹47,988/yr)     | Custom             |
| **Target**              | Solo / micro (1-3 people) | Growing SMB (5-15 people) | Established (15-50 people) | Large / franchise  |
|                         |                           |                           |                            |                    |
| **Leads**               | 500 active                | 5,000 active              | Unlimited                  | Unlimited          |
| **Team members**        | 3                         | 10                        | 25                         | Unlimited          |
| **Pipelines**           | 1                         | 5                         | Unlimited                  | Unlimited          |
|                         |                           |                           |                            |                    |
| **Channels**            |                           |                           |                            |                    |
| WhatsApp                | ✅                        | ✅                        | ✅                         | ✅                 |
| Email (SES)             | ✅ (1,000/mo)             | ✅ (10,000/mo)            | ✅ (50,000/mo)             | Unlimited          |
| Instagram DM            | ❌                        | ✅                        | ✅                         | ✅                 |
| Facebook Messenger      | ❌                        | ✅                        | ✅                         | ✅                 |
| Telegram                | ❌                        | ✅                        | ✅                         | ✅                 |
| Webchat                 | ✅ (1 domain)             | ✅ (3 domains)            | ✅ (10 domains)            | Unlimited          |
|                         |                           |                           |                            |                    |
| **Automation**          |                           |                           |                            |                    |
| Automation rules        | 5                         | 25                        | Unlimited                  | Unlimited          |
| Sequences               | 2                         | 10                        | Unlimited                  | Unlimited          |
| Flow builder            | ❌                        | ✅ (5 flows)              | ✅ (unlimited)             | ✅                 |
|                         |                           |                           |                            |                    |
| **Commerce**            |                           |                           |                            |                    |
| Invoices                | 20/mo                     | Unlimited                 | Unlimited                  | Unlimited          |
| Payment gateway         | Razorpay                  | Razorpay + Stripe         | Razorpay + Stripe          | Custom             |
| Client portal           | ❌                        | ✅ (basic)                | ✅ (branded)               | ✅ (custom domain) |
|                         |                           |                           |                            |                    |
| **Intelligence (LAIE)** |                           |                           |                            |                    |
| Lead enrichment         | ❌                        | 100 credits/mo            | 500 credits/mo             | Custom             |
| AI auto-responder       | ❌                        | ✅                        | ✅                         | ✅                 |
| Research reports        | ❌                        | ❌                        | ✅                         | ✅                 |
|                         |                           |                           |                            |                    |
| **Storage**             | 1 GB                      | 5 GB                      | 25 GB                      | Custom             |
| **Support**             | Email (48hr)              | Email + Chat (24hr)       | Priority (4hr)             | Dedicated AM       |
| **API access**          | ❌                        | ✅ (rate-limited)         | ✅ (full)                  | ✅ (premium)       |

### 2.2 Free Trial

| Parameter            | Value                          |
| -------------------- | ------------------------------ |
| Duration             | 14 days                        |
| Plan level           | Growth (full features)         |
| Credit card required | No                             |
| WhatsApp messages    | 100 free service conversations |
| Conversion goal      | > 15% trial-to-paid            |

### 2.3 Free Tier (Post-PMF, Phase 2)

| Parameter       | Value                                           | Purpose                          |
| --------------- | ----------------------------------------------- | -------------------------------- |
| Price           | ₹0 forever                                      | Product-led growth hook          |
| Leads           | 100 active                                      | Enough to experience value       |
| Team            | 1 user                                          | Solo micro-business              |
| WhatsApp        | Receive only (no broadcast)                     | Can't spam, but sees inbox value |
| Automation      | 1 rule                                          | Taste of automation              |
| Upgrade trigger | "You've hit 100 leads — upgrade to manage more" | Natural expansion                |

---

## 3. Usage-Based Components

### 3.1 WhatsApp Messages (Pass-Through)

| Category              | Meta Rate (India) | ECODrIx Charge | Our Margin |
| --------------------- | ----------------- | -------------- | ---------- |
| Marketing             | ₹0.86/message     | ₹0.86/message  | ₹0 (trust) |
| Utility               | ₹0.12/message     | ₹0.12/message  | ₹0         |
| Authentication        | ₹0.13/message     | ₹0.13/message  | ₹0         |
| Service (24hr window) | FREE              | FREE           | ₹0         |

**Why zero markup:** Competitors charge 10-30% markup. Transparent pass-through builds trust and removes pricing comparison anxiety. Revenue comes from the platform fee, not message arbitrage.

### 3.2 Email Overage

| Plan     | Included  | Overage         |
| -------- | --------- | --------------- |
| Starter  | 1,000/mo  | ₹0.10 per email |
| Growth   | 10,000/mo | ₹0.08 per email |
| Business | 50,000/mo | ₹0.05 per email |

### 3.3 LAIE Intelligence Credits

| Credit pack   | Price  | Per-lead cost |
| ------------- | ------ | ------------- |
| 100 credits   | ₹500   | ₹5/lead       |
| 500 credits   | ₹2,000 | ₹4/lead       |
| 2,000 credits | ₹6,000 | ₹3/lead       |

### 3.4 Storage Overage

| Overage              | Price      |
| -------------------- | ---------- |
| Per additional 10 GB | ₹200/month |

---

## 4. Unit Economics

### 4.1 Cost Per Tenant (Monthly)

| Cost component               | Starter tenant | Growth tenant | Business tenant |
| ---------------------------- | -------------- | ------------- | --------------- |
| **Cloud SQL (Postgres)**     | ₹15 (shared)   | ₹30 (shared)  | ₹50 (shared)    |
| **Cloud Run (API server)**   | ₹10            | ₹20           | ₹40             |
| **Cloudflare R2 (storage)**  | ₹5             | ₹15           | ₹50             |
| **AWS SES (email)**          | ₹5             | ₹30           | ₹100            |
| **ErixStore (queue)**        | ₹5             | ₹10           | ₹20             |
| **Monitoring / Logging**     | ₹5             | ₹5            | ₹10             |
| **Support cost (amortized)** | ₹50            | ₹100          | ₹200            |
|                              |                |               |                 |
| **Total COGS**               | **₹95/mo**     | **₹210/mo**   | **₹470/mo**     |
| **Revenue**                  | **₹999/mo**    | **₹2,499/mo** | **₹4,999/mo**   |
| **Gross margin**             | **90.5%**      | **91.6%**     | **90.6%**       |

### 4.2 Blended Economics Target

| Metric                          | Target     | Notes                              |
| ------------------------------- | ---------- | ---------------------------------- |
| Gross margin                    | > 85%      | SaaS benchmark: 70-85%             |
| CAC (Customer Acquisition Cost) | < ₹3,000   | Founder-led initially (near ₹0)    |
| LTV (Lifetime Value)            | > ₹50,000  | 24-month retention × avg ₹2,000/mo |
| LTV:CAC ratio                   | > 15:1     | Healthy: > 3:1                     |
| Payback period                  | < 2 months | Revenue > CAC by month 2           |
| Monthly churn target            | < 5%       | Top-quartile SMB SaaS              |

### 4.3 Revenue Per Account (ARPA) Growth

| Month    | ARPA                          | Driver                                        |
| -------- | ----------------------------- | --------------------------------------------- |
| Month 1  | ₹999 (starter trial converts) | Base plan                                     |
| Month 3  | ₹1,500                        | Some upgrade to Growth                        |
| Month 6  | ₹2,200                        | Usage growth + plan upgrades                  |
| Month 12 | ₹3,000                        | Full adoption + add-ons (LAIE, extra storage) |

---

## 5. Revenue Model

### 5.1 Revenue Streams

| Stream                       | % of revenue (Year 1) | % of revenue (Year 3) |
| ---------------------------- | --------------------- | --------------------- |
| **Platform subscriptions**   | 80%                   | 60%                   |
| **WhatsApp pass-through**    | 5%                    | 15%                   |
| **LAIE credits**             | 5%                    | 10%                   |
| **Email overage**            | 3%                    | 5%                    |
| **Storage overage**          | 2%                    | 3%                    |
| **Partner/white-label fees** | 5%                    | 7%                    |

### 5.2 Revenue Projections

| Month    | Tenants | ARPA   | MRR        | ARR    |
| -------- | ------- | ------ | ---------- | ------ |
| Sep 2026 | 10      | ₹1,500 | ₹15,000    | ₹1.8L  |
| Dec 2026 | 50      | ₹2,000 | ₹1,00,000  | ₹12L   |
| Mar 2027 | 150     | ₹2,300 | ₹3,45,000  | ₹41.4L |
| Jun 2027 | 400     | ₹2,500 | ₹10,00,000 | ₹1.2Cr |
| Dec 2027 | 1,500   | ₹3,000 | ₹45,00,000 | ₹5.4Cr |

### 5.3 Break-Even Analysis

| Cost                   | Monthly (solo founder) |
| ---------------------- | ---------------------- |
| Cloud infrastructure   | ₹15,000                |
| Domain + services      | ₹2,000                 |
| Meta verification/fees | ₹1,000                 |
| Personal expenses      | ₹30,000                |
| **Total monthly burn** | **₹48,000**            |

**Break-even:** 24 tenants at ₹2,000 ARPA = ₹48,000 MRR  
**Timeline:** Target by October 2026 (60 days from now)

---

## 6. Competitive Pricing Analysis

### 6.1 What You Get Per ₹2,000/month

| Platform           | What ₹2,000/mo buys you                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| **WATI**           | WhatsApp inbox + chatbot (no CRM, no pipeline, no invoicing)                  |
| **Interakt**       | WhatsApp + Shopify notifications (no CRM, single channel)                     |
| **AiSensy**        | WhatsApp broadcast + basic chatbot (no CRM)                                   |
| **Gallabox**       | WhatsApp + simple automation (no pipeline, no invoicing)                      |
| **Zoho CRM**       | CRM only (no WhatsApp, separate Zoho WA at extra cost)                        |
| **ECODrIx Growth** | Full CRM + pipeline + 6 channels + automation + invoicing + payments + portal |

### 6.2 Price-Value Map

```
Value Delivered
(features × depth)
      ↑
  HIGH│                              ★ ECODrIx Growth (₹2,499)
      │                           ★ ECODrIx Business (₹4,999)
      │
      │     ★ Respond.io (₹6,600)        ★ Zoho One (₹6,000+)
      │
  MED │  ★ ChatDaddy ($29)
      │     ★ WATI (₹2,199)
      │        ★ AiSensy Pro (₹3,200)
      │
  LOW │  ★ Gallabox (₹999)
      │  ★ AiSensy Basic (₹1,500)
      │  ★ Interakt (₹1,999)
      │  ★ ECODrIx Starter (₹999)
      └──────────────────────────────────────────────→ Price
         ₹999   ₹1,500  ₹2,500  ₹4,000  ₹5,000  ₹7,000
```

**ECODrIx sits in the "high value, medium price" quadrant** — the most attractive position.

---

## 7. Discount & Offer Strategy

### 7.1 Standard Discounts

| Discount               | Amount                      | Condition               |
| ---------------------- | --------------------------- | ----------------------- |
| Annual billing         | 20% off                     | Pay yearly upfront      |
| Startup (< 1 year old) | 30% off for 6 months        | Verified new business   |
| Referral credit        | ₹500 off next month         | Per successful referral |
| Agency bulk            | 15% off per additional seat | 5+ client accounts      |

### 7.2 Launch Offers (First 100 customers)

| Offer               | Details                                          | Duration          |
| ------------------- | ------------------------------------------------ | ----------------- |
| **Founder's Plan**  | Growth plan at ₹999/mo (60% off) locked for life | First 50 signups  |
| **Free onboarding** | 1-on-1 setup call + first automation configured  | First 100 signups |
| **Extended trial**  | 30 days instead of 14                            | First 100 signups |

### 7.3 Pricing Experiments to Run

| Experiment                              | Hypothesis                         | Measure                       |
| --------------------------------------- | ---------------------------------- | ----------------------------- |
| ₹999 vs ₹1,499 for Starter              | Lower entry = more trials          | Trial signup rate             |
| Monthly vs annual-only                  | Annual-only reduces support burden | Churn at month 3              |
| Free tier vs trial-only                 | Free tier drives word-of-mouth     | Organic signups after month 3 |
| Per-message markup (5%) vs pass-through | Does markup matter to buyer?       | Conversion rate               |

---

## 8. Partner Economics

### 8.1 Agency Partner Program

| Tier         | Requirement         | Discount on client accounts | Revenue share     |
| ------------ | ------------------- | --------------------------- | ----------------- |
| **Silver**   | 3+ client accounts  | 10%                         | —                 |
| **Gold**     | 10+ client accounts | 20%                         | 5% of client MRR  |
| **Platinum** | 25+ client accounts | 25%                         | 10% of client MRR |

### 8.2 Agency Revenue Example

```
Agency manages 10 clients on ECODrIx Growth (₹2,499/mo each)

ECODrIx revenue: 10 × ₹2,499 × 0.80 (Gold discount) = ₹19,992/mo
Agency earns:
  - Setup fee: 10 × ₹5,000 = ₹50,000 (one-time)
  - Monthly management: 10 × ₹3,000 = ₹30,000/mo
  - Revenue share (Gold): 5% × ₹24,990 = ₹1,249/mo
  - Total monthly: ₹31,249/mo recurring from ECODrIx clients

ECODrIx benefit:
  - ₹19,992 MRR from 10 clients (₹0 CAC — agency brought them)
  - Lower support burden (agency handles client)
  - Higher retention (agency keeps client active)
```

### 8.3 White-Label Pricing (Post-PMF)

| Feature                            | Price            |
| ---------------------------------- | ---------------- |
| Custom branding (logo, colors)     | ₹2,000/mo add-on |
| Custom domain (crm.agencyname.com) | ₹1,000/mo add-on |
| Remove "Powered by ECODrIx"        | ₹3,000/mo add-on |
| Full white-label bundle            | ₹5,000/mo        |

---

## 9. Billing Infrastructure

### 9.1 Current Implementation

| Component                            | Status  |
| ------------------------------------ | ------- |
| Razorpay Subscriptions               | ✅ Live |
| Plan management (CRUD)               | ✅ Live |
| Entitlements engine                  | ✅ Live |
| Credit system (prepaid)              | ✅ Live |
| Usage metering                       | ✅ Live |
| Upgrade/downgrade                    | ✅ Live |
| Invoice generation (for our billing) | ✅ Live |
| Webhook (payment confirmation)       | ✅ Live |

### 9.2 Billing Flow

```
User selects plan
    → Razorpay Checkout (₹999/mo)
    → Subscription created
    → Entitlements activated immediately
    → Monthly auto-debit
    → If payment fails: 3-day grace → downgrade to Free
    → Usage tracked daily → overage charged at next billing
```

### 9.3 Payment Methods Supported

| Method                               | Status          |
| ------------------------------------ | --------------- |
| UPI (Google Pay, PhonePe, Paytm)     | ✅ via Razorpay |
| Credit/Debit card                    | ✅ via Razorpay |
| Net banking                          | ✅ via Razorpay |
| Wallets                              | ✅ via Razorpay |
| International cards (for NRI/global) | ✅ via Razorpay |

---

## 10. Pricing Experiments

### 10.1 Experiment Queue (Ordered)

| #   | Experiment                                       | When                     | Success metric          |
| --- | ------------------------------------------------ | ------------------------ | ----------------------- |
| 1   | Founder's Plan (₹999 locked) vs standard pricing | Aug-Sep 2026             | Signup velocity         |
| 2   | 14-day vs 30-day trial                           | Sep 2026                 | Trial → paid conversion |
| 3   | Free tier introduction                           | Nov 2026 (after 50 paid) | Organic growth rate     |
| 4   | Annual-only vs monthly option                    | Dec 2026                 | Revenue retention       |
| 5   | Vertical-specific pricing (Real Estate Premium)  | Q1 2027                  | ARPA by vertical        |

### 10.2 Pricing Review Cadence

- **Monthly:** Review conversion rates, churn by plan, ARPA trends
- **Quarterly:** Competitive pricing check, plan structure review
- **Annually:** Full pricing overhaul if needed

---

## Key Decisions Made

| Decision                        | Rationale                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Zero WhatsApp markup            | Trust-building, removes competitor comparison, revenue from platform value not arbitrage |
| No per-seat                     | Indian SMB behavior (shared devices, family businesses), removes friction                |
| "Leads managed" as value metric | Directly tied to customer outcome (more leads = more revenue for them)                   |
| ₹999 entry point                | Same as cheapest competitor (Gallabox) but 10x more product                              |
| Annual discount 20%             | Standard SaaS, improves cash flow without devaluing                                      |
| Agency revenue share            | Aligns incentives, agencies keep clients active                                          |

---

## Document Governance

| Version | Date     | Change                |
| ------- | -------- | --------------------- |
| 1.0     | Aug 2026 | Initial pricing model |

**Cross-references:**

- Market context: `MARKET_RESEARCH.md`
- Feature justification: `PRODUCT_SPECIFICATION.md`
- Customer willingness-to-pay signals: `CUSTOMER_JOURNEY_MAP.md`
- Execution: `GTM_PLAYBOOK.md`
