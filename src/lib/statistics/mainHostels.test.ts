import { describe, it, expect } from 'vitest';
import { calculateMainHostels } from './mainHostels';
import type { HostelRecord } from '@/types/hostel';

function makeHostel(overrides: Partial<HostelRecord>): HostelRecord {
  return {
    id: '1',
    hostelName: 'Test Hostel',
    city: 'Testville',
    country: 'Testland',
    propertyUrl: 'https://example.com',
    cheapestPricePerNight: 50,
    currency: 'CAD',
    cheapestRoomType: 'Dorm Room',
    cheapestRoomBeds: null,
    averageRating: 8.0,
    numberOfReviews: 0,
    propertyType: 'hostel',
    ...overrides,
  };
}

describe('calculateMainHostels', () => {
  it('returns unavailable stats and empty selection for zero hostels', () => {
    const result = calculateMainHostels([]);
    expect(result.averagePrice).toEqual({ available: false });
    expect(result.medianPrice).toEqual({ available: false });
    expect(result.selectedHostels).toEqual([]);
  });

  it('selects the top 3 by review count, ignoring price and rating entirely', () => {
    // Real Barcelona data used during development testing
    const hostels = [
      makeHostel({ id: '722', hostelName: 'Kabul Party Hostel', numberOfReviews: 11536, cheapestPricePerNight: 72.24, averageRating: 9.5 }),
      makeHostel({ id: '11102', hostelName: 'Safestay Passeig de Gràcia', numberOfReviews: 10516, cheapestPricePerNight: 48.14, averageRating: 7.4 }),
      makeHostel({ id: '999', hostelName: 'Mediterranean Youth Hostel', numberOfReviews: 9819, cheapestPricePerNight: 77.14, averageRating: 9.4 }),
      // Cheaper AND higher-rated than all three above, but far fewer reviews — must NOT be selected.
      makeHostel({ id: '1', hostelName: 'Obscure Cheap Hostel', numberOfReviews: 5, cheapestPricePerNight: 10, averageRating: 10.0 }),
    ];

    const result = calculateMainHostels(hostels);

    expect(result.selectedHostels.map((h) => h.id)).toEqual(['722', '11102', '999']);
    // Hand-verified: (72.24 + 48.14 + 77.14) / 3 = 65.84, median (sorted: 48.14, 72.24, 77.14) = 72.24
    // toBeCloseTo (not toEqual) for the average — IEEE 754 floating-point
    // division produces 65.83999999999999, not exactly 65.84. This is
    // expected floating-point behavior, not an implementation bug (Excel's
    // own number format already rounds to 2 decimal places for display).
    expect(result.averagePrice.available).toBe(true);
    if (result.averagePrice.available) {
      expect(result.averagePrice.value).toBeCloseTo(65.84, 2);
    }
    expect(result.medianPrice).toEqual({ available: true, value: 72.24 });
  });

  it('selects fewer than 3 if fewer than 3 hostels exist', () => {
    const hostels = [makeHostel({ id: 'a', numberOfReviews: 100, cheapestPricePerNight: 40 })];
    const result = calculateMainHostels(hostels);
    expect(result.selectedHostels).toHaveLength(1);
    expect(result.averagePrice).toEqual({ available: true, value: 40 });
  });

  it('does not mutate the input array', () => {
    const hostels = [
      makeHostel({ id: 'a', numberOfReviews: 1 }),
      makeHostel({ id: 'b', numberOfReviews: 2 }),
    ];
    const original = [...hostels];
    calculateMainHostels(hostels);
    expect(hostels.map((h) => h.id)).toEqual(original.map((h) => h.id));
  });
});
