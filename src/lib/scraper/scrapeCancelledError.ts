/**
 * Thrown when a scrape is stopped because the client cancelled the
 * request (not a real failure) — kept distinct from other errors so
 * retry logic never retries a deliberate cancellation, and so a
 * cancelled city never gets recorded in failedCities as if scraping it
 * had actually gone wrong.
 */
export class ScrapeCancelledError extends Error {
  constructor(message = 'Scrape cancelled by client.') {
    super(message);
    this.name = 'ScrapeCancelledError';
  }
}
