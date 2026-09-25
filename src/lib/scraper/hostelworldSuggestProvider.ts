import config from '@/config/config';
import { createLogger } from '@/lib/utils/logger';
import { slugify } from '@/lib/utils/slugify';
import { getContinentSlug } from '@/lib/utils/countryMeta';
import { openSharedPage } from './browserManager';
import type { CitySuggestion } from '@/types/city';

const logger = createLogger('hostelworldSuggestProvider');

interface RawSuggestItem {
  id: number;
  name: string;
  englishName?: string;
  type: 'city' | 'popular places' | 'region' | 'country' | 'property' | string;
  city?: { id: number; name: string; country: string };
}

function parseNameSegments(fullName: string): { cityName: string; country: string } {
  const segments = fullName.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    cityName: segments[0] ?? fullName.trim(),
    country: segments[segments.length - 1] ?? '',
  };
}

function buildDestinationUrl(cityName: string, country: string): string {
  const citySlug = slugify(cityName);
  const countrySlug = slugify(country);
  const continentSlug = getContinentSlug(country);

  return continentSlug
    ? `${config.scraper.baseUrl}/hostels/${continentSlug}/${countrySlug}/${citySlug}/`
    : `${config.scraper.baseUrl}/hostels/${countrySlug}/${citySlug}/`;
}

function toCitySuggestion(item: RawSuggestItem): CitySuggestion {
  const { cityName, country } = parseNameSegments(item.englishName ?? item.name);
  return {
    name: cityName,
    country,
    hostelworldId: String(item.id),
    destinationUrl: buildDestinationUrl(cityName, country),
    displayLabel: item.englishName ?? item.name,
  };
}

/**
 * Calls Hostelworld's live destination-suggest endpoint and returns only
 * city-type results.
 *
 * ROUTED THROUGH A REAL BROWSER (Sept 2026) — a bare Node-side fetch()
 * to this endpoint, even with a full set of realistic browser headers,
 * consistently got HTTP 403. An identical request (same API key) from
 * a real Chrome browser succeeded every time — pointing to
 * TLS/connection-level fingerprinting, which no HTTP header can spoof.
 * Fix: run the actual fetch() call INSIDE a real Chromium page's own
 * JavaScript context (page.evaluate), on a page genuinely navigated to
 * Hostelworld's own domain — the browser's native fetch, same as what
 * happens for a real visitor.
 *
 * SPEED: reuses a shared, already-launched browser process
 * (openSharedPage) instead of launching a fresh one per request, but
 * still opens a NEW, isolated context + real navigation for each call.
 * This is the version PROVEN reliable via repeated testing (~2.6-2.7s,
 * consistent) — a further optimization using one single persistent
 * page across all requests was tried and rolled back after it hung for
 * 93 seconds on one request and then silently broke, returning fast,
 * empty, wrong results for every request after that with no recovery
 * path. That's a worse failure mode than this version's honest,
 * consistent ~2.6s — not worth the risk without proper health-check
 * and retry logic, which is future work, not this fix.
 *
 * Server-side only. Throws on any failure; the caller (the
 * /api/autocomplete route) is responsible for catching this and
 * degrading gracefully.
 */
export async function fetchHostelworldSuggestions(query: string): Promise<CitySuggestion[]> {
  const apiKey = process.env.HOSTELWORLD_AUTOCOMPLETE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'HOSTELWORLD_AUTOCOMPLETE_API_KEY is not set. Add it to .env.local (see .env.example).'
    );
  }

  const { autocomplete } = config.scraper;
  const url = `${autocomplete.baseUrl}${autocomplete.path}?text=${encodeURIComponent(query)}&v=${autocomplete.variant}`;

  const { context, page } = await openSharedPage();

  try {
    await page.goto(config.scraper.baseUrl, { waitUntil: 'domcontentloaded' });

    const raw = await page.evaluate(
      async ({ url, apiKey }) => {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'api-key': apiKey,
          },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Hostelworld suggest API returned HTTP ${response.status}`);
        }
        return response.json();
      },
      { url, apiKey }
    );

    const cities = (raw as RawSuggestItem[])
      .filter((item): item is RawSuggestItem => item.type === 'city')
      .map(toCitySuggestion);

    logger.warn(
      `"${query}" -> ${cities.length} city suggestion(s) (${(raw as RawSuggestItem[]).length} raw items) [browser-routed].`
    );

    return cities;
  } finally {
    await context.close();
  }
}
