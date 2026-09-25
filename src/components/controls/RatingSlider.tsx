import { Eyebrow } from '@/components/ui/Eyebrow';
import { Slider } from '@/components/ui/Slider';
import config from '@/config/config';

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const STEP = 0.1;

export function RatingSlider({ value, onChange }: RatingSliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Eyebrow>Minimum rating</Eyebrow>
        <span className="font-data text-2xl font-medium text-amber-600">{value.toFixed(1)}</span>
      </div>
      <div className="mt-3">
        <Slider
          min={config.filters.minAllowedRating}
          max={config.filters.maxAllowedRating}
          step={STEP}
          value={value}
          onChange={onChange}
          ariaLabel="Minimum hostel rating"
        />
      </div>
      <div className="mt-1 flex justify-between font-data text-[11px] text-ink-300">
        <span>{config.filters.minAllowedRating.toFixed(1)}</span>
        <span>{config.filters.maxAllowedRating.toFixed(1)}</span>
      </div>
    </div>
  );
}
