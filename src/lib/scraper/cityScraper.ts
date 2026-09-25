import type { Page } from 'playwright-core';
import { withRetry } from './retry';
import { scrapeAllListingPages } from './cityListingScraper';
import { buildListingUrl } from './listingUrlBuilder';
import { scrapePropertyCheapestRoom } from './propertyPageScraper';
import { ScrapeCancelledError } from './scrapeCancelledError';
import { createLogger } from '@/lib/utils/logger';
import { QUALIFYING_PROPERTY_TYPES, type HostelRecord } from '@/types/hostel';
import type { SelectedCity } from '@/types/city';
import type { RawListingCard } from './cardExtractor';
import config from '@/config/config';

const logger = createLogger('scraper:city');

export class CityNotFoundError extends Error {}

export type CityProgressCallback = (fraction: number, message: string) => void;

const LISTING_PHASE_FRACTION = 0.1;

function cheapestFromCard(card: RawListingCard): { price: number; roomType: string } | null {
  const candidates: Array<{ price: number; roomType: string }> = [];
  if (card.privatesFromPrice !== null) candidates.push({ price: card.privatesFromPrice, roomType: 'Private Room' });
  if (card.dormsFromPrice !== null) candidates.push({ price: card.dormsFromPrice, roomType: 'Dorm Room' });
  if (candidates.length === 0) return null;
  return candidates.reduce((cheapest, current) => (current.price < cheapest.price ? current : cheapest));
}

function toHostelRecord(card: RawListingCard, city: SelectedCity, currencyCode: string): HostelRecord | null {
  if (!card.propertyType || !QUALIFYING_PROPERTY_TYPES.has(card.propertyType)) return null;
  if (card.rating === null || card.reviewCount === null) return null;

  const cheapest = cheapestFromCard(card);
  if (!cheapest) return null;

  return {
    id: card.propertyId,
    hostelName: card.name,
    city: city.name,
    country: city.country,
    propertyUrl: card.propertyUrl,
    cheapestPricePerNight: cheapest.price,
    currency: currencyCode,
    cheapestRoomType: cheapest.roomType,
    cheapestRoomBeds: null,
    averageRating: card.rating,
    numberOfReviews: card.reviewCount,
    propertyType: card.propertyType,
  };
}

function randomDelay(): Promise<void> {
  const { min, max } = config.scraper.randomDelayRangeMs;
  const ms = Math.round(Math.random() * (max - min) + min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichWithPreciseRoomData(
  page: Page,
  cityName: string,
  records: HostelRecord[],
  onProgress?: CityProgressCallback,
  signal?: AbortSignal
): Promise<HostelRecord[]> {
  const enriched: HostelRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    if (signal?.aborted) throw new ScrapeCancelledError();

    const record = records[i];

    try {
      const precise = await scrapePropertyCheapestRoom(page, record.propertyUrl);
      if (precise) {
        enriched.push({
          ...record,
          cheapestPricePerNight: precise.pricePerNight,
          cheapestRoomType: precise.roomName,
          cheapestRoomBeds: precise.beds,
        });
      } else {
        enriched.push(record);
      }
    } catch (error) {
      logger.warn(
        `${cityName}: precise room data failed for "${record.hostelName}", keeping listing-page estimate. ` +
          `${error instanceof Error ? error.message : String(error)}`
      );
      enriched.push(record);
    }

    const hostelsDone = i + 1;
    const phaseFraction = hostelsDone / records.length;
    const overallFraction = LISTING_PHASE_FRACTION + phaseFraction * (1 - LISTING_PHASE_FRACTION);
    onProgress?.(overallFraction, `${cityName}: processed ${hostelsDone}/${records.length} hostels`);

    await randomDelay();
  }

  return enriched;
}

/**
 * Scrapes one city end-to-end. `currencyCode` is recorded on every
 * resulting HostelRecord — it reflects whatever currency the page was
 * actually switched to before scraping began (see scrapeCities.ts).
 * `detailedMode` is now a per-request user choice (see
 * DetailedModeToggle.tsx), not a fixed server default.
 */
export async function scrapeCity(
  page: Page,
  city: SelectedCity,
  checkIn: Date,
  checkOut: Date,
  minimumRating: number,
  currencyCode: string,
  detailedMode: boolean,
  onProgress?: CityProgressCallback,
  signal?: AbortSignal
): Promise<HostelRecord[]> {
  return withRetry(
    `Scrape ${city.name}`,
    async () => {
      const rawCards = await scrapeAllListingPages(
        page,
        (pageNumber) => buildListingUrl(city, checkIn, checkOut, pageNumber),
        signal
      );

      logger.info(`${city.name}: found ${rawCards.length} properties.`);

      if (rawCards.length === 0) {
        throw new CityNotFoundError(
          `No properties found for ${city.name} — the destination may not exist on Hostelworld, or the constructed URL was incorrect.`
        );
      }

      let qualifying = rawCards
        .map((card) => toHostelRecord(card, city, currencyCode))
        .filter((record): record is HostelRecord => record !== null)
        .filter((record) => record.averageRating >= minimumRating);

      logger.info(`${city.name}: filtered to ${qualifying.length} qualifying hostels (rating >= ${minimumRating}).`);
      onProgress?.(LISTING_PHASE_FRACTION, `${city.name}: filtered to ${qualifying.length} qualifying hostels.`);

      if (detailedMode && qualifying.length > 0) {
        logger.info(`${city.name}: fetching precise room data for ${qualifying.length} qualifying hostels...`);
        qualifying = await enrichWithPreciseRoomData(page, city.name, qualifying, onProgress, signal);
      } else {
        onProgress?.(1, `${city.name}: filtered to ${qualifying.length} qualifying hostels.`);
      }

      return qualifying;
    },
    signal
  );
}
