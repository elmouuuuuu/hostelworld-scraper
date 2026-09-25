import type { SelectedCity } from '@/types/city';
import type { HostelRecord, FailedCity, ScraperFailureReasonCode } from '@/types/hostel';
import type { ProgressEvent, ProgressEventType } from '@/types/api';
import { launchScraperSession, closeScraperSession } from './browserManager';
import { switchCurrency } from './currencySwitcher';
import { scrapeCity, CityNotFoundError } from './cityScraper';
import { ScrapeCancelledError } from './scrapeCancelledError';
import { createLogger } from '@/lib/utils/logger';
import config from '@/config/config';

const logger = createLogger('scraper:run');

export interface CityScrapeOutcome {
  city: SelectedCity;
  hostels: HostelRecord[];
}

export interface ScrapeRunResult {
  cityResults: CityScrapeOutcome[];
  failedCities: FailedCity[];
  cancelled: boolean;
}

export interface ScrapeCitiesOptions {
  onProgress?: (event: ProgressEvent) => void;
  signal?: AbortSignal;
}

function emit(
  onProgress: ((event: ProgressEvent) => void) | undefined,
  type: ProgressEventType,
  message: string,
  cityIndex: number | undefined,
  totalCities: number,
  overallPercent: number
): void {
  onProgress?.({ type, message, cityIndex, totalCities, overallPercent, timestamp: new Date().toISOString() });
}

function classifyFailure(error: unknown): ScraperFailureReasonCode {
  if (error instanceof CityNotFoundError) return 'CITY_NOT_FOUND';
  return 'PAGE_LOAD_FAILED';
}

/**
 * Top-level entry point for a full scraping run.
 *
 * `currencyCode` selects which currency Hostelworld displays prices in
 * (see lib/utils/currencies.ts for the supported list) — only CAD's
 * exact selection has been confirmed via live testing; other codes
 * reuse the same confirmed UI pattern but are otherwise unverified (see
 * currencySwitcher.ts).
 */
export async function scrapeCities(
  cities: SelectedCity[],
  checkIn: Date,
  checkOut: Date,
  minimumRating: number,
  currencyCode: string,
  detailedMode: boolean,
  options: ScrapeCitiesOptions = {}
): Promise<ScrapeRunResult> {
  const { onProgress, signal } = options;
  const cityResults: CityScrapeOutcome[] = [];
  const failedCities: FailedCity[] = [];
  let cancelled = false;

  emit(onProgress, 'init', 'Initializing scraper...', undefined, cities.length, 0);
  logger.info(`Starting scrape run for ${cities.length} cities.`);

  const session = await launchScraperSession();

  try {
    try {
      await switchCurrency(session.page, currencyCode);
    } catch (error) {
      logger.warn(
        `Currency switch to ${currencyCode} failed — continuing anyway. Prices will NOT be guaranteed ${currencyCode}. ` +
          `Reason: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const percentPerCity = 90 / cities.length;

    for (let index = 0; index < cities.length; index++) {
      if (signal?.aborted) {
        logger.info('Scrape run cancelled by client — stopping before next city.');
        cancelled = true;
        break;
      }

      const city = cities[index];
      const basePercent = index * percentPerCity;

      emit(onProgress, 'city_start', `Loading ${city.name}...`, index, cities.length, Math.round(basePercent));

      try {
        const hostels = await scrapeCity(
          session.page,
          city,
          checkIn,
          checkOut,
          minimumRating,
          currencyCode,
          detailedMode,
          (fraction, message) => {
            const percent = basePercent + fraction * percentPerCity;
            emit(onProgress, 'city_progress', message, index, cities.length, Math.round(percent));
          },
          signal
        );
        cityResults.push({ city, hostels });
        emit(
          onProgress,
          'city_complete',
          `${city.name} complete - ${hostels.length} qualifying hostels.`,
          index,
          cities.length,
          Math.round(basePercent + percentPerCity)
        );
      } catch (error) {
        if (error instanceof ScrapeCancelledError) {
          logger.info(`Scrape run cancelled by client during ${city.name}.`);
          cancelled = true;
          break;
        }

        const reason = error instanceof Error ? error.message : String(error);
        const reasonCode = classifyFailure(error);

        failedCities.push({
          city: city.name,
          country: city.country,
          reasonCode,
          reason,
          attemptsMade: config.scraper.retryCount + 1,
        });

        logger.error(`${city.name}: failed permanently.`, error);
        emit(
          onProgress,
          'city_failed',
          `${city.name}: failed after retries - ${reason}`,
          index,
          cities.length,
          Math.round(basePercent + percentPerCity)
        );
      }
    }
  } finally {
    await closeScraperSession(session);
  }

  if (cancelled) {
    logger.info(
      `Scrape run cancelled. ${cityResults.length} city(ies) completed before cancellation, ${failedCities.length} failed.`
    );
  } else {
    emit(onProgress, 'done', 'Scraping complete.', undefined, cities.length, 100);
    logger.info(`Scrape run finished. ${cityResults.length} succeeded, ${failedCities.length} failed.`);
  }

  return { cityResults, failedCities, cancelled };
}
