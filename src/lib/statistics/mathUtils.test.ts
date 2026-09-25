import { describe, it, expect } from 'vitest';
import { calculateAverage, calculateMedian } from './mathUtils';

describe('calculateAverage', () => {
  it('returns unavailable for an empty array (never a fabricated zero)', () => {
    expect(calculateAverage([])).toEqual({ available: false });
  });

  it('computes the correct average', () => {
    expect(calculateAverage([10, 20, 30])).toEqual({ available: true, value: 20 });
  });

  it('handles a single value', () => {
    expect(calculateAverage([42])).toEqual({ available: true, value: 42 });
  });

  it('handles decimal results', () => {
    const result = calculateAverage([10, 15]);
    expect(result).toEqual({ available: true, value: 12.5 });
  });
});

describe('calculateMedian', () => {
  it('returns unavailable for an empty array', () => {
    expect(calculateMedian([])).toEqual({ available: false });
  });

  it('computes the median for an odd-length array', () => {
    // Real values used throughout development testing (Barcelona Main Hostels)
    expect(calculateMedian([72.24, 48.14, 77.14])).toEqual({ available: true, value: 72.24 });
  });

  it('computes the median for an even-length array as the average of the middle two', () => {
    expect(calculateMedian([30, 50, 45, 60])).toEqual({ available: true, value: 47.5 });
  });

  it('does not mutate the input array', () => {
    const input = [3, 1, 2];
    calculateMedian(input);
    expect(input).toEqual([3, 1, 2]);
  });

  it('is unaffected by input order', () => {
    const a = calculateMedian([5, 1, 3, 2, 4]);
    const b = calculateMedian([1, 2, 3, 4, 5]);
    expect(a).toEqual(b);
  });
});
