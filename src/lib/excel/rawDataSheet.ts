import type ExcelJS from 'exceljs';
import config from '@/config/config';
import type { CityReport } from '@/types/report';
import { applyHeaderRowStyle, applyBodyRowFont, autoSizeColumns, sanitizeForExcel, buildPriceNumberFormat } from './formatting';
import { renderSelectedHostelsSection, type CityHostelEntry } from './selectedPropertiesSection';

const style = config.excel.style;

/** Characters Excel forbids in sheet names, per Excel's own naming rules. */
const FORBIDDEN_SHEET_NAME_CHARS = /[\\/?*[\]:]/g;
const MAX_SHEET_NAME_LENGTH = 31;

/**
 * Produces a valid, non-empty Excel sheet name from a city name:
 * strips characters Excel forbids in sheet names, truncates to the
 * 31-character limit, and falls back to "City" if that leaves nothing
 * usable. Verified against edge cases (over-length names, forbidden
 * characters, empty strings) before use.
 */
function sanitizeSheetName(name: string): string {
  const stripped = name.replace(FORBIDDEN_SHEET_NAME_CHARS, '').slice(0, MAX_SHEET_NAME_LENGTH);
  return stripped.trim().length === 0 ? 'City' : stripped;
}

/**
 * Resolves a sanitized sheet name against ones already used in this
 * workbook, appending " (2)", " (3)", etc. as needed — Excel requires
 * every sheet name in a workbook to be unique. Truncates to still fit
 * the 31-character limit with the suffix included.
 */
function uniqueSheetName(baseName: string, usedNames: Set<string>): string {
  let candidate = sanitizeSheetName(baseName);
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    const suffixText = ` (${suffix})`;
    candidate = sanitizeSheetName(baseName).slice(0, MAX_SHEET_NAME_LENGTH - suffixText.length) + suffixText;
    suffix++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Builds one Raw Data sheet PER CITY, rather than a single combined
 * sheet with a City column — requested so a multi-city report's raw
 * data can be reviewed one city at a time without needing to
 * filter/sort a mixed table first.
 *
 * Each city's sheet is self-contained: its own per-hostel table, plus
 * its own "Main Hostels — Selected Properties" and "Cheap Hostels —
 * Selected Properties" sub-tables underneath (using that city's own
 * report data directly).
 *
 * Cities with zero qualifying hostels still get a sheet (with a clear
 * "no qualifying hostels" row) rather than being silently omitted.
 *
 * Only generated when Raw Data Mode is enabled.
 */
export function buildRawDataSheets(workbook: ExcelJS.Workbook, cityReports: CityReport[], currencySymbol: string): void {
  const priceFormat = buildPriceNumberFormat(currencySymbol);
  const usedSheetNames = new Set<string>();

  for (const report of cityReports) {
    const sheetName = uniqueSheetName(report.city, usedSheetNames);
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Country', key: 'country', width: 18 },
      { header: 'Hostel Name', key: 'hostelName', width: 34 },
      { header: 'Cheapest Room Price', key: 'price', width: 18 },
      { header: 'Currency', key: 'currency', width: 12 },
      { header: 'Room Type', key: 'roomType', width: 30 },
      { header: 'Beds', key: 'beds', width: 8 },
      { header: 'Average Rating (/10)', key: 'rating', width: 18 },
      { header: 'Number of Reviews', key: 'reviews', width: 16 },
      { header: 'Hostelworld URL', key: 'url', width: 55 },
    ];

    applyHeaderRowStyle(sheet.getRow(1));

    if (report.qualifyingHostels.length === 0) {
      const row = sheet.addRow({ hostelName: 'No qualifying hostels found for this city.' });
      applyBodyRowFont(row);
    } else {
      for (const hostel of report.qualifyingHostels) {
        const row = sheet.addRow({
          country: sanitizeForExcel(hostel.country),
          hostelName: sanitizeForExcel(hostel.hostelName),
          price: hostel.cheapestPricePerNight,
          currency: hostel.currency,
          roomType: sanitizeForExcel(hostel.cheapestRoomType),
          beds: hostel.cheapestRoomBeds ?? 'N/A',
          rating: hostel.averageRating,
          reviews: hostel.numberOfReviews,
          url: sanitizeForExcel(hostel.propertyUrl),
        });

        row.getCell('price').numFmt = priceFormat;
        row.getCell('rating').numFmt = style.ratingNumberFormat;
        applyBodyRowFont(row);
      }

      sheet.autoFilter = { from: 'A1', to: 'I1' };
    }

    let rowIndex = sheet.rowCount + 2;

    const mainHostelEntries: CityHostelEntry[] = report.mainHostels.selectedHostels.map((hostel) => ({
      city: report.city,
      hostel,
    }));
    rowIndex = renderSelectedHostelsSection(
      sheet,
      rowIndex,
      'Main Hostels \u2014 Selected Properties',
      mainHostelEntries,
      currencySymbol
    );

    rowIndex += 1;

    const cheapHostelEntries: CityHostelEntry[] = report.cheapHostels.selectedHostels.map((hostel) => ({
      city: report.city,
      hostel,
    }));
    renderSelectedHostelsSection(
      sheet,
      rowIndex,
      'Cheap Hostels \u2014 Selected Properties',
      cheapHostelEntries,
      currencySymbol
    );

    autoSizeColumns(sheet);
  }
}
