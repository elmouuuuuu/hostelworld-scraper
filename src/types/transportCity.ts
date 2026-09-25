/**
 * A city in the transport network. Distinct from (but shareable with)
 * hostelworld-scraper's SelectedCity — this model carries geographic
 * and transport-relevance data the hostel side never needed.
 */
export interface TransportCity {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population?: number;
  isCapital: boolean;
  isMajorCity: boolean;
  isTransportHub: boolean;
}
