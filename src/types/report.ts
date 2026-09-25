import type { HostelRecord, FailedCity } from './hostel';

/**
 * A statistic that may legitimately be unavailable (e.g. zero qualifying
 * hostels found for a city). Modeled explicitly as a discriminated value
 * so every consumer (Excel formatter, UI) is forced to handle "N/A".
 */
export type StatValue = { available: true; value: number } | { available: false };

export function statFrom(value: number | undefined): StatValue {
  return value === undefined || Number.isNaN(value) ? { available: false } : { available: true, value };
}

/** Standard price/rating statistics computed across a set of hostels. */
export interface PriceRatingStats {
  averagePrice: StatValue;
  medianPrice: StatValue;
  averageRating: StatValue;
}

/** Main Hostels = top 3 by review count, price stats only. */
export interface MainHostelsStats {
  averagePrice: StatValue;
  medianPrice: StatValue;
  selectedHostels: HostelRecord[];
}

/**
 * Cheap Hostels = the N least expensive qualifying hostels, restricted
 * to hostels clearing a quality floor first (meeting EITHER a minimum
 * review count OR a minimum rating — not both required, per product
 * decision) so the ranking doesn't surface obscure, barely-reviewed
 * hostels purely because they're cheap.
 */
export interface CheapHostelsStats {
  averagePrice: StatValue;
  medianPrice: StatValue;
  selectedHostels: HostelRecord[];
}

/** Full computed report for a single city. */
export interface CityReport {
  city: string;
  country: string;
  qualifyingHostels: HostelRecord[];
  overallStats: PriceRatingStats;
  mainHostels: MainHostelsStats;
  cheapHostels: CheapHostelsStats;
}

/** Search-wide metadata, used to populate the "Report Information" sheet. */
export interface ReportMetadata {
  generatedAt: Date;
  currency: string;
  searchCheckIn: Date;
  searchCheckOut: Date;
  minimumRating: number;
  rawDataModeEnabled: boolean;
  citiesRequested: number;
  qualifyingHostelsTotal: number;
  failedCitiesCount: number;
  scraperVersion: string;
  totalExecutionTimeMs: number;
}

/** The complete result of a report generation run, before Excel serialization. */
export interface ReportResult {
  metadata: ReportMetadata;
  cityReports: CityReport[];
  failedCities: FailedCity[];
}
