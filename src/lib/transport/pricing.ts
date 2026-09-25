/**
 * Centralized price/duration color configuration. Every place in the
 * app that needs a price or duration color reads from here — per spec
 * section 45, colors are never hardcoded ad hoc elsewhere.
 */
export const PRICE_COLORS = {
  cheapest: '#2563eb', // blue
  cheap: '#16a34a', // green
  moderate: '#ca8a04', // yellow
  expensive: '#dc2626', // red
} as const;

export type PriceTier = keyof typeof PRICE_COLORS;

export interface PercentileThresholds {
  p25: number;
  p50: number;
  p75: number;
}

/**
 * Linear-interpolation percentile (matches the common statistical
 * definition, not just "nearest index") — computed fresh from whatever
 * route data is currently in view, never a fixed global constant. This
 * is what makes the color scale adapt automatically as real data
 * replaces sample data in later phases, per spec section 9.
 */
export function computePercentileThresholds(values: number[]): PercentileThresholds | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);

  function percentile(p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  return { p25: percentile(25), p50: percentile(50), p75: percentile(75) };
}

/**
 * Classifies a value (price or duration) into one of the four tiers
 * using thresholds computed from the CURRENT dataset — never a fixed
 * "< $20 = blue" style rule, per spec section 9's explicit requirement.
 */
export function getValueTier(value: number, thresholds: PercentileThresholds): PriceTier {
  if (value <= thresholds.p25) return 'cheapest';
  if (value <= thresholds.p50) return 'cheap';
  if (value <= thresholds.p75) return 'moderate';
  return 'expensive';
}

export function getValueColor(value: number, thresholds: PercentileThresholds): string {
  return PRICE_COLORS[getValueTier(value, thresholds)];
}
