// Components/Functions/DateTimeTools/logic.ts

// ---------------------------------------------------------------------------
// Date Format Converter
// ---------------------------------------------------------------------------

export type DateOutputFormat = 'iso' | 'us' | 'eu' | 'unix' | 'rfc2822' | 'readable';

/**
 * Parse a date string in any of: ISO 8601, plain Unix timestamp (pure digits),
 * US MM/DD/YYYY, EU DD/MM/YYYY, RFC 2822. Throws if none match.
 */
export function parseDate(input: string): Date {
  const trimmed = input.trim();

  // Unix timestamp: pure integer (positive or negative)
  if (/^-?\d+$/.test(trimmed)) {
    const ms = parseInt(trimmed, 10) * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  // ISO 8601 — delegate to Date constructor (handles most ISO variants)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // US format MM/DD/YYYY or MM/DD/YYYY HH:MM:SS
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (usMatch) {
    const [, mm, dd, yyyy, hh = '0', min = '0', ss = '0'] = usMatch;
    const d = new Date(Date.UTC(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      parseInt(hh, 10),
      parseInt(min, 10),
      parseInt(ss, 10),
    ));
    if (!isNaN(d.getTime())) return d;
  }

  // EU format DD.MM.YYYY or DD.MM.YYYY HH:MM:SS
  const euMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (euMatch) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = euMatch;
    const d = new Date(Date.UTC(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      parseInt(hh, 10),
      parseInt(min, 10),
      parseInt(ss, 10),
    ));
    if (!isNaN(d.getTime())) return d;
  }

  // RFC 2822 and other formats — fall back to Date constructor
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return fallback;

  throw new Error(`Cannot parse date: "${input}"`);
}

/**
 * Format a Date object into the requested output format.
 */
export function formatDateOutput(date: Date, format: DateOutputFormat): string {
  switch (format) {
    case 'iso':
      return date.toISOString();

    case 'us': {
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }

    case 'eu': {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }

    case 'unix':
      return Math.floor(date.getTime() / 1000).toString();

    case 'rfc2822':
      return date.toUTCString();

    case 'readable': {
      return date.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    }

    default:
      return date.toISOString();
  }
}

/**
 * Convenience: parse then format.
 */
export function convertDateFormat(input: string, outputFormat: DateOutputFormat): string {
  const date = parseDate(input);
  return formatDateOutput(date, outputFormat);
}

// ---------------------------------------------------------------------------
// Time Zone Converter
// ---------------------------------------------------------------------------

/**
 * Returns ~50 common IANA timezone names as a hardcoded array.
 */
export function listTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'Europe/London',
    'Europe/Dublin',
    'Europe/Lisbon',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Stockholm',
    'Europe/Helsinki',
    'Europe/Warsaw',
    'Europe/Prague',
    'Europe/Athens',
    'Europe/Istanbul',
    'Europe/Moscow',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Jakarta',
    'Australia/Perth',
    'Australia/Adelaide',
    'Australia/Sydney',
    'Australia/Brisbane',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Honolulu',
  ];
}

/**
 * Convert an ISO datetime string from one IANA timezone to another.
 * Uses Intl.DateTimeFormat which is available in Node 18+ and browsers.
 * Returns a human-readable string like "April 8, 2026, 3:45 PM JST".
 */
export function convertTimezone(isoString: string, fromTz: string, toTz: string): string {
  // Parse the input as a wall-clock time in fromTz.
  // Strategy: normalize the input to UTC by treating it as fromTz local time.

  // Step 1: normalize the string — if it has no timezone specifier, treat it as UTC
  // so that new Date() gives us a consistent baseline.
  const normalized = isoString.trim();
  const hasTimezone = /[Zz]$/.test(normalized) || /[+-]\d{2}:?\d{2}$/.test(normalized);
  const utcString = hasTimezone ? normalized : normalized + 'Z';

  const naive = new Date(utcString);
  if (isNaN(naive.getTime())) {
    throw new Error(`Invalid date string: "${isoString}"`);
  }

  // Step 2: find the UTC offset of fromTz at the naive time
  const fromOffset = getUtcOffsetMinutes(naive, fromTz);

  // Step 3: adjust the timestamp so that the wall-clock in fromTz matches the input
  // naive is in UTC; to treat it as fromTz local time, subtract fromTz offset
  const utcMs = naive.getTime() - fromOffset * 60_000;
  const utcDate = new Date(utcMs);

  // Step 4: format in the target timezone
  return new Intl.DateTimeFormat('en-US', {
    timeZone: toTz,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(utcDate);
}

/**
 * Helper: get the UTC offset in minutes for a given timezone at a given Date.
 * Positive = ahead of UTC (e.g. Asia/Tokyo = +540).
 */
function getUtcOffsetMinutes(date: Date, timeZone: string): number {
  // Format the date in the given TZ, then compare to UTC
  const utcParts = getDateParts(date, 'UTC');
  const tzParts = getDateParts(date, timeZone);

  const utcMs = Date.UTC(
    utcParts.year, utcParts.month - 1, utcParts.day,
    utcParts.hour, utcParts.minute, utcParts.second,
  );
  const tzMs = Date.UTC(
    tzParts.year, tzParts.month - 1, tzParts.day,
    tzParts.hour, tzParts.minute, tzParts.second,
  );

  return (tzMs - utcMs) / 60_000;
}

interface DateParts {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
}

function getDateParts(date: Date, timeZone: string): DateParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // handle 24 -> 0
    minute: get('minute'),
    second: get('second'),
  };
}

// ---------------------------------------------------------------------------
// Duration Calculator
// ---------------------------------------------------------------------------

export interface DurationResult {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

/**
 * Calculate the difference between two dates as a decomposed duration.
 * Treats end - start (start must be <= end; if reversed, still computes absolute diff).
 */
export function calculateDuration(start: Date, end: Date): DurationResult {
  const from = start.getTime() <= end.getTime() ? start : end;
  const to = start.getTime() <= end.getTime() ? end : start;

  const totalMs = to.getTime() - from.getTime();
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalMs / 60_000);
  const totalHours = Math.floor(totalMs / 3_600_000);
  const totalDays = Math.floor(totalMs / 86_400_000);

  // Decompose into years/months/days/hours/minutes/seconds
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();
  let hours = to.getUTCHours() - from.getUTCHours();
  let minutes = to.getUTCMinutes() - from.getUTCMinutes();
  let seconds = to.getUTCSeconds() - from.getUTCSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    // Borrow from previous month
    months--;
    const prevMonth = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) { months += 12; years--; }

  return { years, months, days, hours, minutes, seconds, totalDays, totalHours, totalMinutes, totalSeconds };
}

/**
 * Format a DurationResult into a human-readable sentence.
 * Skips zero-valued units, except when the total is zero (returns "0 seconds").
 */
export function formatDuration(duration: DurationResult): string {
  const parts: string[] = [];
  if (duration.years > 0) parts.push(`${duration.years} year${duration.years !== 1 ? 's' : ''}`);
  if (duration.months > 0) parts.push(`${duration.months} month${duration.months !== 1 ? 's' : ''}`);
  if (duration.days > 0) parts.push(`${duration.days} day${duration.days !== 1 ? 's' : ''}`);
  if (duration.hours > 0) parts.push(`${duration.hours} hour${duration.hours !== 1 ? 's' : ''}`);
  if (duration.minutes > 0) parts.push(`${duration.minutes} minute${duration.minutes !== 1 ? 's' : ''}`);
  if (duration.seconds > 0 || parts.length === 0) {
    parts.push(`${duration.seconds} second${duration.seconds !== 1 ? 's' : ''}`);
  }
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Week Number Calculator
// ---------------------------------------------------------------------------

/**
 * ISO 8601 week number. Week 1 = week containing the first Thursday of the year.
 * Weeks start on Monday.
 */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1 ... Sun=7)
  const day = d.getUTCDay() || 7; // convert Sunday (0) to 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * US week number. Week 1 = week containing Jan 1. Weeks start on Sunday.
 */
export function getUsWeekNumber(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const startDay = start.getUTCDay(); // 0=Sun
  const dayOfYear = getDayOfYear(date) - 1; // 0-indexed
  return Math.floor((dayOfYear + startDay) / 7) + 1;
}

/**
 * Day of year, 1-indexed (Jan 1 = 1).
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/**
 * Days remaining until Dec 31 of the same year (inclusive of Dec 31).
 * On Dec 31 itself, returns 0.
 *
 * The input is floored to UTC midnight first: without that, a datetime carrying
 * a time of day lost a whole day to the floor below, so `dayOfYear +
 * daysUntilYearEnd` came out one short of the year's length.
 */
export function getDaysUntilYearEnd(date: Date): number {
  const day = utcMidnight(date);
  const yearEnd = new Date(Date.UTC(day.getUTCFullYear(), 11, 31));
  return Math.floor((yearEnd.getTime() - day.getTime()) / 86_400_000);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface WeekStats {
  isoWeek: number;
  usWeek: number;
  dayOfYear: number;
  daysUntilYearEnd: number;
  dayOfWeek: string;
}

/**
 * Parse a date string and return all week/day stats.
 */
export function getWeekStats(input: string): WeekStats {
  const date = parseDate(input.trim());
  return {
    isoWeek: getIsoWeekNumber(date),
    usWeek: getUsWeekNumber(date),
    dayOfYear: getDayOfYear(date),
    daysUntilYearEnd: getDaysUntilYearEnd(date),
    dayOfWeek: DAY_NAMES[date.getUTCDay()],
  };
}

// ---------------------------------------------------------------------------
// Week Number Calculator — structured report
// ---------------------------------------------------------------------------

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Drop the time of day. Which week a moment falls in is a whole-day question,
 * so every calculation below works from UTC midnight of the given date.
 */
export function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const d = utcMidnight(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** e.g. `Wednesday, 8 April 2026`. */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** e.g. `8 Apr`. */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** Calendar quarter, 1–4. */
export function getQuarter(date: Date): number {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

/**
 * The ISO *week-numbering* year, which is not always the calendar year: the
 * first days of January can belong to week 52/53 of the year before, and the
 * last days of December to week 1 of the year after. 2027-01-01 is a Friday and
 * so belongs to 2026-W53 — reporting its week as a bare "53" reads as a week of
 * 2027, which does not exist.
 */
export function getIsoWeekYear(date: Date): number {
  const d = utcMidnight(date);
  const day = d.getUTCDay() || 7;
  // The Thursday of this week decides which year the week belongs to.
  d.setUTCDate(d.getUTCDate() + 4 - day);
  return d.getUTCFullYear();
}

/**
 * 52 or 53. December 28 is always in the last ISO week of its own year, which
 * makes it the cheapest way to ask the question.
 */
export function weeksInIsoYear(year: number): number {
  return getIsoWeekNumber(new Date(Date.UTC(year, 11, 28)));
}

/** Monday of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = utcMidnight(date);
  return addDays(d, 1 - (d.getUTCDay() || 7));
}

/** Sunday of the US week containing `date`. */
export function startOfUsWeek(date: Date): Date {
  const d = utcMidnight(date);
  return addDays(d, -d.getUTCDay());
}

/**
 * Monday that opens ISO week `week` of `isoYear`. January 4 is in week 1 by
 * definition, so it anchors the count.
 */
export function isoWeekStart(isoYear: number, week: number): Date {
  return addDays(startOfIsoWeek(new Date(Date.UTC(isoYear, 0, 4))), (week - 1) * 7);
}

/**
 * Sunday that opens US week `week` of `year`. Week 1 is the week containing
 * January 1, so week 1 usually starts in the previous December.
 */
export function usWeekStart(year: number, week: number): Date {
  return addDays(startOfUsWeek(new Date(Date.UTC(year, 0, 1))), (week - 1) * 7);
}

/** How many US weeks the calendar year is cut into — 53 or 54. */
export function weeksInUsYear(year: number): number {
  return getUsWeekNumber(new Date(Date.UTC(year, 11, 31)));
}

export interface WeekReport {
  /** The parsed date, floored to UTC midnight and rendered `YYYY-MM-DD`. */
  date: string;
  longDate: string;
  dayOfWeek: string;
  dayOfWeekShort: string;
  isWeekend: boolean;

  isoWeek: number;
  isoWeekYear: number;
  /** `2026-W15` — the ISO 8601 week designation. */
  isoLabel: string;
  isoWeekStart: string;
  isoWeekEnd: string;
  /** Position within the ISO week, 1 = Monday … 7 = Sunday. */
  isoDayNumber: number;
  weeksInIsoYear: number;
  /** True when the ISO week-year differs from the calendar year. */
  isoYearDiffers: boolean;

  usWeek: number;
  usWeekYear: number;
  usWeekStart: string;
  usWeekEnd: string;
  /** Position within the US week, 1 = Sunday … 7 = Saturday. */
  usDayNumber: number;
  weeksInUsYear: number;

  calendarYear: number;
  dayOfYear: number;
  daysUntilYearEnd: number;
  daysInYear: number;
  /** 0–1, for the year-progress meter. */
  yearProgress: number;
  quarter: number;
  isLeapYear: boolean;
}

/**
 * Parse a date string and return everything the Week Number Calculator renders.
 * Throws the same way `parseDate` does when the input is unreadable.
 */
export function getWeekReport(input: string): WeekReport {
  const date = utcMidnight(parseDate(input.trim()));
  const year = date.getUTCFullYear();
  const weekday = date.getUTCDay();

  const isoWeek = getIsoWeekNumber(date);
  const isoYear = getIsoWeekYear(date);
  const isoStart = startOfIsoWeek(date);

  const usWeek = getUsWeekNumber(date);
  const usStart = startOfUsWeek(date);

  const dayOfYear = getDayOfYear(date);
  const total = daysInYear(year);

  return {
    date: toIsoDate(date),
    longDate: formatLongDate(date),
    dayOfWeek: DAY_NAMES[weekday],
    dayOfWeekShort: DAY_NAMES_SHORT[weekday],
    isWeekend: weekday === 0 || weekday === 6,

    isoWeek,
    isoWeekYear: isoYear,
    isoLabel: `${isoYear}-W${String(isoWeek).padStart(2, '0')}`,
    isoWeekStart: toIsoDate(isoStart),
    isoWeekEnd: toIsoDate(addDays(isoStart, 6)),
    isoDayNumber: weekday || 7,
    weeksInIsoYear: weeksInIsoYear(isoYear),
    isoYearDiffers: isoYear !== year,

    usWeek,
    usWeekYear: year,
    usWeekStart: toIsoDate(usStart),
    usWeekEnd: toIsoDate(addDays(usStart, 6)),
    usDayNumber: weekday + 1,
    weeksInUsYear: weeksInUsYear(year),

    calendarYear: year,
    dayOfYear,
    daysUntilYearEnd: getDaysUntilYearEnd(date),
    daysInYear: total,
    yearProgress: dayOfYear / total,
    quarter: getQuarter(date),
    isLeapYear: isLeapYear(year),
  };
}

export interface WeekRuler {
  /** First day of the window, `YYYY-MM-DD`. */
  start: string;
  /** How many day cells the window holds. */
  span: number;
  /** Index of the ISO week's Monday within the window. */
  isoOffset: number;
  /** Index of the US week's Sunday within the window. */
  usOffset: number;
}

/**
 * The window of days covered by *either* week, so both can be drawn over one
 * ruler and their offset becomes visible.
 *
 * Normally that is 8 days: the US week starts one day before the ISO week and
 * they share six. On a Sunday it stretches to 13 — ISO closes a week with that
 * day while the US convention opens one, so the two overlap on it alone.
 */
export function getWeekRuler(report: WeekReport): WeekRuler {
  const day = (s: string) => Date.parse(`${s}T00:00:00Z`);
  const first = Math.min(day(report.isoWeekStart), day(report.usWeekStart));
  const last = Math.max(day(report.isoWeekEnd), day(report.usWeekEnd));

  return {
    start: toIsoDate(new Date(first)),
    span: Math.round((last - first) / 86_400_000) + 1,
    isoOffset: Math.round((day(report.isoWeekStart) - first) / 86_400_000),
    usOffset: Math.round((day(report.usWeekStart) - first) / 86_400_000),
  };
}

// ---------------------------------------------------------------------------
// Cron helper (used by component; formatNextRunTimes is pure and testable)
// ---------------------------------------------------------------------------

/**
 * Format an array of Date objects into readable strings.
 * count caps the output length.
 */
export function formatNextRunTimes(dates: Date[], count: number): string[] {
  return dates.slice(0, count).map(d =>
    d.toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  );
}
