import config from '@/config/config';
import type { HostelRecord } from '@/types/hostel';
import type { CheapHostelsStats } from '@/types/report';
import { calculateAverage, calculateMedian } from './mathUtils';

/**
 * "Cheap Hostels" = the N least expensive hostels in a city, but only
 * considering hostels that clear a quality floor first: a hostel is
 * eligible if it meets EITHER the minimum review count OR the minimum
 * rating (OR logic, a deliberate product decision — not both required).
 * This keeps the ranking from surfacing obscure, barely-reviewed
 * hostels purely because they happen to be cheap.
 *
 * Sort by price ascending, take the bottom N (or fewer, if fewer than N
 * hostels clear the quality floor). Price stats are computed only from
 * those selected hostels.
 */
export function calculateCheapHostels(hostels: HostelRecord[]): CheapHostelsStats {
  const { count, minReviews, minRating } = config.statistics.cheapHostels;

  const eligibleHostels = hostels.filter(
    (hostel) => hostel.numberOfReviews >= minReviews || hostel.averageRating >= minRating
  );

  const sortedByPriceAscending = [...eligibleHostels].sort(
    (a, b) => a.cheapestPricePerNight - b.cheapestPricePerNight
  );
  const selectedHostels = sortedByPriceAscending.slice(0, count);

  const prices = selectedHostels.map((hostel) => hostel.cheapestPricePerNight);

  return {
    averagePrice: calculateAverage(prices),
    medianPrice: calculateMedian(prices),
    selectedHostels,
  };
}
