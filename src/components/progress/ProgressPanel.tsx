import type { ProgressEvent } from '@/types/api';
import { BarcodeProgress } from './BarcodeProgress';
import { Eyebrow } from '@/components/ui/Eyebrow';

interface ProgressPanelProps {
  events: ProgressEvent[];
  latestEvent: ProgressEvent | null;
  onCancel: () => void;
}

export function ProgressPanel({ events, latestEvent, onCancel }: ProgressPanelProps) {
  const percent = latestEvent?.overallPercent ?? 0;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Generating report</Eyebrow>
        <div className="flex items-center gap-3">
          <span className="font-data text-sm text-ink-500">{Math.round(percent)}%</span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2.5 py-1 font-body text-xs font-medium text-stamp-600 transition-colors hover:bg-stamp-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-600"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="mt-4">
        <BarcodeProgress percent={percent} />
      </div>

      <p className="mt-4 font-body text-sm font-medium text-ink-900">
        {latestEvent?.message ?? 'Starting...'}
      </p>

      <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-ink-900 p-4">
        <ol className="space-y-1">
          {events.map((event, index) => (
            <li key={`${event.timestamp}-${index}`} className="font-data text-xs text-teal-100/90">
              <span className="text-ink-300">{`>`}</span> {event.message}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
