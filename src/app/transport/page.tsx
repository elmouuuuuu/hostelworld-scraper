'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EuropeMap } from '@/components/transport/EuropeMap';
import { CitySearch } from '@/components/transport/CitySearch';
import { ConnectionPanel } from '@/components/transport/ConnectionPanel';
import { PriceLegend } from '@/components/transport/PriceLegend';
import { SAMPLE_CITIES, findCityById } from '@/data/transport/sampleCities';
import { SAMPLE_ROUTES } from '@/data/transport/sampleRoutes';
import { computePercentileThresholds, getValueColor } from '@/lib/transport/pricing';

export default function TransportPage() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const priceThresholds = useMemo(
    () =>
      computePercentileThresholds(
        SAMPLE_ROUTES.map((r) => r.price).filter((p): p is number => p != null)
      ),
    []
  );

  const colorForRoute = useMemo(
    () => (route: (typeof SAMPLE_ROUTES)[number]) =>
      route.price != null && priceThresholds ? getValueColor(route.price, priceThresholds) : '#9ca3af',
    [priceThresholds]
  );

  const selectedCity = selectedCityId ? findCityById(selectedCityId) : null;

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-700">
              &larr; Hostel Scraper
            </Link>
            <span className="text-gray-200">|</span>
            <h1 className="text-base font-semibold text-gray-900">Europe Transport Map</h1>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            Explore direct bus, train, high-speed rail and flight connections across Europe.
          </p>
        </div>
        <div className="w-72">
          <CitySearch onSelectCity={setSelectedCityId} />
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
        Phase 1 prototype — every route shown uses illustrative sample data, not real current fares. Real data
        integration is a later phase.
      </div>

      <div className="relative flex-1">
        <EuropeMap
          cities={SAMPLE_CITIES}
          routes={SAMPLE_ROUTES}
          colorForRoute={colorForRoute}
          selectedCityId={selectedCityId}
          onSelectCity={setSelectedCityId}
        />

        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute bottom-4 left-4">
            <PriceLegend />
          </div>

          {selectedCity && (
            <div className="pointer-events-auto absolute right-4 top-4 h-[calc(100%-2rem)] w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <ConnectionPanel
                city={selectedCity}
                routes={SAMPLE_ROUTES}
                priceThresholds={priceThresholds}
                onClose={() => setSelectedCityId(null)}
                onSelectDestination={setSelectedCityId}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
