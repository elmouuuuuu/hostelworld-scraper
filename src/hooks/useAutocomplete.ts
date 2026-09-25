'use client';

import { useEffect, useRef, useState } from 'react';
import type { CitySuggestion } from '@/types/city';
import type { AutocompleteResponse } from '@/types/api';

const DEBOUNCE_MS = 600;
const MIN_QUERY_LENGTH = 2;

interface UseAutocompleteResult {
  query: string;
  setQuery: (value: string) => void;
  suggestions: CitySuggestion[];
  isLoading: boolean;
  /** True once a request has actually completed for the current query — lets the UI distinguish "haven't searched yet" from "searched, found nothing". */
  hasSearched: boolean;
}

/**
 * Debounces the search query and fetches real suggestions from
 * /api/autocomplete. Guards against race conditions: if the query
 * changes again before a request resolves, that stale response is
 * discarded rather than overwriting newer results.
 */
export function useAutocomplete(): UseAutocompleteResult {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(false);

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++latestRequestIdRef.current;

      fetch(`/api/autocomplete?q=${encodeURIComponent(trimmed)}`)
        .then((response) => response.json() as Promise<AutocompleteResponse>)
        .then((data) => {
          if (requestId !== latestRequestIdRef.current) return; // stale — a newer query superseded this one
          setSuggestions(data.suggestions);
        })
        .catch(() => {
          if (requestId !== latestRequestIdRef.current) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (requestId !== latestRequestIdRef.current) return;
          setIsLoading(false);
          setHasSearched(true);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  return { query, setQuery, suggestions, isLoading, hasSearched };
}
