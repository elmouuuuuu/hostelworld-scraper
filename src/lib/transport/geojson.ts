import type { TransportCity } from '@/types/transportCity';
import type { TransportRoute } from '@/types/transportRoute';
import { findCityById } from '@/data/transport/sampleCities';

export function citiesToGeoJSON(cities: TransportCity[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cities.map((city) => ({
      type: 'Feature',
      id: city.id,
      geometry: { type: 'Point', coordinates: [city.longitude, city.latitude] },
      properties: {
        id: city.id,
        name: city.name,
        country: city.country,
        isCapital: city.isCapital,
      },
    })),
  };
}

/**
 * Generates a curved arc between two points via quadratic Bezier
 * interpolation with a perpendicular control-point offset — used for
 * flight routes specifically (spec section 13: flights should read
 * visually distinct from ground transport, not drawn as straight
 * road-like lines). Verified against real coordinates before use — see
 * conversation history for the numeric check (arc starts/ends exactly
 * at the real origin/destination, with genuine curvature between).
 */
function generateArcCoordinates(
  start: [number, number],
  end: [number, number],
  curveHeight = 0.15,
  steps = 32
): [number, number][] {
  const [lon1, lat1] = start;
  const [lon2, lat2] = end;
  const midLon = (lon1 + lon2) / 2;
  const midLat = (lat1 + lat2) / 2;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return [start, end];

  const controlLon = midLon + (-dy / dist) * dist * curveHeight;
  const controlLat = midLat + (dx / dist) * dist * curveHeight;

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = (1 - t) ** 2 * lon1 + 2 * (1 - t) * t * controlLon + t ** 2 * lon2;
    const lat = (1 - t) ** 2 * lat1 + 2 * (1 - t) * t * controlLat + t ** 2 * lat2;
    points.push([lon, lat]);
  }
  return points;
}

export interface RouteFeatureProperties {
  id: string;
  mode: TransportRoute['mode'];
  operator: string;
  price?: number;
  durationMinutes?: number;
  originCityId: string;
  destinationCityId: string;
  originName: string;
  destinationName: string;
  color: string;
}

/**
 * Converts routes into a GeoJSON FeatureCollection of LineStrings.
 * Flight routes get curved arc geometry; every other mode gets a
 * straight line — the mode's VISUAL style (dashed/solid/thick) is
 * applied separately via MapLibre paint properties keyed on the `mode`
 * property, not baked into the geometry.
 */
export function routesToGeoJSON(
  routes: TransportRoute[],
  colorForRoute: (route: TransportRoute) => string
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const route of routes) {
    const origin = findCityById(route.originCityId);
    const destination = findCityById(route.destinationCityId);
    if (!origin || !destination) continue;

    const start: [number, number] = [origin.longitude, origin.latitude];
    const end: [number, number] = [destination.longitude, destination.latitude];

    const coordinates = route.mode === 'flight' ? generateArcCoordinates(start, end) : [start, end];

    const properties: RouteFeatureProperties = {
      id: route.id,
      mode: route.mode,
      operator: route.operator,
      price: route.price,
      durationMinutes: route.durationMinutes,
      originCityId: route.originCityId,
      destinationCityId: route.destinationCityId,
      originName: origin.name,
      destinationName: destination.name,
      color: colorForRoute(route),
    };

    features.push({
      type: 'Feature',
      id: route.id,
      geometry: { type: 'LineString', coordinates },
      properties,
    });
  }

  return { type: 'FeatureCollection', features };
}
