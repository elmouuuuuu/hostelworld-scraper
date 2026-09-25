import type ExcelJS from 'exceljs';
import config from '@/config/config';
import type { CityReport } from '@/types/report';
import type { FailedCity } from '@/types/hostel';
import { SCRAPER_FAILURE_LABELS } from '@/types/hostel';
import {
  applyHeaderRowStyle,
  applySectionHeaderStyle,
  setStatCell,
  autoSizeColumns,
  sanitizeForExcel,
  buildPriceNumberFormat,
} from './formatting';

const COLUMN_COUNT = 10;
const style = config.excel.style;

/**
 * Builds the Summary sheet. `currencySymbol` (e.g. '$', '\u20ac', 'CA$')
 * determines the price column number format — this is dynamic now that
 * currency is user-selectable, not fixed to CAD.
 */
export function buildSummarySheet(
  workbook: ExcelJS.Workbook,
  cityReports: CityReport[],
  failedCities: FailedCity[],
  currencySymbol: string
): void {
  const priceFormat = buildPriceNumberFormat(currencySymbol);

  const sheet = workbook.addWorksheet(config.excel.sheets.summary, {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  sheet.columns = [
    { key: 'city', width: 20 },
    { key: 'country', width: 20 },
    { key: 'status', width: 26 },
    { key: 'avgPrice', width: 16 },
    { key: 'medianPrice', width: 16 },
    { key: 'avgRating', width: 15 },
    { key: 'mainAvgPrice', width: 18 },
    { key: 'mainMedianPrice', width: 18 },
    { key: 'cheapAvgPrice', width: 18 },
    { key: 'cheapMedianPrice', width: 18 },
  ];

  sheet.mergeCells('A1:C1');
  sheet.mergeCells('D1:F1');
  sheet.mergeCells('G1:H1');
  sheet.mergeCells('I1:J1');

  sheet.getCell('A1').value = 'City';
  sheet.getCell('D1').value = 'Overall';
  sheet.getCell('G1').value = 'Main Hostels';
  sheet.getCell('I1').value = 'Cheap Hostels';

  ['A1', 'D1', 'G1', 'I1'].forEach((ref) => applySectionHeaderStyle(sheet.getCell(ref)));

  const headerRow = sheet.getRow(2);
  headerRow.values = [
    'City',
    'Country',
    'Status',
    'Average Price',
    'Median Price',
    'Average Rating',
    'Average Price',
    'Median Price',
    'Average Price',
    'Median Price',
  ];
  applyHeaderRowStyle(headerRow);

  let rowIndex = 3;

  for (const report of cityReports) {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = sanitizeForExcel(report.city);
    row.getCell(2).value = sanitizeForExcel(report.country);
    row.getCell(3).value = 'OK';
    setStatCell(row.getCell(4), report.overallStats.averagePrice, priceFormat);
    setStatCell(row.getCell(5), report.overallStats.medianPrice, priceFormat);
    setStatCell(row.getCell(6), report.overallStats.averageRating, style.ratingNumberFormat);
    setStatCell(row.getCell(7), report.mainHostels.averagePrice, priceFormat);
    setStatCell(row.getCell(8), report.mainHostels.medianPrice, priceFormat);
    setStatCell(row.getCell(9), report.cheapHostels.averagePrice, priceFormat);
    setStatCell(row.getCell(10), report.cheapHostels.medianPrice, priceFormat);
    row.getCell(1).font = { name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(2).font = { name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(3).font = { name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    rowIndex++;
  }

  for (const failed of failedCities) {
    const row = sheet.getRow(rowIndex);
    const label = SCRAPER_FAILURE_LABELS[failed.reasonCode] ?? `Error (${failed.reasonCode})`;
    row.getCell(1).value = sanitizeForExcel(failed.city);
    row.getCell(2).value = sanitizeForExcel(failed.country);
    row.getCell(3).value = label;
    for (let col = 4; col <= COLUMN_COUNT; col++) {
      row.getCell(col).value = 'N/A';
      row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(col).font = { name: style.fontFamily, size: style.bodyFontSize };
    }
    row.getCell(1).font = { name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(2).font = { name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(3).font = { bold: true, color: { argb: 'FFB3402B' }, name: style.fontFamily, size: style.bodyFontSize };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    rowIndex++;
  }

  sheet.autoFilter = { from: 'A2', to: `J2` };

  autoSizeColumns(sheet);
}
