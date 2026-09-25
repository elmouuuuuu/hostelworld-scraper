import config from '@/config/config';
import { isPendingCityId } from '@/lib/utils/cityIdentity';
import type { SelectedCity } from '@/types/city';

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds the URL to navigate to for a given city + page number.
 *
 * Two strategies, depending on how the city was selected:
 *
 * - VERIFIED (real numeric hostelworldId, from Milestone 3 autocomplete):
 *   uses Hostelworld's real /pwa/s search endpoint, confirmed via live
 *   inspection — supports exact dates via from/to query params.
 *
 * - PENDING (manually typed, unverified — see cityIdentity.ts): no real
 *   id exists to search by, so this falls back to the best-effort
 *   destinationUrl constructed in Milestone 3. If that URL doesn't
 *   resolve to a real listings page, that failure IS the real-world
 *   "city not found" signal — the same concept the mock simulation in
 *   Milestone 2/3 was standing in for.
 */
export function buildListingUrl(city: SelectedCity, checkIn: Date, checkOut: Date, page: number): string {
  if (isPendingCityId(city.hostelworldId)) {
    const base = city.destinationUrl.endsWith('/') ? city.destinationUrl : `${city.destinationUrl}/`;
    return page <= 1 ? base : `${base}p/${page}/`;
  }

  const params = new URLSearchParams({
    q: `${city.name}, ${city.country}`,
    country: city.country,
    city: city.name,
    type: 'city',
    id: city.hostelworldId,
    from: formatIsoDate(checkIn),
    to: formatIsoDate(checkOut),
    guests: String(config.scraper.search.defaultGuests),
    page: String(page),
  });

  return `${config.scraper.baseUrl}${config.scraper.search.path}?${params.toString()}`;
}
