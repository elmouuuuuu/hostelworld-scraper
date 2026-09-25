import type { TransportCity } from '@/types/transportCity';

/**
 * Phase 1 prototype city list — real cities, real coordinates, chosen
 * for geographic spread across the regions the spec requires (Western,
 * Northern, Southern, Central, Eastern Europe). Deliberately small
 * (~18 cities) since Phase 1's goal is validating the map/UX, not
 * comprehensive coverage — Phase 2 builds the real, larger database.
 *
 * Italian cities are included here for map completeness (this is
 * geography, not sourced data) — the "skip Italy" decision applies to
 * REAL data sourcing (Phase 4+), not to whether Rome/Milan appear as
 * points on a Phase 1 mock-data map.
 */
export const SAMPLE_CITIES: TransportCity[] = [
  { id: 'paris', name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, population: 2148000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'london', name: 'London', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, population: 8982000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'berlin', name: 'Berlin', country: 'Germany', countryCode: 'DE', latitude: 52.52, longitude: 13.405, population: 3645000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'madrid', name: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038, population: 3223000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'rome', name: 'Rome', country: 'Italy', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964, population: 2873000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', latitude: 52.3676, longitude: 4.9041, population: 872000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'brussels', name: 'Brussels', country: 'Belgium', countryCode: 'BE', latitude: 50.8503, longitude: 4.3517, population: 1219000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'vienna', name: 'Vienna', country: 'Austria', countryCode: 'AT', latitude: 48.2082, longitude: 16.3738, population: 1897000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', countryCode: 'CH', latitude: 47.3769, longitude: 8.5417, population: 421000, isCapital: false, isMajorCity: true, isTransportHub: true },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', countryCode: 'ES', latitude: 41.3874, longitude: 2.1686, population: 1620000, isCapital: false, isMajorCity: true, isTransportHub: true },
  { id: 'munich', name: 'Munich', country: 'Germany', countryCode: 'DE', latitude: 48.1351, longitude: 11.582, population: 1472000, isCapital: false, isMajorCity: true, isTransportHub: true },
  { id: 'milan', name: 'Milan', country: 'Italy', countryCode: 'IT', latitude: 45.4642, longitude: 9.19, population: 1352000, isCapital: false, isMajorCity: true, isTransportHub: true },
  { id: 'prague', name: 'Prague', country: 'Czech Republic', countryCode: 'CZ', latitude: 50.0755, longitude: 14.4378, population: 1309000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', countryCode: 'PT', latitude: 38.7223, longitude: -9.1393, population: 545000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', countryCode: 'DK', latitude: 55.6761, longitude: 12.5683, population: 644000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', countryCode: 'PL', latitude: 52.2297, longitude: 21.0122, population: 1861000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'dublin', name: 'Dublin', country: 'Ireland', countryCode: 'IE', latitude: 53.3498, longitude: -6.2603, population: 592000, isCapital: true, isMajorCity: true, isTransportHub: true },
  { id: 'stockholm', name: 'Stockholm', country: 'Sweden', countryCode: 'SE', latitude: 59.3293, longitude: 18.0686, population: 978000, isCapital: true, isMajorCity: true, isTransportHub: true },
];

export function findCityById(id: string): TransportCity | undefined {
  return SAMPLE_CITIES.find((c) => c.id === id);
}
