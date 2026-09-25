'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { SUPPORTED_CURRENCIES, type CurrencyOption } from '@/lib/utils/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
}

/**
 * Type-to-filter currency picker. Unlike CitySearchInput, this filters
 * a static local list (no network call / debounce needed) — same
 * interaction pattern (type, see matches, arrow keys + Enter to
 * select) applied to a much simpler data source.
 */
export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const selected = SUPPORTED_CURRENCIES.find((c) => c.code === value);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  function select(option: CurrencyOption) {
    onChange(option.code);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (matches.length > 0) setHighlightedIndex((prev) => (prev + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (matches.length > 0) setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = matches[highlightedIndex];
      if (option) select(option);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const displayValue = isOpen ? query : selected ? `${selected.name} (${selected.code})` : '';

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3.5 transition-colors focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/15">
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="currency-suggestion-listbox"
          aria-autocomplete="list"
          value={displayValue}
          placeholder="Search for a currency..."
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent font-body text-base text-ink-900 outline-none placeholder:text-ink-300"
        />
      </div>

      {isOpen && (
        <ul
          id="currency-suggestion-listbox"
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1.5 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-2.5 font-body text-sm text-ink-400">No matching currency</li>
          ) : (
            matches.map((option, index) => (
              <li
                key={option.code}
                role="option"
                aria-selected={option.code === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex cursor-pointer items-center justify-between px-4 py-2.5 font-body text-sm ${
                  index === highlightedIndex ? 'bg-teal-50 text-teal-800' : 'text-ink-900'
                }`}
              >
                <span>{option.name}</span>
                <span className="font-data text-xs text-ink-400">{option.code}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
