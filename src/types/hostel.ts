/**
 * The property classifications Hostelworld uses. We only ever keep
 * 'hostel' and 'capsule' — everything else is filtered out during
 * extraction.
 */
export type PropertyType = 'hostel' | 'capsule' | 'hotel' | 'apartment' | 'guesthouse' | 'resort';

export const QUALIFYING_PROPERTY_TYPES: ReadonlySet<PropertyType> = new Set(['hostel', 'capsule']);

/**
 * A single qualifying hostel/capsule record, fully normalized and ready to
 * feed into statistics and Excel generation. Flat and serializable so it
 * can later be persisted as-is to a SQL row in V2 without restructuring.
 */
export interface HostelRecord {
  id: string;
  hostelName: string;
  city: string;
  country: string;
  propertyUrl: string;
  cheapestPricePerNight: number;
  currency: string;
  cheapestRoomType: string;
  /** Beds in the cheapest room, if known. Null when only a coarse category (e.g. "Dorm Room" vs "Private Room") could be determined, not an exact bed count — see lib/scraper/cardExtractor.ts. */
  cheapestRoomBeds: number | null;
  averageRating: number;
  numberOfReviews: number;
  propertyType: PropertyType;
}

/**
 * Structured reasons a city can fail to scrape. Codes are stable and
 * meant to be shown to the user (e.g. "Error 1 (City not found)"), not
 * just logged — the Excel report's Summary sheet surfaces these directly
 * per the edge-case requirements (N/A values + explicit failure reason,
 * never a blank cell or a silent zero).
 */
export type ScraperFailureReasonCode = 'CITY_NOT_FOUND' | 'PAGE_LOAD_FAILED' | 'UNKNOWN';

export const SCRAPER_FAILURE_LABELS: Record<ScraperFailureReasonCode, string> = {
  CITY_NOT_FOUND: 'Error 1 (City not found)',
  PAGE_LOAD_FAILED: 'Error 2 (Page failed to load)',
  UNKNOWN: 'Error 0 (Unknown failure)',
};

/**
 * A city for which scraping failed after exhausting retries. Captured so
 * the final report can be generated anyway and the failure surfaced to
 * the user, per the error-handling requirements.
 */
export interface FailedCity {
  city: string;
  country: string;
  reasonCode: ScraperFailureReasonCode;
  /** Human-readable detail beyond the code, e.g. the raw error message */
  reason: string;
  attemptsMade: number;
}
