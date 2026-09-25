import { statFrom, type StatValue } from '@/types/report';

/**
 * Pure statistics helpers. No I/O, no framework dependency — same
 * design principle as the rest of lib/statistics/: these are plain
 * functions over plain arrays, fully unit-testable in isolation and
 * reusable outside Next.js if V2 ever needs that.
 */

export function calculateAverage(values: number[]): StatValue {
  if (values.length === 0) return { available: false };
  const sum = values.reduce((total, value) => total + value, 0);
  return statFrom(sum / values.length);
}

export function calculateMedian(values: number[]): StatValue {
  if (values.length === 0) return { available: false };

  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0 ? (sorted[middleIndex - 1] + sorted[middleIndex]) / 2 : sorted[middleIndex];

  return statFrom(median);
}
