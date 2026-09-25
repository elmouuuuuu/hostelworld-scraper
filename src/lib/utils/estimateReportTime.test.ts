import { describe, it, expect } from 'vitest';
import { estimateReportTime } from './estimateReportTime';

describe('estimateReportTime', () => {
  it('returns zero for zero cities', () => {
    expect(estimateReportTime(0, false)).toEqual({ minMinutes: 0, maxMinutes: 0 });
    expect(estimateReportTime(0, true)).toEqual({ minMinutes: 0, maxMinutes: 0 });
  });

  it('detailed mode produces a meaningfully wider, slower range than fast mode for the same city count', () => {
    const fast = estimateReportTime(1, false);
    const detailed = estimateReportTime(1, true);

    expect(detailed.minMinutes).toBeGreaterThan(fast.minMinutes);
    expect(detailed.maxMinutes).toBeGreaterThan(fast.maxMinutes);
  });

  it('scales roughly linearly with city count within a mode (using city counts large enough to avoid the min-1-minute floor distorting the ratio)', () => {
    const twoCities = estimateReportTime(2, false);
    const tenCities = estimateReportTime(10, false);

    expect(tenCities.minMinutes).toBeGreaterThanOrEqual(twoCities.minMinutes * 4);
    expect(tenCities.maxMinutes).toBeGreaterThanOrEqual(twoCities.maxMinutes * 4);
  });

  it('always returns at least 1 minute for any positive city count (never rounds down to 0 and looks broken)', () => {
    const result = estimateReportTime(1, false);
    expect(result.minMinutes).toBeGreaterThanOrEqual(1);
    expect(result.maxMinutes).toBeGreaterThanOrEqual(1);
  });

  it('min is never greater than max', () => {
    for (const detailed of [true, false]) {
      for (const cities of [1, 3, 5, 10, 15]) {
        const result = estimateReportTime(cities, detailed);
        expect(result.minMinutes).toBeLessThanOrEqual(result.maxMinutes);
      }
    }
  });
});
