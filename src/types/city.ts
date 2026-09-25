/**
 * A single autocomplete suggestion as returned by the Hostelworld
 * suggestion endpoint (or our proxy of it).
 *
 * `hostelworldId` / `destinationUrl` are captured at selection time so the
 * scraper can navigate DIRECTLY to the city's listing page later, without
 * re-running the autocomplete search.
 */
export interface CitySuggestion {
  /** Human-readable city name, e.g. "Barcelona" */
  name: string;
  /** Country name, e.g. "Spain" */
  country: string;
  /** Hostelworld's internal destination id (from their suggest API) */
  hostelworldId: string;
  /** Fully-qualified Hostelworld URL for this destination's listings page */
  destinationUrl: string;
  /** Optional disambiguation label shown in the dropdown, e.g. "Barcelona, Spain" */
  displayLabel: string;
}

/**
 * A city the user has selected and turned into a removable tag in the UI.
 * This is what actually gets sent to the report-generation API.
 */
export interface SelectedCity extends CitySuggestion {
  /** Client-generated id for React keys / removal, independent of hostelworldId */
  selectionId: string;
}
