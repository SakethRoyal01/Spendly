import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as isDateToday,
  addMonths,
  subMonths,
  addWeeks,
  addDays,
  subDays,
  getDate,
  getDaysInMonth,
  isAfter,
  parse,
} from 'date-fns';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Returns current month formatted as YYYY-MM
 */
export function getCurrentMonthString(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Formats a YYYY-MM-DD string to uppercase Day of week: "WEDNESDAY"
 */
export function formatDateDayOfWeek(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(parsed, 'EEEE').toUpperCase();
  } catch {
    return '';
  }
}

/**
 * Formats a YYYY-MM-DD string to Day Month Year: "11 NOVEMBER 2026"
 */
export function formatDateDayMonthYear(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(parsed, 'd MMMM yyyy').toUpperCase();
  } catch {
    return dateStr;
  }
}

/**
 * Gets previous day YYYY-MM-DD
 */
export function getPreviousDayString(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(subDays(parsed, 1), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

/**
 * Gets next day YYYY-MM-DD
 */
export function getNextDayString(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(addDays(parsed, 1), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD or ISO date string into human friendly format
 * e.g. "Wednesday, 11 Nov 2026"
 */
export function formatDateLong(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(parsed, 'EEEE, d MMMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats date to concise format: "11 Nov 2026"
 */
export function formatDateMedium(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(parsed, 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats date to short format: "11 Nov"
 */
export function formatDateShort(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(parsed, 'd MMM');
  } catch {
    return dateStr;
  }
}

/**
 * Formats YYYY-MM to readable month year: "November 2026"
 */
export function formatMonthYear(yearMonth: string): string {
  try {
    const parsed = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
    return format(parsed, 'MMMM yyyy');
  } catch {
    return yearMonth;
  }
}

/**
 * Gets previous month string YYYY-MM
 */
export function getPreviousMonth(yearMonth: string): string {
  const parsed = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  return format(subMonths(parsed, 1), 'yyyy-MM');
}

/**
 * Gets next month string YYYY-MM
 */
export function getNextMonth(yearMonth: string): string {
  const parsed = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  return format(addMonths(parsed, 1), 'yyyy-MM');
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * Generates calendar grid cells for a given month (YYYY-MM), starting on Monday.
 */
export function getCalendarGrid(yearMonth: string, selectedDateStr: string): CalendarDay[] {
  const monthDate = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Week starting on Monday (weekStartsOn: 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  return days.map((day) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return {
      date: day,
      dateString,
      dayNumber: getDate(day),
      isCurrentMonth: isSameMonth(day, monthDate),
      isToday: isSameDay(day, today),
      isSelected: dateString === selectedDateStr,
    };
  });
}

/**
 * Returns elapsed days in the specified month for accurate average daily spend calculation.
 * - If current month: days elapsed so far (today's date)
 * - If past month: total days in that month
 * - If future month: 0 (or 1 to avoid division by zero)
 */
export function getElapsedDaysInMonth(yearMonth: string): number {
  const monthDate = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  const today = new Date();
  const currentMonthStr = getCurrentMonthString();

  if (yearMonth === currentMonthStr) {
    return Math.max(1, getDate(today));
  }

  // If in the future
  if (isAfter(startOfMonth(monthDate), today)) {
    return 0;
  }

  // Past month
  return getDaysInMonth(monthDate);
}

/**
 * Checks if a string date is today
 */
export function isToday(dateStr: string): boolean {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isDateToday(parsed);
  } catch {
    return false;
  }
}

/**
 * Returns week interval (Monday to Sunday) for a reference date with optional week offset.
 */
export function getWeekInterval(referenceDate: Date = new Date(), offsetWeeks: number = 0): {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  formattedRange: string;
} {
  const targetDate = offsetWeeks === 0 ? referenceDate : addWeeks(referenceDate, offsetWeeks);
  const startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  const startFmt = format(startDate, 'd MMM');
  const endFmt = format(endDate, 'd MMM yyyy');
  const formattedRange = `${startFmt} – ${endFmt}`;

  return {
    startDate,
    endDate,
    startDateStr,
    endDateStr,
    formattedRange,
  };
}

/**
 * Returns all dates between two dates inclusive
 */
export function getDaysOfIntervalList(startDate: Date, endDate: Date): Date[] {
  return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Gets month offset YYYY-MM from base month
 */
export function getMonthWithOffset(baseYearMonth: string, offsetMonths: number): string {
  if (offsetMonths === 0) return baseYearMonth;
  const parsed = parse(`${baseYearMonth}-01`, 'yyyy-MM-dd', new Date());
  return format(addMonths(parsed, offsetMonths), 'yyyy-MM');
}
