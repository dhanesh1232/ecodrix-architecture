# LAIE Scraper Roadmap — what to add (Apify-store as the capability map)

> LAIE builds its OWN scrapers. Apify's actor store is only a **map of
> what's possible** — this doc lists sources worth adding, grouped by tier,
> each with: what it yields, feasibility for a self-built scraper, and the
> anti-bot / legal risk (LAIE already has `scrap/LEGAL_COMPLIANCE.md` +
> `YOUR_PRODUCT_LEGAL_ASSESSMENT.md` — respect them; we scrape public data,
> honor robots via `robotsChecker.ts`, and rotate IPs via the proxy kit).

---

## 0. Already built (baseline — 7 scrapers + enrichers)

**Discovery scrapers:** Google Maps · JustDial · Sulekha · IndiaMART ·
TradeIndia · Bing Places · Yelp.
**Enrichers (not standalone sources):** website deep-crawl
(`deepCrawler`), social-link discovery (IG/FB/LinkedIn/X/YT/TikTok),
email extract + SMTP verify (`emailExtractor`, `emailDiscovery`), WhatsApp
identity, GBP audit, LinkedIn decision-maker (`linkedInEnricher`),
search-engine official-site finder.

This roadmap is everything BEYOND that baseline.

---

## 1. Tiering rationale

- **Feasibility** = how hard for a self-built scraper (no Apify):
  🟢 easy (HTML/JSON, low defenses) · 🟡 medium (JS render / pagination /
  light anti-bot) · 🔴 hard (aggressive anti-bot, login walls, legal heat).
- **Risk** = anti-bot + ToS/legal exposure. 🔴 = login-walled or
  litigious (scrape only public, cautiously, or via official API).
- LAIE's edge isn't raw coverage — it's **validate + handoff**. Prefer
  sources that improve *contactability* (phone/email/social), not vanity
  volume.

---

## 2. Tier A — local / business directories (high ROI, mostly 🟢🟡)

Same shape as the existing 7; slot straight into `scraperManager` as new
`case`s. Best near-term wins.

| Source | Yields | Feasibility | Risk | Notes |
|---|---|---|---|---|
| **Google Maps (Places API)** | reviews, hours, photos, place_id | 🟢 (official API) | 🟢 | Already have HTML scraper; add official Places API path for reliability where key exists. |
| **Apple Maps / Apple Business** | local biz, categories | 🟡 | 🟢 | MapKit JS; thinner data than Google. |
| **Yellow Pages (US/UK/AU)** | phone, address, category | 🟢 | 🟢 | Classic directory, low defenses. |
| **Foursquare / Places** | venue data, categories | 🟢 (API) | 🟢 | Free API tier. |
| **OpenStreetMap / Overpass** | POIs, no contact | 🟢 (API) | 🟢 | Free; pair with enrichment for contacts. |
| **99acres / MagicBricks** (IN realty) | brokers, builders | 🟡 | 🟡 | Niche-specific but high-intent in IN. |
| **Zomato / Swiggy partner pages** (IN F&B) | restaurants | 🔴 | 🔴 | Heavy anti-bot; consider partner APIs only. |
| **Justdial categories expansion** | deeper niches | 🟢 | 🟡 | Extend existing scraper's category coverage. |

**Recommend now:** Yellow Pages, Foursquare (API), OpenStreetMap — cheap,
global, low-risk, broaden reach beyond India.

---

## 3. Tier B — B2B / professional (high lead value, 🟡🔴)

| Source | Yields | Feasibility | Risk | Notes |
|---|---|---|---|---|
| **LinkedIn company/people** | decision-makers, titles | 🔴 | 🔴 | Already enrich via search engines (no login). Keep that path; do NOT scrape behind login. |
| **Crunchbase** | funding, size, exec | 🟡 | 🟡 | Has API (paid). Great for B2B qualification. |
| **Clutch / GoodFirms** | agencies, services | 🟢 | 🟢 | Public, structured, B2B services goldmine. |
| **G2 / Capterra** | SaaS vendors, reviews | 🟡 | 🟡 | Vendor lists are public. |
| **AngelList / Wellfound** | startups | 🟡 | 🟡 | Startup discovery. |
| **ZaubaCorp / MCA (IN)** | registered companies, directors | 🟢 | 🟢 | Public company registry — strong IN B2B signal. |
| **OpenCorporates** | global company registry | 🟢 (API) | 🟢 | Legitimacy + director names. |

**Recommend:** Clutch/GoodFirms (services agencies), OpenCorporates +
ZaubaCorp (registry truth for validation). These feed the *validation*
moat, not just volume.

---

## 4. Tier C — social / creator (contactability, 🟡🔴)

| Source | Yields | Feasibility | Risk | Notes |
|---|---|---|---|---|
| **Instagram business profiles** | bio, email button, category | 🔴 | 🔴 | Login-walled + aggressive. Today we only *discover* IG links via deep-crawl — keep it enrichment, not a discovery scraper, unless via official Graph API for owned/consented accounts. |
| **Facebook Pages** | category, contact, hours | 🔴 | 🔴 | Similar; Graph API for public pages only. |
| **YouTube channels** | business channels, about | 🟡 (API) | 🟢 | YouTube Data API — channel "about" often has email. |
| **X/Twitter bios** | links, contact | 🔴 | 🔴 | API is paid/limited. |
| **TikTok business** | creator/biz contact | 🔴 | 🔴 | Hard anti-bot. |

**Honest take:** social *discovery* scraping is the highest-risk, lowest-
reliability category for a self-built engine. LAIE's smarter play:
**enrich** social from a business we already found (we do this), and use
official APIs (YouTube) where free. Don't build IG/FB/TikTok discovery
scrapers — they break constantly and carry ToS risk.

---

## 5. Tier D — marketplaces / niche (vertical depth, 🟢🟡)

| Source | Yields | Feasibility | Risk |
|---|---|---|---|
| **Amazon sellers / brand pages** | brand, seller contact | 🔴 | 🔴 |
| **Etsy shops** | small sellers | 🟡 | 🟡 |
| **Shopify storefronts** (via myshopify / built-with) | DTC brands + tech stack | 🟢 | 🟢 |
| **Product Hunt** | new products/makers | 🟢 (API) | 🟢 |
| **BuiltWith-style tech detection** | tech stack of a domain | 🟡 | 🟢 |

**Recommend:** Shopify/tech-stack detection — pairs perfectly with the
existing website deep-crawl and gives a *pitch angle* ("you're on X, we
do Y"). Product Hunt API for fresh-launch leads.

---

## 6. Tier E — contact validation providers (the MOAT, mix of API)

These aren't discovery — they make LAIE's **validation** flagship credible.
Most are best as **provider integrations** (official APIs), not scrapers.

| Capability | How | Build vs. integrate |
|---|---|---|
| Email deliverability (catch-all, role, MX) | already have SMTP verify; add MX/role checks | build (extend `emailDiscovery`) |
| Phone validity + carrier + line type | libphonenumber (build) + optional HLR lookup (integrate) | hybrid |
| WhatsApp presence | already have `waIdentityWorker` | built ✅ |
| Disposable/temp email detection | static block-list | build 🟢 |
| Domain age / WHOIS | WHOIS/RDAP lookup | build 🟢 |
| Business-registry match | OpenCorporates/ZaubaCorp (Tier B) | integrate |

**Recommend:** these are higher-leverage than more discovery scrapers —
they're what separates LAIE ("validated leads") from "just a scraper."

---

## 7. Architecture for adding sources (so N scrapers stay clean)

Today `scraperManager` is a hand-written `switch`. Before adding ~10 more,
refactor to a **scraper registry**:

```ts
interface ScraperDef {
  id: ScraperSource;            // "yellow_pages"
  label: string;                // "Yellow Pages"
  region: "global" | "india" | "us" | ...;
  kind: "local" | "b2b" | "social" | "marketplace";
  inputs: InputField[];         // drives the per-source config form
  run(cfg): Promise<NormalizedLead[]>;
}
const REGISTRY: Record<ScraperSource, ScraperDef> = { ... };
```

Benefits:
- The **scraper gallery** + **per-source config form** render straight
  from `REGISTRY` (no hardcoded cards) — add a scraper = one entry.
- `runScrapeJob` becomes `REGISTRY[source].run(cfg)`; "all" maps over the
  registry filtered by region/kind.
- `SOURCE_COLORS` and inputs co-locate with each def.

This is the unlock for "more scrapers" without UI churn — do it before
expanding past ~8 sources.

---

## 8. Recommended sequencing

1. **Registry refactor** (§7) — makes everything below cheap.
2. **Unlock the existing 7** in the campaign API (the enum widening from
   `laie-app-flow.md` §0) + gallery.
3. **Tier A quick wins:** Yellow Pages, Foursquare (API), OpenStreetMap —
   global reach, low risk.
4. **Validation providers (Tier E):** MX/role/disposable email, phone
   line-type, WHOIS — strengthen the moat.
5. **Tier B registry sources:** OpenCorporates, ZaubaCorp, Clutch.
6. **Tier D tech-stack + Product Hunt** for pitch-angle leads.
7. **Skip / defer** IG/FB/TikTok/Amazon discovery scrapers — keep social
   as *enrichment* only (ToS + breakage risk too high for self-built).

---

## 9. Guardrails (non-negotiable)

- Public data only; honor `robotsChecker.ts`; respect
  `scrap/LEGAL_COMPLIANCE.md`.
- No scraping behind authentication/login walls (LinkedIn, IG, FB feeds).
- Prefer **official APIs** where they exist and are affordable (Foursquare,
  YouTube, Product Hunt, OpenCorporates, Places).
- Rate-limit + IP-rotate via the existing proxy kit; back off on 429/403.
- Validation > volume: every new source should improve contactability or
  qualification, not just row count.
