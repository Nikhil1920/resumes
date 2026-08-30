# Search strategy for Resume Maker 9000

Last updated: August 31, 2026

## The decision

The first search target is the long-tail PDF resume-maker cluster. The homepage is the single commercial landing page. One web-only guide supports the instructional intent. Broader phrases such as `pdf resume` wait until the long-tail group has repeatable traffic and rankings.

This avoids splitting nearly identical terms across thin pages. Google recommends useful pages built for people, not a separate page for every query variation. See [Google's guidance for AI search experiences](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## What the Search Console export says

The export covers May 15, 2025 through August 28, 2026.

| Metric | Result |
| --- | ---: |
| Total clicks | 26 |
| Total impressions | 3,086 |
| CTR | 0.84% |
| Weighted average position | 73.79 |
| Latest 90-day clicks | 7 |
| Latest 90-day impressions | 321 |
| Latest 90-day CTR | 2.18% |
| Latest 90-day weighted position | 36.08 |

The visible query table contains 2,737 impressions and 6 clicks. Search Console omits some query text for privacy, so the table does not reconcile to the property total. Its impressions are property visibility, not market-wide keyword search volume.

Long-tail queries are already the better group:

| Query length | Clicks | Impressions | CTR | Weighted position |
| --- | ---: | ---: | ---: | ---: |
| Three words or fewer | 0 | 1,668 | 0% | 87.26 |
| Four words or more | 6 | 1,069 | 0.56% | 70.99 |
| Five words or more | 6 | 884 | 0.68% | 69.73 |

Every click with visible query text came from a query of at least four words. The main opportunities are:

| Query | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| `online resume maker free pdf` | 5 | 755 | 0.66% | 70.20 |
| `free pdf resume builder` | 0 | 69 | 0% | 89.36 |
| `resume builder online no sign up export pdf` | 0 | 66 | 0% | 73.67 |
| `resume builder free pdf` | 0 | 39 | 0% | 90.79 |
| `create resume online free pdf` | 0 | 19 | 0% | 78.21 |
| `online resume maker pdf` | 0 | 14 | 0% | 43.79 |

The short query `pdf resume` has 1,326 impressions, no clicks, and position 91.87. It is a later target.

## Fix the page mismatch first

The homepage received 25 clicks from 1,458 impressions at position 54.13. The old `/create-resume` URL received no clicks from 1,626 impressions at position 91.33. Non-home application URLs together received one click from 1,669 impressions.

The page rows sum to 3,127 impressions, which is 41 more than the property total. Use the page comparison as a directional mismatch signal rather than an additive traffic total.

The site now uses this indexable set:

| URL | Search role | Indexing |
| --- | --- | --- |
| `/` | Commercial page for the online resume maker and no-sign-up PDF workflow | Index |
| `/guides/make-resume-pdf-online/` | Instructional support for the how-to, create, save, and export-PDF variants | Index |
| `/resume/*` | Local workspace and preview | Noindex |
| `/create-resume/*` | Legacy editor handoff | Noindex |
| `/templates/tenali*` | Legacy preview handoff | Noindex |
| `/create-resume` and `/profiles` | Obsolete acquisition URLs | Redirect to `/` |

Only the homepage and PDF guide belong in the sitemap. Google recommends listing the canonical URLs that should appear in search results. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Positioning and claim limits

The defensible positioning is a local-first, no-account resume builder with ten templates, browser print or save-to-PDF, native PDF download and share, and JSON backups.

| Wording | Use? | Reason |
| --- | --- | --- |
| Free to use today | Yes | There is no payment or premium flow. Do not promise “free forever.” |
| No sign-up or account | Yes | The product has no authentication flow. |
| Stored locally by default | Yes | Resume drafts use browser local storage. Do not make claims about CDN logs or unrelated hosting data. |
| Save as PDF in the browser | Yes, with the print-dialog explanation | Website Download calls the browser print command. |
| Direct PDF download and share | Native apps only | Android and iOS use the native bridge. |
| Ten customizable templates | Yes | The current catalog has ten templates. |
| JSON backup and restore | Yes | Import and export use the app's versioned JSON format. |
| ATS-friendly, ATS-tested, or ATS score | No | The product has no ATS parser, test, or score. |
| Edit or import an existing PDF | No | The importer accepts resume JSON, not PDF or DOCX. |
| Hosted public resume or cloud sync | No | Resume data stays local by default. A copied preview URL does not carry the data. |
| Best, industry-leading, unlimited, or under five minutes | No | There is no evidence for these claims. |

## The first 90 days

### Release and indexing, days 0 to 14

1. Deploy the current React build. The August 30 live site still serves the previous application, so the export measures a different build.
2. Use `pnpm build:web` and deploy `build/web/client`. Exact static files must take priority over the SPA fallback.
3. Confirm that `/create-resume` and `/profiles` return permanent redirects at the edge. The generated `_redirects` file covers Cloudflare Pages. Verify the production response after deployment.
4. Submit `https://resumes.byanr.com/sitemap.xml` in Search Console.
5. Inspect the homepage and guide with Search Console's URL Inspection tool. Confirm the rendered H1, canonical, description, and crawlable guide link.
6. Request indexing once for each public URL. Do not repeatedly request it.

The web build prerenders the homepage and writes the guide as static HTML. This avoids making crawlers wait for the app shell. Google can render JavaScript, but it documents extra limits and failure modes for JavaScript pages. See [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

### Establish the new baseline, days 15 to 42

Use a rolling 28-day comparison against the previous 28 days. Record:

- Homepage clicks, impressions, CTR, and average position.
- Guide clicks, impressions, CTR, and average position.
- Four-word-plus queries containing `resume`, `pdf`, and one of `make`, `maker`, `build`, `builder`, or `create`.
- The exact no-sign-up query group.
- Indexed page count and any duplicate-canonical or soft-404 reports.

Do not compare the new React release directly with the previous deployment's entire 16-month total. Mark the deployment date and treat the next complete 28-day window as the baseline.

### Improve the two pages, days 43 to 90

Use new page-query data before adding pages.

- If the homepage earns impressions but low CTR at positions 5 through 20, test the title and description. Keep the page intent unchanged.
- If the guide reaches the first two result pages, add real interface screenshots and clarify the sections that receive impressions. Do not pad it with generic career advice.
- If Google continues to show `/create-resume/*`, check the production `X-Robots-Tag`, redirects, canonicals, and sitemap. Do not block those URLs in `robots.txt`, because Google must crawl them to read `noindex`.
- If a distinct product-supported intent earns at least 50 impressions in two consecutive 28-day periods, consider one substantial page for it. The next candidates are a real template gallery, multiple local resume versions, A4 versus Letter, and JSON backup and restore.

## When to move to short keywords

Start a page or major section for `pdf resume` only after all of these are true for two consecutive 28-day windows:

1. The four-word-plus PDF resume-maker group receives at least 250 impressions per window.
2. The homepage and guide together receive at least 15 organic clicks per window.
3. At least three tracked long-tail queries have an average position of 20 or better.
4. Neither public page has an indexing, canonical, or mobile usability issue.

These are progression gates, not forecasts. If impressions grow but rankings do not, improve the existing pages and earn relevant references before expanding the keyword set.

## Web and Capacitor boundary

`pnpm build:web` writes the indexable homepage and guide to `build/web/client`. `pnpm build:capacitor` writes the app to `build/capacitor/client`. The native build omits guide HTML, guide CSS, sitemap, robots file, redirect rules, and web-only homepage copy. `pnpm verify:seo` builds both targets and scans the native artifact for web-content markers.

The guide must remain responsive on the mobile website. Search Console's Mobile device category means phone web search, not the installed Capacitor app. Google uses the mobile version of web content for indexing. See [Google's mobile-first indexing guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing).
