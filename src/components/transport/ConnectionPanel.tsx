'use client';

import { useMemo, useState } from 'react';
import type { TransportCity } from '@/types/transportCity';
import type { TransportRoute } from '@/types/transportRoute';
import { findCityById } from '@/data/transport/sampleCities';
import type { PercentileThresholds } from '@/lib/transport/pricing';
import { getValueColor } from '@/lib/transport/pricing';

type SortKey = 'price' | 'duration' | 'destination';

const MODE_LABELS: Record<TransportRoute['mode'], string> = {
  bus: 'Bus',
  train: 'Train',
  high_speed_train: 'High-speed train',
  flight: 'Flight',
};

interface ConnectionPanelProps {
  city: TransportCity;
  routes: TransportRoute[];
  priceThresholds: PercentileThresholds | null;
  onClose: () => void;
  onSelectDestination: (cityId: string) => void;
}

export function ConnectionPanel({ city, routes, priceThresholds, onClose, onSelectDestination }: ConnectionPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('price');

  const connections = useMemo(() => {
    const direct = routes.filter((r) => r.originCityId === city.id || r.destinationCityId === city.id);
    const withDestination = direct.map((route) => {
      const destinationId = route.originCityId === city.id ? route.destinationCityId : route.originCityId;
      const destination = findCityById(destinationId);
      return { route, destination };
    });

    return [...withDestination].sort((a, b) => {
      if (sortKey === 'price') return (a.route.price ?? Infinity) - (b.route.price ?? Infinity);
      if (sortKey === 'duration') return (a.route.durationMinutes ?? Infinity) - (b.route.durationMinutes ?? Infinity);
      return (a.destination?.name ?? '').localeCompare(b.destination?.name ?? '');
    });
  }, [routes, city.id, sortKey]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{city.country}</p>
          <h2 className="text-lg font-semibold text-gray-900">{city.name}</h2>
          <p className="mt-0.5 text-xs text-gray-400">{connections.length} direct connections</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-100 px-4 py-2 text-xs">
        {(['price', 'duration', 'destination'] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`rounded-full px-2.5 py-1 ${sortKey === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            {key === 'price' ? 'Cheapest' : key === 'duration' ? 'Fastest' : 'A-Z'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No direct connections in this dataset.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {connections.map(({ route, destination }) => {
              if (!destination) return null;
              const color = route.price !== undefined && priceThresholds ? getValueColor(route.price, priceThresholds) : '#9ca3af';
              const duration = route.durationMinutes
                ? `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`
                : 'unknown';

              return (
                <li key={route.id}>
                  <button
                    onClick={() => onSelectDestination(destination.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{destination.name}</p>
                      <p className="text-xs text-gray-400">
                        {MODE_LABELS[route.mode]} &middot; {route.operator} &middot; {duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-gray-900">
                        {route.price !== undefined ? `CA$${route.price}` : 'N/A'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
