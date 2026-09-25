import { describe, it, expect } from 'vitest';
import { calculateCheapHostels } from './cheapHostels';
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

describe('calculateCheapHostels', () => {
  it('returns unavailable stats and empty selection for zero hostels', () => {
    const result = calculateCheapHostels([]);
    expect(result.averagePrice).toEqual({ available: false });
    expect(result.selectedHostels).toEqual([]);
  });

  it('OR eligibility: a hostel qualifies via EITHER reviews OR rating, not both required', () => {
    // config defaults: minReviews=50, minRating=7.0
    const hostels = [
      makeHostel({ id: 'A', numberOfReviews: 100, averageRating: 6.0, cheapestPricePerNight: 20 }), // qualifies via reviews
      makeHostel({ id: 'B', numberOfReviews: 5, averageRating: 9.5, cheapestPricePerNight: 15 }), // qualifies via rating
      makeHostel({ id: 'C', numberOfReviews: 5, averageRating: 5.0, cheapestPricePerNight: 10 }), // fails BOTH — must be excluded
      makeHostel({ id: 'D', numberOfReviews: 51, averageRating: 4.0, cheapestPricePerNight: 12 }), // qualifies via reviews (51 >= 50)
    ];

    const result = calculateCheapHostels(hostels);
    const selectedIds = result.selectedHostels.map((h) => h.id).sort();

    // C must be excluded (fails both thresholds); A, B, D all qualify.
    expect(selectedIds).toEqual(['A', 'B', 'D']);
  });

  it('selects the N cheapest among eligible hostels, sorted ascending by price', () => {
    // Real Barcelona data used during development testing — hand-verified
    // against the actual generated report (avg 39.27, median 40.42).
    const hostels = [
      makeHostel({ id: '1', hostelName: 'Urbany Hostel BCN GO!', cheapestPricePerNight: 35.14, numberOfReviews: 6143, averageRating: 7.8 }),
      makeHostel({ id: '2', hostelName: 'Casa Barcelo Camp Nou Hostel', cheapestPricePerNight: 37.58, numberOfReviews: 913, averageRating: 7.6 }),
      makeHostel({ id: '3', hostelName: 'Mellow Hostel', cheapestPricePerNight: 40.42, numberOfReviews: 972, averageRating: 6.1 }),
      makeHostel({ id: '4', hostelName: 'Urbany Hostel Barcelona', cheapestPricePerNight: 41.17, numberOfReviews: 6864, averageRating: 7.7 }),
      makeHostel({ id: '5', hostelName: 'INOUT Hostel', cheapestPricePerNight: 42.04, numberOfReviews: 2663, averageRating: 8.3 }),
      // More expensive than all 5 above — must NOT be selected even though it's eligible.
      makeHostel({ id: '6', hostelName: 'Expensive Hostel', cheapestPricePerNight: 200, numberOfReviews: 5000, averageRating: 9.0 }),
    ];

    const result = calculateCheapHostels(hostels);

    expect(result.selectedHostels.map((h) => h.id)).toEqual(['1', '2', '3', '4', '5']);
    // toBeCloseTo (not toEqual) for the average — same IEEE 754
    // floating-point reasoning as mainHostels.test.ts.
    expect(result.averagePrice.available).toBe(true);
    if (result.averagePrice.available) {
      expect(result.averagePrice.value).toBeCloseTo(39.27, 2);
    }
    expect(result.medianPrice).toEqual({ available: true, value: 40.42 });
  });

  it('selects fewer than N if fewer than N hostels are eligible', () => {
    const hostels = [
      makeHostel({ id: 'a', numberOfReviews: 100, cheapestPricePerNight: 30 }),
      makeHostel({ id: 'b', numberOfReviews: 5, averageRating: 3, cheapestPricePerNight: 10 }), // ineligible
    ];
    const result = calculateCheapHostels(hostels);
    expect(result.selectedHostels).toHaveLength(1);
    expect(result.selectedHostels[0].id).toBe('a');
  });
});
