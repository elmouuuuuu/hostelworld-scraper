import type ExcelJS from 'exceljs';
import config from '@/config/config';
import type { HostelRecord } from '@/types/hostel';
import { applyHeaderRowStyle, applySectionHeaderStyle, sanitizeForExcel, buildPriceNumberFormat } from './formatting';

const style = config.excel.style;

export interface CityHostelEntry {
  city: string;
  hostel: HostelRecord;
}

/**
 * Renders one "selected properties" sub-table (used for both Main
 * Hostels and Cheap Hostels) at the given starting row: a merged
 * section title, column headers, then one row per hostel across every
 * city. Returns the next free row after this block.
 *
 * NOTE: these sub-tables intentionally don't get their own
 * `autoFilter` — Excel/ExcelJS only supports one autoFilter region per
 * worksheet, and the sheet's main table already uses it. A real Excel
 * Table object (`worksheet.addTable()`) could give each sub-table
 * independent filtering, but that API couldn't be verified without live
 * testing, so manual formatting was used instead.
 */
export function renderSelectedHostelsSection(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  title: string,
  entries: CityHostelEntry[],
  currencySymbol: string
): number {
  const priceFormat = buildPriceNumberFormat(currencySymbol);
  let row = startRow;

  sheet.mergeCells(`A${row}:E${row}`);
  const titleCell = sheet.getCell(`A${row}`);
  titleCell.value = title;
  applySectionHeaderStyle(titleCell);
  row++;

  const headerRow = sheet.getRow(row);
  headerRow.values = ['City', 'Hostel Name', 'Price', 'Rating', 'Reviews'];
  applyHeaderRowStyle(headerRow);
  row++;

  if (entries.length === 0) {
    const emptyRow = sheet.getRow(row);
    emptyRow.getCell(1).value = 'N/A';
    emptyRow.getCell(1).font = { name: style.fontFamily, size: style.bodyFontSize };
    row++;
    return row;
  }

  for (const { city, hostel } of entries) {
    const dataRow = sheet.getRow(row);
    dataRow.getCell(1).value = sanitizeForExcel(city);
    dataRow.getCell(2).value = sanitizeForExcel(hostel.hostelName);
    dataRow.getCell(3).value = hostel.cheapestPricePerNight;
    dataRow.getCell(3).numFmt = priceFormat;
    dataRow.getCell(4).value = hostel.averageRating;
    dataRow.getCell(4).numFmt = style.ratingNumberFormat;
    dataRow.getCell(5).value = hostel.numberOfReviews;
    dataRow.eachCell((cell) => {
      cell.font = { name: style.fontFamily, size: style.bodyFontSize };
    });
    row++;
  }

  return row;
}
