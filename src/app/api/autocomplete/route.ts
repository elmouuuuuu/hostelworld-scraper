import { NextRequest, NextResponse } from 'next/server';
import type { AutocompleteResponse } from '@/types/api';
import { autocompleteQuerySchema } from '@/validation/schemas';
import { fetchHostelworldSuggestions } from '@/lib/scraper/hostelworldSuggestProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api:autocomplete');

export const runtime = 'nodejs';

/**
 * GET /api/autocomplete?q=bar
 *
 * Calls Hostelworld's real destination-suggest endpoint server-side (see
 * lib/scraper/hostelworldSuggestProvider.ts) and returns city-only
 * matches. Degrades gracefully: any failure (missing API key, network
 * error, Hostelworld downtime) is logged in detail server-side but still
 * returns a normal 200 with an empty suggestions array, so the frontend
 * never needs special-case error handling — it just falls through to the
 * manual "add as typed" option, same as if zero cities matched.
 */
export async function GET(request: NextRequest): Promise<NextResponse<AutocompleteResponse>> {
  const rawQuery = request.nextUrl.searchParams.get('q') ?? '';

  const parsed = autocompleteQuerySchema.safeParse({ q: rawQuery });
  if (!parsed.success) {
    // Too short to search yet (e.g. a single character) — not an error,
    // just nothing to suggest.
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await fetchHostelworldSuggestions(parsed.data.q);
    return NextResponse.json({ suggestions });
  } catch (error) {
    logger.error(`Autocomplete lookup failed for query "${parsed.data.q}"`, error);
    return NextResponse.json({ suggestions: [] });
  }
}
