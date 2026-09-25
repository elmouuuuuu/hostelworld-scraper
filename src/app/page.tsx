'use client';

import { useEffect, useMemo, useState } from 'react';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { CitySearchInput } from '@/components/search/CitySearchInput';
import { CityTag } from '@/components/search/CityTag';
import { RatingSlider } from '@/components/controls/RatingSlider';
import { RawDataToggle } from '@/components/controls/RawDataToggle';
import { DetailedModeToggle } from '@/components/controls/DetailedModeToggle';
import { CurrencySelector } from '@/components/controls/CurrencySelector';
import { DateRangeSelector, type DateMode } from '@/components/controls/DateRangeSelector';
import { GenerateReportButton } from '@/components/controls/GenerateReportButton';
import { ProgressPanel } from '@/components/progress/ProgressPanel';
import { ErrorBanner } from '@/components/progress/ErrorBanner';
import { DownloadState } from '@/components/progress/DownloadState';
import { TicketDivider } from '@/components/ui/TicketDivider';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { parseCityInput } from '@/lib/utils/parseCityInput';
import { slugify } from '@/lib/utils/slugify';
import { PENDING_CITY_ID_PREFIX } from '@/lib/utils/cityIdentity';
import { getAutoSearchDates } from '@/lib/utils/dateUtils';
import { estimateReportTime } from '@/lib/utils/estimateReportTime';
import type { CitySuggestion, SelectedCity } from '@/types/city';
import config from '@/config/config';

const DEFAULT_MINIMUM_RATING = 8.0;

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  const [selectedCities, setSelectedCities] = useState<SelectedCity[]>([]);
  const [minimumRating, setMinimumRating] = useState(DEFAULT_MINIMUM_RATING);
  const [rawDataMode, setRawDataMode] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const [currency, setCurrency] = useState('CAD');

  const [dateMode, setDateMode] = useState<DateMode>('auto');
  const [manualCheckIn, setManualCheckIn] = useState('');
  const [manualCheckOut, setManualCheckOut] = useState('');
  const [addCityError, setAddCityError] = useState<string | null>(null);

  const {
    status,
    events,
    latestEvent,
    errorMessage,
    summary,
    downloadedFileName,
    start,
    downloadAgain,
    reset,
  } = useReportGeneration();

  const { checkIn: autoCheckIn, checkOut: autoCheckOut } = useMemo(() => getAutoSearchDates(), []);
  const maxCities = detailedMode ? config.scraper.maxCitiesDetailedMode : config.scraper.maxCitiesFastMode;

  useEffect(() => {
    setAddCityError(null);
  }, [selectedCities.length, detailedMode]);
  const timeEstimate = useMemo(
    () => estimateReportTime(selectedCities.length, detailedMode),
    [selectedCities.length, detailedMode]
  );

  const isDuplicateName = (name: string) =>
    selectedCities.some((c) => c.name.toLowerCase() === name.toLowerCase());

  function handleSelectSuggestion(suggestion: CitySuggestion) {
    if (isDuplicateName(suggestion.name)) return;
    if (selectedCities.length >= maxCities) {
      setAddCityError(
        `You've reached the ${maxCities}-city limit${detailedMode ? ' for Detailed Mode' : ''}. Remove a city to add another${detailedMode ? ', or turn Detailed Mode off' : ''}.`
      );
      return;
    }
    setAddCityError(null);

    const newCity: SelectedCity = {
      ...suggestion,
      selectionId: `${suggestion.hostelworldId}-${Date.now()}`,
    };
    setSelectedCities((prev) => [...prev, newCity]);
  }

  function handleAddManualCity(raw: string) {
    const { name, country } = parseCityInput(raw);
    if (name.length === 0 || isDuplicateName(name)) return;
    if (selectedCities.length >= maxCities) {
      setAddCityError(
        `You've reached the ${maxCities}-city limit${detailedMode ? ' for Detailed Mode' : ''}. Remove a city to add another${detailedMode ? ', or turn Detailed Mode off' : ''}.`
      );
      return;
    }
    setAddCityError(null);

    const slug = slugify(name) || 'unknown';
    const newCity: SelectedCity = {
      name,
      country: country || 'Unknown',
      hostelworldId: `${PENDING_CITY_ID_PREFIX}${slug}`,
      destinationUrl: `${config.scraper.baseUrl}/hostels/${slug}`,
      displayLabel: country ? `${name}, ${country}` : name,
      selectionId: `${slug}-${Date.now()}`,
    };
    setSelectedCities((prev) => [...prev, newCity]);
  }

  function handleRemoveCity(selectionId: string) {
    setSelectedCities((prev) => prev.filter((c) => c.selectionId !== selectionId));
  }

  function handleGenerate() {
    start({
      cities: selectedCities,
      minimumRating,
      rawDataMode,
      currency,
      detailedMode,
      ...(dateMode === 'manual' && manualCheckIn && manualCheckOut
        ? { checkIn: manualCheckIn, checkOut: manualCheckOut }
        : {}),
    });
  }

  const isGenerating = status === 'running';
  const isOverCityLimit = selectedCities.length > maxCities;
  const manualDatesIncomplete = dateMode === 'manual' && (!manualCheckIn || !manualCheckOut);
  const manualDatesInvalid =
    dateMode === 'manual' && manualCheckIn && manualCheckOut && manualCheckOut <= manualCheckIn;
  const canGenerate =
    selectedCities.length > 0 &&
    !isGenerating &&
    !isOverCityLimit &&
    !manualDatesIncomplete &&
    !manualDatesInvalid;

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <main className="flex min-h-screen justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <Eyebrow className="justify-center text-teal-700">Trust me bro</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">
            {config.app.name}
          </h1>
          <p className="mx-auto mt-3 max-w-md font-body text-base text-ink-500">
            Search the cities you want to research, set a minimum rating, and generate a
            ready-to-use Excel report — no account, no history, no clutter.
          </p>
        </header>

        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
          <section>
            <Eyebrow>Destinations</Eyebrow>
            <div className="mt-3">
              <CitySearchInput
                onSelectCity={handleSelectSuggestion}
                onAddManualCity={handleAddManualCity}
                excludeHostelworldIds={selectedCities.map((c) => c.hostelworldId)}
                placeholder="Bar..."
              />
            </div>
            {selectedCities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCities.map((city) => (
                  <CityTag key={city.selectionId} city={city} onRemove={handleRemoveCity} />
                ))}
              </div>
            )}
            {isOverCityLimit && (
              <p className="mt-2 font-body text-xs text-stamp-600">
                Detailed mode allows up to {maxCities} cities — remove {selectedCities.length - maxCities} to
                continue, or turn Detailed mode off.
              </p>
            )}
            {addCityError && !isOverCityLimit && (
              <p className="mt-2 font-body text-xs text-stamp-600">{addCityError}</p>
            )}
          </section>

          <TicketDivider />

          <section>
            <Eyebrow>Currency</Eyebrow>
            <div className="mt-3">
              <CurrencySelector value={currency} onChange={setCurrency} />
            </div>
          </section>

          <TicketDivider />

          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <RatingSlider value={minimumRating} onChange={setMinimumRating} />
            <RawDataToggle enabled={rawDataMode} onChange={setRawDataMode} />
          </section>

          {config.scraper.allowDetailedMode && (
            <>
              <TicketDivider />
              <section>
                <DetailedModeToggle
                  enabled={detailedMode}
                  onChange={setDetailedMode}
                  maxCities={config.scraper.maxCitiesDetailedMode}
                />
              </section>
            </>
          )}

          <TicketDivider />

          <section>
            <DateRangeSelector
              mode={dateMode}
              onModeChange={setDateMode}
              autoCheckIn={autoCheckIn}
              autoCheckOut={autoCheckOut}
              manualCheckIn={manualCheckIn}
              manualCheckOut={manualCheckOut}
              onManualCheckInChange={setManualCheckIn}
              onManualCheckOutChange={setManualCheckOut}
            />
            {manualDatesInvalid && (
              <p className="mt-1.5 font-body text-xs text-stamp-600">Check-out must be after check-in.</p>
            )}
          </section>

          <TicketDivider />

          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {selectedCities.length > 0 && (
                <p className="font-data text-xs text-ink-400">
                  Estimated time: ~{timeEstimate.minMinutes}&ndash;{timeEstimate.maxMinutes} min
                  <span className="ml-1 text-ink-300">
                    ({selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'})
                  </span>
                </p>
              )}
            </div>
            <GenerateReportButton
              onClick={handleGenerate}
              disabled={!canGenerate}
              isGenerating={isGenerating}
            />
          </section>
        </div>

        {(status === 'running' || (status === 'success' && !downloadedFileName)) && (
          <div className="mt-6">
            <ProgressPanel events={events} latestEvent={latestEvent} onCancel={reset} />
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="mt-6">
            <ErrorBanner message={errorMessage} onDismiss={reset} />
          </div>
        )}

        {status === 'success' && summary && downloadedFileName && (
          <div className="mt-6">
            <DownloadState
              fileName={downloadedFileName}
              summary={summary}
              onDownloadAgain={downloadAgain}
              onNewSearch={reset}
            />
          </div>
        )}
      </div>
    </main>
  );
}
