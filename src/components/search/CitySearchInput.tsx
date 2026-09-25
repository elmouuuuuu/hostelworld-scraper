'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import type { CitySuggestion } from '@/types/city';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { CitySuggestionList } from './CitySuggestionList';

interface CitySearchInputProps {
  onSelectCity: (suggestion: CitySuggestion) => void;
  onAddManualCity: (rawQuery: string) => void;
  /** hostelworldIds already selected, so they don't reappear in suggestions */
  excludeHostelworldIds: string[];
  placeholder?: string;
}

/**
 * Real, live autocomplete against Hostelworld's own destination-suggest
 * API (via /api/autocomplete). Falls back to manual entry if the API
 * returns nothing for a query that's long enough to be a real search —
 * covers both genuinely obscure destinations and API downtime.
 */
export function CitySearchInput({
  onSelectCity,
  onAddManualCity,
  excludeHostelworldIds,
  placeholder = 'Search for a city...',
}: CitySearchInputProps) {
  const { query, setQuery, suggestions, isLoading, hasSearched } = useAutocomplete();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const excludeSet = useMemo(() => new Set(excludeHostelworldIds), [excludeHostelworldIds]);
  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !excludeSet.has(s.hostelworldId)),
    [suggestions, excludeSet]
  );

  const trimmedQuery = query.trim();
  const showManualFallback = hasSearched && !isLoading && visibleSuggestions.length === 0 && trimmedQuery.length > 0;
  const totalSelectableItems = visibleSuggestions.length + (showManualFallback ? 1 : 0);

  function selectSuggestion(suggestion: CitySuggestion) {
    onSelectCity(suggestion);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function selectManualFallback() {
    if (trimmedQuery.length === 0) return;
    onAddManualCity(trimmedQuery);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (totalSelectableItems > 0) {
        setHighlightedIndex((prev) => (prev + 1) % totalSelectableItems);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (totalSelectableItems > 0) {
        setHighlightedIndex((prev) => (prev - 1 + totalSelectableItems) % totalSelectableItems);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex < visibleSuggestions.length) {
        const suggestion = visibleSuggestions[highlightedIndex];
        if (suggestion) selectSuggestion(suggestion);
      } else if (showManualFallback) {
        selectManualFallback();
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3.5 transition-colors focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/15">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-ink-300">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-suggestion-listbox"
          aria-autocomplete="list"
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent font-body text-base text-ink-900 outline-none placeholder:text-ink-300"
        />
      </div>

      {isOpen && (
        <CitySuggestionList
          suggestions={visibleSuggestions}
          isLoading={isLoading}
          showManualFallback={showManualFallback}
          manualFallbackQuery={trimmedQuery}
          highlightedIndex={highlightedIndex}
          onSelectSuggestion={selectSuggestion}
          onSelectManualFallback={selectManualFallback}
          onHover={setHighlightedIndex}
        />
      )}
    </div>
  );
}
