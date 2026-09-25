import type { HostelRecord } from '@/types/hostel';
import type { CityReport } from '@/types/report';
import { calculateOverallStats } from './cityStatistics';
import { calculateMainHostels } from './mainHostels';
import { calculateCheapHostels } from './cheapHostels';

/**
 * Builds the complete statistics report for a single city from its
 * qualifying hostels. This is the single entry point Milestone 6 (Excel
 * generation) and Milestone 7 (API wiring) should call — combining
 * overall stats, Main Hostels, and Cheap Hostels in one place keeps
 * those consumers from needing to know about three separate functions.
 */
export function buildCityReport(city: string, country: string, qualifyingHostels: HostelRecord[]): CityReport {
  return {
    city,
    country,
    qualifyingHostels,
    overallStats: calculateOverallStats(qualifyingHostels),
    mainHostels: calculateMainHostels(qualifyingHostels),
    cheapHostels: calculateCheapHostels(qualifyingHostels),
  };
}
