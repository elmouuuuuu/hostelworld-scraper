export interface TimeEstimate {
  minMinutes: number;
  maxMinutes: number;
}

/**
 * Rough estimate of how long a report will take, shown to the user
 * before they generate one. Presented as a range, not a precise number,
 * since actual time depends heavily on how many qualifying hostels each
 * city has — something we can't know until the scrape actually runs.
 *
 * Based on real observed timing (Aug 2026): Barcelona, with precise
 * per-property pricing enabled, took ~6.5 minutes for 78 qualifying
 * hostels — roughly the upper end of the per-city range below. Cities
 * with far fewer hostels finish much faster, hence the wide range.
 *
 * `detailedMode` is now a per-request user choice (see
 * DetailedModeToggle.tsx), not a fixed server default.
 */
export function estimateReportTime(cityCount: number, detailedMode: boolean): TimeEstimate {
  if (cityCount <= 0) return { minMinutes: 0, maxMinutes: 0 };

  const [minPerCity, maxPerCity] = detailedMode ? [2, 7] : [0.5, 1.5];

  return {
    minMinutes: Math.max(1, Math.round(cityCount * minPerCity)),
    maxMinutes: Math.max(1, Math.round(cityCount * maxPerCity)),
  };
}
