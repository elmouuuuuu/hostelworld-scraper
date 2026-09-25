import config from '@/config/config';
import type { PropertyType } from '@/types/hostel';

export interface RawListingCard {
  propertyId: string;
  propertyUrl: string;
  name: string;
  propertyType: PropertyType | null;
  rating: number | null;
  reviewCount: number | null;
  /** "From" price for a private room, if the card advertises one */
  privatesFromPrice: number | null;
  /** "From" price for a dorm bed, if the card advertises one */
  dormsFromPrice: number | null;
}

/**
 * Confirmed real behavior (Aug 2026): a hostel can appear TWICE on the
 * same listing page — once in a "Featured Properties" section (a
 * simpler card format with no review count or property-type label,
 * e.g. "HelloBCN Hostel\n8.9\nFabulous\nFrom\nCA$53"), and again in the
 * main "All Properties" list below it (the full card format, with
 * review count, type label, and Privates/Dorms breakdown).
 *
 * When resolving which duplicate to keep, this scores how much usable
 * data a card actually has — used so the fuller main-list version wins
 * over the sparser Featured version, regardless of which one was
 * encountered first in DOM order. Without this, a popular/promoted
 * hostel (exactly the kind likely to be Featured) would silently lose
 * its complete data and then fail the required-review-count check,
 * disappearing from results entirely — a real bug found via a user
 * report (Aug 2026): a well-known Madrid hostel was missing from
 * results despite clearly qualifying.
 */
function completenessScore(card: RawListingCard): number {
  return (
    (card.propertyType !== null ? 1 : 0) +
    (card.rating !== null ? 1 : 0) +
    (card.reviewCount !== null ? 1 : 0) +
    (card.privatesFromPrice !== null || card.dormsFromPrice !== null ? 1 : 0)
  );
}

/** True if `candidate` has more usable data than `current` and should replace it. */
export function isMoreComplete(candidate: RawListingCard, current: RawListingCard): boolean {
  return completenessScore(candidate) > completenessScore(current);
}

/**
 * Property-type labels as they appear on listing cards, longest/most
 * specific first so e.g. "Capsule Hotel" is matched before the generic
 * "Hotel" substring it contains.
 */
const PROPERTY_TYPE_LABELS: ReadonlyArray<{ label: string; type: PropertyType }> = [
  { label: 'Capsule Hotel', type: 'capsule' },
  { label: 'Bed and Breakfast', type: 'guesthouse' },
  { label: 'Guesthouse', type: 'guesthouse' },
  { label: 'Guest House', type: 'guesthouse' },
  { label: 'Apartment', type: 'apartment' },
  { label: 'Resort', type: 'resort' },
  { label: 'Hostel', type: 'hostel' },
  { label: 'Hotel', type: 'hotel' },
];

/**
 * Extracts the numeric Hostelworld property id from a property URL.
 *
 * CONFIRMED (Aug 2026) two real, different URL patterns exist depending
 * on which page renders the link:
 *  - Static-rendered pages (e.g. /hostels/europe/spain/barcelona/):
 *      /hostels/p/{id}/{slug}/
 *  - The /pwa/s search results page (what the scraper actually
 *    navigates to, since it supports date query params):
 *      /pwa/hosteldetails.php/{Slug}/{City}/{id}?from=...&to=...
 * Both are matched here rather than assuming only one.
 */
export function extractPropertyId(href: string): string | null {
  const legacyMatch = href.match(/\/hostels\/p\/(\d+)\//);
  if (legacyMatch) return legacyMatch[1];

  const pwaMatch = href.match(/hosteldetails\.php\/[^/]+\/[^/]+\/(\d+)/);
  if (pwaMatch) return pwaMatch[1];

  return null;
}

/**
 * Parses a single card's full text content, using the CONFIRMED real
 * line-by-line format (from live logging, Aug 2026):
 *
 *   [Free Cancellation]      <- optional promo badge lines
 *   [Selling out fast!]
 *   Hostel                   <- property type, own line
 *   Sun & Moon Hostel        <- name (comes AFTER the type label)
 *   7.7                      <- rating, own line
 *   Very Good                <- quality label (unused)
 *   (3257)                   <- review count
 *   0.8km from city centre   <- distance (unused)
 *   Privates From
 *   CA$437
 *   Dorms From
 *   CA$53
 *
 * Line-based parsing (rather than whole-text regex) is used because the
 * exact set of optional lines (promo badges, distance, "5+ staying",
 * "7 events") varies per card — anchoring on the labels we DO know are
 * fixed (the type label, "Privates From", "Dorms From") is far more
 * robust than assuming a fixed line count or position.
 *
 * NOTE: "Featured Properties" cards use a different, simpler format
 * with no type label and no review count (e.g. "HelloBCN Hostel\n8.9\n
 * Fabulous\nFrom\nCA$53") — these currently fail extraction (no type,
 * no review count) and are dropped. Acceptable for now since featured
 * properties are typically duplicated in the main list below; revisit
 * if completeness gaps show up in practice.
 */
export function extractCardFromText(cardText: string, href: string): RawListingCard | null {
  const propertyId = extractPropertyId(href);
  if (!propertyId) return null;

  const lines = cardText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const typeLineIndex = lines.findIndex((line) =>
    PROPERTY_TYPE_LABELS.some(({ label }) => line === label)
  );
  const propertyType =
    typeLineIndex >= 0
      ? PROPERTY_TYPE_LABELS.find(({ label }) => lines[typeLineIndex] === label)?.type ?? null
      : null;

  const name = typeLineIndex >= 0 && lines[typeLineIndex + 1] ? lines[typeLineIndex + 1] : lines[0] ?? '';

  const ratingSearchStart = typeLineIndex >= 0 ? typeLineIndex + 2 : 0;
  let rating: number | null = null;
  let ratingLineIndex = -1;
  for (let i = ratingSearchStart; i < lines.length; i++) {
    if (/^\d+(?:\.\d+)?$/.test(lines[i])) {
      rating = parseFloat(lines[i]);
      ratingLineIndex = i;
      break;
    }
  }

  let reviewCount: number | null = null;
  if (ratingLineIndex >= 0) {
    for (let i = ratingLineIndex; i < lines.length; i++) {
      const match = lines[i].match(/^\((\d[\d,]*)\)$/);
      if (match) {
        reviewCount = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }
  }

  /**
   * Extracts the price following a "Privates From" / "Dorms From" label.
   *
   * CONFIRMED (Aug 2026) two real formats exist:
   *   No discount:  "Dorms From\nCA$53"
   *   With discount: "Dorms From\n-10%\nCA$62.43\nCA$56"
   *                   (percentage, then crossed-out original, then the
   *                   actual final discounted price)
   *
   * Per the spec's price rule (always use the final publicly displayed
   * sale price, never the crossed-out original), this scans forward
   * from the label, skips percentage lines, and takes the LAST
   * price-like line in the group — which is the final discounted price
   * when a discount is present, or the only price when there isn't one.
   */
  function priceAfterLabel(labelText: string): number | null {
    const labelIndex = lines.findIndex((line) => line.toLowerCase() === labelText.toLowerCase());
    if (labelIndex === -1) return null;

    let lastPrice: number | null = null;
    for (let i = labelIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^-?\d+%$/.test(line)) continue; // discount percentage badge, e.g. "-10%"

      const priceMatch = line.match(/^[A-Za-z$]*\s*([\d,]+(?:\.\d+)?)$/);
      if (priceMatch) {
        lastPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        continue; // keep scanning — a later line may be the real final price
      }
      break; // hit a non-price, non-percentage line (e.g. the next "X From" label) — stop
    }
    return lastPrice;
  }

  const privatesFromPrice = priceAfterLabel('Privates From');
  const dormsFromPrice = priceAfterLabel('Dorms From');

  return {
    propertyId,
    propertyUrl: href.startsWith('http') ? href : `${config.scraper.baseUrl}${href}`,
    name,
    propertyType,
    rating,
    reviewCount,
    privatesFromPrice,
    dormsFromPrice,
  };
}
