import type { HostelRecord } from '@/types/hostel';
import type { PriceRatingStats } from '@/types/report';
import { calculateAverage, calculateMedian } from './mathUtils';

/**
 * Computes average price, median price, and average rating across
 * every qualifying hostel in a city. Returns N/A (via StatValue) for
 * every field if the city has zero qualifying hostels — never zeros,
 * never blanks, per the edge-case requirement.
 */
export function calculateOverallStats(hostels: HostelRecord[]): PriceRatingStats {
  const prices = hostels.map((hostel) => hostel.cheapestPricePerNight);
  const ratings = hostels.map((hostel) => hostel.averageRating);

  return {
    averagePrice: calculateAverage(prices),
    medianPrice: calculateMedian(prices),
    averageRating: calculateAverage(ratings),
  };
}
