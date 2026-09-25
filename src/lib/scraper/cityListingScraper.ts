import type { Page } from 'playwright-core';
import config from '@/config/config';
import { createLogger } from '@/lib/utils/logger';
import { extractCardFromText, extractPropertyId, isMoreComplete, type RawListingCard } from './cardExtractor';
import { ScrapeCancelledError } from './scrapeCancelledError';

const logger = createLogger('scraper:listing');

const PROPERTY_CARD_SELECTOR = 'a[href*="hosteldetails.php"], a[href*="/hostels/p/"]';

function randomDelay(): Promise<void> {
  const { min, max } = config.scraper.randomDelayRangeMs;
  const ms = Math.round(Math.random() * (max - min) + min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts every property card on the current page, merged by property
 * ID. A hostel can legitimately appear twice on one page (Featured
 * Properties section + main list) — when that happens, whichever card
 * has more usable data wins (see cardExtractor.ts isMoreComplete), not
 * whichever was encountered first in DOM order. Without this, a
 * Featured hostel's sparse card (no review count) could shadow its own
 * fuller duplicate later on the same page and get dropped entirely.
 */
async function extractCardsFromCurrentPage(page: Page): Promise<RawListingCard[]> {
  const anchors = await page.locator(PROPERTY_CARD_SELECTOR).all();
  const cardsById = new Map<string, RawListingCard>();
  const allRawTexts: Array<{ propertyId: string | null; text: string }> = [];

  for (const anchor of anchors) {
    const href = await anchor.getAttribute('href');
    if (!href) continue;

    const propertyId = extractPropertyId(href);
    const text = await anchor.innerText();
    allRawTexts.push({ propertyId, text });

    if (!propertyId) continue;

    const card = extractCardFromText(text, href);
    if (!card) continue;

    const existing = cardsById.get(propertyId);
    if (!existing || isMoreComplete(card, existing)) {
      cardsById.set(propertyId, card);
    }
  }

  if (config.scraper.verboseScraperDiagnostics) {
    try {
      const fs = await import('fs/promises');
      const rawDumpPath = `/tmp/hostelworld-raw-cards-${Date.now()}.json`;
      await fs.writeFile(rawDumpPath, JSON.stringify(allRawTexts, null, 2));
      logger.warn(`Raw card text dump: ${rawDumpPath}`);
    } catch {
      // best-effort diagnostic only
    }
  }

  return Array.from(cardsById.values());
}

async function scrollUntilStable(page: Page): Promise<void> {
  const { maxScrollAttempts, scrollStepPx, stableRoundsBeforeStop, pauseBetweenScrollsMs } = config.scraper.scroll;

  let previousCount = (await page.locator(PROPERTY_CARD_SELECTOR).all()).length;
  let stableRounds = 0;

  for (let attempt = 0; attempt < maxScrollAttempts && stableRounds < stableRoundsBeforeStop; attempt++) {
    await page.mouse.wheel(0, scrollStepPx);

    const pauseMs = Math.round(
      Math.random() * (pauseBetweenScrollsMs.max - pauseBetweenScrollsMs.min) + pauseBetweenScrollsMs.min
    );
    await new Promise((resolve) => setTimeout(resolve, pauseMs));

    const currentCount = (await page.locator(PROPERTY_CARD_SELECTOR).all()).length;
    stableRounds = currentCount > previousCount ? 0 : stableRounds + 1;
    previousCount = currentCount;
  }
}

/**
 * Scrapes every listing page for one city, following Hostelworld's
 * page-based pagination until a page contributes zero previously-unseen
 * property IDs, or the safety cap is hit. Checks `signal` at the top of
 * each page iteration for cancellation.
 *
 * Merging is completeness-preferring across pages too, for the same
 * reason as within a single page — the merge itself is cheap and this
 * makes the function robust to duplication happening anywhere, not just
 * the one specific page-1 Featured-vs-main-list case that's confirmed
 * real.
 */
export async function scrapeAllListingPages(
  page: Page,
  buildPageUrl: (pageNumber: number) => string,
  signal?: AbortSignal
): Promise<RawListingCard[]> {
  const cardsById = new Map<string, RawListingCard>();

  for (let pageNumber = 1; pageNumber <= config.scraper.maxPaginationPages; pageNumber++) {
    if (signal?.aborted) throw new ScrapeCancelledError();

    const url = buildPageUrl(pageNumber);
    logger.debug(`Navigating to page ${pageNumber}: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.waitForSelector(PROPERTY_CARD_SELECTOR, { timeout: config.scraper.listingsLoadTimeoutMs }).catch(() => {});

    await scrollUntilStable(page);

    const pageCards = await extractCardsFromCurrentPage(page);

    if (pageCards.length === 0 && config.scraper.verboseScraperDiagnostics) {
      const debugPath = `/tmp/hostelworld-listing-debug-${Date.now()}.png`;
      const htmlDebugPath = `/tmp/hostelworld-listing-debug-${Date.now()}.html`;
      const title = await page.title().catch(() => '(could not read title)');
      await page.screenshot({ path: debugPath, fullPage: true }).catch(() => {});
      const html = await page.content().catch(() => '');
      const fs = await import('fs/promises');
      await fs.writeFile(htmlDebugPath, html).catch(() => {});
      logger.warn(
        `Page ${pageNumber} had 0 cards. Page title: "${title}". URL: ${page.url()}. ` +
          `Screenshot: ${debugPath}. HTML: ${htmlDebugPath}`
      );
    } else if (pageCards.length === 0) {
      logger.warn(`Page ${pageNumber} had 0 cards. URL: ${page.url()}.`);
    }

    const hasNewProperties = pageCards.some((card) => !cardsById.has(card.propertyId));

    if (!hasNewProperties) {
      logger.debug(`Page ${pageNumber} had no new properties — stopping pagination.`);
      break;
    }

    for (const card of pageCards) {
      const existing = cardsById.get(card.propertyId);
      if (!existing || isMoreComplete(card, existing)) {
        cardsById.set(card.propertyId, card);
      }
    }

    await randomDelay();
  }

  return Array.from(cardsById.values());
}
