'use client';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { formatSearchDate } from '@/lib/utils/dateUtils';

export type DateMode = 'auto' | 'manual';

interface DateRangeSelectorProps {
  mode: DateMode;
  onModeChange: (mode: DateMode) => void;
  autoCheckIn: Date;
  autoCheckOut: Date;
  manualCheckIn: string;
  manualCheckOut: string;
  onManualCheckInChange: (value: string) => void;
  onManualCheckOutChange: (value: string) => void;
}

/**
 * Lets the user pick their own stay dates, or fall back to the
 * auto-computed default (next month's first Tuesday-Thursday). Manual
 * mode isn't constrained to a 2-night stay — that constraint was
 * specific to the auto-computed default, not a general rule.
 */
export function DateRangeSelector({
  mode,
  onModeChange,
  autoCheckIn,
  autoCheckOut,
  manualCheckIn,
  manualCheckOut,
  onManualCheckInChange,
  onManualCheckOutChange,
}: DateRangeSelectorProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Eyebrow>Stay dates</Eyebrow>
        <div className="flex rounded-full border border-ink-200 p-0.5 font-body text-xs font-medium">
          <button
            type="button"
            onClick={() => onModeChange('auto')}
            aria-pressed={mode === 'auto'}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === 'auto' ? 'bg-teal-600 text-white' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => onModeChange('manual')}
            aria-pressed={mode === 'manual'}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === 'manual' ? 'bg-teal-600 text-white' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === 'auto' ? (
        <p className="mt-2 font-data text-sm text-ink-700">
          {formatSearchDate(autoCheckIn)} &rarr; {formatSearchDate(autoCheckOut)}
          <span className="ml-2 text-ink-300">(auto)</span>
        </p>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={manualCheckIn}
            min={todayIso}
            onChange={(event) => onManualCheckInChange(event.target.value)}
            aria-label="Check-in date"
            className="rounded-lg border border-ink-200 px-2.5 py-1.5 font-data text-sm text-ink-900 outline-none focus:border-teal-600"
          />
          <span aria-hidden="true" className="text-ink-300">
            &rarr;
          </span>
          <input
            type="date"
            value={manualCheckOut}
            min={manualCheckIn || todayIso}
            onChange={(event) => onManualCheckOutChange(event.target.value)}
            aria-label="Check-out date"
            className="rounded-lg border border-ink-200 px-2.5 py-1.5 font-data text-sm text-ink-900 outline-none focus:border-teal-600"
          />
        </div>
      )}
    </div>
  );
}
