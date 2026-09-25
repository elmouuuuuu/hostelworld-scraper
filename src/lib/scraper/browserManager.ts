import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import config from '@/config/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('scraper:browser');

export interface ScraperSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Detects a serverless environment (Vercel or generic AWS Lambda-based
 * platforms). Vercel sets VERCEL=1 automatically; AWS Lambda sets
 * AWS_LAMBDA_FUNCTION_NAME. Local `next dev`/`next start` have neither.
 */
const IS_SERVERLESS = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Launches the actual Chromium browser process.
 *
 * Two paths, chosen automatically:
 * - Local development: launches the system-installed Google Chrome via
 *   Playwright's `channel` option. Deliberately avoids Playwright's own
 *   bundled-browser download entirely — that download mechanism caused
 *   real, repeated problems during development on this project
 *   (Gatekeeper quarantine flags, corrupted downloads, invalid code
 *   signatures). System Chrome is already trusted by the OS.
 * - Serverless (Vercel/Lambda): no system browser exists there at all,
 *   and there's no way to install one at deploy time (no persistent
 *   disk, strict package size limits). @sparticuz/chromium provides a
 *   specially-compressed Chromium build made for exactly this
 *   constraint, launched via an explicit executablePath.
 *
 * UNVERIFIED: the @sparticuz/chromium + playwright-core version pairing
 * here has not been tested against a live Vercel deployment (this
 * project's sandbox has no way to do that). Playwright doesn't publish
 * an official compatibility matrix with this package the way Puppeteer
 * does — if the serverless path fails, checking for a version mismatch
 * between these two packages is the first thing to try.
 */
async function launchBrowser(): Promise<Browser> {
  if (IS_SERVERLESS) {
    logger.info('Serverless environment detected — launching @sparticuz/chromium.');
    const chromiumBinary = (await import('@sparticuz/chromium')).default;

    return chromium.launch({
      args: chromiumBinary.args,
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
      timeout: config.scraper.browserLaunchTimeoutMs,
    });
  }

  logger.info('Local environment detected — launching system Chrome.');
  return chromium.launch({
    headless: config.scraper.browser.headless,
    timeout: config.scraper.browserLaunchTimeoutMs,
    ...(config.scraper.browser.channel ? { channel: config.scraper.browser.channel } : {}),
  });
}

/**
 * Launches a single browser + context + page for a full multi-city
 * scrape run. One session is reused across all cities (not
 * re-launched per city) so the CAD currency setting — which lives in a
 * cookie/localStorage, not the URL — persists across every navigation.
 */
export async function launchScraperSession(): Promise<ScraperSession> {
  logger.info('Launching browser...');

  const browser = await launchBrowser();

  const context = await browser.newContext({
    viewport: config.scraper.browser.viewport,
    userAgent: config.scraper.browser.userAgent,
    locale: config.scraper.browser.locale,
  });

  context.setDefaultNavigationTimeout(config.scraper.pageNavigationTimeoutMs);
  context.setDefaultTimeout(config.scraper.selectorTimeoutMs);

  const page = await context.newPage();

  logger.info('Browser session ready.');
  return { browser, context, page };
}

let sharedBrowserPromise: Promise<Browser> | null = null;

/**
 * Returns a shared, long-lived Browser instance, launching it only once
 * and reusing it across calls — specifically for cheap, frequent
 * operations like autocomplete lookups, where launching a whole new
 * browser process per call (as launchScraperSession does, since a full
 * report-generation run needs its own fresh session) would be far too
 * slow to do on every keystroke.
 *
 * Guards against a launch race: if multiple callers ask for the shared
 * browser concurrently before the first launch finishes, they all
 * await the SAME in-flight promise rather than each triggering a
 * separate browser launch.
 *
 * HONEST CAVEAT: this only helps within a single warm process. Locally
 * (next dev is one long-running Node process) this keeps the browser
 * alive for the whole dev server session. On Vercel, this helps for
 * consecutive requests landing on the same warm serverless instance,
 * but does nothing for a genuine cold start — the first request to a
 * fresh instance still pays the full launch cost. Serverless can't
 * fully eliminate that without an always-on process, which is a bigger
 * change than this.
 */
async function getSharedBrowser(): Promise<Browser> {
  if (!sharedBrowserPromise) {
    sharedBrowserPromise = launchBrowser().catch((error) => {
      // Don't cache a failed launch — the next call should retry fresh.
      sharedBrowserPromise = null;
      throw error;
    });
  }
  return sharedBrowserPromise;
}

/**
 * Opens a lightweight page on the shared browser for a single, quick
 * operation (e.g. one autocomplete lookup): a fresh, isolated
 * BrowserContext per call, so concurrent requests never share cookies
 * or state with each other — but the expensive part, the underlying
 * browser process, stays warm and reused.
 *
 * Caller must close the returned context when done (context.close())
 * — never the shared browser itself, which stays alive for future
 * calls.
 */
export async function openSharedPage(): Promise<{ context: BrowserContext; page: Page }> {
  const browser = await getSharedBrowser();

  const context = await browser.newContext({
    viewport: config.scraper.browser.viewport,
    userAgent: config.scraper.browser.userAgent,
    locale: config.scraper.browser.locale,
  });

  context.setDefaultNavigationTimeout(config.scraper.pageNavigationTimeoutMs);
  context.setDefaultTimeout(config.scraper.selectorTimeoutMs);

  const page = await context.newPage();

  return { context, page };
}

let sharedPagePromise: Promise<Page> | null = null;

/**
 * Returns ONE persistent Page, reused across EVERY autocomplete call —
 * navigation to Hostelworld's domain happens only once, ever, not per
 * request. This goes a step further than openSharedPage/getSharedBrowser:
 * those still pay for a fresh context + real navigation on every single
 * lookup, which measured out to a consistent ~2.6s floor even with the
 * underlying browser process reused. This eliminates that too.
 *
 * REAL TRADEOFF, accepted deliberately for this low-traffic personal
 * app: since this is ONE page shared across every call — not a fresh,
 * isolated context per request — two lookups that genuinely overlap in
 * time (two people using the app at once, or a new search firing
 * before a previous one's response returns) share that same page and
 * could interfere with each other. Fine for one person searching at a
 * time; not safe for real concurrent traffic.
 */
async function getSharedAutocompletePage(): Promise<Page> {
  if (!sharedPagePromise) {
    sharedPagePromise = (async () => {
      const browser = await getSharedBrowser();
      const context = await browser.newContext({
        viewport: config.scraper.browser.viewport,
        userAgent: config.scraper.browser.userAgent,
        locale: config.scraper.browser.locale,
      });
      context.setDefaultNavigationTimeout(config.scraper.pageNavigationTimeoutMs);
      context.setDefaultTimeout(config.scraper.selectorTimeoutMs);
      const page = await context.newPage();
      await page.goto(config.scraper.baseUrl, { waitUntil: 'commit' });
      return page;
    })().catch((error) => {
      sharedPagePromise = null;
      throw error;
    });
  }
  return sharedPagePromise;
}

/** Public entry point for autocomplete specifically — see the tradeoff notes on getSharedAutocompletePage above before reusing this elsewhere. */
export async function getAutocompletePage(): Promise<Page> {
  return getSharedAutocompletePage();
}

export async function closeScraperSession(session: ScraperSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
  logger.info('Browser session closed.');
}
