# Phase 1: Growth baseline, SEO roadmap, and KPIs

**North Star (CEO):** 100k+ monthly organic sessions and top-3 visibility for 10+ high-intent keywords (e.g. AI tarot, free tarot, psychic reading online).

**Positioning anchor:** Accurate, transparent, instant AI spiritual guidance — premium, modern, no spam.

**Site:** cosmicspiritguide.com (production URL should match `NEXT_PUBLIC_BASE_URL`).

---

## 1. Baseline (Month 0)

### 1.1 Data we need (fill from GA4 + GSC)

| Metric | Source | Month 0 (fill in) | Notes |
|--------|--------|-------------------|--------|
| Organic sessions (28d) | GA4 | | Primary SEO health |
| Total sessions (28d) | GA4 | | Share of organic |
| New users (organic) | GA4 | | Top-of-funnel |
| Engaged sessions / user | GA4 | | Quality signal |
| Key events: signup, purchase, lead | GA4 | | CVR numerator/denominator |
| Impressions (28d) | GSC | | Demand visibility |
| Clicks (28d) | GSC | | Traffic from search |
| Average position (site) | GSC | | Directional only |
| Top 20 queries (clicks) | GSC | | Existing winners |
| Top 20 pages (clicks) | GSC | | Page-level baseline |
| Indexed pages | GSC / URL Inspection sample | | Coverage |
| Core issues (manual checks) | GSC | | Security, mobile usability |

**Agent note:** Live GA4/GSC numbers were not available in the execution environment. Treat the table above as the **Month 0 capture template**. A follow-up child issue owns exporting real numbers into this file or the company wiki.

### 1.2 Traffic sources (qualitative baseline)

Until GA4 is pasted in, assume the product stack supports:

- **Organic search** — primary long-term lever for 100k/mo goal.
- **Direct / brand** — grows with repeat use and word of mouth.
- **Referral** — partnerships, embeds, PR, directories (secondary).
- **Paid** — optional accelerator; not required for this SEO roadmap.

### 1.3 Competitor SERP landscape (AI / online tarot)

High-intent and informational SERPs are crowded with **free AI tarot** propositions. Representative competitors (for positioning and SERP reviews, not legal claims):

| Competitor / URL | Positioning hook | SEO-relevant notes |
|------------------|------------------|-------------------|
| FlipTarot / aireadingtarot.com | Many spreads, follow-up Q&A, free daily pulls | Strong “free AI tarot” landing experience; spread depth |
| Tarovent | Calm UX, question quality emphasis | Minimal friction before first card |
| TAROTIFY.ai | Yes/no + up to 10-card tool, multilingual angle | Tool-style pages rank well for “tarot online” variants |
| TaroPath | Large spread library, daily free tier, history | Habit + retention messaging |
| MyAITarot | Free interactive spreads, privacy on-device angle | Long-tail “free tarot” intent |

**Differentiation for CosmicSpiritGuide:** Combine **transparent AI** + **premium visual/report depth** (birth chart, compatibility, reports) with **non-spammy** educational content that feeds calculators and tools. Avoid thin “AI slop” pages; every pillar should tie to a real product path (reading, chart, email).

### 1.4 Content & product inventory (repo)

- Published workflow draft: `CONTENT_WORKFLOW_README.md` (Q2 calendar skeleton).
- Draft asset: `blog-posts/birth-chart-calculator-guide.md`.
- Pinterest pipeline: `pinterest-pins/CONTENT_PIPELINE.md`.

Use these as execution hooks; the 90-day calendar below aligns and extends them.

---

## 2. Pillar page set (~30 URLs for Phase 2)

Target **one primary keyword cluster per URL**. Phase 2 is implementation + internal linking from hub (“Astrology hub”, “Tarot hub”, “Guidance hub”).

| # | Slug (proposed) | Primary keyword cluster | Funnel tie-in |
|---|-----------------|-------------------------|---------------|
| 1 | `/learn/birth-chart-calculator` | birth chart calculator | Product: birth chart |
| 2 | `/learn/free-birth-chart` | free birth chart | Signup / credits |
| 3 | `/learn/moon-phase-today` | moon phase today | Daily engagement |
| 4 | `/learn/rising-sign-calculator` | rising sign calculator | Chart inputs |
| 5 | `/learn/sun-moon-rising` | sun moon rising signs | Educational → chart |
| 6 | `/learn/mercury-retrograde` | mercury retrograde meaning | Evergreen news cycles |
| 7 | `/learn/venus-retrograde` | venus retrograde | Evergreen |
| 8 | `/learn/north-node-meaning` | north node astrology | Depth content |
| 9 | `/learn/lilith-astrology` | lilith in astrology | Niche volume |
| 10 | `/learn/juno-sign` | juno sign calculator | Relationship niche |
| 11 | `/learn/compatibility-chart` | compatibility test astrology | Product: compatibility |
| 12 | `/learn/synastry-chart` | synastry chart | Product upsell |
| 13 | `/learn/composite-chart` | composite chart calculator | Product upsell |
| 14 | `/learn/vertex-synastry` | vertex astrology | Long-tail |
| 15 | `/learn/part-of-fortune` | part of fortune astrology | Long-tail |
| 16 | `/learn/solar-return` | solar return chart | Annual intent spike |
| 17 | `/learn/progressed-chart` | progressed chart | Advanced |
| 18 | `/learn/astrology-houses` | astrology houses | Pillar → many internal links |
| 19 | `/learn/zodiac-signs` | zodiac signs list | Broad top-of-funnel |
| 20 | `/learn/daily-horoscope-explained` | daily horoscope | Product: horoscope |
| 21 | `/learn/tarot-card-meanings` | tarot card meanings | Tarot hub |
| 22 | `/learn/tarot-spreads-beginners` | tarot spreads for beginners | Product: tarot |
| 23 | `/learn/free-tarot-reading` | free tarot reading | High intent |
| 24 | `/learn/ai-tarot-reading` | ai tarot reading | High intent / differentiation |
| 25 | `/learn/love-tarot` | love tarot reading | High intent |
| 26 | `/learn/career-tarot` | career tarot spread | Intent |
| 27 | `/learn/yes-no-tarot` | yes no tarot | Tool-style |
| 28 | `/learn/psychic-reading-online` | psychic reading online | Adjacent positioning (careful claims) |
| 29 | `/learn/how-ai-tarot-works` | how does ai tarot work | Trust / transparency |
| 30 | `/learn/spiritual-guidance-vs-prediction` | spiritual guidance disclaimer | E-E-A-T + compliance |

**Internal linking rule:** Each pillar links to 2–4 siblings + 1 hub + 1 money page (signup, pricing, or primary tool).

---

## 3. First 90-day SEO / content calendar

Cadence: **2 shipped long-form pieces per week** (≈24 pieces in 90 days), plus **2 sprint weeks** for template/tool landing improvements (meta, schema, speed). Adjust resourcing as needed.

### Month 1 — Tools & high-intent astrology

| Week | Ship date (target) | Piece | Primary keyword | CTA |
|------|-------------------|-------|-----------------|-----|
| 1 | D+7 | Birth chart calculator (pillar) | birth chart calculator | Run chart |
| 1 | D+7 | Moon phases guide (refresh) | moon phase today | Moon tool |
| 2 | D+14 | Rising vs sun sign | rising sign calculator | Full chart |
| 2 | D+14 | Mercury retrograde 2026 hub | mercury retrograde meaning | Email / reading |
| 3 | D+21 | Venus retrograde | venus in retrograde | Compatibility |
| 3 | D+21 | North node meaning | north node astrology | Chart deep dive |
| 4 | D+28 | Juno sign / soul mate asteroid | juno sign calculator | Relationship product |
| 4 | D+28 | Lilith explainer | lilith in astrology | Profile / report |

**Sprint A (week 4 overlap):** Tarot hub meta + FAQ schema on `/learn/tarot-*` templates; verify Core Web Vitals on reading flow.

### Month 2 — Relationships & synastry

| Week | Piece | Primary keyword | CTA |
|------|-------|-----------------|-----|
| 5 | Compatibility beyond sun signs | compatibility test | Compatibility tool |
| 5 | Composite chart guide | composite chart calculator | Composite product |
| 6 | Synastry vs composite | synastry chart | Tool |
| 6 | Vertex in synastry | vertex astrology | Long-tail internal links |
| 7 | Part of fortune | part of fortune | Chart add-on |
| 7 | Transit timing compatibility | transit astrology | Horoscope / transits |
| 8 | Asteroid astrology relationships | asteroid astrology | Niche cluster |
| 8 | Progressed chart primer | progressed chart calculator | Advanced upsell |

**Sprint B:** Internal link pass from new posts to pillars 1–20.

### Month 3 — Tarot + authority

| Week | Piece | Primary keyword | CTA |
|------|-------|-----------------|-----|
| 9 | Solar return | solar return chart | Annual report |
| 9 | Tarot card meanings hub | tarot card meanings | Tarot product |
| 10 | Tarot for beginners / spreads | tarot reading | Tool |
| 10 | Daily horoscope “why it feels off” | daily horoscope | Personalization hook |
| 11 | Zodiac signs complete guide | what is my zodiac sign | Chart |
| 11 | Astrology houses | astrology houses | Pillar |
| 12 | Planetary aspects simple | astrology aspects | Education |
| 12 | Free birth chart walkthrough | free birth chart | Signup |

### Always-on (parallel, low dev)

- **Pinterest:** follow `pinterest-pins/CONTENT_PIPELINE.md` for 3–5 pins per published post.
- **Refresh:** monthly tweak to title/meta on pages with high impressions but low CTR (from GSC).

---

## 4. KPI sheet (aligned to CEO targets)

Review **monthly**; compare to Month 0 baseline once filled.

| KPI | Definition | Target direction (90d) | Owner |
|-----|------------|------------------------|--------|
| Organic sessions | GA4 sessions where source = organic | +30–50% stretch vs baseline; absolute depends on M0 | Growth |
| Non-brand organic clicks | GSC: filter brand terms out | Up | Growth |
| **Top 10 keyword slots** | Count of tracked keywords in positions 1–3 (use GSC + rank tracker) | +3–5 keywords in top 3 (from current) | Growth |
| Indexed money pages | Key URLs indexed without errors | 100% of pillar list published in-phase | Eng |
| Organic CVR | Key events / organic sessions | Flat or up (quality over raw traffic) | Product |
| Signups from organic | GA4 segment | Up | Growth |
| Revenue attributed organic | GA4 (or Stripe + UTM) | Up | Finance / Growth |
| Avg engagement time (organic) | GA4 | Up or stable | Content |

**Tracked keyword seed list (minimum):**  
`ai tarot reading`, `free tarot reading`, `tarot card meanings`, `birth chart calculator`, `free birth chart`, `compatibility astrology`, `daily horoscope`, `moon phase today`, `mercury retrograde`, `psychic reading online` — expand to 30–50 in rank tracker.

---

## 5. Risks & guardrails

- **Trust / compliance:** AI spiritual products need clear “entertainment / reflection” framing where required; pillar #30 and on-site disclaimers support E-E-A-T.
- **Thin content:** Programmatic pages must include unique copy, FAQs, and tool embeds — no duplicate city-style spam.
- **Measurement gap:** Without GSC/GA4 exports, prioritization is hypothesis-driven; unblock data in child issue.

---

## 6. Next actions (execution)

1. Export Month 0 GA4 + GSC into §1.1 (owner: whoever has property access).
2. Prioritize **pillars 1, 3, 21–24** first (highest overlap with North Star keywords).
3. Ship calendar week 1–2 pieces; measure CTR and position after 14 days per URL.
