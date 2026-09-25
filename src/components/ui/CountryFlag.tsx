import { getCountryFlagEmoji } from '@/lib/utils/countryMeta';

interface CountryFlagProps {
  country: string;
  className?: string;
}

/**
 * Renders a country's flag emoji, or nothing if the country isn't
 * recognized — deliberately never falls back to a placeholder emoji,
 * since a wrong or generic flag would be worse than no flag.
 * aria-hidden because the country name is always rendered as adjacent
 * text; the emoji is decorative, not the accessible label.
 */
export function CountryFlag({ country, className = '' }: CountryFlagProps) {
  const flag = getCountryFlagEmoji(country);
  if (!flag) return null;

  return (
    <span aria-hidden="true" className={className}>
      {flag}
    </span>
  );
}
