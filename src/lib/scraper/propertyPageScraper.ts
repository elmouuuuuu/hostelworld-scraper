import type { Page } from 'playwright-core';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('scraper:property');

export interface PreciseRoomOption {
  roomName: string;
  beds: number;
  /** The lower of the two displayed prices (refundable vs non-refundable) — confirmed via live testing that non-refundable is always the cheaper, final displayed price. */
  pricePerNight: number;
  category: 'private' | 'dorm';
}

/**
 * Parses a property page's full body text into individual room options.
 *
 * CONFIRMED real format (Aug 2026), validated by cross-checking the
 * computed global minimum against the page's own "From CA$X" summary
 * on two different real properties (exact match both times):
 *
 *   Private Rooms                      <- section header
 *   Basic 6 Bed Private Ensuite        <- room name
 *   3 bunk beds with en-suite ...      <- description (always 1 line)
 *   Sleeps 6                           <- bed count
 *   Private Room
 *   Ensuite
 *   [Best private price]               <- optional badge
 *   [Only 2 rooms left!]               <- optional badge
 *   Prices are per room -
 *   [Taxes Not Included]
 *   CA$475.64                          <- refundable price
 *   Free Cancellation
 *   Add
 *   CA$437.60                          <- non-refundable price (always cheaper — this is "the" price)
 *   Non-refundable
 *   Add
 *
 *   Dorm Beds                          <- section header (if any dorms exist)
 *   ...same structure, "Sleeps N" = beds per dorm room, category 'dorm'
 */
export function extractRoomOptions(bodyText: string): PreciseRoomOption[] {
  const lines = bodyText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const options: PreciseRoomOption[] = [];
  let currentCategory: 'private' | 'dorm' | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Private Rooms') {
      currentCategory = 'private';
      continue;
    }
    if (lines[i] === 'Dorm Beds') {
      currentCategory = 'dorm';
      continue;
    }
    // Past the room list entirely — stop attributing "Sleeps N" matches to a category.
    if (lines[i] === 'Linkups Events' || lines[i] === 'House Rules' || lines[i] === 'Facilities') {
      currentCategory = null;
    }

    const sleepsMatch = lines[i].match(/^Sleeps (\d+)$/);
    if (!sleepsMatch || !currentCategory) continue;

    const beds = parseInt(sleepsMatch[1], 10);
    const fallbackName = currentCategory === 'private' ? 'Private Room' : 'Dorm Bed';
    const roomName = lines[i - 2] && lines[i - 2].length > 0 ? lines[i - 2] : fallbackName;

    // Scan forward (bounded window) for the two prices that belong to this room.
    let firstPrice: number | null = null;
    let secondPrice: number | null = null;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      if (/^Sleeps \d+$/.test(lines[j])) break; // ran into the next room without finding 2 prices — bail
      const priceMatch = lines[j].match(/^CA\$([\d,]+(?:\.\d+)?)$/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (firstPrice === null) {
          firstPrice = price;
        } else {
          secondPrice = price;
          break;
        }
      }
    }

    const cheapestForRoom =
      firstPrice !== null && secondPrice !== null
        ? Math.min(firstPrice, secondPrice)
        : firstPrice;

    if (cheapestForRoom !== null) {
      options.push({ roomName, beds, pricePerNight: cheapestForRoom, category: currentCategory });
    }
  }

  return options;
}

export function findCheapestRoomOption(options: PreciseRoomOption[]): PreciseRoomOption | null {
  if (options.length === 0) return null;
  return options.reduce((cheapest, option) => (option.pricePerNight < cheapest.pricePerNight ? option : cheapest));
}

/**
 * Visits a single property page (URL must already include from/to/guests
 * query params — confirmed this alone is enough to render full room
 * pricing, no date-picker interaction needed) and returns its cheapest
 * room option with exact price and real bed count.
 *
 * Returns null (rather than throwing) if no room options could be
 * parsed — the caller falls back to the coarser listing-page price data
 * in that case rather than losing the hostel from results entirely.
 */
export async function scrapePropertyCheapestRoom(
  page: Page,
  propertyUrl: string
): Promise<PreciseRoomOption | null> {
  await page.goto(propertyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (!bodyText) return null;

  const options = extractRoomOptions(bodyText);
  const cheapest = findCheapestRoomOption(options);

  if (!cheapest) {
    logger.warn(`No room options parsed from property page: ${propertyUrl}`);
  }

  return cheapest;
}
