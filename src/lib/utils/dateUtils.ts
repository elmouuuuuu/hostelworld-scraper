import config from '@/config/config';

export interface SearchDateRange {
  checkIn: Date;
  checkOut: Date;
}

/**
 * Computes the automatic search stay dates: month immediately following
 * the current month, stay starts the first Tuesday of that month and
 * ends the following Thursday (2-night stay).
 */
export function getAutoSearchDates(referenceDate: Date = new Date()): SearchDateRange {
  const nextMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const year = nextMonthDate.getFullYear();
  const month = nextMonthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const targetWeekday = config.searchDates.checkInDayOfWeek;

  let dayOffset = targetWeekday - firstWeekday;
  if (dayOffset < 0) dayOffset += 7;

  const checkIn = new Date(year, month, 1 + dayOffset);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + config.searchDates.stayLengthNights);

  return { checkIn, checkOut };
}

/** Formats a date for display, e.g. "Tue, Sep 2". */
export function formatSearchDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}
