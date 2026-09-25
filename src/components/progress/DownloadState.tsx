import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { GenerateReportSummary } from '@/types/api';

interface DownloadStateProps {
  fileName: string;
  summary: GenerateReportSummary;
  onDownloadAgain: () => void;
  onNewSearch: () => void;
}

export function DownloadState({ fileName, summary, onDownloadAgain, onNewSearch }: DownloadStateProps) {
  return (
    <div className="rounded-2xl border border-teal-600/20 bg-teal-50 p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 font-data text-xs font-bold text-white"
        >
          &#10003;
        </span>
        <Eyebrow className="text-teal-700">Report ready</Eyebrow>
      </div>

      <p className="mt-3 font-body text-sm text-ink-700">
        <span className="font-data">{fileName}</span> downloaded &mdash;{' '}
        {summary.totalQualifyingHostels} qualifying hostels across {summary.cities.length}{' '}
        {summary.cities.length === 1 ? 'city' : 'cities'}.
        {summary.failedCities.length > 0 && (
          <>
            {' '}
            {summary.failedCities.length} {summary.failedCities.length === 1 ? 'city' : 'cities'}{' '}
            could not be found and {summary.failedCities.length === 1 ? 'was' : 'were'} marked N/A.
          </>
        )}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onDownloadAgain}>
          Download again
        </Button>
        <Button variant="ghost" onClick={onNewSearch}>
          New search
        </Button>
      </div>
    </div>
  );
}
