export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

/**
 * A reasonable, standard list of major world currencies (ISO 4217),
 * the kind virtually every international booking site supports.
 *
 * UNVERIFIED against Hostelworld's actual live currency dropdown — no
 * definitive list of exactly which currencies they support was found
 * during research for this feature. If a currency here turns out not
 * to be one Hostelworld actually offers, `switchCurrency` will fail
 * loudly with a clear error (no visible list item found) rather than
 * silently picking the wrong one.
 */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00a3' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN\u00a5' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'K\u010d' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20ba' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0e3f' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20a9' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '\u20b1' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '\u20ab' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'CO$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '\u20aa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00a3' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
];

export function findCurrencyByCode(code: string): CurrencyOption | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase());
}
