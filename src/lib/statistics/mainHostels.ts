import config from '@/config/config';
import type { HostelRecord } from '@/types/hostel';
import type { MainHostelsStats } from '@/types/report';
import { calculateAverage, calculateMedian } from './mathUtils';

/**
 * "Main Hostels" = the N hostels with the highest review count in a
 * city, per the requirements: sort by number of reviews descending,
 * take the top N, ignoring rating and price entirely when selecting
 * them — popularity by review count is the sole criterion. Price stats
 * are then computed only from those N (or fewer, if the city has fewer
 * than N qualifying hostels total).
 */
export function calculateMainHostels(hostels: HostelRecord[]): MainHostelsStats {
  const sortedByReviews = [...hostels].sort((a, b) => b.numberOfReviews - a.numberOfReviews);
  const selectedHostels = sortedByReviews.slice(0, config.statistics.mainHostelsCount);

  const prices = selectedHostels.map((hostel) => hostel.cheapestPricePerNight);

  return {
    averagePrice: calculateAverage(prices),
    medianPrice: calculateMedian(prices),
    selectedHostels,
  };
}
