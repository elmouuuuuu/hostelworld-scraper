import type ExcelJS from 'exceljs';
import config from '@/config/config';
import type { ReportMetadata } from '@/types/report';
import { applyHeaderRowStyle } from './formatting';

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Builds the Report Information sheet — metadata about the run itself,
 * per the requirements: generated timestamp, search currency/dates,
 * filters used, counts, scraper version, and execution time.
 */
export function buildReportInfoSheet(workbook: ExcelJS.Workbook, metadata: ReportMetadata): void {
  const sheet = workbook.addWorksheet(config.excel.sheets.reportInfo, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Field', key: 'field', width: 32 },
    { header: 'Value', key: 'value', width: 42 },
  ];

  applyHeaderRowStyle(sheet.getRow(1));

  const fields: Array<[string, string]> = [
    ['Date & Time Generated', metadata.generatedAt.toLocaleString('en-CA')],
    ['Search Currency', metadata.currency],
    [
      'Search Dates',
      `${metadata.searchCheckIn.toLocaleDateString('en-CA')} to ${metadata.searchCheckOut.toLocaleDateString('en-CA')}`,
    ],
    ['Minimum Rating Selected', metadata.minimumRating.toFixed(1)],
    ['Raw Data Mode', metadata.rawDataModeEnabled ? 'Enabled' : 'Disabled'],
    ['Number of Cities Searched', String(metadata.citiesRequested)],
    ['Number of Qualifying Hostels', String(metadata.qualifyingHostelsTotal)],
    ['Number of Failed Cities', String(metadata.failedCitiesCount)],
    ['Scraper Version', metadata.scraperVersion],
    ['Total Execution Time', formatDuration(metadata.totalExecutionTimeMs)],
  ];

  for (const [field, value] of fields) {
    const row = sheet.addRow({ field, value });
    row.getCell('field').font = { bold: true, name: config.excel.style.fontFamily, size: config.excel.style.bodyFontSize };
    row.getCell('value').font = { name: config.excel.style.fontFamily, size: config.excel.style.bodyFontSize };
  }
}
