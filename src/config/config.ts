/**
 * Centralized configuration for the entire application. No other file
 * should contain a literal timeout, retry count, currency code, delay
 * range, or Excel style constant — everything tunable lives here.
 */

const config = {
  app: {
    name: 'Hostelworld Data Scraper',
    scraperVersion: '1.0.0',
  },

  scraper: {
    browserLaunchTimeoutMs: 30_000,
    pageNavigationTimeoutMs: 30_000,
    listingsLoadTimeoutMs: 20_000,
    selectorTimeoutMs: 10_000,

    retryCount: 2,
    retryBackoffMs: [1_000, 3_000],

    randomDelayRangeMs: { min: 250, max: 900 },

    scroll: {
      maxScrollAttempts: 40,
      scrollStepPx: 1200,
      stableRoundsBeforeStop: 3,
      pauseBetweenScrollsMs: { min: 300, max: 700 },
    },

    browser: {
      headless: true,
      /**
       * 'chrome' uses the system-installed Google Chrome instead of
       * downloading Playwright's own bundled Chromium. Set to null to
       * use Playwright's managed browser instead (the default
       * behavior) — useful if a machine's security software or network
       * makes downloading Playwright's own browser unreliable, since
       * system Chrome is already signed/trusted by the OS.
       */
      channel: 'chrome' as string | null,
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      locale: 'en-CA',
    },

    baseUrl: 'https://www.hostelworld.com',

    /**
     * Hostelworld's real listings-search endpoint, confirmed by watching
     * the address bar after searching with real dates (Aug 2026):
     *   /pwa/s?q=...&country=...&city=...&type=city&id={hostelworldId}
     *     &from=YYYY-MM-DD&to=YYYY-MM-DD&guests=1&page=N
     * Only usable for cities verified via real autocomplete (numeric
     * hostelworldId). Manually-added (PENDING-) cities fall back to the
     * constructed destinationUrl from Milestone 3 instead — see
     * listingUrlBuilder.ts.
     */
    search: {
      path: '/pwa/s',
      defaultGuests: 1,
    },

    /** Safety cap on pagination — real cities max out around 4-5 pages, this just prevents a runaway loop if page-detection logic is ever wrong. */
    maxPaginationPages: 25,

    /**
     * Whether exact per-hostel pricing (visiting each qualifying
     * hostel's own page — one extra page load per hostel, meaningfully
     * slower) is offered as a user-facing choice at all. This is now a
     * PER-REPORT toggle the user picks in the UI ("Detailed Mode"), not
     * a fixed server default — see types/api.ts GenerateReportRequest
     * and DetailedModeToggle.tsx. This flag is a server-side kill
     * switch: set to false to hard-disable the option everywhere
     * (client and server both), e.g. if even the 5-city cap below turns
     * out to be too much for a given deployment's constraints.
     */
    allowDetailedMode: process.env.ALLOW_DETAILED_MODE !== 'false',

    /**
     * City limits differ by mode because their per-city cost differs
     * enormously. Detailed mode's real measured runtime (~7 min/city
     * worst case) means even 5 cities can approach Vercel's most
     * generous function duration ceiling (800s, Pro + Fluid Compute) —
     * this cap exists specifically so a standard Vercel deployment
     * still completes. Fast mode's per-city cost is low enough that 15
     * cities comfortably fits. Enforced both client-side (immediate
     * feedback) and server-side (the only enforcement that actually
     * matters — see validation/schemas.ts).
     */
    maxCitiesFastMode: 15,
    maxCitiesDetailedMode: 5,

    /**
     * When true, dumps raw card text (every page scraped) and
     * screenshots/HTML (whenever a page has 0 cards) to /tmp for
     * debugging. Extremely useful during development (this is exactly
     * how the Featured-vs-main-list duplicate bug was diagnosed and
     * fixed, Aug 2026) but pure overhead in normal operation — off by
     * default, flip to true when actively investigating an extraction
     * issue.
     */
    verboseScraperDiagnostics: false,

    /**
     * Hostelworld's live destination-suggest endpoint, confirmed by
     * inspecting the real request their own frontend makes (Network tab,
     * Aug 2026). Fronted by Apigee — requires the `api-key` header, which
     * is supplied via the HOSTELWORLD_AUTOCOMPLETE_API_KEY env var, never
     * hardcoded here. This key ships in Hostelworld's own public frontend
     * bundle (visible to any visitor's browser), but it's still handled
     * as an env-configured value rather than a literal, since (a) that's
     * correct practice regardless of sensitivity, and (b) it can rotate.
     */
    autocomplete: {
      baseUrl: 'https://prod.apigee.hostelworld.com',
      path: '/autocomplete-service/v1/autocomplete/web/',
      variant: 'control',
    },
  },

  // Currency config removed — currency is now fully dynamic, selected
  // per-request via the CurrencySelector UI and threaded through the
  // whole pipeline (see lib/utils/currencies.ts for the supported
  // list). Nothing here defaults it anymore.

  searchDates: {
    checkInDayOfWeek: 2, // Tuesday (0 = Sunday)
    checkOutDayOfWeek: 4, // Thursday
    stayLengthNights: 2,
  },

  filters: {
    minAllowedRating: 0,
    maxAllowedRating: 10,
  },

  statistics: {
    /** "Main Hostels" = top N by review count, ignoring price/rating when selecting. */
    mainHostelsCount: 3,

    /**
     * "Cheap Hostels" = the N least expensive qualifying hostels, but
     * only among hostels clearing a quality floor first. A hostel
     * qualifies if it meets EITHER threshold (OR logic, not AND) — a
     * product decision to keep the quality bar permissive rather than
     * strict, so e.g. a highly-rated hostel with modest review count
     * still qualifies.
     */
    cheapHostels: {
      count: 5,
      minReviews: 50,
      minRating: 7.0,
    },
  },

  excel: {
    fileNamePrefix: 'Hostelworld_Report',
    sheets: {
      summary: 'Summary',
      rawData: 'Raw Data',
      reportInfo: 'Report Information',
    },
    style: {
      headerFillColor: 'FF1C3CB0',
      headerFontColor: 'FFFFFFFF',
      sectionTitleFillColor: 'FFEEF4FF',
      fontFamily: 'Calibri',
      headerFontSize: 11,
      bodyFontSize: 10,
      // priceNumberFormat removed — built dynamically per selected
      // currency now (see lib/excel/formatting.ts buildPriceNumberFormat).
      ratingNumberFormat: '0.0',
      columnPaddingChars: 2,
    },
  },

  logging: {
    level: (process.env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
  },

  performance: {
    parallelScraping: false,
    maxConcurrentCities: 1,
  },
} as const;

export default config;
