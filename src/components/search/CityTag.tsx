import type { SelectedCity } from '@/types/city';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';

interface CityTagProps {
  city: SelectedCity;
  onRemove: (selectionId: string) => void;
}

export function CityTag({ city, onRemove }: CityTagProps) {
  return (
    <Badge onRemove={() => onRemove(city.selectionId)} removeLabel={`Remove ${city.name}`}>
      <CountryFlag country={city.country} className="mr-1" />
      {city.name}
      <span className="text-teal-600/70">, {city.country}</span>
    </Badge>
  );
}
