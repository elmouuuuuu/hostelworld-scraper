import { z } from 'zod';
import config from '@/config/config';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currencies';

export const selectedCitySchema = z.object({
  name: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  hostelworldId: z.string().min(1).max(200),
  destinationUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith(config.scraper.baseUrl), {
      message: `destinationUrl must be a ${config.scraper.baseUrl} URL`,
    }),
  displayLabel: z.string().min(1).max(240),
  selectionId: z.string().min(1).max(100),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date' });

const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]];

export const generateReportRequestSchema = z
  .object({
    cities: z
      .array(selectedCitySchema)
      .min(1, 'At least one city must be selected')
      .max(config.scraper.maxCitiesFastMode, `A maximum of ${config.scraper.maxCitiesFastMode} cities can be searched per report`),
    minimumRating: z
      .number()
      .min(config.filters.minAllowedRating)
      .max(config.filters.maxAllowedRating),
    rawDataMode: z.boolean(),
    currency: z.enum(SUPPORTED_CURRENCY_CODES),
    /** "Detailed Mode" — exact per-hostel pricing (see config.scraper.allowDetailedMode/maxCitiesDetailedMode). Capped to far fewer cities than fast mode since it's meaningfully slower per city. */
    detailedMode: z.boolean(),
    // Manual date override — both omitted means "use auto-computed dates".
    checkIn: isoDateSchema.optional(),
    checkOut: isoDateSchema.optional(),
  })
  .refine((data) => (data.checkIn === undefined) === (data.checkOut === undefined), {
    message: 'checkIn and checkOut must be provided together, or both omitted',
    path: ['checkOut'],
  })
  .refine(
    (data) => !data.checkIn || !data.checkOut || new Date(data.checkOut) > new Date(data.checkIn),
    { message: 'checkOut must be after checkIn', path: ['checkOut'] }
  )
  .refine((data) => !data.detailedMode || config.scraper.allowDetailedMode, {
    message: 'Detailed Mode is disabled on this deployment',
    path: ['detailedMode'],
  })
  .refine((data) => !data.detailedMode || data.cities.length <= config.scraper.maxCitiesDetailedMode, {
    message: `Detailed Mode allows a maximum of ${config.scraper.maxCitiesDetailedMode} cities per report`,
    path: ['cities'],
  });

export const autocompleteQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(80),
});

export type GenerateReportRequestInput = z.infer<typeof generateReportRequestSchema>;
export type AutocompleteQueryInput = z.infer<typeof autocompleteQuerySchema>;
