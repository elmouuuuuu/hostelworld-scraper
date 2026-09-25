import type { Page } from 'playwright-core';
import config from '@/config/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('scraper:currency');

/**
 * Switches the site's displayed currency to the given ISO code.
 *
 * CONFIRMED WORKING for CAD specifically (Aug 2026) via repeated live
 * testing: real selectors from DevTools inspection
 * (`[data-testid="currency-button"]` trigger, `button[data-type="listItem"]`
 * options filtered by a "(CODE)" text pattern), and 'domcontentloaded'
 * instead of 'networkidle' for navigation (this site has persistent
 * background activity — live chat/counters — that never goes fully
 * idle, so 'networkidle' reliably timed out).
 *
 * UNVERIFIED for any code other than CAD: this generalizes the
 * confirmed CAD flow by reusing the same "(CODE)" filter pattern for
 * an arbitrary code, on the reasonable assumption Hostelworld labels
 * every currency option consistently (e.g. "US Dollar (USD)"). That
 * assumption hasn't been checked live for any other currency — if a
 * non-CAD currency fails here, checking the real option text for that
 * specific currency is the first thing to try.
 */
export async function switchCurrency(page: Page, currencyCode: string): Promise<void> {
  const triggerSelector = '[data-testid="currency-button"]';

  await page.goto(config.scraper.baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const triggers = page.locator(triggerSelector);
  const triggerCount = await triggers.count();

  let opened = false;
  for (let i = 0; i < triggerCount; i++) {
    const candidate = triggers.nth(i);
    if (await candidate.isVisible()) {
      await candidate.click({ timeout: config.scraper.selectorTimeoutMs });
      opened = true;
      break;
    }
  }
  if (!opened) {
    throw new Error(`No visible currency trigger (${triggerSelector}) found.`);
  }

  await page.waitForTimeout(500);

  const candidates = page.locator('button[data-type="listItem"]').filter({ hasText: `(${currencyCode})` });
  const candidateCount = await candidates.count();

  let selected = false;
  for (let i = 0; i < candidateCount; i++) {
    const candidate = candidates.nth(i);
    if (await candidate.isVisible()) {
      await candidate.click({ timeout: config.scraper.selectorTimeoutMs });
      selected = true;
      break;
    }
  }
  if (!selected) {
    throw new Error(`No visible "(${currencyCode})" list item found among ${candidateCount} candidate(s).`);
  }

  await page
    .locator(`${triggerSelector}[aria-label="${currencyCode}"]`)
    .first()
    .waitFor({ state: 'visible', timeout: config.scraper.selectorTimeoutMs });

  logger.info(`Currency switched to ${currencyCode}.`);
}
