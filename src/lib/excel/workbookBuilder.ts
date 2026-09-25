import ExcelJS from 'exceljs';
import config from '@/config/config';
import type { ReportResult } from '@/types/report';
import { buildSummarySheet } from './summarySheet';
import { buildRawDataSheets } from './rawDataSheet';
import { buildReportInfoSheet } from './reportInfoSheet';
import { findCurrencyByCode } from '@/lib/utils/currencies';

/**
 * Builds the complete Excel workbook from a finished ReportResult:
 *   - Summary sheet (always) — one row per city, aggregate stats
 *   - One Raw Data sheet PER CITY (only if Raw Data Mode was enabled)
 *     — each city's own qualifying hostels plus its own Main/Cheap
 *     Hostels sub-tables, self-contained per sheet
 *   - Report Information sheet (always)
 */
export async function buildWorkbook(report: ReportResult): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.app.name;
  workbook.created = report.metadata.generatedAt;

  const currencySymbol = findCurrencyByCode(report.metadata.currency)?.symbol ?? report.metadata.currency;

  buildSummarySheet(workbook, report.cityReports, report.failedCities, currencySymbol);

  if (report.metadata.rawDataModeEnabled) {
    buildRawDataSheets(workbook, report.cityReports, currencySymbol);
  }

  buildReportInfoSheet(workbook, report.metadata);

  return workbook.xlsx.writeBuffer();
}

/** Generates a timestamped filename for the downloaded workbook. */
export function generateReportFileName(generatedAt: Date = new Date()): string {
  const timestamp = generatedAt.toISOString().replace(/[:.]/g, '-');
  return `${config.excel.fileNamePrefix}_${timestamp}.xlsx`;
}
