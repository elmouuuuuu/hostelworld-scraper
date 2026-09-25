/**
 * Consolidated per-country metadata, keyed by country name as it appears
 * in Hostelworld's suggest API response (e.g. "Spain", "USA").
 *
 * - continentSlug: used to construct Hostelworld listing URLs
 *   (/hostels/{continent}/{country}/{city}/) — see
 *   hostelworldSuggestProvider.ts. Verified pattern for the handful of
 *   countries directly observed on Hostelworld's homepage; best-effort
 *   for the rest (Milestone 4 is where a wrong URL actually gets caught).
 * - iso2: standard ISO 3166-1 alpha-2 code, used to derive the flag emoji
 *   (flag emoji are just two Unicode "regional indicator" characters
 *   corresponding to the ISO code — see getCountryFlagEmoji below).
 *
 * One list, one source of truth, so continent and flag data can't drift
 * out of sync with each other.
 */
interface CountryMeta {
  continentSlug: string;
  iso2: string;
}

const COUNTRY_META: Readonly<Record<string, CountryMeta>> = {
  // Europe
  spain: { continentSlug: 'europe', iso2: 'ES' },
  italy: { continentSlug: 'europe', iso2: 'IT' },
  france: { continentSlug: 'europe', iso2: 'FR' },
  germany: { continentSlug: 'europe', iso2: 'DE' },
  portugal: { continentSlug: 'europe', iso2: 'PT' },
  netherlands: { continentSlug: 'europe', iso2: 'NL' },
  belgium: { continentSlug: 'europe', iso2: 'BE' },
  ireland: { continentSlug: 'europe', iso2: 'IE' },
  england: { continentSlug: 'europe', iso2: 'GB' },
  'united kingdom': { continentSlug: 'europe', iso2: 'GB' },
  scotland: { continentSlug: 'europe', iso2: 'GB' },
  wales: { continentSlug: 'europe', iso2: 'GB' },
  austria: { continentSlug: 'europe', iso2: 'AT' },
  switzerland: { continentSlug: 'europe', iso2: 'CH' },
  czechia: { continentSlug: 'europe', iso2: 'CZ' },
  'czech republic': { continentSlug: 'europe', iso2: 'CZ' },
  hungary: { continentSlug: 'europe', iso2: 'HU' },
  poland: { continentSlug: 'europe', iso2: 'PL' },
  greece: { continentSlug: 'europe', iso2: 'GR' },
  croatia: { continentSlug: 'europe', iso2: 'HR' },
  slovenia: { continentSlug: 'europe', iso2: 'SI' },
  slovakia: { continentSlug: 'europe', iso2: 'SK' },
  romania: { continentSlug: 'europe', iso2: 'RO' },
  bulgaria: { continentSlug: 'europe', iso2: 'BG' },
  denmark: { continentSlug: 'europe', iso2: 'DK' },
  sweden: { continentSlug: 'europe', iso2: 'SE' },
  norway: { continentSlug: 'europe', iso2: 'NO' },
  finland: { continentSlug: 'europe', iso2: 'FI' },
  iceland: { continentSlug: 'europe', iso2: 'IS' },
  montenegro: { continentSlug: 'europe', iso2: 'ME' },
  serbia: { continentSlug: 'europe', iso2: 'RS' },
  'bosnia and herzegovina': { continentSlug: 'europe', iso2: 'BA' },
  albania: { continentSlug: 'europe', iso2: 'AL' },
  'north macedonia': { continentSlug: 'europe', iso2: 'MK' },
  estonia: { continentSlug: 'europe', iso2: 'EE' },
  latvia: { continentSlug: 'europe', iso2: 'LV' },
  lithuania: { continentSlug: 'europe', iso2: 'LT' },
  ukraine: { continentSlug: 'europe', iso2: 'UA' },
  malta: { continentSlug: 'europe', iso2: 'MT' },
  cyprus: { continentSlug: 'europe', iso2: 'CY' },
  luxembourg: { continentSlug: 'europe', iso2: 'LU' },
  monaco: { continentSlug: 'europe', iso2: 'MC' },
  andorra: { continentSlug: 'europe', iso2: 'AD' },
  'san marino': { continentSlug: 'europe', iso2: 'SM' },
  russia: { continentSlug: 'europe', iso2: 'RU' },
  moldova: { continentSlug: 'europe', iso2: 'MD' },
  georgia: { continentSlug: 'europe', iso2: 'GE' },
  armenia: { continentSlug: 'europe', iso2: 'AM' },

  // Asia
  thailand: { continentSlug: 'asia', iso2: 'TH' },
  vietnam: { continentSlug: 'asia', iso2: 'VN' },
  japan: { continentSlug: 'asia', iso2: 'JP' },
  'south korea': { continentSlug: 'asia', iso2: 'KR' },
  china: { continentSlug: 'asia', iso2: 'CN' },
  india: { continentSlug: 'asia', iso2: 'IN' },
  indonesia: { continentSlug: 'asia', iso2: 'ID' },
  malaysia: { continentSlug: 'asia', iso2: 'MY' },
  singapore: { continentSlug: 'asia', iso2: 'SG' },
  philippines: { continentSlug: 'asia', iso2: 'PH' },
  cambodia: { continentSlug: 'asia', iso2: 'KH' },
  laos: { continentSlug: 'asia', iso2: 'LA' },
  myanmar: { continentSlug: 'asia', iso2: 'MM' },
  nepal: { continentSlug: 'asia', iso2: 'NP' },
  'sri lanka': { continentSlug: 'asia', iso2: 'LK' },
  taiwan: { continentSlug: 'asia', iso2: 'TW' },
  'hong kong': { continentSlug: 'asia', iso2: 'HK' },
  israel: { continentSlug: 'asia', iso2: 'IL' },
  jordan: { continentSlug: 'asia', iso2: 'JO' },
  lebanon: { continentSlug: 'asia', iso2: 'LB' },
  iran: { continentSlug: 'asia', iso2: 'IR' },
  palestine: { continentSlug: 'asia', iso2: 'PS' },
  turkey: { continentSlug: 'asia', iso2: 'TR' },
  'united arab emirates': { continentSlug: 'asia', iso2: 'AE' },
  bahrain: { continentSlug: 'asia', iso2: 'BH' },
  qatar: { continentSlug: 'asia', iso2: 'QA' },
  mongolia: { continentSlug: 'asia', iso2: 'MN' },
  kazakhstan: { continentSlug: 'asia', iso2: 'KZ' },
  kyrgyzstan: { continentSlug: 'asia', iso2: 'KG' },
  uzbekistan: { continentSlug: 'asia', iso2: 'UZ' },
  bangladesh: { continentSlug: 'asia', iso2: 'BD' },

  // Africa
  morocco: { continentSlug: 'africa', iso2: 'MA' },
  'south africa': { continentSlug: 'africa', iso2: 'ZA' },
  egypt: { continentSlug: 'africa', iso2: 'EG' },
  kenya: { continentSlug: 'africa', iso2: 'KE' },
  tanzania: { continentSlug: 'africa', iso2: 'TZ' },
  ghana: { continentSlug: 'africa', iso2: 'GH' },
  ethiopia: { continentSlug: 'africa', iso2: 'ET' },
  tunisia: { continentSlug: 'africa', iso2: 'TN' },
  namibia: { continentSlug: 'africa', iso2: 'NA' },
  uganda: { continentSlug: 'africa', iso2: 'UG' },
  rwanda: { continentSlug: 'africa', iso2: 'RW' },
  zambia: { continentSlug: 'africa', iso2: 'ZM' },
  zimbabwe: { continentSlug: 'africa', iso2: 'ZW' },
  botswana: { continentSlug: 'africa', iso2: 'BW' },
  mozambique: { continentSlug: 'africa', iso2: 'MZ' },
  senegal: { continentSlug: 'africa', iso2: 'SN' },
  algeria: { continentSlug: 'africa', iso2: 'DZ' },
  libya: { continentSlug: 'africa', iso2: 'LY' },
  sudan: { continentSlug: 'africa', iso2: 'SD' },
  'south sudan': { continentSlug: 'africa', iso2: 'SS' },
  'western sahara': { continentSlug: 'africa', iso2: 'EH' },
  nigeria: { continentSlug: 'africa', iso2: 'NG' },
  niger: { continentSlug: 'africa', iso2: 'NE' },
  mali: { continentSlug: 'africa', iso2: 'ML' },
  'burkina faso': { continentSlug: 'africa', iso2: 'BF' },
  guinea: { continentSlug: 'africa', iso2: 'GN' },
  'guinea-bissau': { continentSlug: 'africa', iso2: 'GW' },
  'sierra leone': { continentSlug: 'africa', iso2: 'SL' },
  liberia: { continentSlug: 'africa', iso2: 'LR' },
  'ivory coast': { continentSlug: 'africa', iso2: 'CI' },
  "cote d'ivoire": { continentSlug: 'africa', iso2: 'CI' },
  togo: { continentSlug: 'africa', iso2: 'TG' },
  benin: { continentSlug: 'africa', iso2: 'BJ' },
  'cape verde': { continentSlug: 'africa', iso2: 'CV' },
  gambia: { continentSlug: 'africa', iso2: 'GM' },
  mauritania: { continentSlug: 'africa', iso2: 'MR' },
  cameroon: { continentSlug: 'africa', iso2: 'CM' },
  chad: { continentSlug: 'africa', iso2: 'TD' },
  'central african republic': { continentSlug: 'africa', iso2: 'CF' },
  'democratic republic of the congo': { continentSlug: 'africa', iso2: 'CD' },
  'dr congo': { continentSlug: 'africa', iso2: 'CD' },
  'republic of the congo': { continentSlug: 'africa', iso2: 'CG' },
  congo: { continentSlug: 'africa', iso2: 'CG' },
  gabon: { continentSlug: 'africa', iso2: 'GA' },
  'equatorial guinea': { continentSlug: 'africa', iso2: 'GQ' },
  'sao tome and principe': { continentSlug: 'africa', iso2: 'ST' },
  angola: { continentSlug: 'africa', iso2: 'AO' },
  somalia: { continentSlug: 'africa', iso2: 'SO' },
  djibouti: { continentSlug: 'africa', iso2: 'DJ' },
  eritrea: { continentSlug: 'africa', iso2: 'ER' },
  burundi: { continentSlug: 'africa', iso2: 'BI' },
  malawi: { continentSlug: 'africa', iso2: 'MW' },
  madagascar: { continentSlug: 'africa', iso2: 'MG' },
  comoros: { continentSlug: 'africa', iso2: 'KM' },
  seychelles: { continentSlug: 'africa', iso2: 'SC' },
  mauritius: { continentSlug: 'africa', iso2: 'MU' },
  lesotho: { continentSlug: 'africa', iso2: 'LS' },
  eswatini: { continentSlug: 'africa', iso2: 'SZ' },

  // North America
  usa: { continentSlug: 'north-america', iso2: 'US' },
  'united states': { continentSlug: 'north-america', iso2: 'US' },
  canada: { continentSlug: 'north-america', iso2: 'CA' },
  mexico: { continentSlug: 'north-america', iso2: 'MX' },
  guatemala: { continentSlug: 'north-america', iso2: 'GT' },
  belize: { continentSlug: 'north-america', iso2: 'BZ' },
  'costa rica': { continentSlug: 'north-america', iso2: 'CR' },
  panama: { continentSlug: 'north-america', iso2: 'PA' },
  nicaragua: { continentSlug: 'north-america', iso2: 'NI' },
  honduras: { continentSlug: 'north-america', iso2: 'HN' },
  'el salvador': { continentSlug: 'north-america', iso2: 'SV' },
  cuba: { continentSlug: 'north-america', iso2: 'CU' },
  jamaica: { continentSlug: 'north-america', iso2: 'JM' },
  'dominican republic': { continentSlug: 'north-america', iso2: 'DO' },
  bahamas: { continentSlug: 'north-america', iso2: 'BS' },

  // South America
  brazil: { continentSlug: 'south-america', iso2: 'BR' },
  argentina: { continentSlug: 'south-america', iso2: 'AR' },
  chile: { continentSlug: 'south-america', iso2: 'CL' },
  peru: { continentSlug: 'south-america', iso2: 'PE' },
  colombia: { continentSlug: 'south-america', iso2: 'CO' },
  ecuador: { continentSlug: 'south-america', iso2: 'EC' },
  bolivia: { continentSlug: 'south-america', iso2: 'BO' },
  uruguay: { continentSlug: 'south-america', iso2: 'UY' },
  paraguay: { continentSlug: 'south-america', iso2: 'PY' },
  venezuela: { continentSlug: 'south-america', iso2: 'VE' },
  guyana: { continentSlug: 'south-america', iso2: 'GY' },

  // Oceania
  australia: { continentSlug: 'oceania', iso2: 'AU' },
  'new zealand': { continentSlug: 'oceania', iso2: 'NZ' },
  fiji: { continentSlug: 'oceania', iso2: 'FJ' },
  'papua new guinea': { continentSlug: 'oceania', iso2: 'PG' },
  samoa: { continentSlug: 'oceania', iso2: 'WS' },
  'french polynesia': { continentSlug: 'oceania', iso2: 'PF' },
  'solomon islands': { continentSlug: 'oceania', iso2: 'SB' },
  vanuatu: { continentSlug: 'oceania', iso2: 'VU' },
  tonga: { continentSlug: 'oceania', iso2: 'TO' },
  kiribati: { continentSlug: 'oceania', iso2: 'KI' },
  palau: { continentSlug: 'oceania', iso2: 'PW' },
  'marshall islands': { continentSlug: 'oceania', iso2: 'MH' },
  micronesia: { continentSlug: 'oceania', iso2: 'FM' },
  nauru: { continentSlug: 'oceania', iso2: 'NR' },
  tuvalu: { continentSlug: 'oceania', iso2: 'TV' },
  'cook islands': { continentSlug: 'oceania', iso2: 'CK' },
  niue: { continentSlug: 'oceania', iso2: 'NU' },
  'new caledonia': { continentSlug: 'oceania', iso2: 'NC' },
  'american samoa': { continentSlug: 'oceania', iso2: 'AS' },
  guam: { continentSlug: 'oceania', iso2: 'GU' },
  'northern mariana islands': { continentSlug: 'oceania', iso2: 'MP' },
  'wallis and futuna': { continentSlug: 'oceania', iso2: 'WF' },
  'norfolk island': { continentSlug: 'oceania', iso2: 'NF' },
};

function lookup(country: string): CountryMeta | undefined {
  return COUNTRY_META[country.trim().toLowerCase()];
}

export function getContinentSlug(country: string): string | null {
  return lookup(country)?.continentSlug ?? null;
}

/**
 * Converts a 2-letter ISO country code into its flag emoji by combining
 * two Unicode "regional indicator symbol" characters — this is how flag
 * emoji work at the encoding level (e.g. "ES" -> the regional indicators
 * for E and S, which render as the Spanish flag). No hand-picked emoji
 * table needed; this covers all 26x26 possible codes generically.
 */
function isoCodeToFlagEmoji(iso2: string): string {
  const REGIONAL_INDICATOR_OFFSET = 127397; // 0x1F1E6 ('🇦') minus 'A'.charCodeAt(0)
  return iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(REGIONAL_INDICATOR_OFFSET + char.charCodeAt(0)))
    .join('');
}

/** Returns the flag emoji for a country name, or null if unrecognized — never guesses. */
export function getCountryFlagEmoji(country: string): string | null {
  const meta = lookup(country);
  return meta ? isoCodeToFlagEmoji(meta.iso2) : null;
}
