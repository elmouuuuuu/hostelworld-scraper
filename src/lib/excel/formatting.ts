import type { Row, Cell, Worksheet } from 'exceljs';
import config from '@/config/config';
import type { StatValue } from '@/types/report';

const style = config.excel.style;

/**
 * Guards against Excel/spreadsheet formula injection: if a string
 * starts with a character Excel could interpret as a formula trigger
 * (=, +, -, @, or a leading tab/carriage return), prefixes it with a
 * single quote. This is standard native Excel behavior, not a
 * workaround — a leading apostrophe forces text interpretation and is
 * hidden in the cell display (only visible in the formula bar).
 *
 * Applied to every externally-sourced string before it's written into
 * any cell: hostel names and room types (from Hostelworld), city/country
 * names (from Hostelworld or manual entry), and URLs.
 */
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

export function sanitizeForExcel(value: string): string {
  return FORMULA_TRIGGER_CHARS.some((char) => value.startsWith(char)) ? `'${value}` : value;
}

/**
 * Builds an Excel number format string for a given currency symbol,
 * e.g. buildPriceNumberFormat('$') -> '"$"#,##0.00'. Replaces the old
 * fixed CAD-only format now that currency is user-selectable.
 */
export function buildPriceNumberFormat(currencySymbol: string): string {
  return `"${currencySymbol}"#,##0.00`;
}

/** Bold, centered, filled header row — applied to the actual column-header row (not the super-header). */
export function applyHeaderRowStyle(row: Row): void {
  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: style.headerFontColor },
      name: style.fontFamily,
      size: style.headerFontSize,
    };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.headerFillColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
}

/** Lighter-filled section label cell — used for the merged "Main Hostels" / "Cheap Hostels" super-header groupings. */
export function applySectionHeaderStyle(cell: Cell): void {
  cell.font = { bold: true, name: style.fontFamily, size: style.headerFontSize };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.sectionTitleFillColor } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

/**
 * Sets a cell from a StatValue — the real value with a number format if
 * available, or the literal text "N/A" (never a zero, never blank) if
 * not. This is the one place N/A handling actually happens in the
 * output, per the edge-case requirement.
 */
export function setStatCell(cell: Cell, stat: StatValue, numberFormat: string): void {
  if (stat.available) {
    cell.value = stat.value;
    cell.numFmt = numberFormat;
  } else {
    cell.value = 'N/A';
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.font = { name: style.fontFamily, size: style.bodyFontSize };
}

/** Applies the standard body font/size to every cell in a row. */
export function applyBodyRowFont(row: Row): void {
  row.eachCell((cell) => {
    cell.font = { name: style.fontFamily, size: style.bodyFontSize };
  });
}

/**
 * Approximates Excel's "auto-fit column width" — ExcelJS has no native
 * auto-size, so this computes each column's width from its longest
 * cell's text length plus padding.
 */
export function autoSizeColumns(worksheet: Worksheet): void {
  worksheet.columns.forEach((column) => {
    if (!column || typeof column.eachCell !== 'function') return;
    let maxLength = 10;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const text = cell.value === null || cell.value === undefined ? '' : String(cell.value);
      if (text.length > maxLength) maxLength = text.length;
    });
    column.width = maxLength + style.columnPaddingChars;
  });
}
