import { Eyebrow } from '@/components/ui/Eyebrow';
import { Switch } from '@/components/ui/Switch';

interface RawDataToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function RawDataToggle({ enabled, onChange }: RawDataToggleProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Eyebrow>Raw data mode</Eyebrow>
        <Switch checked={enabled} onChange={onChange} label="Toggle Raw Data Mode" id="raw-data-toggle" />
      </div>
      <p className="mt-3 font-body text-sm leading-relaxed text-ink-500">
        Adds a second worksheet listing every qualifying hostel individually, instead of just city-level summaries.
      </p>
    </div>
  );
}
