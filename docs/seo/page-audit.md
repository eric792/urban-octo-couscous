# SEO page audit — Zen Amour

Run with the **superseo `page-audit` skill** (installed in `.claude/skills/`) on 29 Oct 2026.
Primary page: **Fragrances category** (`/shop/fragrances`, previously `/shop?category=fragrances`). Supporting notes on the homepage and product pages are at the end.

> **Research limits.** The site isn't public yet, so pages were read from the local production build. Competitor sites were blocked by this sandbox's network policy. The competitor findings below come from search-engine extracts of their pages (titles, snippets, quoted copy), not full page reads. The search tool is US-based, so google.co.za rankings may differ slightly. Re-run `page-audit` once the site is live and the competitor domains are reachable.

## Primary keyword

**"inspired fragrances South Africa"** (and its twin, "inspired perfumes South Africa"). The meta description already led with "Inspired alternative fragrances", and the brand is positioned as affordable, inspired-by luxury for SA buyers. But the title and H1 said only "Fragrances".

## Content identity

A transactional category page whose job is to turn "inspired perfume" searchers into buyers of six house fragrances. Before the audit it was structured as a bare product grid: about 150 words, most of them filter labels. It gave Google nothing to rank and gave shoppers no reason to pick an unknown brand over a 750-scent competitor.

## Competitive position

Results for the keyword are led by specialist SA "inspired-by" retailers:

| Competitor | What their pages show | What they do better | Where Zen Amour can win |
|---|---|---|---|
| [Scentimental](https://www.scentimental.co.za/) | 850+ inspired scents; "French fragrance oils"; 2 × 50ml for R499; Hellopeter 4.8 (109 reviews) and Trustpilot 4.5; "what is inspired-by" page; "not affiliated" note | Breadth, third-party reviews, every product named after its inspiration | Their own pages disagree on strength ("Extrait de Parfum" vs "EDP bases"). Zen Amour can be the clear, consistent one |
| [Perfume Emporium](https://www.perfumeemporium.co.za/) | Oil-based inspired line "at a rich 30% fragrance-oil concentration"; 100ml around R339–R399 | States a concrete oil percentage; low price per ml | Brand experience, curation, SA-climate guidance |
| [Perfumology](https://perfumology.co.za/) | 750 inspired scents; 15ml from R249, 100ml ~R899; designer "Retail Price" shown next to theirs; men's/women's collections | Entry-level 15ml, gender collections, designer-reference pricing | Fewer, better-explained scents and a luxury feel |

**The #1 thing competitors do better:** they tie every product to a named designer reference ("Inspired by …"). That matches how people search ("[designer] dupe South Africa").
**The #1 gap to exploit:** nobody explains strength and longevity honestly and consistently. Zen Amour can own that with real oil percentages and a published wear test.

## Scorecard

| Dimension | Before | After fixes | Priority now |
|---|---|---|---|
| 1. Information Gain & Originality | 2/10 | 5/10 | 🔴 needs first-party data |
| 2. Semantic Depth & Topical Completeness | 2/10 | 7/10 | 🟡 |
| 3. E-E-A-T Signals | 3/10 | 5/10 | 🔴 needs real reviews & company details |
| 4. Structure, Readability & Time-to-Value | 5/10 | 8/10 | 🟢 |
| 5. Technical On-Page SEO | 4/10 | 8/10 | 🟢 |
| 6. Engagement, Distribution & Discoverability | 5/10 | 6/10 | 🟡 needs real photography |
| 7. Conversion & Business Impact | 6/10 | 7/10 | 🟡 |
| **Total** | **27/70** | **46/70** | |

The "after" scores are a re-read of the rebuilt page, not a ranking prediction.

## Detailed findings

**1. Information gain.** *Before:* one sentence ("Inspired alternative fragrances in rich, long-lasting concentrations") and nothing a shopper couldn't get on any competitor. *Now:* the page explains the two strengths in the range, maps each scent to a family and occasion, and gives price-per-ml advice. In this range, 100ml costs roughly a third less per ml than 30ml (Oud Royale: R11.63/ml at 30ml vs R7.99/ml at 100ml). *Still missing:* anything only Zen Amour can say, such as measured oil % per fragrance and a wear test in SA conditions.

**2. Semantic depth.** *Before:* product names only. *Now covered:* extrait de parfum, eau de parfum, fragrance oil, scent families (amber/oud, musk, white floral, fresh woody), notes, sizes, Pargo pickup, returns, the non-affiliation statement. *Gaps vs competitors:* the oil-concentration figure, oil origin, named inspirations, men's/women's/unisex.

**3. E-E-A-T.** *Problems:* no disclosure about the inspired-by model. The product copy had unverifiable performance claims ("lingers for 10+ hours", "72-hour hydration", "without compromising on longevity"). Reviews are demo data. No company details. *Fixed:* added a plain "not affiliated" statement and removed the three unverified claims. *Still needed:* real reviews, registered company number and address, and a short founder/perfumer story.

**4. Structure.** *Problems:* H1 went straight to H3. The filter labels ("Category", "Price", "Availability") were H3 headings, and they appeared twice because the desktop and mobile filters both render. *Fixed:* the filter labels are no longer headings. There's now a hidden "All fragrances" H2 above the grid, then a guide with descriptive H2s and FAQ H3s below the products. The grid stays above the fold.

**5. Technical.** *Problems:* the title had no keyword, the address used a query string, there was no structured data, and filtered/sorted views could be indexed. *Fixed:* see Quick wins below.

**6. Engagement.** *Problems:* the social share card was the generic site card, and product art is SVG (social networks and image search can't use it). *Fixed:* category-specific Open Graph title/description, with the site card as the image. *Still needed:* real JPG/PNG photography.

**7. Conversion.** *Problems:* no trust cues near the grid. *Fixed:* a delivery/payment strip under the intro (Pargo, free-delivery threshold, Yoco/Payfast). *Still needed:* an entry-level size or discovery set. Competitors start at R220–R249, Zen Amour at R299.

## Semantic gap analysis (what to add next)

1. **Named inspiration per scent.** Every competitor uses it, and it matches the search demand. A field for it now exists (see Strategic #1), but it needs a legal decision first.
2. **Oil concentration %.** Perfume Emporium quotes 30%. Add a real figure per fragrance once confirmed with the blender.
3. **Oil origin.** Scentimental leads with "French fragrance oils". Say where Zen Amour's oils come from, if that's a selling point.
4. **Third-party reviews.** Hellopeter / Trustpilot / Google ratings appear in competitors' trust copy.
5. **Gender & occasion collections.** Perfumology has men's and women's collections, and searches like "inspired perfume for men South Africa" are a separate demand.
6. **Entry price & bundles.** 15ml / 2-for-1 offers lower the risk of trying an unknown brand.

## Top 5 quick wins (all done in code)

1. **Title** changed from `Fragrances — Shop | Zen Amour` (29 chars) to `Inspired Perfumes South Africa | Zen Amour Fragrances` (53 chars).
2. **Web address** changed from `/shop?category=fragrances` to `/shop/fragrances`, with a permanent 308 redirect from every old link. Same for skincare and wellness.
3. **H1** changed from `Fragrances` to `Inspired Fragrances`. The menu still says "Fragrances".
4. **Below-the-grid guide:** ~550 words covering how inspired fragrances work, extrait vs EDP, scent families, which size to buy, 5 FAQs and related links. Skincare and wellness got their own versions.
5. **Structured data & indexing:** CollectionPage + ItemList, BreadcrumbList and FAQPage. Filtered, sorted and search views are set to `noindex, follow` and keep the clean canonical. Filter links are `nofollow`.

## Top 5 strategic improvements (need you)

1. **Decide on "Inspired by" names with an IP lawyer.** SA sellers name designer references, but EU courts have ruled against it, and there's no clear SA ruling. If approved, fill **Inspired by** on each product in Admin → Inventory. It's added to the title and details table with an automatic "not affiliated" note.
2. **Publish real numbers.** Get the oil % for each fragrance from your blender. Run a simple wear test (for example 5 people per scent, hours until faint, Durban vs Johannesburg) and publish it on the category page and a journal post. No competitor has this, and it's the strongest information-gain move available.
3. **Replace demo reviews with real ones** (`npm run db:clear-demo`), then collect Hellopeter and Google Business Profile reviews and link them.
4. **Add For Him / For Her / Unisex collections** as their own pages with intro copy. Each targets a separate search.
5. **Launch a discovery set or 10ml travel size, and shoot real product photos** (JPG, at least 1200px). This covers entry price, image search and social sharing in one go.

## Rewritten elements

| Element | Before | After |
|---|---|---|
| Title | Fragrances — Shop \| Zen Amour (29) | Inspired Perfumes South Africa \| Zen Amour Fragrances (53) |
| Meta description | Inspired alternative fragrances in rich, long-lasting concentrations. (72) | Extrait and eau de parfum blends inspired by the world's most-loved scents. 30ml to 100ml, with Pargo pickup or courier delivery nationwide. (140) |
| H1 | Fragrances | Inspired Fragrances |
| Intro | Inspired alternative fragrances in rich, long-lasting concentrations. | Extrait and eau de parfum blends inspired by the scents people stop you to ask about, in 30ml, 50ml and 100ml. |

All copy can be edited in **Admin → Inventory → Category pages**.

---

## Homepage (`/`)

| | Before | After |
|---|---|---|
| Title | Zen Amour — Affordable Luxury Fragrance, Skincare & Wellness (60) | Inspired Perfumes & Skincare in South Africa \| Zen Amour (56) |
| Meta | Affordable luxury fragrances, skincare and wellness, crafted for South Africa. (78) | Inspired perfumes, results-driven skincare and wellness rituals at an everyday price. Pargo pickup or courier delivery across South Africa. (139) |
| H1 | Quiet Luxury Meets Everyday Price | Inspired perfumes, skincare & wellness · South Africa — Quiet Luxury Meets Everyday Price (same design; the badge line is now part of the H1) |
| Canonical | missing | `/` |

## Product pages (`/product/…`)

| | Before | After |
|---|---|---|
| Title (Amber Saffron Extrait) | Amber Saffron Extrait — Fragrances \| Zen Amour | Amber Saffron Extrait — Amber Woody Perfume \| Zen Amour |
| Meta | Our most-requested signature (28) | Amber Saffron Extrait: our most-requested signature. Notes of saffron, jasmine, amberwood. 30ml, 50ml & 100ml from R399.00. Delivered across South Africa. (154) |
| Structured data | Product with one AggregateOffer | Product with an Offer per size, shipping details, a 14-day return policy, reviews and scent properties, plus BreadcrumbList |
| On page | Scent pyramid only | Adds a Details table (concentration, scent family/type, sizes, optional "inspired by" + disclaimer) |
| Social image | none | site card (until real photos replace the SVG art) |

Titles and descriptions are generated automatically. Override any of them in the product editor (new "Search engine listing" section).

## Journal posts

Posts now carry a byline, `dateModified` and an author in their structured data. At ~200–260 words they're too thin to rank. Use the `write-content` skill to expand them, and `topic-cluster-planning` (seed: "inspired perfume") to plan a cluster that links into `/shop/fragrances`.

## Sources

- Competitor and market research: [Scentimental](https://www.scentimental.co.za/), [Scentimental – what is inspired-by](https://www.scentimental.co.za/pages/what-is-inspired-by), [Scentimental on Trustpilot](https://www.trustpilot.com/review/scentimental.co.za?page=2), [Perfume Emporium](https://www.perfumeemporium.co.za/), [Perfumology](https://perfumology.co.za/), [Perfumology men's collection](https://perfumology.co.za/collections/mens-collection), [Holistic Emporium – are inspired perfumes good?](https://holisticemporium.co.za/2025/05/09/are-inspired-perfumes-good-the-truth-behind-affordable-luxury/)
- Legal context ("inspired by" naming): [Global Law Experts](https://globallawexperts.com/%F0%9F%92%A1-why-trademark-protection-matters-in-the-fragrance-industry-the-truth-behind-inspired-by-perfumes/), [ICTRecht – "inspired by" infringement (Benelux)](https://www.ictrechtswijzer.be/en/inspired-by-a-perfume-brand-infringement/), [Oura – inspired perfume explained](https://ouraonline.co.za/journal/inspired-perfume-explained/)
