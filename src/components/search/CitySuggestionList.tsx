import type { CitySuggestion } from '@/types/city';
import { CountryFlag } from '@/components/ui/CountryFlag';

interface CitySuggestionListProps {
  suggestions: CitySuggestion[];
  isLoading: boolean;
  showManualFallback: boolean;
  manualFallbackQuery: string;
  highlightedIndex: number;
  onSelectSuggestion: (suggestion: CitySuggestion) => void;
  onSelectManualFallback: () => void;
  onHover: (index: number) => void;
}

/**
 * Pure presentational dropdown. The manual-fallback row (index ==
 * suggestions.length when shown) exists for when Hostelworld's real
 * autocomplete returns nothing — network hiccup, API downtime, or a
 * genuinely obscure destination it doesn't recognize.
 */
export function CitySuggestionList({
  suggestions,
  isLoading,
  showManualFallback,
  manualFallbackQuery,
  highlightedIndex,
  onSelectSuggestion,
  onSelectManualFallback,
  onHover,
}: CitySuggestionListProps) {
  if (!isLoading && suggestions.length === 0 && !showManualFallback) return null;

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-ink-100 bg-white shadow-lg"
    >
      {isLoading && (
        <li className="px-4 py-3 font-data text-xs text-ink-300">Searching...</li>
      )}

      {!isLoading &&
        suggestions.map((suggestion, index) => {
          const isHighlighted = index === highlightedIndex;
          return (
            <li key={suggestion.hostelworldId} role="option" aria-selected={isHighlighted}>
              <button
                type="button"
                onMouseEnter={() => onHover(index)}
                onClick={() => onSelectSuggestion(suggestion)}
                className={[
                  'flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left transition-colors',
                  isHighlighted ? 'bg-teal-50' : 'bg-white hover:bg-paper-50',
                ].join(' ')}
              >
                <span className="font-body text-sm font-medium text-ink-900">{suggestion.name}</span>
                <span className="flex items-center gap-1.5 font-data text-xs text-ink-500">
                  <CountryFlag country={suggestion.country} />
                  {suggestion.country}
                </span>
              </button>
            </li>
          );
        })}

      {!isLoading && showManualFallback && (
        <li role="option" aria-selected={highlightedIndex === suggestions.length}>
          <button
            type="button"
            onMouseEnter={() => onHover(suggestions.length)}
            onClick={onSelectManualFallback}
            className={[
              'flex w-full items-center gap-2 border-t border-ink-100 px-4 py-3 text-left transition-colors',
              highlightedIndex === suggestions.length ? 'bg-amber-400/10' : 'bg-white hover:bg-paper-50',
            ].join(' ')}
          >
            <span className="font-body text-sm text-ink-700">
              Can&apos;t find it? Add &ldquo;<span className="font-medium">{manualFallbackQuery}</span>&rdquo; manually
            </span>
          </button>
        </li>
      )}
    </ul>
  );
}
