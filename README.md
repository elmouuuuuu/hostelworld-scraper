# Hostelworld Data Scraper

A stateless, real-time Hostelworld.com scraper that generates a professional Excel report of hostel pricing and rating statistics across one or more cities. No database — each search is independent, and scraped data is discarded once the report is downloaded.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS
- **Backend:** Next.js API Routes
- **Scraping:** Playwright (Chromium)
- **Excel generation:** ExcelJS
- **Validation:** Zod

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in HOSTELWORLD_AUTOCOMPLETE_API_KEY
npm run dev
```

Open http://localhost:3000.

### Running the test suite

```bash
npm test
```

Runs the automated test suite (Vitest) covering every pure/deterministic function in the codebase — statistics calculations, card-text extraction, date logic, and the Excel injection sanitizer. No browser, no network, no live site required — these run in milliseconds.

## Deploying to Vercel

**1. Push this project to a GitHub (or GitLab/Bitbucket) repo.** Vercel deploys from a connected git repo — go to [vercel.com](https://vercel.com), "Add New Project", and import the repo.

**2. Set environment variables** in the Vercel project's Settings → Environment Variables (these are never read from `.env.local` in production — that file only exists locally):
- `HOSTELWORLD_AUTOCOMPLETE_API_KEY` — required, same value as local
- `LOG_LEVEL` — optional, defaults to `info`
- `ALLOW_DETAILED_MODE` — optional, defaults to `true`. Exact per-hostel pricing ("Detailed Mode") is now a **per-request toggle the user picks in the UI**, capped server-side to a maximum of 5 cities per report regardless of what the client sends (see `validation/schemas.ts`) — real measured runtime with it on (~7 min/city worst case) means even 5 cities can approach Vercel's most generous duration ceiling. This variable is a deployment-wide kill switch on top of that cap, not the main control — set to `false` only if the 5-city cap still isn't enough headroom for your specific hosting limits.

**3. Enable Fluid Compute** (Vercel project Settings → Functions) if you're on the Hobby (free) plan. Even with Detailed Mode off (the default), a multi-city report (up to 15 cities in fast mode) can take a few minutes — Hobby's default function timeout is only 10-60s without Fluid Compute, but goes up to 300s with it enabled. This project's API route already requests `maxDuration = 300` to use that full ceiling.

**4. Deploy.** Vercel auto-detects Next.js — no build config changes needed.

**5. Test the one thing that couldn't be verified from this sandbox**: generate a real report on the live deployment and confirm the `@sparticuz/chromium` serverless browser launch actually works (see `browserManager.ts` — this path was built but never tested against a real Vercel deployment). Watch Vercel's function logs (Vercel dashboard → your project → Logs) for `Serverless environment detected — launching @sparticuz/chromium.` — if that line appears and a report actually completes, this is confirmed working end to end.

**Known real limit, even with Detailed Mode off**: a report with many cities can still add up. If you hit timeouts with a large city count even in fast mode, that's the signal to revisit Option 2 (background jobs) or Option 3 (a non-serverless host) discussed earlier — fast mode buys real headroom, not infinite headroom.

### Using the app

Open http://localhost:3000 and use it as intended: search for cities (real autocomplete), set a minimum rating, optionally enable Raw Data Mode and/or Detailed Mode (capped to 5 cities when on), and click **Generate Excel Report**. Watch the progress panel for live status, and the terminal running `npm run dev` for detailed step-by-step logs (more informative than the UI if something goes wrong).

A multi-city report can take several minutes — this is expected, since each qualifying hostel gets its own page visit for exact pricing (see Milestone 4/7 notes below).

### Getting the autocomplete API key

Hostelworld's destination search calls a real (undocumented) endpoint that requires an `api-key` header. To get it yourself:
1. Open hostelworld.com in your browser, open DevTools → Network tab → filter to Fetch/XHR
2. Type a city into their search box
3. Click the `autocomplete` request → Headers → Request Headers → copy the `api-key` value
4. Paste it into `.env.local` as `HOSTELWORLD_AUTOCOMPLETE_API_KEY=...`

If this key is missing or wrong, autocomplete degrades gracefully — the search box logs the error server-side (visible in your `npm run dev` terminal) and falls back to manual city entry rather than breaking.

## Project Structure

```
src/
├── app/            # Next.js App Router: pages + API routes (thin, no business logic)
├── components/     # Presentational React components only
├── lib/
│   ├── scraper/    # Playwright logic + the real Hostelworld suggest-API provider
│   ├── statistics/ # Pure functions: averages, medians, Main Hostels (Milestone 5)
│   ├── excel/      # Full ExcelJS workbook construction (Milestone 6)
│   ├── mock/       # MOCK ONLY — deleted once Milestones 4-7 land
│   └── utils/      # Logger, date/country/city-identity helpers
├── types/          # Shared TypeScript interfaces (City, Hostel, Report, API contracts)
├── config/         # Single source of truth for all tunable values
└── validation/     # Zod schemas guarding the API boundary
```

**Design principle:** `lib/` contains zero Next.js-specific code. Every scraping, statistics, and Excel function is a plain async TypeScript function that could be imported into a CLI script, a cron job, or a different framework in V2 without modification.

## Current status (Milestone 3)

- **Real, live autocomplete** against Hostelworld's own destination-suggest API (`lib/scraper/hostelworldSuggestProvider.ts`), server-side only — the API key never reaches the browser.
- Only `type: "city"` results are surfaced (the raw API also returns neighborhoods, regions, countries, and individual properties).
- `destinationUrl` is constructed from a verified URL pattern (`/hostels/{continent}/{country}/{city}/`) confirmed against Hostelworld's own homepage links; best-effort for countries outside the built-in continent map (see `lib/utils/countryContinents.ts`) — Milestone 4 is where any wrong URLs get caught and corrected, since the scraper actually loading the page is the real verification step.
- **Manual entry remains as a fallback** if the API returns nothing or errors — city selections carry a `PENDING-` id prefix when unverified, and the mock report simulation now treats *that* (not an arbitrary city-name whitelist) as the signal for the "Error 1 (City not found)" / N/A path.
- "Generate Report" still runs the Milestone 2 mock simulation (`lib/mock/`), producing a real `.xlsx` via a temporary route, `/api/mock-generate-report`. Both are deleted once Milestones 4-7 build the real scraper → statistics → Excel pipeline.

## Current status (Milestone 4) — confirmed working end-to-end

- **Real scraping confirmed working live** across two cities (Barcelona, Tokyo) with correct names, ratings, review counts, property types, and CAD prices — verified field-by-field against manually observed real prices.
- **Currency switching to CAD confirmed working** via repeated live testing — kept non-fatal (logs a warning rather than aborting) as defensive practice in case Hostelworld changes their markup later, not because it's unreliable now.
- **Real, verified card-parsing logic**: built from actual logged `innerText()` output, not guessed — see `lib/scraper/cardExtractor.ts` for the confirmed line-by-line format.
- **Exact room-level pricing and bed counts now confirmed working**: a second-stage scraper (`lib/scraper/propertyPageScraper.ts`) visits each qualifying hostel's own page — the URL already carries the search dates from the listing page, so no date-picker interaction is needed. Validated by cross-checking the computed minimum against the page's own "From CA$X" summary on multiple real properties (exact match). This became the "Detailed Mode" user toggle later on (adds one extra page load per qualifying hostel — meaningfully slower, e.g. ~79 extra requests for Barcelona — see the Deploying to Vercel section above for the 5-city cap this required).
- **Price accuracy investigated and confirmed exact**: a real discrepancy was found and fixed (a discount-badge parsing bug — see below). After that fix, an initial comparison against a manual check still showed a small gap; systematically controlling for confounds one at a time (member/login pricing, guest count, exact date range) resolved it completely — with all three matched, the scraped price was an **exact match** (52.59 = 52.59) against the live site, not just "close."
- **Price discount bug found and fixed**: cards with an active promotion show `-10%` then the crossed-out original price then the final discounted price, all as separate lines (e.g. `Dorms From\n-10%\nCA$62.43\nCA$56`). Initial extraction grabbed the `-10%` line itself as the price (producing implausible values like "10" instead of "56"). Fixed to skip percentage lines and take the last (final, discounted) price in the group — matches the spec's requirement to use the final displayed sale price, never the crossed-out original.
- Two real URL patterns for property links were discovered and both are handled (`/hostels/p/{id}/{slug}/` on static-rendered pages, `/pwa/hosteldetails.php/{slug}/{city}/{id}` on the actual search page the scraper navigates to).
- **Open question, not yet confirmed**: capsule-hotel detection (`Capsule Hotel` type label) hasn't been observed in real data yet — every tested result so far has been type `hostel`. Worth verifying against a city known for capsule hotels before fully trusting that classification path.
- **Known minor gap**: "Featured Properties" cards (a small promoted subset shown at the top of each city's results) use a simpler format lacking a review count, so they're currently dropped rather than parsed — acceptable since they're typically duplicated in the main list below.
- **Resolved**: `cheapestRoomBeds` and `cheapestRoomType` now hold real, exact values (e.g. "Basic 8 Bed Mixed Dorm Ensuite", 8 beds) via the precise room-data feature above, when Detailed Mode is on. If off (the default), falls back to the coarser listing-page category (Private Room / Dorm Room, beds `null`).
- The dev-test route now accepts any city: `/api/dev-test-scrape?city=Tokyo`, resolved via the real autocomplete provider.

## Current status (Milestone 5) — statistics engine complete

- **Pure, fully unit-testable statistics** (`lib/statistics/`) — no I/O, no framework dependency, just `HostelRecord[]` in, computed stats out.
- **Overall city stats**: average price, median price, average rating — every field independently N/A-safe (via `StatValue`) if a city has zero qualifying hostels.
- **Main Hostels**: top 3 by review count (configurable via `config.statistics.mainHostelsCount`), ignoring price/rating when selecting — price stats computed only from those 3.
- **Cheap Hostels** (new, beyond the original spec): the 5 least expensive qualifying hostels, restricted to hostels meeting a quality floor first — a hostel qualifies if it meets EITHER the minimum review count OR the minimum rating (OR logic, configurable via `config.statistics.cheapHostels`), so the ranking doesn't surface obscure, barely-reviewed hostels purely because they're cheap.
- Sanity-checked against hand-computed values (median for odd/even counts, empty-array N/A handling, OR-filter eligibility) before shipping — see conversation history for the verification.
- `dev-test-scrape` now returns real computed statistics alongside the raw hostel data, so results can be checked against actual scraped cities immediately.

## Current status (Milestone 6) — real Excel generation complete

- **`lib/excel/`** fully built: `workbookBuilder.ts` (orchestrator), `summarySheet.ts`, `pureDataSheet.ts`, `reportInfoSheet.ts`, `formatting.ts` (shared styling helpers).
- **Summary sheet**: merged super-header row grouping "Overall" / "Main Hostels" / "Cheap Hostels" columns visually, frozen header rows, bold/centered headers, real Excel filters (`autoFilter`), auto-sized columns, currency/rating number formats.
- **Failed cities get a row too**, not silently dropped — Status column shows "OK" or the specific error label (e.g. "Error 1 (City not found)"), every stat column shows literal `"N/A"` text (never zero, never blank).
- **Pure Data sheet** — one row per qualifying hostel across all cities, only generated when Pure Data Mode is on.
- **Report Information sheet** — generation timestamp, search dates/currency, filters used, counts, scraper version, execution time.
- Uses the `config.excel.style` values set all the way back in Milestone 1, unchanged since.
- **Design choice**: uses manual row styling + `worksheet.autoFilter` rather than ExcelJS's `addTable()` API — a deliberate risk tradeoff, since `addTable()` couldn't be tested locally and a runtime error there would be hard to debug without live iteration.
- New dev-only route `/api/dev-test-excel?city=Tokyo` scrapes a real city plus a deliberately-fake one (to exercise the failed-city row), and returns an actual downloadable `.xlsx` — opening the real file is the best way to verify formatting.

## Current status (Milestone 7) — fully wired end to end

The app is now the real thing, no mocks anywhere:

- **`POST /api/generate-report`** — real implementation: validates the request, runs the actual scraper → statistics → Excel pipeline, and **streams live progress** back to the browser as newline-delimited JSON, ending with the finished workbook (base64-encoded in the final message).
- **Streaming architecture, not polling**: a single continuous streamed HTTP response was used deliberately over a job-store-plus-polling design, since polling would need server-side state shared across separate requests — which doesn't reliably work on stateless serverless deployments (a follow-up request can land on a different function instance with no memory of the first one). One continuous response sidesteps that entirely and works the same locally and on Vercel.
- **`useReportGeneration` hook rewritten** to consume the real stream instead of simulating one — but its *public interface* is unchanged from the Milestone 2 mock version, which is why **`page.tsx` required zero changes** for this milestone. That was the payoff of designing the hook's interface implementation-agnostic from the start.
- **All mock code and temporary dev-only diagnostic routes deleted**: `lib/mock/`, `/api/mock-generate-report`, `/api/dev-test-scrape`, `/api/dev-test-property`, `/api/dev-test-excel` are all gone. The only API routes left are the three real ones: `/api/autocomplete`, `/api/generate-report`.
- The homepage's "Generate Excel Report" button now triggers the real pipeline — real scraping (with all of Milestone 4's fixes), real statistics (Milestone 5, including Cheap Hostels), real Excel output (Milestone 6, verified against an actual downloaded file).

**Heads up on real usage**: a multi-city report with precise per-property pricing enabled can take several minutes — this is expected (each qualifying hostel gets its own page visit for exact pricing). The progress panel should show live movement throughout; if it looks frozen for a long stretch, check the terminal running `npm run dev` for detailed step-by-step logs.

## Post-Milestone-7 customizations

Requested after the core build was complete and working:

- **Manual date selection** — an Auto/Manual toggle next to "Stay dates". Auto keeps the original next-month-Tuesday-Thursday default; Manual lets the user pick any check-in/check-out pair (not constrained to 2 nights — that constraint was specific to the auto default). Validated both client-side (checkout after checkin) and server-side (Zod schema).
- **"Pure Data Mode" renamed to "Raw Data Mode"** throughout — UI label, Excel sheet tab name, Report Information field, and every internal identifier (`pureDataMode` → `rawDataMode`) for consistency between what's displayed and what's in the code.
- **Raw Data sheet now includes two extra sections** (moved here from Summary, per feedback): below the main per-hostel table, "Main Hostels — Selected Properties" and "Cheap Hostels — Selected Properties" list the actual individual hostels behind those aggregate stats, grouped by city. The Summary sheet stays a single, focused per-city table.
- **Homepage eyebrow text** changed from "Data report generator" to "Trust me bro".
- **Splash screen** — a brief branded intro shown once before the main app appears, auto-dismissing after ~3 seconds (or on click/tap to skip). "Trust me bro" on one line (reverted from an earlier two-line "Trust me" / "tbro" split, per feedback), on the left; logo image (bigger) on the right.
- **Approximate time estimate** — shown next to the Generate button once at least one city is selected, e.g. "Estimated time: ~4-14 min (2 cities)". Based on real observed timing (Barcelona took ~6.5 min for 78 hostels with precise per-property pricing on) rather than a guess — presented as a range since actual time depends heavily on how many hostels each city turns out to have, which isn't known until the scrape runs.
- **Progress now moves at real per-hostel granularity, not just per-city** (replaced an earlier time-based live countdown, which was removed in favor of this — tying progress to actual completed work is more honest than a time guess). `scrapeCity` reports a 0-1 fraction of its own progress via a new callback, threaded through the precise-room-data enrichment step so the percentage advances after *every individual hostel* finishes its exact-price lookup — previously the only granular events were server-side console logs, invisible to the UI, which just jumped city-to-city. New `city_progress` event type added to the stream protocol. Verified the underlying math stays monotonically increasing (never jumps backward) via a numeric simulation across several city-size scenarios before shipping.
- **Cancel button** — added to the progress panel while a report is running. This is real cancellation, not just a UI trick: clicking it aborts the browser's fetch, which propagates to the server via the request's `AbortSignal` (`request.signal` in the route handler), threaded all the way down into the scraper and checked between cities, between listing pages, and between individual hostels — so the actual Playwright browser stops and closes rather than continuing to scrape in the background after the client stopped listening. A cancelled run never reaches the workbook-building step and is never recorded as a "failed" city (`ScrapeCancelledError` is kept distinct from real failures, so it's never retried and never logged as a scrape error). **One piece of this genuinely couldn't be verified from this environment**: whether `request.signal` reliably fires server-side when a Next.js dev server's client aborts mid-stream. It's a standard, well-documented pattern (the same technique AI chat "Stop generating" buttons use), but worth confirming live — check the terminal for a log line like `Scrape run cancelled by client` after clicking Cancel; if that line doesn't appear, the server-side plumbing needs a second look even though the client-side UI will still look like it worked.

## Current status (Milestone 8) — hardening complete

- **Real bug fixed, found via a user report**: hostels appearing in Hostelworld's "Featured Properties" section (a simpler card format, no review count) were silently disappearing from results entirely — not just missing the Main Hostels cutoff. Root cause: our dedup logic kept whichever duplicate card was encountered first in DOM order (the sparse Featured version), discarding the fuller main-list duplicate that appeared right after it. Fixed by scoring card completeness and always keeping the fuller version, regardless of encounter order. Verified via a Python simulation replicating the exact scenario before shipping.
- **Vercel/serverless compatibility fixed**: the scraper previously launched via `channel: 'chrome'` (your local system Chrome), which doesn't exist on Vercel's serverless functions. Swapped `playwright` → `playwright-core` + `@sparticuz/chromium` (the standard serverless-Chromium package), with environment-aware branching in `browserManager.ts` (system Chrome locally, sparticuz Chromium in production). Bonus: this also eliminates the entire Chromium-download saga from Milestone 4 (Gatekeeper quarantine, corrupted downloads) — `npx playwright install` is no longer needed at all, locally or in production. **Unverified**: this hasn't been tested against a live Vercel deployment; Playwright doesn't publish an official version-compatibility matrix with `@sparticuz/chromium` the way Puppeteer does, so a version mismatch is the first thing to check if the serverless path fails.
- **Excel formula injection guarded**: any string written into a cell that starts with `=`, `+`, `-`, `@`, or a leading tab/carriage return is now prefixed with a single quote (standard native Excel behavior forcing text interpretation), applied to every externally-sourced string — hostel names, city/country names, room types, URLs.
- **Debug diagnostics gated behind `config.scraper.verboseScraperDiagnostics`** (default off) — the raw-card-text and zero-cards screenshot/HTML dumps from Milestone 4 troubleshooting no longer write to `/tmp` on every production run.
- **React error boundary added** (`src/app/error.tsx`, Next.js's built-in convention) — a component throwing now shows a recoverable error state instead of a blank white screen.
- **Real automated test suite added** (Vitest) covering every pure/deterministic function in the codebase: statistics (average/median, Main Hostels, Cheap Hostels including the OR-eligibility logic), card text extraction (using the *exact* real text captured live during development, including regression tests for both bugs found and fixed during this build), the completeness-scoring dedup fix, auto-computed search dates, and the Excel injection sanitizer. Run via `npm test`. This is the one part of the whole build verified through actual test execution logic (replicated in Python and run, matching the real TypeScript implementation) rather than manual live testing — everything else in this project needed your hands-on verification since this sandbox has no live network access.

## Post-Milestone-8 customizations

- **Detailed Mode toggle** — exact per-hostel pricing (real room names, exact prices, bed counts) is now a per-request choice the user makes in the UI, not a fixed server default. Capped to a maximum of 5 cities per report when enabled (vs. 15 in the default fast mode) — enforced both client-side (can't add a 6th city while the toggle is on, clear warning shown if switching modes leaves an existing selection over the new cap) and server-side (the enforcement that actually matters — `validation/schemas.ts` rejects any request over the cap regardless of what the client sends). A deployment-wide kill switch (`ALLOW_DETAILED_MODE` env var) can disable the option entirely if even 5 cities proves too much for a given deployment's time limits.

- **Currency selector** — a new type-to-filter dropdown (`CurrencySelector.tsx`, same interaction pattern as city search: type, see matches, arrow keys + Enter to select) replaces the previous hardcoded CAD-only behavior. Threaded genuinely end-to-end, not just cosmetic: request validation (`SUPPORTED_CURRENCIES` in `lib/utils/currencies.ts`), the scraper's currency switcher (generalized from CAD-only to any code), and Excel price formatting (now built dynamically from the selected currency's symbol instead of a fixed `"CA$"` format). **Honest caveat**: only CAD's exact selection has been confirmed via live testing against the real site; other currencies reuse the same confirmed UI pattern (filtering Hostelworld's dropdown by a `(CODE)` text match) but that's an assumption, not a verified fact, for every other currency. The currency list itself is a standard set of major world currencies — no definitive list of exactly which ones Hostelworld supports was available, so this should be checked against the real dropdown too.
- **App-based (native mobile app) scraper — discussed, not built.** A real native-app scraper would need fundamentally different tooling (Appium instead of Playwright), much heavier infrastructure (real emulators/devices, iOS specifically needing macOS-based infra — no serverless equivalent), and likely runs into certificate pinning and device attestation that a website scraper never has to deal with. Meaningfully higher legal/ToS exposure too. If "the app" instead means Hostelworld's *mobile web* experience (still just HTML), that's a much smaller, tractable addition — worth clarifying which was actually meant before any of this gets built.

## Roadmap (V2, out of scope for this build)

- SQL database + persisted history
- User accounts
- Scheduled/recurring monitoring
- Charts in the report
- REST API for third-party consumption
- Mobile app scraper variant
- CSV/PDF export formats
- Parallel city scraping (toggleable via `config.performance.parallelScraping`)

## Milestones

- [x] Milestone 1 — Project structure & dependencies
- [x] Milestone 2 — Frontend UI (mock data)
- [x] Milestone 3 — City autocomplete
- [x] Milestone 4 — Playwright scraper
- [x] Milestone 5 — Statistics engine
- [x] Milestone 6 — Excel workbook generation
- [x] Milestone 7 — End-to-end integration
- [x] Milestone 8 — Testing, optimization, hardening
