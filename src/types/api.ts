import type { SelectedCity, CitySuggestion } from './city';

/** Request body for POST /api/generate-report */
export interface GenerateReportRequest {
  cities: SelectedCity[];
  minimumRating: number;
  rawDataMode: boolean;
  /** ISO 4217 currency code, e.g. 'USD', 'EUR' — see lib/utils/currencies.ts. */
  currency: string;
  /** Exact per-hostel pricing (slower, capped to far fewer cities server-side — see config.scraper.maxCitiesDetailedMode). */
  detailedMode: boolean;
  /** ISO date strings (YYYY-MM-DD). If omitted, the server auto-computes dates (next month's first Tuesday-Thursday). */
  checkIn?: string;
  checkOut?: string;
}

/**
 * Progress events streamed back to the client while a report is being
 * generated. Maps 1:1 onto the required log lines (e.g. "Loading
 * Barcelona...", "Found 92 properties.").
 */
export type ProgressEventType =
  | 'init'
  | 'city_start'
  | 'city_pagination'
  | 'city_filtered'
  | 'city_progress'
  | 'city_complete'
  | 'city_failed'
  | 'statistics'
  | 'workbook_start'
  | 'workbook_complete'
  | 'done';

export interface ProgressEvent {
  type: ProgressEventType;
  message: string;
  cityIndex?: number;
  totalCities?: number;
  overallPercent: number;
  timestamp: string;
}

/** Response body for GET /api/autocomplete?q=... */
export interface AutocompleteResponse {
  suggestions: CitySuggestion[];
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/** Per-city summary shown in the success state, once the full report is done. */
export interface GenerateReportCitySummary {
  city: string;
  country: string;
  qualifyingHostels: number;
}

export interface GenerateReportFailedCitySummary {
  city: string;
  country: string;
  reasonCode: string;
  reason: string;
}

export interface GenerateReportSummary {
  cities: GenerateReportCitySummary[];
  totalQualifyingHostels: number;
  failedCities: GenerateReportFailedCitySummary[];
}

/**
 * The streaming protocol for POST /api/generate-report. The response
 * body is newline-delimited JSON (one message per line) rather than a
 * single JSON blob, so the client can render progress live instead of
 * waiting for the entire (potentially multi-minute) run to finish.
 *
 * The final message is always either 'complete' (with the finished
 * workbook, base64-encoded so it can travel in the same text stream as
 * the progress events) or 'error'.
 */
export type GenerateReportStreamMessage =
  | { type: 'progress'; event: ProgressEvent }
  | { type: 'complete'; fileName: string; fileBase64: string; summary: GenerateReportSummary }
  | { type: 'error'; message: string };
