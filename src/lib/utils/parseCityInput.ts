export interface ParsedCityInput {
  name: string;
  country: string;
}

/**
 * Parses free-typed "City" or "City, Country" text into a name/country
 * pair. Exists only because real Hostelworld autocomplete (Milestone 3)
 * isn't wired up yet.
 */
export function parseCityInput(raw: string): ParsedCityInput {
  const [namePart, ...rest] = raw.split(',');
  return {
    name: namePart.trim(),
    country: rest.join(',').trim(),
  };
}
