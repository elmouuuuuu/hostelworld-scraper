export type TransportMode = 'bus' | 'train' | 'high_speed_train' | 'flight';

/**
 * A single DIRECT transport service between two cities. Every route is
 * one specific service by one specific operator/mode — a city pair with
 * multiple services (e.g. Paris-Brussels by both Eurostar and FlixBus)
 * is multiple separate TransportRoute records, never merged into one.
 *
 * `isSampleData` is deliberately baked into the type itself, not left
 * as a convention or comment — per the spec's explicit requirement
 * (section 51: "Never silently substitute fake data for missing real
 * data"), Phase 1 uses clearly-labeled sample data only, and this flag
 * makes that structurally impossible to lose track of as the system
 * grows into Phase 4+ with real integrated sources.
 */
export interface TransportRoute {
  id: string;
  originCityId: string;
  destinationCityId: string;
  mode: TransportMode;
  operator: string;
  serviceName?: string;
  /** Always true in the current model — see spec section 26: only routes verified as genuinely direct (zero transfers) are ever represented. */
  direct: true;
  durationMinutes?: number;
  price?: number;
  currency?: string;
  priceInCAD?: number;
  /**
   * True for Phase 1 prototype data. Must be explicitly false (and
   * carry a real `source`) before any route is treated as production
   * data anywhere in the app — see spec sections 24-26.
   */
  isSampleData: boolean;
  source?: string;
}
