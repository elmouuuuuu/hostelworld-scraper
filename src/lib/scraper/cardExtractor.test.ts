import { describe, it, expect } from 'vitest';
import { extractCardFromText, extractPropertyId, isMoreComplete, type RawListingCard } from './cardExtractor';

describe('extractPropertyId', () => {
  it('extracts the id from the legacy /hostels/p/{id}/{slug}/ pattern', () => {
    expect(extractPropertyId('https://www.hostelworld.com/hostels/p/722/kabul-party-hostel-barcelona/')).toBe('722');
  });

  it('extracts the id from the real /pwa/hosteldetails.php pattern', () => {
    const href =
      'https://www.hostelworld.com/pwa/hosteldetails.php/Sun-Moon-Hostel/Barcelona/7169?from=2026-09-01&to=2026-09-03&guests=1#position=4';
    expect(extractPropertyId(href)).toBe('7169');
  });

  it('returns null for an unrelated URL', () => {
    expect(extractPropertyId('https://www.hostelworld.com/blog/')).toBeNull();
  });
});

describe('extractCardFromText', () => {
  const href = 'https://www.hostelworld.com/pwa/hosteldetails.php/Sun-Moon-Hostel/Barcelona/7169?from=2026-09-01&to=2026-09-03';

  it('parses a real main-list card with no discount (captured live, Aug 2026)', () => {
    const text =
      "Free Cancellation\nHostel\nSun & Moon Hostel\n7.7\nVery Good\n(3257)\n0.8km from city centre\n5+ staying\n7 events\nPrivates From\nCA$437\nDorms From\nCA$53";

    const result = extractCardFromText(text, href);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Sun & Moon Hostel');
    expect(result?.propertyType).toBe('hostel');
    expect(result?.rating).toBe(7.7);
    expect(result?.reviewCount).toBe(3257);
    expect(result?.privatesFromPrice).toBe(437);
    expect(result?.dormsFromPrice).toBe(53);
  });

  it('parses a real card with multiple promo badge lines before the type label', () => {
    const text =
      "Free Cancellation\nSelling out fast!\nHostel\nFabrizzio's Petit\n9.0\nSuperb\n(2574)\n0.8km from city centre\nPrivates From\nCA$424\nDorms From\nCA$82";

    const result = extractCardFromText(text, href);

    // Regression test for the original bug: name used to incorrectly
    // capture "Free Cancellation Selling out fast!" (everything before
    // the type label) instead of the real name (which comes AFTER it).
    expect(result?.name).toBe("Fabrizzio's Petit");
    expect(result?.reviewCount).toBe(2574);
    expect(result?.dormsFromPrice).toBe(82);
  });

  it('uses the FINAL discounted price, not the crossed-out original or the discount percentage (regression test for the hostel DEN bug)', () => {
    // Real text that originally produced cheapestPricePerNight=10 (the
    // "-10%" badge misread as the price) instead of the correct 56.
    const text =
      "Free Cancellation\nHostel\nhostel DEN\n9.0\nSuperb\n(724)\n7.7km from city centre\nstaying\nNo Privates Available\nDorms From\n-10%\nCA$62.43\nCA$56";

    const result = extractCardFromText(text, href);

    expect(result?.dormsFromPrice).toBe(56);
    expect(result?.privatesFromPrice).toBeNull(); // "No Privates Available" — correctly absent, not zero
  });

  it('handles a room with a discount on BOTH private and dorm prices', () => {
    const text =
      'Free Cancellation\nHostel\nGRAND HOSTEL LDK Tokyo Nishikasai\n9.3\nSuperb\n(176)\n15.3km from city centre\n5+ staying\n1 event\nPrivates From\n-5%\nCA$122.81\nCA$117\nDorms From\n-5%\nCA$37.69\nCA$36';

    const result = extractCardFromText(text, href);

    expect(result?.privatesFromPrice).toBe(117);
    expect(result?.dormsFromPrice).toBe(36);
  });

  it('returns propertyType null and reviewCount null for a Featured-section card (no type label, no review count)', () => {
    const text = 'HelloBCN Hostel\n8.9\nFabulous\nFrom\nCA$53';

    const result = extractCardFromText(text, href);

    expect(result?.propertyType).toBeNull();
    expect(result?.reviewCount).toBeNull();
    expect(result?.name).toBe('HelloBCN Hostel'); // falls back to the first line when no type label is found
  });

  it('returns null when the href has no extractable property id', () => {
    const result = extractCardFromText('Some Hostel\n8.0', 'https://www.hostelworld.com/blog/');
    expect(result).toBeNull();
  });
});

describe('isMoreComplete', () => {
  function partialCard(overrides: Partial<RawListingCard>): RawListingCard {
    return {
      propertyId: '1',
      propertyUrl: 'https://example.com',
      name: 'Test',
      propertyType: null,
      rating: null,
      reviewCount: null,
      privatesFromPrice: null,
      dormsFromPrice: null,
      ...overrides,
    };
  }

  it('prefers a card with a review count over one without (the Madrid bug scenario)', () => {
    const featured = partialCard({ rating: 8.9, dormsFromPrice: 45 }); // no propertyType, no reviewCount
    const mainList = partialCard({ propertyType: 'hostel', rating: 8.9, reviewCount: 5200, privatesFromPrice: 62, dormsFromPrice: 45 });

    expect(isMoreComplete(mainList, featured)).toBe(true);
    expect(isMoreComplete(featured, mainList)).toBe(false);
  });

  it('treats two equally complete cards as neither more complete than the other', () => {
    const a = partialCard({ propertyType: 'hostel', reviewCount: 100 });
    const b = partialCard({ propertyType: 'hostel', reviewCount: 200 });
    expect(isMoreComplete(a, b)).toBe(false);
    expect(isMoreComplete(b, a)).toBe(false);
  });
});
