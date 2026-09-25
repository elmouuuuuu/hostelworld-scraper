'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TransportCity } from '@/types/transportCity';
import type { TransportRoute } from '@/types/transportRoute';
import { citiesToGeoJSON, routesToGeoJSON } from '@/lib/transport/geojson';

// Free, no-API-key vector tile style — deliberately avoids requiring a
// Mapbox/MapTiler account for this prototype. "Positron" is a clean,
// low-saturation basemap chosen specifically so colorful route lines
// stand out on top of it (spec section 11: clean background, minimal
// clutter, geography clearly visible but not competing for attention).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const EUROPE_CENTER: [number, number] = [10, 50];
const EUROPE_ZOOM = 4;

interface EuropeMapProps {
  cities: TransportCity[];
  routes: TransportRoute[];
  colorForRoute: (route: TransportRoute) => string;
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
}

export function EuropeMap({ cities, routes, colorForRoute, selectedCityId, onSelectCity }: EuropeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectCityRef = useRef(onSelectCity);
  onSelectCityRef.current = onSelectCity;

  // Map is created once on mount — MapLibre needs a real DOM node and
  // WebGL context, both browser-only, so this must live inside
  // useEffect (never at module/render top level) to avoid breaking SSR.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: EUROPE_CENTER,
      zoom: EUROPE_ZOOM,
      minZoom: 2,
      maxZoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('cities', { type: 'geojson', data: citiesToGeoJSON(cities) });
      map.addSource('routes', { type: 'geojson', data: routesToGeoJSON(routes, colorForRoute) });

      map.addLayer({
        id: 'routes-solid',
        type: 'line',
        source: 'routes',
        filter: ['!=', ['get', 'mode'], 'bus'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['match', ['get', 'mode'], 'high_speed_train', 4, 'flight', 2.5, 2],
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'routes-dashed',
        type: 'line',
        source: 'routes',
        filter: ['==', ['get', 'mode'], 'bus'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'city-points',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'id'], selectedCityId ?? ''], 8, 5],
          'circle-color': ['case', ['==', ['get', 'id'], selectedCityId ?? ''], '#111827', '#374151'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'cities',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      const routeClickHandler = (event: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ['routes-solid', 'routes-dashed'],
        });
        const feature = features[0];
        if (!feature) return;

        const props = feature.properties as {
          originName: string;
          destinationName: string;
          mode: string;
          operator: string;
          price?: number;
          durationMinutes?: number;
        };

        const modeLabel = props.mode.replace(/_/g, ' ');
        const durationLabel = props.durationMinutes
          ? `${Math.floor(props.durationMinutes / 60)}h ${props.durationMinutes % 60}m`
          : 'unknown';

        new maplibregl.Popup({ closeButton: true })
          .setLngLat(event.lngLat)
          .setHTML(
            `<div style="font-family: system-ui; font-size: 13px; line-height: 1.5;">
              <strong>${props.originName} &rarr; ${props.destinationName}</strong><br/>
              ${modeLabel} &middot; ${props.operator}<br/>
              ${props.price ? `CA$${props.price}` : 'Price unavailable'} &middot; ${durationLabel}
            </div>`
          )
          .addTo(map);
      };

      map.on('click', 'routes-solid', routeClickHandler);
      map.on('click', 'routes-dashed', routeClickHandler);

      map.on('click', 'city-points', (event) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;
        if (typeof id === 'string') onSelectCityRef.current(id);
      });

      ['city-points', 'routes-solid', 'routes-dashed'].forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const citiesSource = map.getSource('cities') as maplibregl.GeoJSONSource | undefined;
    const routesSource = map.getSource('routes') as maplibregl.GeoJSONSource | undefined;
    citiesSource?.setData(citiesToGeoJSON(cities));
    routesSource?.setData(routesToGeoJSON(routes, colorForRoute));
  }, [cities, routes, colorForRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('city-points')) return;

    map.setPaintProperty('city-points', 'circle-radius', [
      'case',
      ['==', ['get', 'id'], selectedCityId ?? ''],
      8,
      5,
    ]);
    map.setPaintProperty('city-points', 'circle-color', [
      'case',
      ['==', ['get', 'id'], selectedCityId ?? ''],
      '#111827',
      '#374151',
    ]);
  }, [selectedCityId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
