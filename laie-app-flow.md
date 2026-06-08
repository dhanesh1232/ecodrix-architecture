# LAIE App Flow — self-built scraper engine (Apify-style UX only)

> The end-to-end UX for `/product/laie/*`. **LAIE builds its own scrapers**
> — we do NOT use Apify as a data source. Apify and Clay are *UX references
> only*: Apify for the "pick a scraper → configure → run → watch → results"
> feel, Clay for the "table-as-workspace with progressively-filling
> enrichment columns" feel. Grounded in `laie-design-consolidated.md` §0a
> and the REAL scrapers in `ECOD/server/src/lib/laie/scrap/scraperManager.ts`.

---

## 0. The real engine (what we already have server-side)

`scraperManager.runScrapeJob()` is a working switch over **7 self-built
scrapers** + a parallel "all" mode:

| Scraper (real) | `source` id | Region/kind |
|---|---|---|
| Google Maps | `google_maps` | global local-business |
| JustDial | `justdial` | India local |
| Sulekha | `sulekha` | India services |
| IndiaMART | `indiamart` | India B2B suppliers |
| TradeIndia | `tradeindia` | India B2B sellers |
| Bing Places | `bing_places` | global local |
| Yelp | `yelp` | global reviews/local |
| **All (parallel)** | `all` | run every source at once |

Plus enrichment (not standalone scrapers): website deep-crawl, social
discovery (`deepCrawler.socialLinks` → IG/FB/LinkedIn/etc.), email
discovery + SMTP verify, WhatsApp identity, GBP audit, LinkedIn decision-
maker.

### The one gap to unlock the gallery
The run engine supports all 7, but the **campaign API artificially limits
`source` to 3** (`CAMPAIGN_SOURCES = google_maps | justdial | sulekha` in
`validation/laie/flows.schema.ts`). To ship a full scraper gallery we
widen `CAMPAIGN_SOURCES` to the 7 runnable sources (server one-liner) and
the schema's `sourceType`/payload `source` union to match. This is the
single backend change the new flow needs; everything else is UI.

---

## 1. Required pages (this is the ask)

```
/product/laie                     OVERVIEW   — hero + pipeline status + quick actions
/product/laie/campaigns           CAMPAIGNS  — SCRAPER GALLERY (cards like Apify store)
/product/laie/campaigns/new?src=  CONFIG     — chosen-scraper input form (asks inputs)
   → launch → LiveTerminal (run)  RUN        — live log stream (exists)
/product/laie/leads               TABLE      — Clay-style living grid (v2 shipped)
/product/laie/validation          VALIDATE   — flagship: email/phone/WA/social (next)
/product/laie/outreach            OUTREACH   — kits (exists)
   → Export to ERIX (modal)       HANDOFF    — pipeline+stage picker → import bridge
```

---

## 2. OVERVIEW page (`/product/laie`)

Today this is just the marketing `ProductFeaturePage`. For an *enabled*
org it should become a real **command center** (the attract-and-orient
screen):

```
┌────────────────────────────────────────────────────────────────────┐
│  LAIE — Lead Intelligence Engine            [+ New Campaign]        │
│                                                                      │
│  ┌── Pipeline at a glance (real counts) ──────────────────────────┐ │
│  │  Scraped 1,204 → Enriched 891 → Validated 540 → Ready 210      │ │
│  │  → Exported 88        (each is a click-through filter)         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Popular scrapers (jump straight in)                                 │
│  [▣ Google Maps] [▣ JustDial] [▣ IndiaMART] [▣ Yelp]  → gallery     │
│                                                                      │
│  Recent runs            Data quality           Proxy health          │
│  (last 5, status dots)  (coverage score)       (alive/total)         │
└────────────────────────────────────────────────────────────────────┘
```

- Pipeline counts: derive from `laie_leads` (has score? validated? kit?
  `importedToCrm`?) — the same derivation as `PipelineStatusChip`.
- Recent runs / quality / proxy: reuse the real endpoints already wired
  (`/batches`, `/leads/quality`, `/infra/status`).
- For a NOT-enabled org, keep the marketing `ProductFeaturePage`.

## 3. CAMPAIGNS page (`/campaigns`) — the SCRAPER GALLERY

This is the centerpiece, modeled on Apify's actor store but with OUR
scrapers. Two sections:

```
┌─ Scraper Gallery ────────────────────────────────────────────────────┐
│  Choose a source to start a campaign                                  │
│                                                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │  [GM icon]  │ │  [JD icon]  │ │ [IM icon]   │ │ [Yelp icon] │     │
│  │ Google Maps │ │  JustDial   │ │  IndiaMART  │ │   Yelp      │     │
│  │ Local biz · │ │ India local │ │ India B2B   │ │ Reviews ·   │     │
│  │ global      │ │             │ │ suppliers   │ │ global      │     │
│  │ [Use →]     │ │ [Use →]     │ │ [Use →]     │ │ [Use →]     │     │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │  Sulekha    │ │ TradeIndia  │ │ Bing Places │ │ ⚡ All       │     │
│  │             │ │ B2B sellers │ │ global local│ │ run every   │     │
│  │ [Use →]     │ │ [Use →]     │ │ [Use →]     │ │ source [→]  │     │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │
└───────────────────────────────────────────────────────────────────────┘

┌─ Your Campaigns ──────────────────────────────────────────────────────┐
│  (existing CampaignList — runs/flows the user already created)        │
└───────────────────────────────────────────────────────────────────────┘
```

- Each card uses brand color from `SOURCE_COLORS` (extend the map with
  `indiamart`, `tradeindia`, `bing_places`, `yelp`).
- "Use →" routes to `/campaigns/new?src=<source>` (deep-link `view=<source>`
  via the existing convention) which opens the **config form** pre-set to
  that scraper.
- The "All" card = parallel mode (`scrapeAllSources`) — a genuine LAIE
  superpower Apify charges per-actor for; we run every source in one go.

## 4. CONFIG (`/campaigns/new`) — "the scraper asks for inputs"

When a scraper is chosen, show ONLY the inputs that scraper needs
(Apify's per-actor input schema feel):

- **Common**: niche/keyword, city (autocomplete), max results
  (10/20/50/100/200), enrichment toggles (website, social, email-verify,
  WhatsApp).
- **Google Maps extra**: map-radius picker (lat/lng + radius km) — reuse
  `/leads/map`'s `LeadRadiusMap`.
- **Right rail "Input preview"** (Apify-style): resolved query + estimated
  leads + estimated credits before launch. Reuse `InputPreview`.
- **Launch** → creates flow + run → `LiveTerminal` streams (existing).

## 5. RUN → TABLE → VALIDATE → OUTREACH → EXPORT

Unchanged from the corrected scope; summarized:

- **RUN**: `LiveTerminal` (Apify run-log feel — already built).
- **TABLE** (`/leads`): Clay living grid — rows fill as enrichment workers
  complete; per-row `PipelineStatusChip`; bulk **Export to ERIX**. (v2 shipped.)
- **VALIDATE** (`/validation`): flagship — email (`verifyEmailSMTP`),
  phone/WhatsApp (`waIdentityWorker`), social (`deepCrawler`) coverage +
  per-lead signals + waterfall re-run.
- **OUTREACH** (`/outreach`): AI kits (prepare only).
- **EXPORT**: bulk → `ExportToErixModal` (pick CRM pipeline+stage) →
  `POST /import/crm`. The ONLY place "stages" appear, and they're CRM's.

## 6. Navigation (pipeline-ordered)

```
Start              → Overview · Campaigns (gallery) · Map Search · Runs · Scheduler
Enrich & Validate  → Audit · Intelligence · Validation ★
Outreach           → Outreach · Templates
Export & Ops       → (Export = action) · Data Ops · Datasets · Proxy
Platform           → Analytics · Usage · Webhooks · Settings
```

## 7. New primitives this flow needs

| Primitive | Status | Carries |
|---|---|---|
| `SOURCE_COLORS` (+4 sources) | extend | scraper brand identity |
| `ScraperCard` / `ScraperGallery` | ❌ NEW | the campaigns gallery |
| `ScraperConfigForm` (per-source inputs) | ❌ NEW (reuse SourceSelector bits) | the "asks inputs" step |
| `PipelineStatusChip` | ❌ NEW | overview + table spine |
| `OverviewCommandCenter` | ❌ NEW | enabled-org overview |
| `ExportToErixModal` | ❌ NEW | the handoff |
| `LiveTerminal`, `InputPreview`, `LeadRadiusMap` | ✅ exist | run + config |

## 8. Build order

1. **Server (one change):** widen `CAMPAIGN_SOURCES` + payload `source`
   union to the 7 runnable scrapers (+ optional `all`). Unblocks the gallery.
2. **`SOURCE_COLORS`** — add indiamart/tradeindia/bing_places/yelp.
3. **Scraper Gallery** `/campaigns` — `ScraperCard` grid above the existing
   `CampaignList`. "Use →" deep-links to config.
4. **Config** `/campaigns/new?src=` — per-source input form + input preview;
   launch → LiveTerminal.
5. **Overview command center** — pipeline counts + recent runs + quality +
   proxy, all from real endpoints; marketing page when not enabled.
6. **`PipelineStatusChip`** — derived status on the leads table + overview.
7. **Validation** `/validation` + **ExportToErixModal** (close the loop).

Each step: real data only, loading/error/empty, `tsc`+`biome`+
`getDiagnostics` clean.

## 9. Why this attracts users (the uniqueness)

- **One place, many sources** — pick a scraper like an app, or hit "All"
  to run every source in parallel (no per-actor fees, no glue code).
- **Self-built = no Apify dependency or cost** passed to the user.
- **Watch it happen** — the live terminal makes scraping feel alive.
- **It validates, not just scrapes** — email/phone/WhatsApp/social
  verification is the moat vs. raw scrapers.
- **One-click handoff to a real CRM** (ERIX) — finish the job, don't dump a
  CSV.

## 10. Hard "do nots"

- LAIE builds its own scrapers — never call Apify as a backend.
- No sales pipeline/kanban page — stages live only in the Export modal (CRM's).
- No mock data — gallery cards map to REAL `scraperManager` sources;
  counts/coverage/health from real endpoints.
- Platform tokens only; `SOURCE_COLORS` is the sole brand-hex.
