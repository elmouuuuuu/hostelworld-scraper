'use client';

import { useMemo, useState } from 'react';
import { SAMPLE_CITIES } from '@/data/transport/sampleCities';

interface CitySearchProps {
  onSelectCity: (cityId: string) => void;
}

export function CitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return SAMPLE_CITIES;
    return SAMPLE_CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        placeholder="Search a city..."
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
      {isOpen && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No matching city</li>
          ) : (
            matches.map((city) => (
              <li
                key={city.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectCity(city.id);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{city.name}</span>
                <span className="ml-1.5 text-gray-400">{city.country}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
