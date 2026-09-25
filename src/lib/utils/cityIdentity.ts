/**
 * Prefix used on hostelworldId for cities added via manual entry (the
 * fallback path when autocomplete returns nothing or errors), as opposed
 * to a real numeric id returned by Hostelworld's suggest API.
 *
 * This single prefix is the one signal the rest of the app needs to
 * distinguish "verified by Hostelworld" from "unverified, typed by the
 * user" — used both when constructing the placeholder id (page.tsx) and
 * by the real scraper (lib/scraper/listingUrlBuilder.ts) to decide
 * between the id-based search URL and the best-effort direct URL
 * fallback.
 */
export const PENDING_CITY_ID_PREFIX = 'PENDING-';

export function isPendingCityId(hostelworldId: string): boolean {
  return hostelworldId.startsWith(PENDING_CITY_ID_PREFIX);
}
