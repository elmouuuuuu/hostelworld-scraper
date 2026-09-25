import type { TransportRoute } from '@/types/transportRoute';

/**
 * Phase 1 prototype route dataset. Real operator names (Eurostar, TGV,
 * FlixBus etc. genuinely operate these services) but the specific
 * prices/durations here are illustrative development data, NOT current
 * real fares — every record is explicitly marked isSampleData: true.
 * Real fare integration is Phase 4+, per the roadmap.
 *
 * Deliberately varied mode/price mix so the percentile-based color
 * classification and mode-differentiation (dashed/solid/thick/curved)
 * both have something real to render and validate against.
 */
let nextId = 1;
function route(
  originCityId: string,
  destinationCityId: string,
  mode: TransportRoute['mode'],
  operator: string,
  durationMinutes: number,
  price: number
): TransportRoute {
  return {
    id: `sample-${nextId++}`,
    originCityId,
    destinationCityId,
    mode,
    operator,
    direct: true,
    durationMinutes,
    price,
    currency: 'CAD',
    priceInCAD: price,
    isSampleData: true,
    source: 'phase-1-prototype',
  };
}

export const SAMPLE_ROUTES: TransportRoute[] = [
  // Paris hub
  route('paris', 'london', 'high_speed_train', 'Eurostar', 135, 89),
  route('paris', 'london', 'bus', 'FlixBus', 480, 32),
  route('paris', 'london', 'flight', 'Air France', 90, 145),
  route('paris', 'brussels', 'high_speed_train', 'Thalys/Eurostar', 82, 65),
  route('paris', 'brussels', 'bus', 'FlixBus', 210, 22),
  route('paris', 'amsterdam', 'high_speed_train', 'Thalys/Eurostar', 200, 95),
  route('paris', 'berlin', 'flight', 'Lufthansa', 100, 130),
  route('paris', 'berlin', 'bus', 'FlixBus', 720, 45),
  route('paris', 'barcelona', 'high_speed_train', 'TGV/Renfe', 390, 78),
  route('paris', 'barcelona', 'flight', 'Vueling', 105, 88),
  route('paris', 'milan', 'high_speed_train', 'TGV/Trenitalia', 425, 82),
  route('paris', 'milan', 'flight', 'Air France', 95, 120),
  route('paris', 'zurich', 'high_speed_train', 'TGV Lyria', 245, 99),
  route('paris', 'dublin', 'flight', 'Aer Lingus', 110, 135),

  // London hub
  route('london', 'amsterdam', 'flight', 'KLM', 85, 110),
  route('london', 'amsterdam', 'bus', 'FlixBus', 660, 38),
  route('london', 'dublin', 'flight', 'Ryanair', 80, 65),
  route('london', 'brussels', 'high_speed_train', 'Eurostar', 120, 92),

  // Berlin hub
  route('berlin', 'amsterdam', 'train', 'Deutsche Bahn/NS', 375, 55),
  route('berlin', 'amsterdam', 'bus', 'FlixBus', 480, 28),
  route('berlin', 'prague', 'train', 'Deutsche Bahn/ČD', 255, 42),
  route('berlin', 'prague', 'bus', 'FlixBus', 300, 20),
  route('berlin', 'munich', 'high_speed_train', 'ICE', 240, 79),
  route('berlin', 'vienna', 'train', 'ÖBB Nightjet', 480, 68),
  route('berlin', 'copenhagen', 'train', 'Deutsche Bahn/DSB', 420, 71),
  route('berlin', 'warsaw', 'train', 'Deutsche Bahn/PKP', 355, 58),
  route('berlin', 'warsaw', 'bus', 'FlixBus', 480, 25),

  // Madrid / Barcelona / Lisbon
  route('madrid', 'barcelona', 'high_speed_train', 'Renfe AVE', 150, 72),
  route('madrid', 'barcelona', 'flight', 'Iberia', 80, 68),
  route('madrid', 'barcelona', 'bus', 'FlixBus', 450, 24),
  route('madrid', 'lisbon', 'flight', 'TAP Air Portugal', 75, 58),
  route('madrid', 'lisbon', 'bus', 'FlixBus', 540, 30),

  // Rome / Milan
  route('rome', 'milan', 'high_speed_train', 'Frecciarossa', 180, 65),
  route('rome', 'milan', 'flight', 'ITA Airways', 75, 95),
  route('rome', 'vienna', 'flight', 'Austrian Airlines', 100, 115),
  route('milan', 'zurich', 'train', 'SBB/Trenitalia', 210, 48),

  // Amsterdam / Brussels
  route('amsterdam', 'brussels', 'train', 'NS/SNCB', 105, 35),

  // Vienna hub
  route('vienna', 'prague', 'train', 'ÖBB/ČD', 240, 39),
  route('vienna', 'zurich', 'high_speed_train', 'ÖBB Railjet', 480, 89),
  route('vienna', 'munich', 'high_speed_train', 'ÖBB Railjet', 240, 62),

  // Nordics
  route('copenhagen', 'stockholm', 'train', 'SJ', 300, 74),

  // Eastern
  route('warsaw', 'prague', 'train', 'PKP/ČD', 480, 51),
];
