import { Eyebrow } from '@/components/ui/Eyebrow';
import { Switch } from '@/components/ui/Switch';

interface DetailedModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  maxCities: number;
}

export function DetailedModeToggle({ enabled, onChange, maxCities }: DetailedModeToggleProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Eyebrow>Detailed mode</Eyebrow>
        <Switch checked={enabled} onChange={onChange} label="Toggle Detailed Mode" id="detailed-mode-toggle" />
      </div>
      <p className="mt-3 font-body text-sm leading-relaxed text-ink-500">
        Exact prices, real room names, and bed counts, instead of rounded, category-only pricing. Meaningfully
        slower per city, so limited to {maxCities} {maxCities === 1 ? 'city' : 'cities'} per report.
      </p>
    </div>
  );
}
