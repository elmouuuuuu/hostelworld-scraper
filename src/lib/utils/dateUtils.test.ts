import { describe, it, expect } from 'vitest';
import { getAutoSearchDates } from './dateUtils';

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('getAutoSearchDates', () => {
  it('always returns a Tuesday check-in and Thursday check-out', () => {
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 7, 8)); // Aug 8, 2026
    expect(checkIn.getDay()).toBe(2); // Tuesday
    expect(checkOut.getDay()).toBe(4); // Thursday
  });

  it('is always a 2-night stay', () => {
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 7, 8));
    const nights = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    expect(nights).toBe(2);
  });

  it('uses the month immediately following the reference date (mid-month case)', () => {
    // Hand-verified: Jan 15, 2026 (Thursday) -> first Tuesday of Feb 2026 is Feb 3.
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 0, 15));
    expect(iso(checkIn)).toBe('2026-02-03');
    expect(iso(checkOut)).toBe('2026-02-05');
  });

  it('handles a reference date at the start of a month', () => {
    // Hand-verified: Jun 1, 2026 (Monday) -> first Tuesday of Jul 2026 is Jul 7.
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 5, 1));
    expect(iso(checkIn)).toBe('2026-07-07');
    expect(iso(checkOut)).toBe('2026-07-09');
  });

  it('rolls over the year correctly for a December reference date', () => {
    // Hand-verified: Dec 25, 2026 (Friday) -> first Tuesday of Jan 2027 is Jan 5.
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 11, 25));
    expect(iso(checkIn)).toBe('2027-01-05');
    expect(iso(checkOut)).toBe('2027-01-07');
  });

  it('matches the real dates this project generated during development (Aug 8, 2026 reference)', () => {
    const { checkIn, checkOut } = getAutoSearchDates(new Date(2026, 7, 8));
    expect(iso(checkIn)).toBe('2026-09-01');
    expect(iso(checkOut)).toBe('2026-09-03');
  });
});
